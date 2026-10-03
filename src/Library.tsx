import { useEffect, useRef, useState } from 'react';
import { functions } from './functions';
type Props = { id: string; onSelect: (id: string) => void; onCustom: () => void };
export function Library({ id, onSelect, onCustom }: Props) {
  return (
    <nav className="function-library" aria-label="Function library">
      {['Trigonometric', 'Hyperbolic', 'Polynomial', 'Other'].map((group) => (
        <div className="nav-group" key={group}>
          <h3>{group}</h3>
          {functions
            .filter((f) => f.group === group)
            .map((f) => (
              <button
                key={f.id}
                className={id === f.id ? 'selected' : ''}
                aria-pressed={id === f.id}
                onClick={() => onSelect(f.id)}
              >
                <span>{f.name}</span>
                <span className="nav-symbol">{f.symbol}</span>
              </button>
            ))}
        </div>
      ))}
      <div className="nav-group">
        <h3>Custom</h3>
        <button
          aria-pressed={id === 'custom'}
          onClick={onCustom}
          className={id === 'custom' ? 'selected' : ''}
        >
          Your own function <span className="nav-symbol">f(t)</span>
        </button>
      </div>
    </nav>
  );
}
export function MobileMenu(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState('');
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function close() {
    setState('is-closing');
    const duration =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--dropdown-close-dur'),
      ) || 150;
    timer.current = setTimeout(
      () => {
        dialog.current?.close();
        setState('');
        trigger.current?.focus();
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration,
    );
  }
  function open() {
    if (timer.current) clearTimeout(timer.current);
    dialog.current?.showModal();
    requestAnimationFrame(() => setState('is-open'));
  }
  return (
    <>
      <button
        ref={trigger}
        className={`hamburger ${state === 'is-open' ? 'active' : ''}`}
        aria-label="Open function menu"
        aria-haspopup="dialog"
        aria-expanded={state === 'is-open'}
        aria-controls="mobile-functions"
        onClick={open}
      >
        <span />
        <span />
        <span />
      </button>
      <dialog
        id="mobile-functions"
        ref={dialog}
        className={`mobile-menu t-dropdown ${state}`}
        data-origin="top-right"
        aria-labelledby="menu-heading"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const bounds = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < bounds.left ||
              e.clientX > bounds.right ||
              e.clientY < bounds.top ||
              e.clientY > bounds.bottom
            )
              close();
          }
        }}
      >
        <div className="dialog-heading">
          <h2 id="menu-heading">Functions</h2>
          <button aria-label="Close function menu" onClick={close}>
            ×
          </button>
        </div>
        <Library
          {...props}
          onSelect={(id) => {
            props.onSelect(id);
            close();
          }}
          onCustom={() => {
            props.onCustom();
            close();
          }}
        />
      </dialog>
    </>
  );
}
