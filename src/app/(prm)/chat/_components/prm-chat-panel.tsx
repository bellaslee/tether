'use client';

import { useCallback, useId, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { FormTextarea } from '@/components/ui/form-textarea';
import type { PersonOption } from '@/components/people/attendee-picker';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { prmChatTurn } from '@/lib/actions/prm-chat';
import type {
  PrmChatAssistantPayload,
  PrmChatClientMessage,
  PrmChatProposalWithClientId,
} from '@/lib/actions/prm-chat';
import { PrmChatProposalCard } from './prm-chat-proposal-card';

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
      proposals: PrmChatProposalWithClientId[];
      dismissed: Record<string, boolean>;
    };

function toClientMessages(rows: ChatMessage[]): PrmChatClientMessage[] {
  return rows.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

type PrmChatPanelProps = {
  chatPeople: PersonOption[];
  chatCategories: { id: string; name: string }[];
  chatInteractionTypes: InteractionTypeOption[];
  /** IANA zone used when confirming moments (matches server `applyChatProposal` parsing). */
  momentWallZone: string;
};

export function PrmChatPanel({
  chatPeople,
  chatCategories,
  chatInteractionTypes,
  momentWallZone,
}: PrmChatPanelProps) {
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
      const res = await prmChatTurn(toClientMessages(nextThread));
      if ('error' in res) {
        setError(res.error);
        return;
      }
      const a: PrmChatAssistantPayload = res.assistant;
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
    <div className="space-y-6">
      <div
        ref={scrollRef}
        className="card-surface max-h-[min(32rem,70vh)] min-h-[12rem] space-y-4 overflow-y-auto rounded-[1.75rem] border border-border-soft p-4 sm:p-6"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-muted">
            Ask who you last talked to, what someone cares about,
            mention a hangout or call in plain language, or suggest a profile
            update. Anything that changes your data shows up here as a card you
            can edit before you confirm.
          </p>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className="space-y-3">
            {m.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-white/80 px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm ring-1 ring-border-soft">
                  {m.content}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-w-[95%] rounded-2xl bg-white/60 px-4 py-3 text-sm leading-relaxed text-foreground ring-1 ring-border-soft">
                  {m.content}
                </div>
                {m.proposals
                  .filter((p) => !m.dismissed[p.clientId])
                  .map((p) => (
                    <PrmChatProposalCard
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

        {pending ? (
          <p className="text-xs font-medium text-muted motion-reduce:transition-none">
            Thinking…
          </p>
        ) : null}
      </div>

      {error ? <FieldError size="compact">{error}</FieldError> : null}

      <form
        id={formId}
        className="card-surface rounded-[1.75rem] border border-border-soft p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor={`${formId}-composer`} className="sr-only">
          Message
        </label>
        <FormTextarea
          id={`${formId}-composer`}
          rows={3}
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
          placeholder="Ask Tether..."
          disabled={pending}
          className="min-h-[5.5rem] resize-y"
        />
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="cursor-pointer"
            disabled={pending || !input.trim()}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
