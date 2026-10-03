import { useMemo, useRef, useState, type RefObject } from 'react';
import {
  curvePath,
  sampleFunction,
  isTraveling,
  type FunctionSpec,
  type Sample,
} from './functions';
type Props = {
  fn: FunctionSpec;
  amplitude: number;
  frequency: number;
  progress: number;
  grid: boolean;
  projections: boolean;
  view: number;
  svgRef: RefObject<SVGSVGElement | null>;
};
export function Graph(props: Props) {
  return <GraphScene key={props.view} {...props} />;
}
function GraphScene({ fn, amplitude, frequency, progress, grid, projections, svgRef }: Props) {
  const [angle, setAngle] = useState([0.78, 0.38]);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; y: number; a: number[] } | null>(null);
  const flowing = isTraveling(fn);
  const phase = fn.domain[0] + (flowing ? progress : progress % 1) * (fn.domain[1] - fn.domain[0]);
  const offset = flowing ? phase : undefined;
  const basePoints = useMemo(
    () => sampleFunction(fn, amplitude, frequency),
    [fn, amplitude, frequency],
  );
  const points = useMemo(
    () =>
      offset === undefined ? basePoints : sampleFunction(fn, amplitude, frequency, 720, offset),
    [fn, amplitude, frequency, basePoints, offset],
  );
  const extent = Math.max(
    1.25,
    ...points
      .filter((p) => p.valid)
      .flatMap((p) => [Math.abs(p.y / amplitude), Math.abs(p.z / amplitude)]),
  );
  const scale = 100 / extent;
  const project = (x: number, y: number, z: number): [number, number] => [
    500 + zoom * (Math.cos(angle[0]) * x - Math.sin(angle[0]) * z),
    245 +
      zoom *
        (Math.sin(angle[1]) * (Math.sin(angle[0]) * x + Math.cos(angle[0]) * z) -
          Math.cos(angle[1]) * y),
  ];
  const xAt = (t: number) => -405 + ((t - fn.domain[0]) / (fn.domain[1] - fn.domain[0])) * 810;
  const position = (p: Sample) => project(xAt(p.t), p.y * scale, p.z * scale);
  const line = (
    a: number[],
    b: number[],
    key: string,
    color = '#e7e7e7',
    width = 1,
    dash?: string,
  ) => {
    const [x1, y1] = project(a[0], a[1], a[2]),
      [x2, y2] = project(b[0], b[1], b[2]);
    return (
      <line
        key={key}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dash}
      />
    );
  };
  const grids = [];
  for (let x = -405; x <= 406; x += 27) {
    grids.push(
      line([x, -115, -115], [x, 115, -115], `b${x}`),
      line([x, -115, -115], [x, -115, 115], `f${x}`),
    );
  }
  for (let n = -115; n <= 116; n += 23) {
    grids.push(
      line([-405, n, -115], [405, n, -115], `bh${n}`),
      line([-405, -115, n], [405, -115, n], `fh${n}`),
      line([-405, -115, n], [-405, 115, n], `lv${n}`),
      line([-405, n, -115], [-405, n, 115], `lh${n}`),
    );
  }
  const t = phase;
  const current = {
    t,
    y: amplitude * fn.y(t * frequency),
    z: amplitude * fn.z(t * frequency),
    valid: true,
  };
  current.valid =
    Number.isFinite(current.y) &&
    Number.isFinite(current.z) &&
    (!fn.limit || Math.abs(current.y) <= fn.limit * amplitude);
  const dot = flowing ? project(-405, current.y * scale, current.z * scale) : position(current);
  const front = project(-405, current.y * scale, current.z * scale),
    center = project(-405, 0, 0);
  const frontPath = curvePath(
    fn.id === 'circle'
      ? sampleFunction({ ...fn, domain: [0, 2 * Math.PI] }, amplitude, 1, 180)
      : basePoints,
    (p) => project(-405, p.y * scale, p.z * scale),
  );
  const traced = flowing ? points : [...points.filter((p) => p.t <= t), current];
  const theta = (((phase * frequency) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const sectorPoints = Array.from({ length: 33 }, (_, i) => {
    const a = (theta * i) / 32;
    return project(-405, Math.sin(a) * 19, Math.cos(a) * 19).join(',');
  });
  const sector = `${center.join(',')} ${sectorPoints.join(' ')}`;

  const keyboard = (key: string) => {
    if (key === 'ArrowLeft') setAngle((a) => [a[0] - 0.05, a[1]]);
    if (key === 'ArrowRight') setAngle((a) => [a[0] + 0.05, a[1]]);
    if (key === 'ArrowUp') setAngle((a) => [a[0], Math.min(0.85, a[1] + 0.05)]);
    if (key === 'ArrowDown') setAngle((a) => [a[0], Math.max(0.1, a[1] - 0.05)]);
  };
  return (
    <div className="graph-wrap">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 490"
        role="img"
        aria-label={`Interactive 3D ${fn.name} graph. Drag or use arrow keys to rotate.`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            keyboard(e.key);
          }
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, a: angle };
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setAngle([
              Math.max(
                -0.1,
                Math.min(1.2, drag.current.a[0] + (e.clientX - drag.current.x) * 0.004),
              ),
              Math.max(
                0.1,
                Math.min(0.85, drag.current.a[1] + (e.clientY - drag.current.y) * 0.004),
              ),
            ]);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <rect width="1000" height="490" fill="white" />
        {grid ? <g>{grids}</g> : null}
        <g>
          {line([-405, 0, -115], [440, 0, -115], 'axis-t', '#bdbdbd', 1.4)}
          {line([-405, -115, -115], [-405, 135, -115], 'axis-y', '#bdbdbd', 1.4)}
          {line([-405, -115, -115], [-405, -115, 145], 'axis-z', '#bdbdbd', 1.4)}
        </g>
        {projections ? (
          <g>
            {points
              .filter((p, i) => p.valid && i % 5 === 0)
              .map((p, i) => (
                <g key={i}>
                  {line(
                    [xAt(p.t), 0, -115],
                    [xAt(p.t), p.y * scale, -115],
                    `yb${i}`,
                    '#565656',
                    1.4,
                  )}
                  {line(
                    [xAt(p.t), -115, 0],
                    [xAt(p.t), -115, p.z * scale],
                    `zb${i}`,
                    '#a0a0a0',
                    1.4,
                  )}
                </g>
              ))}
            <path
              d={curvePath(points, (p) => project(xAt(p.t), p.y * scale, -115))}
              data-testid="wall-projection"
              fill="none"
              stroke="#555"
              strokeWidth="1.2"
            />
            <path
              d={curvePath(points, (p) => project(xAt(p.t), -115, p.z * scale))}
              data-testid="floor-projection"
              fill="none"
              stroke="#888"
              strokeWidth="1.2"
            />
          </g>
        ) : null}
        <path
          d={frontPath}
          fill="none"
          stroke={fn.id === 'circle' ? '#222' : '#aaa'}
          strokeWidth="1.7"
        />
        {fn.id === 'circle' ? <polygon points={sector} fill="#777" opacity=".2" /> : null}
        {!flowing ? (
          <path d={curvePath(points, position)} fill="none" stroke="#cfcfcf" strokeWidth="1.4" />
        ) : null}
        <path
          data-testid="main-curve"
          d={curvePath(traced, position)}
          stroke="#171717"
          strokeWidth="2.6"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {current.valid ? (
          <g>
            {projections ? (
              <>
                {line(
                  [flowing ? -405 : xAt(t), current.y * scale, current.z * scale],
                  [flowing ? -405 : xAt(t), current.y * scale, -115],
                  'guide1',
                  '#555',
                  1.2,
                  '4 4',
                )}
                {line(
                  [flowing ? -405 : xAt(t), current.y * scale, current.z * scale],
                  [flowing ? -405 : xAt(t), -115, current.z * scale],
                  'guide2',
                  '#555',
                  1.2,
                  '4 4',
                )}
                {[
                  project(flowing ? -405 : xAt(t), current.y * scale, -115),
                  project(flowing ? -405 : xAt(t), -115, current.z * scale),
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3.5" fill="#777" />
                ))}
              </>
            ) : null}
            {line(
              [-405, 0, 0],
              [-405, current.y * scale, current.z * scale],
              'radius',
              '#222',
              1.8,
            )}
            {!flowing
              ? line(
                  [-405, current.y * scale, current.z * scale],
                  [xAt(t), current.y * scale, current.z * scale],
                  'connector',
                  '#999',
                  1,
                  '4 4',
                )
              : null}
            <circle
              data-testid="driver-point"
              cx={front[0]}
              cy={front[1]}
              r="5"
              fill="#111"
              stroke="white"
              strokeWidth="1.5"
            />
            <circle
              data-testid="trace-point"
              cx={dot[0]}
              cy={dot[1]}
              r="5"
              fill="#111"
              stroke="white"
              strokeWidth="1.5"
            />
            {fn.id === 'circle' ? (
              <text
                x={front[0] - 25}
                y={front[1] - 13}
                fontFamily="Georgia,serif"
                fontStyle="italic"
                fontSize="18"
              >
                e
                <tspan baselineShift="super" fontSize="12">
                  iθ
                </tspan>
              </text>
            ) : null}
          </g>
        ) : null}
        <g fontFamily="STIX Two Text, Georgia, serif" fontStyle="italic" fill="#555" fontSize="17">
          <text x="880" y="370">
            {flowing ? 'τ' : 't'}
          </text>
          <text x="140" y="130">
            y
          </text>
          <text x="128" y="337">
            x
          </text>
        </g>
        <g fontFamily="STIX Two Text, Georgia, serif" fontSize="14" fill="#888">
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const t = fn.domain[0] + p * (fn.domain[1] - fn.domain[0]),
              [x, y] = project(xAt(t), -115, 115);
            return (
              <text key={p} x={x} y={y + 23} textAnchor="middle">
                {(flowing ? t - fn.domain[0] : t).toFixed(1)}
              </text>
            );
          })}
        </g>
      </svg>
      <div className="graph-meta">
        <span>Drag to rotate · Arrow keys to adjust</span>
        <span>
          Grid ±{(extent * 1.15).toFixed(2)}
          <button
            className="zoom"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
          >
            −
          </button>
          <button
            className="zoom"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
          >
            +
          </button>
        </span>
      </div>
    </div>
  );
}
