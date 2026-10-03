import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createFunction, type FunctionDefinition } from './functionFactory';
import { MathText } from './MathText';
import { Markdown } from './Markdown';
import type { FunctionSpec } from './functions';
type Message = { role: 'user' | 'assistant'; content: string; definition?: FunctionDefinition };
type Quota = {
  limit: number;
  used: number;
  committed: number;
  remaining: number;
  resetsAt: string;
};
export function Chat({ onPlot }: { onPlot: (fn: FunctionSpec, def: FunctionDefinition) => void }) {
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [configured, setConfigured] = useState<boolean | null>(null),
    [quota, setQuota] = useState<Quota | null>(null),
    [personalKey, setPersonalKey] = useState(''),
    [keyDraft, setKeyDraft] = useState(''),
    [keyError, setKeyError] = useState('');
  const keyPanel = useRef<HTMLDetailsElement>(null);
  const controller = useRef<AbortController | null>(null),
    bottom = useRef<HTMLDivElement>(null),
    inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (keyPanel.current && !keyPanel.current.contains(event.target as Node))
        keyPanel.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && keyPanel.current?.open) {
        keyPanel.current.open = false;
        keyPanel.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  useEffect(() => {
    let alive = true;
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setConfigured(d.configured);
          setQuota(d.quota);
        }
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
        headers: {
          'Content-Type': 'application/json',
          ...(personalKey ? { 'X-Function-API-Key': personalKey } : {}),
        },
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
      if (!personalKey)
        fetch('/api/status')
          .then((r) => r.json())
          .then((d) => {
            setQuota(d.quota);
            setConfigured(d.configured);
          })
          .catch(() => undefined);
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
      <details ref={keyPanel} className="assistant-access">
        <summary className="access-trigger" aria-label="AI access settings">
          <svg
            viewBox="0 0 20 20"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
          >
            <path d="M3 5h14M3 10h14M3 15h14" />
            <circle cx="7" cy="5" r="2" fill="white" />
            <circle cx="13" cy="10" r="2" fill="white" />
            <circle cx="8" cy="15" r="2" fill="white" />
          </svg>
          AI access
          {personalKey ? (
            <span className="personal-key-dot" aria-label="Personal key active" />
          ) : null}
        </summary>
        <div className="key-settings">
          <div className="quota-status">
            {personalKey
              ? 'Using your key'
              : quota
                ? `${quota.remaining.toLocaleString()} / 500,000 public tokens available`
                : 'Public assistant unavailable'}
            <small>
              {personalKey
                ? 'Your provider usage applies.'
                : 'Shared daily allowance · resets at midnight IST'}
            </small>
          </div>
          <label htmlFor="personal-api-key">Your Google AI API key</label>
          <input
            id="personal-api-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={keyDraft}
            onChange={(e) => {
              setKeyDraft(e.target.value);
              setKeyError('');
            }}
            placeholder="Paste your key"
            disabled={busy}
          />
          <p>
            Kept only in this tab’s memory. Sent to our server and Google for your requests, never
            saved. Refreshing clears it.
          </p>
          {keyError ? (
            <p role="alert" className="form-error">
              {keyError}
            </p>
          ) : null}
          <div>
            <button
              disabled={busy}
              onClick={() => {
                const key = keyDraft.trim();
                if (key.length < 20 || key.length > 200 || /\s/.test(key)) {
                  setKeyError('Enter a valid API key.');
                  return;
                }
                setPersonalKey(key);
                setKeyDraft('');
                setKeyError('');
                setError('');
                if (keyPanel.current) keyPanel.current.open = false;
              }}
            >
              Use key
            </button>
            {personalKey ? (
              <button
                disabled={busy}
                onClick={() => {
                  setPersonalKey('');
                  setKeyDraft('');
                  setError('');
                  if (keyPanel.current) keyPanel.current.open = false;
                }}
              >
                Remove key
              </button>
            ) : null}
          </div>
        </div>
      </details>
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
            {configured === false && !personalKey
              ? 'Use your own key while the public assistant is unavailable.'
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
