// 채팅 페이지 - NEURALTWIN 다크 테마 + retail-chatbot EF 연동
// TASK 9: Suggestions + Lead Capture Form 추가
// TASK C: 3D Wireframe Visualizer 통합
// PHASE J: 파일 업로드, 메시지 리액션, Export 기능
// UI 통합: collapsible messages, 타임라인 minor ticks, fullscreen UX 개선
import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/seo/SEOHead";
import "@/styles/chat.css";

// 3D Visualizer 컴포넌트
import { StoreVisualizer, CompareVisualizer } from "@/components/chatbot/visualizer";
import type { VizDirective, VizState, CustomerStage, VizKPI, VizAnnotation, StoreParams, ZoneScale } from "@/components/chatbot/visualizer";
import { mergeVizDirective } from "@/components/chatbot/visualizer";
import { ZONE_LABELS_KO, getZoneColorHex } from "@/components/chatbot/visualizer/storeData";

// Export 유틸리티
import { exportAsMarkdown, exportAsPDF, exportAsDocx } from "@/shared/chat/utils/exportConversation";

// 파일 업로드 유틸리티
import { uploadChatFiles, type UploadedFile } from "@/shared/chat/utils/fileUpload";

// 메시지 타입 정의
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  showLeadForm?: boolean;
  feedback?: "positive" | "negative" | null;
  attachments?: FileAttachment[];
  searchSourceInfo?: {
    knowledgeSourceCount: number;
    webSearchPerformed: boolean;
    searchSources?: Array<{ title: string; url: string }>;
    factCount?: number;
  };
}

// 파일 첨부 타입
interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;           // Supabase storage URL (업로드 완료 후)
  previewUrl?: string;    // 로컬 미리보기 URL
}

// 리드 폼 데이터 타입
interface LeadFormData {
  email: string;
  company: string;
  role: string;
}

// 타임라인 연도 (2018~2026, HTML 원본 동일)
const TIMELINE_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

// 인라인 채팅에서 최근 N턴만 표시, 나머지는 접기
const VISIBLE_TURNS = 3;
const MAX_GUEST_TURNS = 10;

// 세션 ID 관리
const getOrCreateSessionId = (): string => {
  const key = "neuraltwin_chat_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

const Chat = () => {
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 인트로 애니메이션: 첫 방문만 풀 재생, 재방문(같은 세션) 시 스킵
  const hasSeenIntro = sessionStorage.getItem('neuraltwin-intro-seen') === 'true';
  const [introComplete, setIntroComplete] = useState(hasSeenIntro);
  const [curtainsOpen, setCurtainsOpen] = useState(hasSeenIntro);
  const [contentVisible, setContentVisible] = useState(hasSeenIntro);
  const [introHidden, setIntroHidden] = useState(hasSeenIntro);

  // 채팅 상태
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // TASK 9: Suggestions + Lead Form 상태
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showLeadForm, setShowLeadForm] = useState(false);

  // TASK C: VizDirective 상태 (3D Visualizer)
  const [vizDirective, setVizDirective] = useState<VizDirective | null>(null);
  // Phase 6 B-7: 채팅에서 존 클릭 시 추가 하이라이트
  const [chatHighlightZones, setChatHighlightZones] = useState<string[]>([]);
  // 모바일 탭 토글 (채팅 ↔ 3D뷰)
  const [mobileActiveTab, setMobileActiveTab] = useState<"chat" | "viz">("chat");
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({
    email: "",
    company: "",
    role: "",
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosingFs, setIsClosingFs] = useState(false);  // 축소 애니메이션 진행 중
  const [fsInputValue, setFsInputValue] = useState("");

  // 이전 대화 접기/펼치기 상태
  const [expandedOldMessages, setExpandedOldMessages] = useState(false);

  // PHASE J: Export 메뉴 상태
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // PHASE J: 파일 업로드 상태
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const pendingFileDataRef = useRef<Map<string, File>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fsFileInputRef = useRef<HTMLInputElement>(null);

  // PHASE J: 복사 알림
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // 비회원 턴 제한 모달
  const [showTurnLimitModal, setShowTurnLimitModal] = useState(false);

  // 플레이스홀더 로테이션
  const PLACEHOLDERS = [
    "예: 이번 시즌 VMD 트렌드 알려줘",
    "예: 주말 프로모션 기획안 작성해줘",
    "예: 리테일 전환율 업계 평균은?",
    "예: 매장 일일 보고서 양식 만들어줘",
  ];

  // 랜딩 뷰 프리셋 카드 — 대화 시작 전 우측 패널에 표시
  const LANDING_PRESETS = [
    {
      id: 'data-decision',
      description: '매대 위치 바꾸면 매출 오를까?',
      chatMessage: '매대 위치 바꾸면 매출 오를까?',
      thumbnail: '/presets/preset-1.png',
    },
    {
      id: 'popup-planning',
      description: '팝업스토어 기획 초안 만들어줘',
      chatMessage: '팝업스토어 기획 초안 만들어줘',
      thumbnail: '/presets/preset-2.png',
    },
    {
      id: 'industry-compare',
      description: '리테일 전환율 업계 평균은?',
      chatMessage: '리테일 전환율 업계 평균은?',
      thumbnail: '/presets/preset-3.png',
    },
    {
      id: 'vmd-trends',
      description: '이번 시즌 VMD 트렌드 알려줘',
      chatMessage: '이번 시즌 VMD 트렌드 알려줘',
      thumbnail: '/presets/preset-4.png',
    },
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // SSE 스트리밍: 현재 어시스턴트 메시지 ID (점진적 업데이트용)
  const streamingMessageIdRef = useRef<string | null>(null);

  // Phase 3: 검색 소스 정보 (meta 이벤트에서 수신)
  const [searchSourceInfo, setSearchSourceInfo] = useState<{
    knowledgeSourceCount: number;
    webSearchPerformed: boolean;
    searchSources?: Array<{ title: string; url: string }>;
    factCount?: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fsMessagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fsInputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 페이지 진입 시 body 스타일 조정
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // 재방문 시 인트로 애니메이션 스킵
    if (hasSeenIntro) {
      return () => {
        document.body.style.backgroundColor = "";
        document.body.style.margin = "";
        document.body.style.padding = "";
        abortControllerRef.current?.abort();
      };
    }

    // 인트로 애니메이션 시퀀스 (HTML 원본 타이밍과 동일)
    const timer1 = setTimeout(() => setIntroComplete(true), 1100);
    const timer2 = setTimeout(() => {
      setCurtainsOpen(true);
      setContentVisible(true);
    }, 1400);
    const timer3 = setTimeout(() => {
      setIntroHidden(true);
      sessionStorage.setItem('neuraltwin-intro-seen', 'true');
    }, 2200);

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      // 컴포넌트 언마운트 시 진행 중인 스트리밍 중단
      abortControllerRef.current?.abort();
    };
  }, []);

  // 메시지 스크롤 — scrollIntoView 대신 부모 컨테이너의 scrollTop 직접 제어 (페이지 스크롤 전파 방지)
  useEffect(() => {
    const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>) => {
      const el = ref.current?.parentElement;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    };
    scrollContainer(messagesEndRef);
    scrollContainer(fsMessagesEndRef);
  }, [messages]);

  // 플레이스홀더 로테이션 (2.5초 간격)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // 비회원 턴 카운트 (user 메시지 수 = 턴 수)
  const turnCount = messages.filter(m => m.role === 'user').length;
  const isGuestLimitReached = !isAuthenticated && turnCount >= MAX_GUEST_TURNS;

  // 비회원 턴 제한 도달 시 모달 자동 표시
  useEffect(() => {
    if (isGuestLimitReached && !isLoading) {
      setShowTurnLimitModal(true);
    }
  }, [isGuestLimitReached, isLoading]);

  // 모바일 감지 (resize 반응형)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  // 태블릿+모바일: 인라인 프리셋 표시 (1200px 미만)
  const [showInlinePresets, setShowInlinePresets] = useState(
    typeof window !== 'undefined' && window.innerWidth < 1200
  );
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setShowInlinePresets(window.innerWidth < 1200);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ═══════════════════════════════════════════
  // A-1: 공통 SSE 스트리밍 소비 함수
  // ═══════════════════════════════════════════

  /**
   * SSE 스트리밍 응답 소비 — text/viz/meta/done 이벤트 처리
   * 빈 어시스턴트 메시지를 먼저 추가하고, text 이벤트마다 점진적 업데이트
   */
  const processStreamingResponse = async (
    response: Response,
    assistantMsgId: string,
    signal: AbortSignal
  ) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    let buffer = '';
    // streamingMessageIdRef는 첫 text content 도착 시 설정 (로딩 버블 유지를 위해)

    try {
      while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 이벤트 파싱: "event: xxx\ndata: {...}\n\n"
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // 마지막 불완전 이벤트 보관

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;

          const lines = eventBlock.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }

          if (!eventType || !eventData) continue;

          try {
            const parsed = JSON.parse(eventData);

            switch (eventType) {
              case 'text': {
                // 점진적 텍스트 추가
                const content = parsed.content || '';
                if (content) {
                  // 첫 text 도착 시 스트리밍 ID 설정 → 로딩 버블 숨김
                  if (!streamingMessageIdRef.current) {
                    streamingMessageIdRef.current = assistantMsgId;
                  }
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: msg.content + content }
                        : msg
                    )
                  );
                }
                break;
              }

              case 'viz': {
                // VizDirective 업데이트
                // vizState가 있으면 완전한 새 directive → full replace (이전 대화의 stale zones 방지)
                // vizState가 없으면 부분 업데이트 → merge
                console.log('[Chat:SSE] viz event received:', parsed);
                setVizDirective((prev) => {
                  if (!prev || parsed.vizState) return parsed as VizDirective;
                  return mergeVizDirective(prev, parsed as Partial<VizDirective>);
                });
                break;
              }

              case 'meta': {
                // suggestions, salesBridge, painPoints, showLeadForm
                if (parsed.suggestions?.length > 0) {
                  setSuggestions(parsed.suggestions);
                } else {
                  setSuggestions([]);
                }
                if (parsed.showLeadForm && !leadSubmitted) {
                  setShowLeadForm(true);
                }
                // Phase 3: 검색 소스 정보 저장
                if (parsed.knowledgeSourceCount !== undefined || parsed.webSearchPerformed !== undefined) {
                  setSearchSourceInfo({
                    knowledgeSourceCount: parsed.knowledgeSourceCount || 0,
                    webSearchPerformed: parsed.webSearchPerformed || false,
                    searchSources: parsed.searchSources,
                    factCount: parsed.factCount,
                  });
                }
                // 어시스턴트 메시지에 meta 첨부
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          suggestions: parsed.suggestions,
                          showLeadForm: parsed.showLeadForm,
                          searchSourceInfo: parsed.knowledgeSourceCount !== undefined
                            ? {
                                knowledgeSourceCount: parsed.knowledgeSourceCount || 0,
                                webSearchPerformed: parsed.webSearchPerformed || false,
                                searchSources: parsed.searchSources,
                                factCount: parsed.factCount,
                              }
                            : undefined,
                        }
                      : msg
                  )
                );
                break;
              }

              case 'done': {
                // conversationId 저장
                if (parsed.conversationId) {
                  setConversationId(parsed.conversationId);
                }
                console.log('[Chat:SSE] Stream complete');
                break;
              }

              case 'error': {
                console.error('[Chat:SSE] Server error:', parsed.error);
                break;
              }
            }
          } catch (parseErr) {
            console.warn('[Chat:SSE] Event parse error:', parseErr);
          }
        }
      }
    } finally {
      reader.releaseLock();
      streamingMessageIdRef.current = null;
    }
  };

  /**
   * Non-streaming JSON 응답 처리 (fallback)
   */
  const processJsonResponse = async (response: Response, assistantMsgId: string) => {
    let data: Record<string, unknown>;
    try {
      data = await response.json();
    } catch {
      // JSON 파싱 실패 — 텍스트로 시도
      const text = await response.text().catch(() => '');
      console.warn('[Chat] JSON parse failed, raw text:', text.slice(0, 200));
      throw new Error('응답을 파싱할 수 없습니다.');
    }

    console.log('[Chat] JSON fallback response');

    if (data.error) {
      throw new Error(String(data.error));
    }

    if (data.conversationId) {
      setConversationId(data.conversationId as string);
    }

    const suggestions = data.suggestions as string[] | undefined;
    if (suggestions?.length && suggestions.length > 0) {
      setSuggestions(suggestions);
    } else {
      setSuggestions([]);
    }

    if (data.showLeadForm && !leadSubmitted) {
      setShowLeadForm(true);
    }

    if (data.vizDirective) {
      setVizDirective((prev) => {
        const viz = data.vizDirective as VizDirective;
        // vizState가 있으면 완전한 새 directive → full replace
        if (!prev || viz.vizState) return viz;
        return mergeVizDirective(prev, viz as Partial<VizDirective>);
      });
    }

    // Phase 3: 검색 소스 정보 저장
    if (data.knowledgeSourceCount !== undefined || data.webSearchPerformed !== undefined) {
      setSearchSourceInfo({
        knowledgeSourceCount: (data.knowledgeSourceCount as number) || 0,
        webSearchPerformed: (data.webSearchPerformed as boolean) || false,
        searchSources: data.searchSources as Array<{ title: string; url: string }> | undefined,
      });
    }

    const content = data.content as string | undefined;
    if (content) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content,
                suggestions,
                showLeadForm: data.showLeadForm as boolean | undefined,
                searchSourceInfo: data.knowledgeSourceCount !== undefined
                  ? {
                      knowledgeSourceCount: (data.knowledgeSourceCount as number) || 0,
                      webSearchPerformed: (data.webSearchPerformed as boolean) || false,
                      searchSources: data.searchSources as Array<{ title: string; url: string }> | undefined,
                      factCount: data.factCount as number | undefined,
                    }
                  : undefined,
              }
            : msg
        )
      );
    }
  };

  /**
   * 공통 메시지 전송 함수 (인라인 + 전체화면 공용)
   */
  const sendChatMessage = async (messageText: string, currentFiles?: FileAttachment[]) => {
    const currentFileData: File[] = [];
    if (currentFiles) {
      for (const f of currentFiles) {
        const fileObj = pendingFileDataRef.current.get(f.id);
        if (fileObj) currentFileData.push(fileObj);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      attachments: currentFiles,
    };

    // 빈 어시스턴트 메시지 (스트리밍용 placeholder)
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setPendingFiles([]);
    pendingFileDataRef.current.clear();
    // vizDirective는 유지 — 새 viz 이벤트가 오면 자동 교체됨 (깜빡임 방지)
    setSearchSourceInfo(null);  // 검색 소스 정보 리셋
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const sessionId = getOrCreateSessionId();

      // 파일 업로드
      let uploadedFiles: UploadedFile[] = [];
      if (currentFileData.length > 0) {
        try {
          uploadedFiles = await uploadChatFiles(currentFileData, sessionId);
        } catch (err) {
          console.error('[FileUpload] Upload error:', err);
        }
      }

      // 히스토리 (최근 10턴, 현재 빈 placeholder 제외)
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const attachments = uploadedFiles.length > 0
        ? uploadedFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            url: f.url,
            textContent: f.textContent,
          }))
        : undefined;

      // 모바일 감지: SSE 비활성화 (모바일 네트워크/브라우저 호환성)
      const isMobileDevice = typeof window !== 'undefined' && (
        window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
      );

      const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          conversationId,
          history,
          attachments,
          stream: !isMobileDevice, // 모바일: JSON, 데스크톱: SSE
          // A-2: 현재 3D 상태를 AI에 전달 → 연속 대화 시 맥락 인지
          currentVizState: vizDirective ? {
            vizState: vizDirective.vizState,
            zones: vizDirective.zones?.map(z => ({ id: z.id, label: z.label })),
            highlights: vizDirective.highlights,
          } : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      // Content-Type에 따라 SSE vs JSON 분기
      const contentType = response.headers.get('Content-Type') || '';
      const canStream = contentType.includes('text/event-stream') && response.body;

      if (canStream) {
        // SSE 스트리밍 (데스크톱) — 실패 시 부분 콘텐츠 유지
        try {
          await processStreamingResponse(response, assistantMsgId, abortControllerRef.current.signal);
        } catch (sseErr) {
          console.warn('[Chat] SSE processing failed:', sseErr);
          // 부분 콘텐츠가 있으면 유지, 없으면 에러 표시
          setMessages((prev) => {
            const msg = prev.find((m) => m.id === assistantMsgId);
            if (msg && !msg.content) {
              return prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: "죄송합니다. 스트리밍 응답 중 오류가 발생했습니다. 다시 시도해 주세요." }
                  : m
              );
            }
            return prev; // 부분 콘텐츠가 있으면 그대로 유지
          });
        }
      } else {
        // JSON fallback (모바일 또는 SSE 미지원)
        await processJsonResponse(response, assistantMsgId);
      }

      // 스트리밍 후 잔존 viz 블록 클리닝 + 빈 메시지 체크
      setMessages((prev) => {
        const msg = prev.find((m) => m.id === assistantMsgId);
        if (!msg) return prev;

        // 빈 메시지 제거
        if (!msg.content) {
          return prev.filter((m) => m.id !== assistantMsgId);
        }

        // SSE에서 viz 블록이 감지되지 않은 경우: 텍스트에서 직접 추출 (안전망)
        const vizMatch = msg.content.match(/```viz\s*\n?([\s\S]*?)\n?```/);
        if (vizMatch) {
          try {
            const vizData = JSON.parse(vizMatch[1].trim());
            if (vizData.vizState) {
              setVizDirective((prev) =>
                prev ? mergeVizDirective(prev, vizData) : vizData
              );
            }
          } catch (e) {
            console.warn('[Chat] Residual viz JSON parse error:', e);
          }
          // viz 블록을 텍스트에서 제거
          const cleaned = msg.content
            .replace(/```viz[\s\S]*?```/g, '')
            .replace(/```viz[\s\S]*$/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
          return prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: cleaned } : m
          );
        }

        return prev;
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted");
        // 빈 placeholder 제거
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      } else {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: "죄송합니다. 응답을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 메시지 전송 — 데스크톱: 인라인 전송 / 모바일: 전체화면 전환 후 자동 전송
  const pendingMessageRef = useRef<string | null>(null);

  const handleSendMessage = async () => {
    if (isGuestLimitReached) {
      setShowTurnLimitModal(true);
      return;
    }
    if (!inputValue.trim() || isLoading) return;

    // 모바일: 전체화면 전환 후 자동 전송 (인라인 API 호출 안 함)
    if (isMobile) {
      pendingMessageRef.current = inputValue.trim();
      setFsInputValue(inputValue);
      setInputValue("");
      setIsFullscreen(true);
      document.body.style.overflow = "hidden";
      return;
    }

    // 데스크톱: 인라인 직접 전송
    const currentFiles = pendingFiles.length > 0 ? [...pendingFiles] : undefined;
    const msgText = inputValue.trim();
    setInputValue("");
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await sendChatMessage(msgText, currentFiles);
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // TASK 9: Suggestion 클릭 핸들러 — 현재 모드에 맞는 input state 업데이트
  const handleSuggestionClick = (suggestion: string) => {
    if (isGuestLimitReached) {
      setShowTurnLimitModal(true);
      return;
    }
    if (isFullscreen) {
      setFsInputValue(suggestion);
    } else {
      setInputValue(suggestion);
    }
    setSuggestions([]);
  };

  // 랜딩 프리셋 클릭 — 데스크톱: 인라인 전송 / 모바일: 전체화면 전환 후 자동 전송
  const handlePresetClick = (preset: typeof LANDING_PRESETS[0]) => {
    if (isGuestLimitReached) {
      setShowTurnLimitModal(true);
      return;
    }
    if (isLoading) return;

    // 모바일: 전체화면 전환 후 자동 전송
    if (isMobile) {
      pendingMessageRef.current = preset.chatMessage;
      setFsInputValue("");
      setIsFullscreen(true);
      document.body.style.overflow = "hidden";
      return;
    }

    // 데스크톱: 인라인 직접 전송
    sendChatMessage(preset.chatMessage);
  };

  // TASK 9: Lead Form 제출 핸들러
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFormData.email.trim()) return;

    setIsSubmittingLead(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const sessionId = getOrCreateSessionId();

      const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "capture_lead",
          sessionId,
          conversationId,
          lead: leadFormData,
        }),
      });

      if (response.ok) {
        setLeadSubmitted(true);
        setShowLeadForm(false);
        const thankYouMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `감사합니다, ${leadFormData.company || "고객"}님! 입력하신 이메일(${leadFormData.email})로 연락드리겠습니다.`,
        };
        setMessages((prev) => [...prev, thankYouMessage]);
      }
    } catch (error) {
      console.error("Lead submission error:", error);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // TASK 9: Lead Form 닫기
  const handleLeadFormClose = () => {
    setShowLeadForm(false);
  };

  // A-7: 3D 존 클릭 → 채팅 입력에 자동 질문 삽입 (전체화면/인라인 모드 동기화)
  const handleZoneClick = useCallback((zoneId: string, zoneLabel: string) => {
    const question = `${zoneLabel} 존에 대해 더 자세히 알려주세요`;
    if (isFullscreen) {
      setFsInputValue(question);
    } else {
      setInputValue(question);
    }
  }, [isFullscreen]);

  // 비회원 세션 초기화 (턴 제한 후 새 대화)
  const handleResetSession = useCallback(() => {
    const key = "neuraltwin_chat_session_id";
    localStorage.setItem(key, crypto.randomUUID());
    setMessages([]);
    setConversationId(null);
    setSuggestions([]);
    setShowLeadForm(false);
    setVizDirective(null);
    setShowTurnLimitModal(false);
    setInputValue("");
    setFsInputValue("");
    if (inputRef.current) inputRef.current.style.height = 'auto';
    if (fsInputRef.current) fsInputRef.current.style.height = 'auto';
    setPendingFiles([]);
    setExpandedOldMessages(false);
    setLeadSubmitted(false);
  }, []);

  // ═══════════════════════════════════════════
  // PHASE J: 메시지 리액션 핸들러 (Copy / Like / Dislike)
  // ═══════════════════════════════════════════

  // 리액션 로그를 백엔드에 전송 (fire-and-forget)
  const logReaction = useCallback((type: 'copy' | 'positive' | 'negative', messageId: string, messageContent?: string) => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL) return;
    fetch(`${SUPABASE_URL}/functions/v1/unified-chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'log_reaction',
        sessionId: getOrCreateSessionId(),
        conversationId,
        reaction: {
          type,
          messageId,
          messageContent: messageContent?.slice(0, 200),
        },
      }),
    }).catch((err) => console.warn('[Reaction] Log failed:', err));
  }, [conversationId]);

  const handleCopyMessage = useCallback((messageId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
    logReaction('copy', messageId, content);
  }, [logReaction]);

  const handleFeedback = useCallback((messageId: string, feedback: "positive" | "negative") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === feedback ? null : feedback }
          : msg
      )
    );
    // 피드백 토글: 이미 같은 피드백이면 취소 (null로 변경되므로 로그하지 않음)
    const currentMsg = messages.find(m => m.id === messageId);
    if (currentMsg?.feedback !== feedback) {
      logReaction(feedback, messageId, currentMsg?.content);
    }
  }, [logReaction, messages]);

  // ═══════════════════════════════════════════
  // PHASE J: Export 핸들러
  // ═══════════════════════════════════════════

  const handleExport = useCallback(async (format: 'md' | 'pdf' | 'docx') => {
    if (messages.length === 0 || isExporting) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const exportMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      switch (format) {
        case 'md':
          exportAsMarkdown(exportMessages);
          break;
        case 'pdf':
          await exportAsPDF(exportMessages);
          break;
        case 'docx':
          await exportAsDocx(exportMessages);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [messages, isExporting]);

  // Export 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // ═══════════════════════════════════════════
  // PHASE J: 파일 업로드 핸들러
  // ═══════════════════════════════════════════

  const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/csv', 'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(`지원하지 않는 파일 형식입니다: ${file.name}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`파일 크기가 10MB를 초과합니다: ${file.name}`);
        continue;
      }

      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined;

      const attachmentId = crypto.randomUUID();

      // 실제 File 객체 저장 (업로드용)
      pendingFileDataRef.current.set(attachmentId, file);

      newAttachments.push({
        id: attachmentId,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      });
    }

    if (newAttachments.length > 0) {
      setPendingFiles((prev) => [...prev, ...newAttachments]);
    }

    // Reset input
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    pendingFileDataRef.current.delete(fileId);
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // ═══════════════════════════════════════════
  // PHASE J: 첨부 파일 렌더러
  // ═══════════════════════════════════════════

  const renderAttachments = (attachments?: FileAttachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="msg-attachments">
        {attachments.map((file) => (
          <div key={file.id} className="msg-attachment-chip">
            {file.previewUrl ? (
              <img src={file.previewUrl} alt={file.name} className="msg-attachment-thumb" />
            ) : (
              <span className="msg-attachment-icon">
                {file.type.includes('pdf') ? 'PDF' : file.type.includes('word') || file.type.includes('document') ? 'DOC' : 'FILE'}
              </span>
            )}
            <span className="msg-attachment-name">{file.name}</span>
          </div>
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // 메시지 액션 버튼 렌더러
  // ═══════════════════════════════════════════

  const renderMessageActions = (msg: Message, variant: 'inline' | 'fullscreen' = 'inline') => {
    if (msg.role === 'user') return null;

    const prefix = variant === 'fullscreen' ? 'fs-' : '';
    const isCopied = copiedMessageId === msg.id;

    return (
      <div className={`msg-actions ${prefix}msg-actions`}>
        {/* Copy */}
        <button
          className={`msg-action-btn ${isCopied ? 'copied' : ''}`}
          onClick={() => handleCopyMessage(msg.id, msg.content)}
          title={isCopied ? '복사됨!' : '복사'}
        >
          {isCopied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          )}
        </button>

        {/* Like */}
        <button
          className={`msg-action-btn ${msg.feedback === 'positive' ? 'active-positive' : ''}`}
          onClick={() => handleFeedback(msg.id, 'positive')}
          title="좋아요"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.feedback === 'positive' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
        </button>

        {/* Dislike */}
        <button
          className={`msg-action-btn ${msg.feedback === 'negative' ? 'active-negative' : ''}`}
          onClick={() => handleFeedback(msg.id, 'negative')}
          title="싫어요"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.feedback === 'negative' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
        </button>
      </div>
    );
  };

  // 전체화면 열기/닫기 — 모드 전환 시 입력값 동기화
  // 축소모드 입력 → 전체화면 전환 후 자동 전송
  useEffect(() => {
    if (isFullscreen && pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      handleFsSendMessage(msg);
    }
  }, [isFullscreen]);

  const openFullscreen = () => {
    setFsInputValue(inputValue);
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    setInputValue(fsInputValue);
    // 축소 애니메이션 재생 후 언마운트 (280ms = fsClose 애니메이션 길이)
    setIsClosingFs(true);
    setTimeout(() => {
      setIsClosingFs(false);
      setIsFullscreen(false);
      document.body.style.overflow = "";
    }, 280);
  };

  // 전체화면 전용 메시지 전송 (messageOverride: 축소모드에서 전환 시 직접 전달)
  const handleFsSendMessage = async (messageOverride?: string) => {
    if (isGuestLimitReached) {
      setShowTurnLimitModal(true);
      return;
    }
    const msgText = messageOverride || fsInputValue.trim();
    if (!msgText || isLoading) return;

    const currentFiles = pendingFiles.length > 0 ? [...pendingFiles] : undefined;
    setFsInputValue("");
    if (fsInputRef.current) fsInputRef.current.style.height = 'auto';
    await sendChatMessage(msgText, currentFiles);
  };

  // 전체화면 전용 키 핸들러
  const handleFsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFsSendMessage();
    }
  };

  // 메시지를 턴(user+assistant 쌍) 단위로 그룹화
  const computeTurns = (): Message[][] => {
    const turns: Message[][] = [];
    let currentTurn: Message[] = [];
    messages.forEach((msg) => {
      currentTurn.push(msg);
      if (msg.role === "assistant") {
        turns.push([...currentTurn]);
        currentTurn = [];
      }
    });
    if (currentTurn.length > 0) turns.push([...currentTurn]);
    return turns;
  };

  // 존 라벨의 띄어쓰기 변형(variant) 생성 — "파워 월"↔"파워월", "피팅룸"↔"피팅 룸"
  const generateZoneLabelVariants = (label: string): string[] => {
    const variants: string[] = [];
    // 공백 제거 버전: "파워 월" → "파워월"
    const noSpace = label.replace(/\s+/g, '');
    if (noSpace !== label && noSpace.length >= 2) variants.push(noSpace);
    // 한글 사이 공백 추가 버전: "피팅룸" → "피팅 룸"
    const withSpace = label.replace(/([가-힣]{2,})([가-힣]{2,})/g, '$1 $2');
    if (withSpace !== label && withSpace.length >= 3) variants.push(withSpace);
    return variants;
  };

  // Phase 6 B-7: 어시스턴트 메시지에서 존 이름을 감지하고 클릭 가능한 링크로 변환
  const renderMessageWithZoneLinks = useCallback((content: string) => {
    // vizDirective가 없으면 텍스트만 반환
    if (!vizDirective) {
      return content;
    }

    // 존 라벨 → ID 맵 생성 (비주얼라이저에 실제 표시된 zone만 사용)
    const zoneLabels: Array<{ label: string; id: string; color: string }> = [];
    const addedLabels = new Set<string>(); // 중복 방지

    if (vizDirective.zones && vizDirective.zones.length > 0) {
      // 동적 존이 있으면 동적 존만 사용 (비주얼라이저와 1:1 대응)
      for (const z of vizDirective.zones) {
        if (!addedLabels.has(z.label)) {
          zoneLabels.push({ label: z.label, id: z.id, color: z.color });
          addedLabels.add(z.label);
        }
        // 괄호 부분 제거한 기본 이름도 매칭 대상에 추가 (예: "파워 월 (봄 신상)" → "파워 월")
        const baseName = z.label.replace(/\s*\(.*?\)\s*$/, '').trim();
        if (baseName && baseName !== z.label && baseName.length >= 2 && !addedLabels.has(baseName)) {
          zoneLabels.push({ label: baseName, id: z.id, color: z.color });
          addedLabels.add(baseName);
        }
      }
    } else {
      // 동적 존이 없을 때만 정적 존 사용 (fallback)
      for (const [zoneId, label] of Object.entries(ZONE_LABELS_KO)) {
        if (!addedLabels.has(label)) {
          zoneLabels.push({ label, id: zoneId, color: getZoneColorHex(zoneId) });
          addedLabels.add(label);
        }
      }
    }

    // 띄어쓰기 변형(variant) 추가 — "파워 월"↔"파워월", "피팅룸"↔"피팅 룸" 등
    const variantLabels: typeof zoneLabels = [];
    for (const z of zoneLabels) {
      for (const variant of generateZoneLabelVariants(z.label)) {
        if (!addedLabels.has(variant)) {
          variantLabels.push({ label: variant, id: z.id, color: z.color });
          addedLabels.add(variant);
        }
      }
    }
    zoneLabels.push(...variantLabels);

    if (zoneLabels.length === 0) return content;

    // 라벨 길이 내림차순 정렬 (긴 라벨 우선 매칭 — 풀 라벨이 기본 이름보다 먼저 매칭)
    zoneLabels.sort((a, b) => b.label.length - a.label.length);

    // 라벨을 정규식으로 찾아서 분할
    const pattern = zoneLabels.map(z => z.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!pattern) return content;

    const regex = new RegExp(`(${pattern})`, 'g');
    const parts = content.split(regex);

    return parts.map((part, i) => {
      const zone = zoneLabels.find(z => z.label === part);
      if (zone) {
        return (
          <span
            key={i}
            className="chat-zone-link"
            style={{ color: zone.color, cursor: 'pointer', borderBottom: `1px dashed ${zone.color}55` }}
            onMouseEnter={() => setChatHighlightZones([zone.id])}
            onMouseLeave={() => setChatHighlightZones([])}
            onClick={() => {
              // 존 클릭 시 해당 존으로 카메라 포커스
              if (vizDirective) {
                setVizDirective(prev => prev ? { ...prev, focusZone: zone.id, cameraAngle: 'perspective' as const } : prev);
              }
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }, [vizDirective]);

  // 인라인 채팅 메시지 렌더링 (collapsible turns)
  const renderCollapsibleMessages = () => {
    if (messages.length === 0 && !isLoading) {
      return <div className="chat-message-empty">대화를 시작해보세요</div>;
    }

    const turns = computeTurns();
    const hiddenCount = Math.max(0, turns.length - VISIBLE_TURNS);
    const hiddenTurns = turns.slice(0, hiddenCount);
    const visibleTurns = turns.slice(hiddenCount);

    return (
      <>
        {/* 접기 가능한 이전 대화 */}
        {hiddenTurns.length > 0 && (
          <>
            <div className="chat-collapsed-group">
              <button
                className={`chat-expand-btn${expandedOldMessages ? " expanded" : ""}`}
                onClick={() => setExpandedOldMessages(!expandedOldMessages)}
              >
                <span className="expand-arrow">▶</span>
                {expandedOldMessages
                  ? "이전 대화 접기"
                  : `이전 대화 ${hiddenTurns.length}개 보기`}
              </button>
              <div className={`chat-hidden-messages${expandedOldMessages ? " expanded" : ""}`}>
                {hiddenTurns.flat().map((msg) => (
                  <div key={msg.id} className="chat-message-wrapper">
                    <div className={`chat-message ${msg.role}`}>
                      {msg.role === 'user' && renderAttachments(msg.attachments)}
                      {msg.content}
                    </div>
                    {renderMessageActions(msg, 'inline')}
                  </div>
                ))}
              </div>
            </div>
            <div className="chat-divider">
              <span>최근 대화</span>
            </div>
          </>
        )}

        {/* 최근 대화 (항상 표시) */}
        {visibleTurns.flat().map((msg) => {
          // 빈 assistant placeholder는 숨김 (로딩 인디케이터가 대신 표시됨)
          if (msg.role === 'assistant' && !msg.content) return null;
          return (
            <div key={msg.id} className="chat-message-wrapper">
              <div className={`chat-message ${msg.role}`}>
                {msg.role === 'user' && renderAttachments(msg.attachments)}
                {msg.role === 'assistant' ? renderMessageWithZoneLinks(msg.content) : msg.content}
              </div>
              {msg.role === 'assistant' && msg.searchSourceInfo && (
                msg.searchSourceInfo.knowledgeSourceCount > 0 || msg.searchSourceInfo.webSearchPerformed
              ) && (
                <div className="chat-search-sources compact">
                  {msg.searchSourceInfo.knowledgeSourceCount > 0 && (
                    <span className="chat-source-badge knowledge">
                      지식 {msg.searchSourceInfo.knowledgeSourceCount}건
                    </span>
                  )}
                  {msg.searchSourceInfo.webSearchPerformed && (
                    <span className="chat-source-badge web">웹 검색</span>
                  )}
                  {msg.searchSourceInfo.factCount && msg.searchSourceInfo.factCount > 0 && (
                    <span className="chat-source-badge fact">팩트 {msg.searchSourceInfo.factCount}건</span>
                  )}
                  {msg.searchSourceInfo.searchSources && msg.searchSourceInfo.searchSources.length > 0 && (
                    <div className="chat-source-links">
                      {msg.searchSourceInfo.searchSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chat-source-link"
                          title={src.url}
                        >
                          {src.title.length > 30 ? src.title.slice(0, 30) + '…' : src.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {renderMessageActions(msg, 'inline')}
            </div>
          );
        })}
      </>
    );
  };

  // 전체화면 채팅 메시지 렌더링 — 축소모드와 동일한 collapsible 패턴 + Phase J 기능 통합
  const renderFsCollapsibleMessages = () => {
    if (messages.length === 0 && !isLoading) {
      return <div className="chat-fs-empty">대화를 시작해보세요</div>;
    }

    const turns = computeTurns();
    const hiddenCount = Math.max(0, turns.length - VISIBLE_TURNS);
    const hiddenTurns = turns.slice(0, hiddenCount);
    const visibleTurns = turns.slice(hiddenCount);

    return (
      <>
        {/* 접기 가능한 이전 대화 */}
        {hiddenTurns.length > 0 && (
          <>
            <div className="chat-collapsed-group">
              <button
                className={`chat-expand-btn${expandedOldMessages ? " expanded" : ""}`}
                onClick={() => setExpandedOldMessages(!expandedOldMessages)}
              >
                <span className="expand-arrow">▶</span>
                {expandedOldMessages
                  ? "이전 대화 접기"
                  : `이전 대화 ${hiddenTurns.length}개 보기`}
              </button>
              <div className={`chat-hidden-messages${expandedOldMessages ? " expanded" : ""}`}>
                {hiddenTurns.flat().map((msg) => (
                  <div key={msg.id} className="chat-fs-message-wrapper">
                    <div className={`chat-fs-message ${msg.role}`}>
                      {msg.role === 'user' && renderAttachments(msg.attachments)}
                      {msg.content}
                    </div>
                    {renderMessageActions(msg, 'fullscreen')}
                  </div>
                ))}
              </div>
            </div>
            <div className="chat-divider">
              <span>최근 대화</span>
            </div>
          </>
        )}

        {/* 최근 대화 (항상 표시) */}
        {visibleTurns.flat().map((msg) => {
          // 빈 assistant placeholder는 숨김 (로딩 인디케이터가 대신 표시됨)
          if (msg.role === 'assistant' && !msg.content) return null;
          return (
            <div key={msg.id} className="chat-fs-message-wrapper">
              <div className={`chat-fs-message ${msg.role}`}>
                {msg.role === 'user' && renderAttachments(msg.attachments)}
                {msg.role === 'assistant' ? renderMessageWithZoneLinks(msg.content) : msg.content}
              </div>
              {msg.role === 'assistant' && msg.searchSourceInfo && (
                msg.searchSourceInfo.knowledgeSourceCount > 0 || msg.searchSourceInfo.webSearchPerformed
              ) && (
                <div className="chat-search-sources compact">
                  {msg.searchSourceInfo.knowledgeSourceCount > 0 && (
                    <span className="chat-source-badge knowledge">
                      지식 {msg.searchSourceInfo.knowledgeSourceCount}건
                    </span>
                  )}
                  {msg.searchSourceInfo.webSearchPerformed && (
                    <span className="chat-source-badge web">웹 검색</span>
                  )}
                  {msg.searchSourceInfo.factCount && msg.searchSourceInfo.factCount > 0 && (
                    <span className="chat-source-badge fact">팩트 {msg.searchSourceInfo.factCount}건</span>
                  )}
                  {msg.searchSourceInfo.searchSources && msg.searchSourceInfo.searchSources.length > 0 && (
                    <div className="chat-source-links">
                      {msg.searchSourceInfo.searchSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chat-source-link"
                          title={src.url}
                        >
                          {src.title.length > 30 ? src.title.slice(0, 30) + '…' : src.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {renderMessageActions(msg, 'fullscreen')}
            </div>
          );
        })}
      </>
    );
  };

  // 타임라인 룰러 렌더링 (minor tick 포함)
  const renderTimelineRuler = () => {
    const elements: JSX.Element[] = [];
    TIMELINE_YEARS.forEach((year, index) => {
      const isActive = year === 2026;
      const pos = 3 + (index / (TIMELINE_YEARS.length - 1)) * 94;

      // 활성 연도의 dot
      if (isActive) {
        elements.push(
          <div
            key={`dot-${year}`}
            className="ruler-dot"
            style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          />
        );
      }

      // 연도 마크
      elements.push(
        <div
          key={year}
          className={`ruler-mark${isActive ? " active" : ""}`}
          style={{ left: `${pos}%` }}
        >
          <div className="line"></div>
          <div className="label">{year}</div>
        </div>
      );

      // minor tick marks (연도 사이 3개씩)
      if (index < TIMELINE_YEARS.length - 1) {
        const gap = 94 / (TIMELINE_YEARS.length - 1);
        for (let t = 1; t <= 3; t++) {
          elements.push(
            <div
              key={`${year}-tick-${t}`}
              className="ruler-mark ruler-minor"
              style={{ left: `${pos + (t * gap) / 4}%` }}
            >
              <div className="line"></div>
            </div>
          );
        }
      }
    });
    return elements;
  };

  return (
    <div className="chat-page">
      <SEOHead
        title="AI Chat"
        description="NEURALTWIN AI와 대화하세요. 리테일 운영 최적화, 매장 분석, 디지털 트윈에 대해 전문가 수준의 답변을 제공합니다."
        path="/"
      />
      {/* ==================== TURN LIMIT MODAL ==================== */}
      {showTurnLimitModal && (
        <div className="turn-limit-overlay" onClick={() => setShowTurnLimitModal(false)}>
          <div className="turn-limit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="turn-limit-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 className="turn-limit-title">대화 횟수를 모두 사용했습니다</h3>
            <p className="turn-limit-desc">
              비회원 모드에서는 세션당 최대 {MAX_GUEST_TURNS}회까지 대화할 수 있습니다.<br />
              새로운 대화를 시작하시거나, 회원가입 후 무제한으로 이용해보세요.
            </p>
            <div className="turn-limit-counter">
              <span className="turn-limit-count">{turnCount}</span>
              <span className="turn-limit-max">/ {MAX_GUEST_TURNS} 턴 사용</span>
            </div>
            <div className="turn-limit-actions">
              <Link to="/auth" className="turn-limit-login-btn" onClick={() => setShowTurnLimitModal(false)}>
                로그인하면 무제한 이용 &rarr;
              </Link>
              <button className="turn-limit-reset-btn" onClick={handleResetSession}>
                새 대화 시작
              </button>
              <button className="turn-limit-close-btn" onClick={() => setShowTurnLimitModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FULLSCREEN CHAT OVERLAY ==================== */}
      {/* 조건부 렌더링: isFullscreen 또는 closing 애니메이션 중일 때 DOM 유지 */}
      {(isFullscreen || isClosingFs) && (
      <div className={`chat-fullscreen ${isClosingFs ? "closing" : "open"}`}>
        <div className="chat-fs-header">
          <span className="chat-fs-brand">NEURALTWIN CHAT</span>
          <div className="chat-fs-header-actions">
            {/* Export 버튼 */}
            <div className="export-menu-container" ref={exportMenuRef}>
              <button
                className="chat-fs-action-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={messages.length === 0 || isExporting}
                title="대화 내보내기"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {isExporting ? '내보내는 중...' : '내보내기'}
              </button>
              {showExportMenu && (
                <div className="export-menu-dropdown">
                  <button className="export-menu-item" onClick={() => handleExport('md')}>
                    <span className="export-icon">MD</span>
                    Markdown
                  </button>
                  <button className="export-menu-item" onClick={() => handleExport('pdf')}>
                    <span className="export-icon">PDF</span>
                    PDF
                  </button>
                  <button className="export-menu-item" onClick={() => handleExport('docx')}>
                    <span className="export-icon">DOC</span>
                    Word
                  </button>
                </div>
              )}
            </div>

            <button className="chat-fs-minimize" onClick={closeFullscreen}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
              축소
            </button>
          </div>
        </div>

        {/* 전체화면 모바일 탭 (vizDirective 있을 때만, 768px 이하에서만 표시) */}
        {vizDirective && (
          <div className="chat-fs-viz-tabs">
            <button
              className={`chat-fs-viz-tab${mobileActiveTab === "chat" ? " active" : ""}`}
              onClick={() => setMobileActiveTab("chat")}
            >
              채팅
            </button>
            <button
              className={`chat-fs-viz-tab${mobileActiveTab === "viz" ? " active" : ""}`}
              onClick={() => setMobileActiveTab("viz")}
            >
              3D 뷰
            </button>
          </div>
        )}

        {/* body 영역: vizDirective 유무에 따라 분할 */}
        <div className={`chat-fs-body-wrapper${vizDirective ? " with-viz" : ""}`}>
          {/* 좌측: 채팅 메시지 — 모바일에서 3D 뷰 탭 선택 시 숨김 */}
          <div
            className={`chat-fs-body${vizDirective && mobileActiveTab !== "chat" ? " mobile-tab-hidden" : ""}`}
            id="chat-fs-body"
          >
            <div className="chat-fs-inner">
              {/* 전체화면에서도 축소모드와 동일한 collapsible 메시지 렌더링 (Phase J 통합) */}
              {renderFsCollapsibleMessages()}
              {isLoading && !streamingMessageIdRef.current && (
                <div className="chat-fs-message assistant">
                  <div className="chat-fs-loading">
                    <span className="chat-fs-loading-text">
                      {searchSourceInfo
                        ? `리서치 완료 — 답변 생성 중`
                        : 'NEURALTWIN 리서치 중'}
                    </span>
                    <div className="chat-fs-loading-dot"></div>
                    <div className="chat-fs-loading-dot"></div>
                    <div className="chat-fs-loading-dot"></div>
                  </div>
                  {searchSourceInfo && (
                    <div className="chat-search-sources">
                      {searchSourceInfo.knowledgeSourceCount > 0 && (
                        <span className="chat-source-badge knowledge">
                          지식 {searchSourceInfo.knowledgeSourceCount}건
                        </span>
                      )}
                      {searchSourceInfo.webSearchPerformed && (
                        <span className="chat-source-badge web">웹 검색</span>
                      )}
                      {searchSourceInfo.factCount && searchSourceInfo.factCount > 0 && (
                        <span className="chat-source-badge fact">팩트 {searchSourceInfo.factCount}건</span>
                      )}
                      {searchSourceInfo.searchSources && searchSourceInfo.searchSources.length > 0 && (
                        <div className="chat-source-links">
                          {searchSourceInfo.searchSources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="chat-source-link"
                              title={src.url}
                            >
                              {src.title.length > 30 ? src.title.slice(0, 30) + '…' : src.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 전체화면: Suggestions 칩 */}
              {!isLoading && !isGuestLimitReached && suggestions.length > 0 && (
                <div className="chat-fs-suggestions">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="chat-fs-suggestion-chip"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* 전체화면: Lead Capture Form — 응답 완료 후에만 표시 */}
              {showLeadForm && !leadSubmitted && !isLoading && (
                <div className="chat-fs-lead-form-container">
                  <div className="chat-fs-lead-form">
                    <div className="chat-fs-lead-form-header">
                      <h4>더 자세한 상담을 원하시나요?</h4>
                      <button
                        className="chat-fs-lead-form-close"
                        onClick={handleLeadFormClose}
                      >
                        ✕
                      </button>
                    </div>
                    <p className="chat-fs-lead-form-desc">
                      연락처를 남겨주시면 전문 컨설턴트가 연락드립니다.
                    </p>
                    <form onSubmit={handleLeadSubmit}>
                      <input
                        type="email"
                        className="chat-fs-lead-input"
                        placeholder="이메일 *"
                        value={leadFormData.email}
                        onChange={(e) =>
                          setLeadFormData({ ...leadFormData, email: e.target.value })
                        }
                        required
                      />
                      <input
                        type="text"
                        className="chat-fs-lead-input"
                        placeholder="회사명"
                        value={leadFormData.company}
                        onChange={(e) =>
                          setLeadFormData({ ...leadFormData, company: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="chat-fs-lead-input"
                        placeholder="직책/역할"
                        value={leadFormData.role}
                        onChange={(e) =>
                          setLeadFormData({ ...leadFormData, role: e.target.value })
                        }
                      />
                      <button
                        type="submit"
                        className="chat-fs-lead-submit"
                        disabled={isSubmittingLead || !leadFormData.email.trim()}
                      >
                        {isSubmittingLead ? "제출 중..." : "상담 요청"}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div ref={fsMessagesEndRef} />
            </div>
          </div>

          {/* 우측: 3D Visualizer — 모바일에서 채팅 탭 선택 시 숨김 */}
          {vizDirective && (
            <div className={`chat-fs-viz${mobileActiveTab !== "viz" ? " mobile-tab-hidden" : ""}`}>
              {vizDirective.compare ? (
                <CompareVisualizer vizDirective={vizDirective} chatHighlightZones={chatHighlightZones} />
              ) : (
                <StoreVisualizer
                  vizState={vizDirective.vizState}
                  highlights={[...(vizDirective.highlights || []), ...chatHighlightZones]}
                  annotations={vizDirective.annotations || []}
                  showFlow={vizDirective.flowPath || false}
                  zones={vizDirective.zones}
                  kpis={vizDirective.kpis}
                  stage={vizDirective.stage}
                  storeParams={vizDirective.storeParams}
                  zoneScale={vizDirective.zoneScale}
                  focusZone={vizDirective.focusZone}
                  cameraAngle={vizDirective.cameraAngle}
                  onZoneClick={handleZoneClick}
                />
              )}
            </div>
          )}
        </div>

        <div className="chat-fs-footer">
          <div className="chat-fs-input-wrapper">
            {!isAuthenticated && turnCount > 0 && (
              <div className={`turn-counter-bar${isGuestLimitReached ? ' limit-reached' : ''}`}>
                <span className="turn-counter-text">{turnCount} / {MAX_GUEST_TURNS} 턴 사용</span>
                {isGuestLimitReached && (
                  <button className="turn-counter-reset" onClick={handleResetSession}>새 대화 시작</button>
                )}
              </div>
            )}
            <div className={`chat-fs-input-box${isGuestLimitReached ? ' disabled' : ''}`}>
              {/* 첨부 파일 미리보기 (풀스크린) */}
              {pendingFiles.length > 0 && (
                <div className="chat-pending-files">
                  {pendingFiles.map((file) => (
                    <div key={file.id} className="pending-file-chip">
                      {file.previewUrl ? (
                        <img src={file.previewUrl} alt={file.name} className="pending-file-thumb" />
                      ) : (
                        <span className="pending-file-icon">
                          {file.type.includes('pdf') ? 'PDF' : file.type.includes('word') || file.type.includes('document') ? 'DOC' : 'FILE'}
                        </span>
                      )}
                      <span className="pending-file-name">{file.name}</span>
                      <span className="pending-file-size">{formatFileSize(file.size)}</span>
                      <button
                        className="pending-file-remove"
                        onClick={() => handleRemoveFile(file.id)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="chat-fs-input-row">
                <textarea
                  ref={fsInputRef}
                  className="chat-fs-input"
                  placeholder={isGuestLimitReached ? "대화 횟수를 모두 사용했습니다" : PLACEHOLDERS[placeholderIndex]}
                  value={fsInputValue}
                  onChange={(e) => {
                    setFsInputValue(e.target.value);
                    const ta = e.target;
                    ta.style.height = 'auto';
                    ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
                  }}
                  onKeyDown={handleFsKeyDown}
                  rows={1}
                  disabled={isGuestLimitReached}
                />
              </div>
              <div className="chat-fs-input-actions">
                <div className="chat-fs-input-left">
                  {/* 파일 업로드 버튼 (풀스크린) */}
                  <input
                    ref={fsFileInputRef}
                    type="file"
                    className="chat-file-input-hidden"
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,.pdf,.txt,.csv,.md,.docx,.xlsx"
                  />
                  <button
                    className="chat-action-icon-btn"
                    onClick={() => fsFileInputRef.current?.click()}
                    title="파일 첨부"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </button>
                </div>
                <button
                  className="chat-send-btn"
                  onClick={() => handleFsSendMessage()}
                  disabled={!fsInputValue.trim() || isLoading || isGuestLimitReached}
                >
                  <svg
                    className="chat-send-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ==================== INTRO ANIMATION ==================== */}
      {!introHidden && (
        <>
          <div className={`intro-overlay${introComplete ? " done" : ""}`}>
            <div className="intro-logo-wrapper">
              <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" />
            </div>
            <div className="intro-tagline">Intelligence Redefined</div>
            <div className="intro-line"></div>
          </div>
          <div className={`intro-curtain-top${curtainsOpen ? " open" : ""}`}></div>
          <div className={`intro-curtain-bottom${curtainsOpen ? " open" : ""}`}></div>
        </>
      )}

      {/* ==================== PAGE CONTENT ==================== */}
      <div className={`page-content${contentVisible ? " visible" : ""}`}>
        {/* ==================== HERO with CHAT ==================== */}
        <section className="hero">
          {/* Grid Background */}
          <div className="hero-grid-bg">
            <div className="grid-lines"></div>
            <div className="grid-lines-fine"></div>
            <div className="grid-dots"></div>
            <div className="grid-glow"></div>
          </div>

          {/* Grid Coordinates */}
          <div className="grid-coord tl">0, 0</div>
          <div className="grid-coord tr">1920, 0</div>
          <div className="grid-coord bl">0, 1080</div>
          <div className="grid-coord br">1920, 1080</div>
          <div className="grid-axis-y">Y — Axis</div>
          <div className="grid-axis-x">X — Axis</div>

          {/* Nav */}
          <nav className="hero-nav">
            <a href="/" onClick={(e) => { if (location.pathname === "/") { e.preventDefault(); window.location.reload(); } }}>
              <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="logo-img" />
            </a>
            <div className="hero-nav-links">
              <Link to="/about">제품 &amp; 회사소개</Link>
              <Link to="/contact">문의하기</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/os/insights">대시보드</Link>
                  <button className="nav-auth-btn" onClick={() => signOut()}>로그아웃</button>
                </>
              ) : (
                <Link to="/auth" style={{ color: '#00d4aa' }}>로그인</Link>
              )}
            </div>
            <button className={`mobile-menu-btn${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="메뉴">
              <span className="mobile-menu-bar"></span>
              <span className="mobile-menu-bar"></span>
              <span className="mobile-menu-bar"></span>
            </button>
          </nav>
          {mobileMenuOpen && (
            <div className="mobile-menu-dropdown">
              <Link to="/about" onClick={() => setMobileMenuOpen(false)}>제품 &amp; 회사소개</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>문의하기</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/os/insights" onClick={() => setMobileMenuOpen(false)}>대시보드</Link>
                  <button className="mobile-auth-btn" onClick={() => { signOut(); setMobileMenuOpen(false); }}>로그아웃</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} style={{ color: '#00d4aa' }}>로그인</Link>
              )}
            </div>
          )}

          {/* Chat UI + Visualizer/Preset Split Layout */}
          <div
            className="hero-content"
            style={(vizDirective || messages.length === 0) ? { gap: "16px", padding: "0 24px" } : undefined}
          >
            {/* 채팅 영역 */}
            <div
              className={`chat-container${vizDirective ? " with-viz" : messages.length === 0 ? " with-presets" : ""}${vizDirective && mobileActiveTab !== "chat" ? " mobile-tab-hidden" : ""}`}
            >
              {/* 타이틀 + 전체화면 버튼 */}
              <div className="chat-title-row">
                <h1 className="chat-headline">가장 강력한 AI 리테일 어시스턴트</h1>
                <h2 className="chat-title">오늘은 어떤 업무를 도와드릴까요?</h2>

                {/* 모바일+태블릿: 프리셋 카드 인라인 (서브타이틀과 전체화면 버튼 사이) */}
                {showInlinePresets && messages.length === 0 && !vizDirective && !isFullscreen && !isClosingFs && (
                  <div className={`preset-inline-mobile${isMobile ? '' : ' preset-inline-tablet'}`}>
                    {LANDING_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        className="preset-card preset-card--shimmer"
                        onClick={() => handlePresetClick(preset)}
                      >
                        <span className="preset-cta-label">클릭 한 번으로 시작해보세요</span>
                        <div className="preset-thumbnail-wrapper">
                          <img src={preset.thumbnail} alt={preset.description} className="preset-thumbnail" />
                        </div>
                        <p className="preset-description">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  className="chat-expand-fullscreen-btn"
                  onClick={openFullscreen}
                  title="전체화면으로 보기"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  전체화면
                </button>
              </div>

              {/* 데스크톱 전용: 인라인 채팅 기록 (모바일에서는 숨김 → 전체화면에서만 표시) */}
              <div className="chat-inline-desktop">
                {!isAuthenticated && turnCount > 0 && (
                  <div className={`turn-counter-bar${isGuestLimitReached ? ' limit-reached' : ''}`}>
                    <span className="turn-counter-text">{turnCount} / {MAX_GUEST_TURNS} 턴 사용</span>
                    {isGuestLimitReached && (
                      <button className="turn-counter-reset" onClick={handleResetSession}>새 대화 시작</button>
                    )}
                  </div>
                )}

                <div className="chat-messages">
                  {renderCollapsibleMessages()}
                  {isLoading && !streamingMessageIdRef.current && (
                    <div className="chat-message assistant">
                      <div className="chat-loading">
                        <span className="chat-loading-text">
                          {searchSourceInfo
                            ? `리서치 완료 — 답변 생성 중`
                            : 'NEURALTWIN 리서치 중'}
                        </span>
                        <div className="chat-loading-dot"></div>
                        <div className="chat-loading-dot"></div>
                        <div className="chat-loading-dot"></div>
                      </div>
                      {searchSourceInfo && (
                        <div className="chat-search-sources">
                          {searchSourceInfo.knowledgeSourceCount > 0 && (
                            <span className="chat-source-badge knowledge">
                              지식 {searchSourceInfo.knowledgeSourceCount}건
                            </span>
                          )}
                          {searchSourceInfo.webSearchPerformed && (
                            <span className="chat-source-badge web">웹 검색</span>
                          )}
                          {searchSourceInfo.factCount && searchSourceInfo.factCount > 0 && (
                            <span className="chat-source-badge fact">팩트 {searchSourceInfo.factCount}건</span>
                          )}
                          {searchSourceInfo.searchSources && searchSourceInfo.searchSources.length > 0 && (
                            <div className="chat-source-links">
                              {searchSourceInfo.searchSources.map((src, i) => (
                                <a
                                  key={i}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="chat-source-link"
                                  title={src.url}
                                >
                                  {src.title.length > 30 ? src.title.slice(0, 30) + '…' : src.title}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestions + Lead Form: 스크롤 영역 내부에 배치 (입력창 겹침 방지) */}
                  {!isLoading && !isGuestLimitReached && suggestions.length > 0 && (
                    <div className="chat-suggestions">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="chat-suggestion-chip"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Lead Capture Form — 응답 완료 후에만 표시 */}
                  {showLeadForm && !leadSubmitted && !isLoading && (
                    <div className="chat-lead-form-container">
                      <div className="chat-lead-form">
                        <div className="chat-lead-form-header">
                          <h4>더 자세한 상담을 원하시나요?</h4>
                          <button className="chat-lead-form-close" onClick={handleLeadFormClose}>✕</button>
                        </div>
                        <p className="chat-lead-form-desc">연락처를 남겨주시면 전문 컨설턴트가 연락드립니다.</p>
                        <form onSubmit={handleLeadSubmit}>
                          <input type="email" className="chat-lead-input" placeholder="이메일 *" value={leadFormData.email} onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })} required />
                          <input type="text" className="chat-lead-input" placeholder="회사명" value={leadFormData.company} onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value })} />
                          <input type="text" className="chat-lead-input" placeholder="직책/역할" value={leadFormData.role} onChange={(e) => setLeadFormData({ ...leadFormData, role: e.target.value })} />
                          <button type="submit" className="chat-lead-submit" disabled={isSubmittingLead || !leadFormData.email.trim()}>
                            {isSubmittingLead ? "제출 중..." : "상담 요청"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 입력 영역 (모바일+데스크톱 공통) */}
              <div className={`chat-input-box${isGuestLimitReached ? ' disabled' : ''}`}>
                {/* 첨부 파일 미리보기 */}
                {pendingFiles.length > 0 && (
                  <div className="chat-pending-files">
                    {pendingFiles.map((file) => (
                      <div key={file.id} className="pending-file-chip">
                        {file.previewUrl ? (
                          <img src={file.previewUrl} alt={file.name} className="pending-file-thumb" />
                        ) : (
                          <span className="pending-file-icon">
                            {file.type.includes('pdf') ? 'PDF' : file.type.includes('word') || file.type.includes('document') ? 'DOC' : 'FILE'}
                          </span>
                        )}
                        <span className="pending-file-name">{file.name}</span>
                        <span className="pending-file-size">{formatFileSize(file.size)}</span>
                        <button
                          className="pending-file-remove"
                          onClick={() => handleRemoveFile(file.id)}
                          title="파일 제거"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="chat-input-row">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder={isGuestLimitReached ? "대화 횟수를 모두 사용했습니다" : PLACEHOLDERS[placeholderIndex]}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      const ta = e.target;
                      ta.style.height = 'auto';
                      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={isGuestLimitReached}
                  />
                </div>
                <div className="chat-input-actions">
                  <div className="chat-input-left">
                    {/* 파일 업로드 버튼 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="chat-file-input-hidden"
                      onChange={handleFileSelect}
                      multiple
                      accept="image/*,.pdf,.txt,.csv,.md,.docx,.xlsx"
                    />
                    <button
                      className="chat-action-icon-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="파일 첨부"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </button>

                    {/* Export 버튼 (인라인) */}
                    <div className="export-menu-container export-menu-inline" ref={messages.length > 0 ? undefined : exportMenuRef}>
                      <button
                        className="chat-action-icon-btn"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={messages.length === 0}
                        title="대화 내보내기"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      {showExportMenu && !isFullscreen && (
                        <div className="export-menu-dropdown export-menu-up">
                          <button className="export-menu-item" onClick={() => handleExport('md')}>
                            <span className="export-icon">MD</span>
                            Markdown
                          </button>
                          <button className="export-menu-item" onClick={() => handleExport('pdf')}>
                            <span className="export-icon">PDF</span>
                            PDF
                          </button>
                          <button className="export-menu-item" onClick={() => handleExport('docx')}>
                            <span className="export-icon">DOC</span>
                            Word
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="chat-send-btn"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || isGuestLimitReached}
                  >
                    <svg
                      className="chat-send-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 우측: 3D Visualizer (55%) - vizDirective가 있을 때만 표시 */}
            {/* 전체화면 활성 시 인라인 비주얼라이저 숨김 → 두 개의 Three.js 컨텍스트 충돌 방지 + 콘텐츠 동기화 보장 */}
            {vizDirective && !isFullscreen && !isClosingFs && (
              <div
                className={`visualizer-container${mobileActiveTab !== "viz" ? " mobile-tab-hidden" : ""}`}
              >
                {/* 3D Store Visualizer — KPI/Stage는 내부 오버레이로 렌더링 */}
                {vizDirective.compare ? (
                  <CompareVisualizer vizDirective={vizDirective} chatHighlightZones={chatHighlightZones} />
                ) : (
                  <StoreVisualizer
                    vizState={vizDirective.vizState}
                    highlights={[...(vizDirective.highlights || []), ...chatHighlightZones]}
                    annotations={vizDirective.annotations || []}
                    showFlow={vizDirective.flowPath || false}
                    zones={vizDirective.zones}
                    kpis={vizDirective.kpis}
                    stage={vizDirective.stage}
                    storeParams={vizDirective.storeParams}
                    zoneScale={vizDirective.zoneScale}
                    focusZone={vizDirective.focusZone}
                    cameraAngle={vizDirective.cameraAngle}
                    onZoneClick={handleZoneClick}
                  />
                )}
              </div>
            )}

            {/* 우측: 랜딩 프리셋 패널 — 데스크톱(1200px+)에서만 표시 */}
            {!showInlinePresets && messages.length === 0 && !vizDirective && !isFullscreen && !isClosingFs && (
              <div className="preset-panel">
                <div className="preset-grid">
                  {LANDING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className="preset-card preset-card--shimmer"
                      onClick={() => handlePresetClick(preset)}
                    >
                      <span className="preset-cta-label">클릭 한 번으로 시작해보세요</span>
                      <div className="preset-thumbnail-wrapper">
                        <img src={preset.thumbnail} alt={preset.description} className="preset-thumbnail" />
                      </div>
                      <p className="preset-description">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Semicircle Decoration */}
          <div className="hero-semicircle"></div>

          {/* Caption — 3D 비주얼라이저 또는 프리셋 패널 활성 시 숨김 (겹침 방지) */}
          {!vizDirective && messages.length > 0 && (
            <div className="hero-caption">
              <div className="dot"></div>
              <p>리테일 전문 지식으로 학습된<br />AI 어시스턴트, NEURALTWIN.</p>
            </div>
          )}

          {/* Timeline Ruler (minor ticks 포함) */}
          <div className="hero-ruler">
            <div className="ruler-track">
              {renderTimelineRuler()}
            </div>
          </div>

          {/* Giant Brand */}
          <div className="hero-brand">
            <h1>NEURALTWIN</h1>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="chat-footer">
          <div className="footer-left">
            <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="logo-img" />
            <p>복잡한 세계를 위한 AI 플랫폼.<br />데이터를 의사결정으로 전환합니다.</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Company &amp; Product</h4>
              <Link to="/about">제품 & 회사소개</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <Link to="/contact">문의하기</Link>
            </div>
          </div>
        </footer>
        <div className="footer-bottom">
          <span>© 2026 NEURALTWIN. All rights reserved.</span>
          <span><Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link></span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
