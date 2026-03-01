/**
 * useAssistant — Hook for OS AI Assistant communication.
 *
 * Manages conversation state and communicates with the neuraltwin-assistant
 * Edge Function. Uses auth context for user token, store context for store
 * information, and react-router location for page context.
 */

import { useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import type { ChatMessageUI } from "@/shared/chat/types/chat.types";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

interface AssistantUIAction {
  type: string;
  label: string;
  target?: string;
  params?: Record<string, unknown>;
}

interface AssistantResponse {
  message: string;
  actions?: AssistantUIAction[];
  suggestions?: string[];
  meta: {
    conversationId: string;
    intent: string;
    confidence: number;
    executionTimeMs: number;
  };
}

export interface UseAssistantReturn {
  messages: ChatMessageUI[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  suggestions: string[];
  clearChat: () => void;
}

// ---------------------------------------------------------
// Page label helper
// ---------------------------------------------------------

const PAGE_LABELS: Record<string, string> = {
  "/os/insights": "인사이트 허브",
  "/os/studio": "디지털트윈 스튜디오",
  "/os/roi": "ROI 측정",
  "/os/settings": "설정 & 관리",
};

function getPageLabel(pathname: string): string {
  for (const [prefix, label] of Object.entries(PAGE_LABELS)) {
    if (pathname.startsWith(prefix)) return label;
  }
  return "OS Dashboard";
}

// ---------------------------------------------------------
// Hook
// ---------------------------------------------------------

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `msg-${Date.now()}-${idCounter}`;
}

export function useAssistant(): UseAssistantReturn {
  const { session } = useAuth();
  const { selectedStore } = useSelectedStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const conversationIdRef = useRef<string | null>(null);

  // -------------------------------------------------------
  // Handle actions returned by the assistant
  // -------------------------------------------------------
  const handleActions = useCallback(
    (actions: AssistantUIAction[]) => {
      for (const action of actions) {
        switch (action.type) {
          case "navigate":
            if (action.target) {
              navigate(action.target);
            }
            break;
          // Future action types (open_modal, set_filter, etc.) can be added here
          default:
            console.log("[Assistant] Unhandled action:", action.type);
        }
      }
    },
    [navigate],
  );

  // -------------------------------------------------------
  // Send a message to the neuraltwin-assistant EF
  // -------------------------------------------------------
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessageUI = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setSuggestions([]);

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const accessToken = session?.access_token;

        if (!supabaseUrl || !accessToken) {
          throw new Error("Missing Supabase URL or auth token");
        }

        const requestBody = {
          message: text.trim(),
          ...(conversationIdRef.current && {
            conversationId: conversationIdRef.current,
          }),
          context: {
            page: {
              current: location.pathname,
              tab: new URLSearchParams(location.search).get("tab") || undefined,
            },
            store: selectedStore
              ? { id: selectedStore.id, name: selectedStore.store_name }
              : undefined,
          },
        };

        const response = await fetch(
          `${supabaseUrl}/functions/v1/unified-chatbot`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              apikey: supabaseKey,
              "X-NeuralTwin-Channel": "os",
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Assistant API error (${response.status}): ${errorText}`,
          );
        }

        const data: AssistantResponse = await response.json();

        // Track conversation
        if (data.meta?.conversationId) {
          conversationIdRef.current = data.meta.conversationId;
        }

        // Build assistant message with optional action buttons
        const actionButtons: ChatMessageUI["actions"] = data.actions?.map(
          (action) => ({
            type: action.type,
            label: action.label,
            onClick: () => handleActions([action]),
          }),
        );

        const assistantMsg: ChatMessageUI = {
          id: generateId(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          actions: actionButtons,
          suggestions: data.suggestions,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }

        // Execute any immediate actions
        if (data.actions && data.actions.length > 0) {
          handleActions(data.actions);
        }
      } catch (error) {
        console.error("[Assistant] Error:", error);

        const errorMsg: ChatMessageUI = {
          id: generateId(),
          role: "assistant",
          content:
            "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      session,
      location.pathname,
      location.search,
      selectedStore,
      handleActions,
    ],
  );

  // -------------------------------------------------------
  // Clear chat
  // -------------------------------------------------------
  const clearChat = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
    conversationIdRef.current = null;
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    suggestions,
    clearChat,
  };
}

export { getPageLabel };
