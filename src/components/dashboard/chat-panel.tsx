'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { ArrowUp, Copy, Mic } from 'lucide-react';
import { FieldError } from '@/components/ui/field-error';
import type { PersonOption } from '@/components/people/attendee-picker';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { submitChatTurn } from '@/lib/actions/chat-turn';
import type {
  ChatAssistantPayload,
  ChatClientMessage,
  ChatProposalWithClientId,
} from '@/lib/actions/chat-turn';
import { ChatProposalCard } from './chat-proposal-card';

type ChatMessage =
  | {
      id: string;
      role: 'user';
      content: string;
    }
  | {
      id: string;
      role: 'assistant';
      content: string;
      proposals: ChatProposalWithClientId[];
      dismissed: Record<string, boolean>;
    };

function toClientMessages(rows: ChatMessage[]): ChatClientMessage[] {
  return rows.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function AssistantMessageToolbar({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current !== undefined) {
        clearTimeout(copiedTimeoutRef.current);
      }
    },
    [],
  );

  const onCopy = useCallback(async () => {
    const ok = await copyToClipboard(content);
    if (!ok) return;
    if (copiedTimeoutRef.current !== undefined) {
      clearTimeout(copiedTimeoutRef.current);
    }
    setCopied(true);
    copiedTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimeoutRef.current = undefined;
    }, 2200);
  }, [content]);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="rounded-md p-1.5 text-muted transition hover:bg-surface-strong hover:text-foreground"
        aria-label="Copy message"
        onClick={() => void onCopy()}
      >
        <Copy className="size-4" strokeWidth={1.75} />
      </button>
      {copied ? (
        <span className="text-xs font-medium text-success" role="status">
          Copied to clipboard
        </span>
      ) : null}
    </div>
  );
}

function ChatLoadingWave() {
  return (
    <div
      className="flex items-end gap-1.5 py-1"
      role="status"
      aria-live="polite"
      aria-label="Assistant is replying"
    >
      <span className="sr-only">Loading response</span>
      <span
        className="tether-chat-loading-dot bg-accent"
        aria-hidden="true"
      />
      <span
        className="tether-chat-loading-dot bg-accent-sun"
        aria-hidden="true"
      />
      <span
        className="tether-chat-loading-dot bg-accent-sky"
        aria-hidden="true"
      />
    </div>
  );
}

type ChatPanelProps = {
  chatPeople: PersonOption[];
  chatCategories: { id: string; name: string }[];
  chatInteractionTypes: InteractionTypeOption[];
  /** IANA zone used when confirming moments (matches server `applyChatProposal` parsing). */
  momentWallZone: string;
};

export function ChatPanel({
  chatPeople,
  chatCategories,
  chatInteractionTypes,
  momentWallZone,
}: ChatPanelProps) {
  const formId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, pending, error]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || pending) {
      return;
    }
    setInput('');
    setError(undefined);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    const nextThread = [...messages, userMsg];
    setMessages(nextThread);

    startTransition(async () => {
      const res = await submitChatTurn(toClientMessages(nextThread));
      if ('error' in res) {
        setError(res.error);
        return;
      }
      const a: ChatAssistantPayload = res.assistant;
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: a.content,
        proposals: a.proposals,
        dismissed: {},
      };
      setMessages((prev) => [...prev, assistantMsg]);
    });
  }, [input, messages, pending]);

  const dismissProposal = useCallback((messageId: string, clientId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || m.role !== 'assistant') {
          return m;
        }
        return {
          ...m,
          dismissed: { ...m.dismissed, [clientId]: true },
        };
      }),
    );
  }, []);

  const applySummary = useCallback((messageId: string, clientId: string, summary: string) => {
    setMessages((prev) => {
      const next = prev.map((m) => {
        if (m.id !== messageId || m.role !== 'assistant') {
          return m;
        }
        return {
          ...m,
          dismissed: { ...m.dismissed, [clientId]: true },
        };
      });
      next.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: summary,
        proposals: [],
        dismissed: {},
      });
      return next;
    });
  }, []);

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-border-soft bg-surface/80 shadow-sm">
      <div
        ref={scrollRef}
        className="max-h-[min(32rem,70dvh)] min-h-[12rem] space-y-5 overflow-y-auto bg-surface/40 px-4 py-6 sm:px-6"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <p className="mx-auto max-w-md text-center text-sm leading-relaxed text-muted">
            Ask who you last talked to, what someone cares about, or describe a
            hangout. Anything that changes your data appears as a card you can
            edit before you confirm.
          </p>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className="space-y-3">
            {m.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[min(85%,28rem)] rounded-full bg-surface-strong px-4 py-2.5 text-sm leading-relaxed text-foreground ring-1 ring-border-soft">
                  {m.content}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-w-[min(95%,36rem)] text-sm leading-relaxed text-foreground">
                  {m.content}
                </div>
                <AssistantMessageToolbar content={m.content} />
                {m.proposals
                  .filter((p) => !m.dismissed[p.clientId])
                  .map((p) => (
                    <ChatProposalCard
                      key={p.clientId}
                      messageId={m.id}
                      proposal={p}
                      chatPeople={chatPeople}
                      chatCategories={chatCategories}
                      chatInteractionTypes={chatInteractionTypes}
                      momentWallZone={momentWallZone}
                      onCancel={() => dismissProposal(m.id, p.clientId)}
                      onApplied={(summary) => applySummary(m.id, p.clientId, summary)}
                    />
                  ))}
              </div>
            )}
          </div>
        ))}

        {pending ? <ChatLoadingWave /> : null}
      </div>

      {error ? (
        <div className="border-t border-border-soft px-4 pb-2 pt-1 sm:px-6">
          <FieldError size="compact">{error}</FieldError>
        </div>
      ) : null}

      <form
        id={formId}
        className="border-t border-border-soft bg-surface/60 px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        {messages.length === 0 ? (
          <p className="mb-3 text-center text-sm font-medium text-foreground">
            How can I help you?
          </p>
        ) : null}
        <label htmlFor={`${formId}-composer`} className="sr-only">
          Message
        </label>
        <div className="flex w-full min-w-0 items-end gap-1 rounded-full border border-border-soft bg-white/80 px-1.5 py-1 shadow-sm sm:gap-1.5 sm:px-2">
          <textarea
            id={`${formId}-composer`}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.shiftKey) {
                return;
              }
              e.preventDefault();
              if (!pending && input.trim()) {
                send();
              }
            }}
            placeholder="Ask anything"
            disabled={pending}
            className="max-h-32 min-h-[2.75rem] min-w-0 flex-1 resize-none border-0 bg-transparent py-2.5 pl-2 text-sm leading-snug text-foreground outline-none ring-0 placeholder:text-muted focus:ring-0 disabled:opacity-60 sm:pl-3"
          />
          <button
            type="button"
            className="mb-0.5 inline-flex shrink-0 rounded-full p-2 text-muted transition hover:bg-surface-strong hover:text-foreground"
            aria-label="Voice input — not available yet"
            title="Coming soon"
          >
            <Mic className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="submit"
            className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold !text-white shadow-[var(--shadow-lift)] transition duration-200 ease-out hover:-translate-y-px hover:!text-white focus-visible:!text-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            aria-label="Send"
            disabled={pending || !input.trim()}
          >
            <ArrowUp className="size-5" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}
