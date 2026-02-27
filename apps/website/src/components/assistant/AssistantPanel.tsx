/**
 * AssistantPanel — Collapsible right-side panel for the OS AI Assistant.
 *
 * Uses shared chat UI components with variant="os".
 * Slides in from the right, sits alongside the main content area.
 * On mobile, renders as a full-screen overlay.
 */

import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Bot, Trash2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  ChatBubble,
  ChatInput,
  ChatScrollArea,
  TypingIndicator,
  SuggestionChips,
  WelcomeMessage,
} from "@/shared/chat";

import { useAssistant, getPageLabel } from "./useAssistant";

// ---------------------------------------------------------
// Props
// ---------------------------------------------------------

interface AssistantPanelProps {
  onClose: () => void;
}

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------

export function AssistantPanel({ onClose }: AssistantPanelProps) {
  const { messages, sendMessage, isLoading, suggestions, clearChat } =
    useAssistant();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const pageLabel = getPageLabel(location.pathname);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-30 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          // Base styles
          "flex flex-col bg-card border-l border-border z-30",
          "transition-transform duration-300 ease-out",
          // Desktop: side panel within flow
          "hidden md:flex w-80 shrink-0",
          // Mobile: full-screen overlay
          "max-md:fixed max-md:inset-0 max-md:!flex max-md:w-full max-md:border-l-0",
        )}
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
              <Bot size={16} className="text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-none">
                AI Assistant
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                NEURALTWIN OS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="대화 초기화"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="닫기"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ---- Page context badge ---- */}
        <div className="px-4 py-2 border-b border-border/50 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {pageLabel}
          </div>
        </div>

        {/* ---- Chat body ---- */}
        <ChatScrollArea className="flex-1 min-h-0">
          {messages.length === 0 ? (
            <WelcomeMessage
              variant="os"
              onSuggestionSelect={sendMessage}
            />
          ) : (
            <>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  variant="os"
                  showTimestamp
                />
              ))}

              <AnimatePresence>
                {isLoading && (
                  <TypingIndicator
                    text="AI가 답변 중..."
                    variant="os"
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </ChatScrollArea>

        {/* ---- Suggestions ---- */}
        {suggestions.length > 0 && !isLoading && (
          <div className="px-4 py-2 border-t border-border/50 shrink-0">
            <SuggestionChips
              suggestions={suggestions}
              onSelect={sendMessage}
              variant="os"
              maxItems={3}
            />
          </div>
        )}

        {/* ---- Input ---- */}
        <div className="p-3 border-t border-border shrink-0">
          <ChatInput
            onSend={sendMessage}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            variant="os"
          />
        </div>
      </div>
    </>
  );
}

export default AssistantPanel;
