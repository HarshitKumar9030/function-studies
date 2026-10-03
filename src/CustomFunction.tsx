import { useState, type FormEvent } from 'react';
import { parseExpression } from './expression';
import { sampleFunction, type FunctionSpec } from './functions';
import type { FunctionDefinition } from './functionFactory';
export function CustomFunction({
  onApply,
  initial,
}: {
  onApply: (fn: FunctionSpec, def?: FunctionDefinition) => void;
  initial?: FunctionDefinition;
}) {
  const [y, setY] = useState(initial?.y || 'sin(t)'),
    [x, setX] = useState(initial?.x || 'cos(t)'),
    [start, setStart] = useState(String(initial?.domain[0] ?? 0)),
    [end, setEnd] = useState(String(initial?.domain[1] ?? 18.8496)),
    [traveling, setTraveling] = useState(initial?.traveling ?? true),
    [error, setError] = useState(''),
    [status, setStatus] = useState('');
  function apply(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    try {
      const low = Number(start),
        high = Number(end);
      if (
        !start.trim() ||
        !end.trim() ||
        !Number.isFinite(low) ||
        !Number.isFinite(high) ||
        low >= high ||
        Math.abs(low) > 1000 ||
        Math.abs(high) > 1000 ||
        high - low < 0.01
      )
        throw new Error('Choose an increasing domain between −1000 and 1000, at least 0.01 wide.');
      const ey = parseExpression(y, '\\left(k t\\right)'),
        ex = parseExpression(x, '\\left(k t\\right)');
      const fn: FunctionSpec = {
        id: 'custom',
        name: 'Custom function',
        group: 'Custom',
        symbol: 'f(t)',
        domain: [low, high],
        y: ey.evaluate,
        z: ex.evaluate,
        fy: `A\\left[${ey.tex}\\right]`,
        fz: `A\\left[${ex.tex}\\right]`,
        identity: '(x,y)=\\big(g(t),f(t)\\big)',
        description: traveling
          ? 'Your two expressions form a moving 3D curve. The point at the left drives the curve and both projections; the horizontal axis shows delay behind that point.'
          : 'Your two expressions form a parametric curve. The moving point, front-plane cross-section and wall/floor projections follow the same input.',
        traveling,
      };
      if (sampleFunction(fn, 1, 1, 160).filter((p) => p.valid).length < 3)
        throw new Error(
          'No drawable real-valued curve in this domain. Check divisions, square roots and logarithms.',
        );
      onApply(fn, {
        name: fn.name,
        y,
        x,
        domain: [low, high],
        traveling,
        explanation: fn.description,
      });
      setError('');
      setStatus('Custom function applied.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this function.');
    }
  }
  return (
    <section className="custom-editor" aria-label="Custom function editor">
      <div>
        <h2>Your own function.</h2>
        <p>
          Define the wall and floor coordinates using <i>t</i>. Try <code>sin(2*t)</code>,{' '}
          <code>t^2</code>, or <code>sinh(t)</code>.
        </p>
      </div>
      <form onSubmit={apply}>
        <div className="expression-fields">
          <label>
            Wall · y =
            <input
              aria-label="Custom y expression"
              value={y}
              onChange={(e) => setY(e.target.value)}
              spellCheck={false}
              maxLength={200}
            />
          </label>
          <label>
            Floor · x =
            <input
              aria-label="Custom x expression"
              value={x}
              onChange={(e) => setX(e.target.value)}
              spellCheck={false}
              maxLength={200}
            />
          </label>
          <label>
            From
            <input
              aria-label="Domain start"
              type="number"
              step="any"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              aria-label="Domain end"
              type="number"
              step="any"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        <div className="custom-actions">
          <label>
            <input
              type="checkbox"
              checked={traveling}
              onChange={(e) => setTraveling(e.target.checked)}
            />
            Traveling wave
          </label>
          <span>
            {traveling
              ? 'Evaluates f(t − τ) beyond the visible domain.'
              : 'Trace the curve within the chosen domain.'}
          </span>
          <button type="submit">Plot function</button>
        </div>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : (
          <p role="status" className="form-status">
            {status}
          </p>
        )}
        <details>
          <summary>Supported notation</summary>
          <p>
            + − * / ^, parentheses, implicit multiplication (2t), t (or x), pi, e. Functions: sin,
            cos, tan, sec, csc, cot, sinh, cosh, tanh, sech, asin, acos, atan, exp, log / ln, sqrt,
            abs, floor, ceil. Use radians. Undefined values and magnitudes above 1,000,000 are
            omitted.
          </p>
        </details>
      </form>
    </section>
  );
}
