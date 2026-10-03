import { useEffect, useRef, useState } from 'react';
import { functions, isTraveling, type FunctionSpec } from './functions';
import { createFunction, randomFunction, type FunctionDefinition } from './functionFactory';
import { CustomFunction } from './CustomFunction';
import { MathText } from './MathText';
import { Graph } from './Graph';
import { Library, MobileMenu } from './Library';
import { Chat } from './Chat';
import { VideoExport } from './VideoExport';
import { downloadBlob } from './video';
function Icon({ kind }: { kind: 'play' | 'pause' | 'reset' | 'download' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      {kind === 'play' ? (
        <path d="m6 3 10 7-10 7Z" fill="currentColor" />
      ) : kind === 'pause' ? (
        <path d="M7 3v14M13 3v14" strokeWidth="3" />
      ) : kind === 'reset' ? (
        <path d="M4 7a7 7 0 1 1-1 6M4 2v5h5" />
      ) : (
        <path d="M10 2v10m-4-4 4 4 4-4M3 13v4h14v-4" />
      )}
    </svg>
  );
}
function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  symbol,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  symbol: string;
}) {
  return (
    <label className="parameter">
      <span>
        {label} <i>{symbol}</i>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      <output>{value.toFixed(2)}</output>
    </label>
  );
}
export function App() {
  const [id, setId] = useState('circle'),
    [amplitude, setAmplitude] = useState(1),
    [frequency, setFrequency] = useState(1),
    [progress, setProgress] = useState(0.125),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [grid, setGrid] = useState(true),
    [projections, setProjections] = useState(true),
    [view, setView] = useState(0),
    [screen, setScreen] = useState<'explore' | 'chat'>('explore'),
    [recording, setRecording] = useState(false);
  const [custom, setCustom] = useState<FunctionSpec | null>(null),
    [definition, setDefinition] = useState<FunctionDefinition | null>(null),
    [notice, setNotice] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const fn = id === 'custom' && custom ? custom : functions.find((f) => f.id === id)!;
  const t =
    fn.domain[0] + (isTraveling(fn) ? progress : progress % 1) * (fn.domain[1] - fn.domain[0]);
  useEffect(() => {
    if (!playing || screen !== 'explore' || recording) return;
    let frame: number,
      last = 0;
    const tick = (now: number) => {
      if (last) setProgress((p) => p + ((Math.min(now - last, 100) / 1000) * speed) / 18);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, screen, recording]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const select = (next: string) => {
    setId(next);
    setProgress(0.125);
    setAmplitude(1);
    setFrequency(1);
    setScreen('explore');
  };
  const apply = (next: FunctionSpec, def?: FunctionDefinition) => {
    setCustom(next);
    setDefinition(def || null);
    select('custom');
  };
  const impress = () => {
    const def = randomFunction();
    apply(createFunction(def), def);
    setPlaying(true);
    setNotice(def.name);
  };
  const customEditor = () => {
    if (custom) select('custom');
    else setScreen('explore');
    setTimeout(
      () =>
        document.getElementById('custom-function')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
          block: 'center',
        }),
      0,
    );
  };
  const exportSvg = () => {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute('tabindex');
    clone.setAttribute('width', '1500');
    clone.setAttribute('height', '735');
    downloadBlob(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }),
      `function-studies-${id}.svg`,
    );
  };
  const formula =
    id === 'circle'
      ? amplitude === 1 && frequency === 1
        ? 'z=e^{it}=\\cos(t)+i\\sin(t)'
        : `z=${amplitude.toFixed(2)}e^{i ${frequency.toFixed(2)}t}`
      : `y=${fn.fy},\\qquad x=${fn.fz}`;
  const libraryProps = { id, onSelect: select, onCustom: customEditor };
  return (
    <>
      <header className="masthead">
        <a
          href="./"
          onClick={(e) => {
            e.preventDefault();
            setScreen('explore');
          }}
          aria-label="Function studies home"
        >
          function studies<span className="brand-dot">.</span>
        </a>
        <div className="header-controls">
          <nav className="screen-tabs" aria-label="Workspace">
            <button
              className={screen === 'explore' ? 'active' : ''}
              aria-pressed={screen === 'explore'}
              disabled={recording}
              onClick={() => setScreen('explore')}
            >
              Explore
            </button>
            <button
              className={screen === 'chat' ? 'active' : ''}
              aria-pressed={screen === 'chat'}
              disabled={recording}
              onClick={() => setScreen('chat')}
            >
              Create
            </button>
          </nav>
          <MobileMenu {...libraryProps} />
        </div>
      </header>
      <div className={`app-layout ${screen === 'chat' ? 'chat-layout' : ''}`}>
        <aside className="desktop-library">
          <h2>Functions</h2>
          <Library {...libraryProps} />
        </aside>
        <main className={recording ? 'is-recording' : ''}>
          <div hidden={screen !== 'chat'}>
            <Chat
              onPlot={(fn, def) => {
                apply(fn, def);
                setPlaying(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
          <div hidden={screen !== 'explore'} className="explore-screen">
            <div className="page-heading">
              <h1 key={fn.name} className="title-enter">
                {fn.name}
              </h1>
              <div className="actions">
                <button className="impress-button" onClick={impress}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    aria-hidden="true"
                  >
                    <path d="m10 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
                  </svg>
                  Impress me
                </button>
                <button aria-label="Reset view" onClick={() => setView((v) => v + 1)}>
                  <Icon kind="reset" />
                  <span className="reset-label">Reset view</span>
                </button>
                <button onClick={exportSvg}>
                  <Icon kind="download" />
                  SVG
                </button>
                <VideoExport
                  svgRef={svgRef}
                  title={fn.name}
                  amplitude={amplitude}
                  frequency={frequency}
                  progress={progress}
                  playing={playing}
                  speed={speed}
                  setPlaying={setPlaying}
                  setProgress={setProgress}
                  onBusy={setRecording}
                />
              </div>
            </div>
            <section className="study" aria-label={fn.name}>
              <div className="equation" key={`${id}-${fn.fy}`}>
                <MathText tex={formula} />
              </div>
              <div className="projection-key">
                <span>
                  <b className="line-key" />
                  Wall <MathText tex={`y=${fn.fy}`} />
                </span>
                <span>
                  <b className="line-key light" />
                  Floor <MathText tex={`x=${fn.fz}`} />
                </span>
              </div>
              <Graph
                fn={fn}
                amplitude={amplitude}
                frequency={frequency}
                progress={progress}
                grid={grid}
                projections={projections}
                view={view}
                svgRef={svgRef}
              />
              <div className="playback">
                <button
                  className="play-button"
                  aria-label={playing ? 'Pause animation' : 'Play animation'}
                  onClick={() => setPlaying((v) => !v)}
                >
                  <Icon kind={playing ? 'pause' : 'play'} />
                </button>
                <div className="timeline">
                  <input
                    type="range"
                    aria-label="Trace position"
                    min="0"
                    max="1"
                    step="0.001"
                    value={progress % 1}
                    onChange={(e) => {
                      setPlaying(false);
                      setProgress(+e.target.value);
                    }}
                  />
                  <div className="readouts">
                    <span>
                      <i>t</i> = {t.toFixed(2)}
                      {fn.group === 'Trigonometric' ? ' rad' : ''}
                    </span>
                    <span>
                      y ={' '}
                      {Number.isFinite(fn.y(t * frequency))
                        ? (amplitude * fn.y(t * frequency)).toFixed(3)
                        : 'undefined'}
                      <span className="readout-z">
                        x ={' '}
                        {Number.isFinite(fn.z(t * frequency))
                          ? (amplitude * fn.z(t * frequency)).toFixed(3)
                          : 'undefined'}
                      </span>
                    </span>
                  </div>
                </div>
                <label className="speed">
                  Speed
                  <select
                    aria-label="Animation speed"
                    value={speed}
                    onChange={(e) => setSpeed(+e.target.value)}
                  >
                    <option value="0.5">0.5×</option>
                    <option value="1">1×</option>
                    <option value="2">2×</option>
                  </select>
                </label>
              </div>
            </section>
            <section className="details">
              <article>
                <h2>About the curve</h2>
                <p>{fn.description}</p>
                <div className="identity">
                  <MathText tex={fn.identity} />
                </div>
                <p className="note">
                  {isTraveling(fn)
                    ? 'The front point drives the curve. The horizontal axis shows delay τ.'
                    : 'The horizontal axis carries input t. The front plane and projections follow the same point.'}
                </p>
              </article>
              <section className="parameters">
                <h2>Parameters</h2>
                <Range
                  label="Amplitude"
                  symbol="A"
                  value={amplitude}
                  min={0.25}
                  max={2}
                  step={0.05}
                  onChange={setAmplitude}
                />
                <Range
                  label="Frequency"
                  symbol="k"
                  value={frequency}
                  min={0.25}
                  max={2}
                  step={0.05}
                  onChange={setFrequency}
                />
                <div className="toggles">
                  <label>
                    <input
                      type="checkbox"
                      checked={grid}
                      onChange={(e) => setGrid(e.target.checked)}
                    />
                    Show grid
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={projections}
                      onChange={(e) => setProjections(e.target.checked)}
                    />
                    Show projections
                  </label>
                  <button
                    className="text-button"
                    onClick={() => {
                      setAmplitude(1);
                      setFrequency(1);
                    }}
                  >
                    Reset parameters
                  </button>
                </div>
              </section>
            </section>
            <div id="custom-function">
              <CustomFunction
                key={definition ? JSON.stringify(definition) : 'manual'}
                initial={definition || undefined}
                onApply={apply}
              />
            </div>
          </div>
          <footer className="signature-footer">
            <a
              className="maker-signature"
              href="https://harshit.page"
              target="_blank"
              rel="noreferrer"
            >
              <svg className="signature-wave" viewBox="0 0 64 28" aria-hidden="true">
                <path className="wave-guide" d="M0 14h64" />
                <path
                  className="wave-ink"
                  d="M2 14C7 14 7 3 14 3S21 25 28 25 35 3 42 3 49 25 56 25 61 14 62 14"
                />
              </svg>
              <span>
                <small>Made by</small>
                <span className="maker-name">
                  Harshit Singh <span aria-hidden="true">↗</span>
                </span>
              </span>
            </a>
            <button className="footer-encore" onClick={impress}>
              One more curve <span aria-hidden="true">↻</span>
            </button>
          </footer>
        </main>
      </div>
      {notice ? (
        <div className="function-toast" role="status">
          {notice}
        </div>
      ) : null}
    </>
  );
}
