export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function videoMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  return (
    [
      'video/mp4;codecs=avc1.42001E',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ].find((type) => MediaRecorder.isTypeSupported(type)) || null
  );
}
type VideoOptions = {
  svg: () => SVGSVGElement | null;
  duration: number;
  fps?: number;
  title: string;
  amplitude: number;
  frequency: number;
  signal: AbortSignal;
  setFrame: (frame: number, total: number) => void;
  onProgress: (value: number) => void;
};
export async function recordVideo({
  svg,
  duration,
  fps = 30,
  title,
  amplitude,
  frequency,
  signal,
  setFrame,
  onProgress,
}: VideoOptions): Promise<{ blob: Blob; extension: string }> {
  const mime = videoMime();
  if (!mime) throw new Error('Video export is not supported by this browser. Try Chrome or Edge.');
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.captureStream) throw new Error('This browser cannot record the graph.');
  const stream = canvas.captureStream(0),
    track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack,
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 }),
    chunks: Blob[] = [];
  let recorderError: Error | undefined;
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.onerror = () => {
    recorderError = new Error('The browser could not encode the video.');
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  const total = Math.round(duration * fps);
  let started = 0;
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', finish);
        resolve();
      };
      const timer = setTimeout(finish, ms);
      signal.addEventListener('abort', finish, { once: true });
    });
  try {
    await document.fonts.ready;
    for (let frame = 0; frame < total;) {
      if (signal.aborted) throw new DOMException('Export cancelled.', 'AbortError');
      if (recorderError) throw recorderError;
      setFrame(frame, total);
      const element = svg();
      if (!element) throw new Error('The graph was closed during export.');
      const clone = element.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('width', '1280');
      clone.setAttribute('height', '627');
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const url = URL.createObjectURL(
          new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }),
        ),
        img = new Image();
      try {
        img.src = url;
        await img.decode();
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#222';
        ctx.font = '28px "STIX Two Text", Georgia, serif';
        ctx.fillText(title.slice(0, 70), 42, 50, 1150);
        ctx.font = '14px "Inter Variable", Arial, sans-serif';
        ctx.fillStyle = '#777';
        ctx.fillText(`A = ${amplitude.toFixed(2)}    k = ${frequency.toFixed(2)}`, 42, 78);
        ctx.drawImage(img, 0, 100, 1280, 627);
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(42, 750);
        ctx.lineTo(1238, 750);
        ctx.stroke();
        ctx.fillStyle = '#444';
        ctx.font = '14px "Inter Variable", Arial, sans-serif';
        ctx.fillText('Made by Harshit Singh · harshit.page', 42, 778);
      } finally {
        URL.revokeObjectURL(url);
      }
      if (frame === 0) {
        recorder.start(250);
        started = performance.now();
      }
      track.requestFrame();
      onProgress((frame + 1) / total);
      await wait(Math.max(0, started + ((frame + 1) * 1000) / fps - performance.now()));
      frame = Math.max(frame + 1, Math.floor(((performance.now() - started) * fps) / 1000));
    }
    await wait(Math.max(0, started + duration * 1000 - performance.now()));
    track.requestFrame();
    await wait(100);
    onProgress(1);
    recorder.stop();
    await stopped;
    if (signal.aborted) throw new DOMException('Export cancelled.', 'AbortError');
    const blob = new Blob(chunks, { type: mime });
    if (blob.size < 1000) throw new Error('The exported video is empty. Try again.');
    return { blob, extension: mime.startsWith('video/mp4') ? 'mp4' : 'webm' };
  } finally {
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  }
}
