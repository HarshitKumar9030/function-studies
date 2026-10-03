import { useEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { downloadBlob, recordVideo, videoMime } from './video';
type Props = {
  svgRef: RefObject<SVGSVGElement | null>;
  title: string;
  amplitude: number;
  frequency: number;
  progress: number;
  playing: boolean;
  speed: number;
  setPlaying: (v: boolean) => void;
  setProgress: (v: number) => void;
  onBusy: (v: boolean) => void;
};
export function VideoExport(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null),
    abort = useRef<AbortController | null>(null);
  const [duration, setDuration] = useState(6),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(0),
    [error, setError] = useState(''),
    [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );
  async function exportVideo() {
    setBusy(true);
    props.onBusy(true);
    setError('');
    setResult(null);
    setDone(0);
    props.setPlaying(false);
    const controller = new AbortController();
    abort.current = controller;
    const original = props.progress;
    try {
      const { blob, extension } = await recordVideo({
        svg: () => props.svgRef.current,
        duration,
        title: props.title,
        amplitude: props.amplitude,
        frequency: props.frequency,
        signal: controller.signal,
        setFrame: (frame) =>
          flushSync(() => props.setProgress(original + ((frame / 30) * props.speed) / 18)),
        onProgress: setDone,
      });
      const name = `function-studies-${props.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${extension}`;
      setResult({ url: URL.createObjectURL(blob), name, size: blob.size });
      downloadBlob(blob, name);
    } catch (err) {
      setError(
        err instanceof Error && err.name === 'AbortError'
          ? 'Export cancelled.'
          : err instanceof Error
            ? err.message
            : 'Export failed.',
      );
    } finally {
      props.setProgress(original);
      props.setPlaying(props.playing);
      props.onBusy(false);
      setBusy(false);
      abort.current = null;
    }
  }
  return (
    <>
      <button
        onClick={() => {
          setError('');
          dialog.current?.showModal();
        }}
        aria-label="Export video"
      >
        <svg
          viewBox="0 0 20 20"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <rect x="2" y="4" width="11" height="12" rx="2" />
          <path d="m13 8 5-3v10l-5-3" />
        </svg>
        Video
      </button>
      <dialog
        ref={dialog}
        className="video-dialog"
        onCancel={(e) => {
          if (busy) {
            e.preventDefault();
            abort.current?.abort();
          }
        }}
      >
        <div className="dialog-heading">
          <h2>Export video</h2>
          <button
            aria-label="Close video export"
            onClick={() => {
              if (busy) abort.current?.abort();
              else dialog.current?.close();
            }}
          >
            ×
          </button>
        </div>
        <p>{props.title} · 1280 × 800 · 30 fps</p>
        {videoMime() ? (
          <label className="duration-label">
            Duration
            <select disabled={busy} value={duration} onChange={(e) => setDuration(+e.target.value)}>
              <option value={6}>6 seconds</option>
              <option value={12}>12 seconds</option>
              <option value={18}>18 seconds</option>
            </select>
          </label>
        ) : (
          <p role="alert">Your browser does not support video recording. Use Chrome or Edge.</p>
        )}
        {busy ? (
          <>
            <progress value={done} max={1} />
            <p role="status">Rendering {Math.round(done * 100)}% · Keep this tab visible.</p>
          </>
        ) : (
          <p className="export-note">
            Includes the current graph view and your credit. Saves as{' '}
            {videoMime()?.startsWith('video/mp4') ? 'MP4' : 'WebM'}.
          </p>
        )}
        {result ? (
          <div className="video-result">
            <video src={result.url} controls playsInline aria-label="Exported graph preview" />
            <p role="status">Clip ready · {(result.size / 1024 / 1024).toFixed(1)} MB</p>
            <a href={result.url} download={result.name}>
              Download clip
            </a>
          </div>
        ) : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="dialog-actions">
          {busy ? (
            <button onClick={() => abort.current?.abort()}>Cancel export</button>
          ) : (
            <button
              className="primary-button"
              disabled={!videoMime()}
              onClick={() => void exportVideo()}
            >
              Export clip
            </button>
          )}
        </div>
      </dialog>
    </>
  );
}
