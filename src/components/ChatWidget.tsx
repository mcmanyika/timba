import { Link } from "@tanstack/react-router";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "@/lib/api/chat.functions";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "timba-chat-id";
const WELCOME =
  "Hello — I'm the editorial assistant for The Timba Papers. I can help you find essays and papers, subscribe for updates, or pass along an inquiry to the desk. How can I help?";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [relatedLinks, setRelatedLinks] = useState<{ title: string; slug: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setConversationId(stored);
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: WELCOME }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const apiMessages = nextMessages.filter(
        (m) => m.role === "user" || (m.role === "assistant" && m.content !== WELCOME),
      );
      const payload =
        apiMessages.length > 0 ? apiMessages : [{ role: "user" as const, content: text }];

      const result = await sendChatMessage({
        data: {
          messages: payload,
          sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
          conversationId,
        },
      });

      if (result.conversationId) {
        setConversationId(result.conversationId);
        sessionStorage.setItem(STORAGE_KEY, result.conversationId);
      }
      if (result.relatedLinks?.length) setRelatedLinks(result.relatedLinks);
      setMessages((prev) => [...prev, { role: "assistant", content: result.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:bg-transparent md:pointer-events-none"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {open && (
          <div
            className={cn(
              "w-[min(100vw-2rem,24rem)] h-[min(70vh,32rem)] flex flex-col",
              "border border-divider bg-background shadow-2xl",
              "animate-in fade-in slide-in-from-bottom-4 duration-200",
            )}
            role="dialog"
            aria-label="Chat assistant"
          >
            <header className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3 bg-surface">
              <div>
                <div className="pub-number">Assistant</div>
                <p className="font-serif text-sm mt-0.5">The Timba Papers</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 text-text-secondary hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-sm leading-relaxed max-w-[90%]",
                    m.role === "user"
                      ? "ml-auto bg-gold text-background px-3 py-2"
                      : "mr-auto text-foreground",
                  )}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <p className="text-sm text-text-secondary animate-pulse">Thinking…</p>
              )}
              {relatedLinks.length > 0 && !loading && (
                <div className="pt-2 border-t border-divider">
                  <p className="pub-number mb-2">Related</p>
                  <ul className="space-y-1">
                    {relatedLinks.map((link) => (
                      <li key={link.slug}>
                        <Link
                          to="/p/$slug"
                          params={{ slug: link.slug }}
                          className="text-sm text-gold hover:underline line-clamp-2"
                          onClick={() => setOpen(false)}
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={onSend} className="border-t border-divider p-3 flex gap-2 bg-surface">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="Ask about papers, subscribe, or leave an inquiry…"
                disabled={loading}
                className="flex-1 resize-none bg-background border border-divider px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 self-end bg-gold text-background p-2.5 disabled:opacity-50 hover:bg-gold/90 transition-colors"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 bg-gold text-background px-4 py-3 shadow-lg",
            "hover:bg-gold/90 transition-colors uppercase tracking-wider text-xs font-medium",
          )}
          aria-expanded={open}
          aria-label={open ? "Close chat" : "Open chat assistant"}
        >
          {open ? <X className="size-4" /> : <MessageCircle className="size-4" />}
          {open ? "Close" : "Ask"}
        </button>
      </div>
    </>
  );
}
