import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createFunction, type FunctionDefinition } from './functionFactory';
import { MathText } from './MathText';
import { Markdown } from './Markdown';
import type { FunctionSpec } from './functions';
type Message = { role: 'user' | 'assistant'; content: string; definition?: FunctionDefinition };
export function Chat({ onPlot }: { onPlot: (fn: FunctionSpec, def: FunctionDefinition) => void }) {
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [configured, setConfigured] = useState<boolean | null>(null);
  const controller = useRef<AbortController | null>(null),
    bottom = useRef<HTMLDivElement>(null),
    inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => {
        if (alive) setConfigured(d.configured);
      })
      .catch(() => {
        if (alive) setConfigured(false);
      });
    return () => {
      alive = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'end',
    });
  }, [messages, busy]);
  async function send(prompt: string) {
    if (!prompt.trim() || busy) return;
    const pending = [...messages, { role: 'user' as const, content: prompt.trim() }];
    setMessages(pending);
    setInput('');
    setError('');
    setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const response = await fetch('/api/function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          messages: pending.slice(-19).map(({ role, content, definition }) => ({
            role,
            content: definition ? JSON.stringify(definition) : content,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not generate a function.');
      const def = data.definition as FunctionDefinition | undefined;
      if (def) createFunction(def);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.message || def?.explanation, definition: def },
      ]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') setError('Generation stopped.');
      else
        setError(
          err instanceof Error ? err.message : 'Could not reach the function assistant. Try again.',
        );
    } finally {
      setBusy(false);
      controller.current = null;
      inputRef.current?.focus();
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }
  return (
    <section className="chat-screen" aria-label="Function assistant">
      <div className="chat-toolbar">
        <span>Function assistant</span>
        <button
          disabled={busy || messages.length === 0}
          onClick={() => {
            setMessages([]);
            setError('');
            inputRef.current?.focus();
          }}
        >
          New chat
        </button>
      </div>
      <div className="chat-conversation">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-mark">ƒ</div>
            <h1>What would you like to explore?</h1>
            <div className="chat-suggestions">
              {[
                'A spiral that slowly fades away',
                'A hyperbolic curve',
                'A wave inside another wave',
              ].map((prompt) => (
                <button key={prompt} disabled={busy} onClick={() => void send(prompt)}>
                  {prompt}
                  <span>↗</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((m, i) => (
              <article className={`chat-message ${m.role}`} key={i}>
                <span className="message-author">
                  {m.role === 'user' ? 'You' : 'Function Studies'}
                </span>
                <Markdown>{m.content}</Markdown>
                {m.definition ? (
                  <div className="function-response">
                    <h2>{m.definition.name}</h2>
                    <div>
                      <MathText tex={`y=${createFunction(m.definition).fy}`} />
                    </div>
                    <div>
                      <MathText tex={`x=${createFunction(m.definition).fz}`} />
                    </div>
                    <p>
                      Domain: {m.definition.domain[0].toFixed(2)} to{' '}
                      {m.definition.domain[1].toFixed(2)} ·{' '}
                      {m.definition.traveling ? 'Traveling wave' : 'Trace'}
                    </p>
                    <button onClick={() => onPlot(createFunction(m.definition!), m.definition!)}>
                      Plot this function <span>↗</span>
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
        {busy ? (
          <div className="chat-thinking" role="status">
            <span className="thinking-dot" />
            Finding your function…
          </div>
        ) : null}
        {error ? (
          <p className="chat-error" role="alert">
            {error}
          </p>
        ) : null}
        <div ref={bottom} />
      </div>
      <form className="chat-composer" onSubmit={submit}>
        <textarea
          ref={inputRef}
          aria-label="Describe a function"
          placeholder="Ask about math or describe a function…"
          value={input}
          maxLength={3000}
          rows={2}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        <div>
          <span>
            {configured === false
              ? 'The function assistant is not configured on this server.'
              : 'Enter to send · Shift + Enter for a new line'}
          </span>
          {busy ? (
            <button
              type="button"
              className="send-button"
              aria-label="Stop generating"
              onClick={() => controller.current?.abort()}
            >
              ■
            </button>
          ) : (
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M10 16V4m-5 5 5-5 5 5" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
