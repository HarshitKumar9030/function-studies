export type FunctionSpec = {
  id: string;
  name: string;
  group: string;
  symbol: string;
  domain: [number, number];
  y: (t: number) => number;
  z: (t: number) => number;
  fy: string;
  fz: string;
  description: string;
  identity: string;
  limit?: number;
  traveling?: boolean;
};
export const functions: FunctionSpec[] = [
  {
    id: 'circle',
    name: 'Sine & cosine',
    group: 'Trigonometric',
    symbol: 'sin θ',
    domain: [0, 6 * Math.PI],
    y: Math.sin,
    z: Math.cos,
    fy: 'A\\sin(k t)',
    fz: 'A\\cos(k t)',
    identity: 'e^{i\\theta}=\\cos\\theta+i\\sin\\theta',
    description:
      'A circle in motion becomes a helix. Its height draws a sine wave on the back wall; its depth draws a cosine wave on the floor. Two familiar functions, seen as a single curve.',
  },
  {
    id: 'tan',
    name: 'Tangent',
    group: 'Trigonometric',
    symbol: 'tan θ',
    domain: [-2 * Math.PI, 2 * Math.PI],
    y: Math.tan,
    z: Math.sin,
    fy: 'A\\tan(k t)',
    fz: 'A\\sin(k t)',
    limit: 3,
    identity: '\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}',
    description:
      'Tangent grows without bound whenever cosine reaches zero. The gaps mark those vertical asymptotes; the floor shows sine as a bounded reference. Values beyond ±3A are cropped.',
  },
  {
    id: 'sec',
    name: 'Secant',
    group: 'Trigonometric',
    symbol: 'sec θ',
    domain: [-2 * Math.PI, 2 * Math.PI],
    y: (t) => 1 / Math.cos(t),
    z: Math.cos,
    fy: 'A\\sec(k t)',
    fz: 'A\\cos(k t)',
    limit: 3,
    identity: '\\sec\\theta=\\frac{1}{\\cos\\theta}',
    description:
      'Secant is the reciprocal of cosine. Watch the curve split into branches where the floor projection crosses zero. Values beyond ±3A are cropped around the asymptotes.',
  },
  {
    id: 'hyper',
    name: 'Sinh & cosh',
    group: 'Hyperbolic',
    symbol: 'sinh t',
    domain: [-2, 2],
    y: Math.sinh,
    z: Math.cosh,
    fy: 'A\\sinh(k t)',
    fz: 'A\\cosh(k t)',
    identity: '\\cosh^2 t-\\sinh^2 t=1',
    description:
      'Replace the circle with a hyperbola. Sinh changes sign through the origin, while cosh forms a catenary with a minimum at zero. Their squared difference stays constant.',
  },
  {
    id: 'tanh',
    name: 'Tanh',
    group: 'Hyperbolic',
    symbol: 'tanh t',
    domain: [-4, 4],
    y: Math.tanh,
    z: (t) => 1 / Math.cosh(t),
    fy: 'A\\tanh(k t)',
    fz: 'A\\operatorname{sech}(k t)',
    identity: '\\tanh^2 t+\\operatorname{sech}^2 t=1',
    description:
      'Tanh smoothly approaches −1 and +1. Its companion sech rises to one at the origin and tends to zero at both ends. Together they trace a semicircle in cross-section.',
  },
  {
    id: 'parabola',
    name: 'Parabola',
    group: 'Polynomial',
    symbol: 't²',
    domain: [-2, 2],
    y: (t) => t * t,
    z: (t) => t,
    fy: 'A(k t)^2',
    fz: 'A k t',
    identity: 'y=x^2\\quad(A=1)',
    description:
      'A straight line on the floor, a parabola on the wall. Squaring turns both negative and positive inputs upward, creating a symmetric U-shaped curve with its vertex at zero.',
  },
  {
    id: 'cubic',
    name: 'Cubic',
    group: 'Polynomial',
    symbol: 't³',
    domain: [-2, 2],
    y: (t) => t * t * t,
    z: (t) => t,
    fy: 'A(k t)^3',
    fz: 'A k t',
    identity: 'y=x^3\\quad(A=1)',
    description:
      'Unlike a parabola, a cubic keeps the sign of its input. It passes through the origin, flattening at its inflection point before accelerating in either direction.',
  },
  {
    id: 'exp',
    name: 'Exponential',
    group: 'Other',
    symbol: 'eᵗ',
    domain: [-2, 2],
    y: Math.exp,
    z: (t) => t,
    fy: 'A e^{k t}',
    fz: 'A k t',
    identity: '\\frac{d}{dt}e^t=e^t',
    description:
      'Exponential growth has a rate proportional to its current value. It remains positive, approaches zero to the left, and rises ever more rapidly to the right.',
  },
  {
    id: 'log',
    name: 'Logarithm',
    group: 'Other',
    symbol: 'ln t',
    domain: [0.05, 5],
    y: Math.log,
    z: (t) => t,
    fy: 'A\\ln(k t)',
    fz: 'A k t',
    identity: '\\ln(e^t)=t',
    description:
      'The natural logarithm reverses the exponential. It is defined only for positive inputs, grows slowly, and descends without bound as its input approaches zero.',
  },
  {
    id: 'gauss',
    name: 'Gaussian',
    group: 'Other',
    symbol: 'e⁻ᵗ²',
    domain: [-3, 3],
    y: (t) => Math.exp(-t * t),
    z: (t) => t,
    fy: 'A e^{-(k t)^2}',
    fz: 'A k t',
    identity: 'f(-t)=f(t)',
    description:
      'The Gaussian forms a symmetric bell centered at zero. Increasing the frequency parameter narrows the bell; amplitude changes its height.',
  },
];
export type Sample = { t: number; y: number; z: number; valid: boolean };
export function isTraveling(fn: FunctionSpec) {
  return fn.traveling ?? ['circle', 'tan', 'sec'].includes(fn.id);
}
export function sampleFunction(
  fn: FunctionSpec,
  amplitude: number,
  frequency: number,
  count = 720,
  phase?: number,
): Sample[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = fn.domain[0] + ((fn.domain[1] - fn.domain[0]) * i) / count;
    const input = phase === undefined ? t : phase - (t - fn.domain[0]);
    const y = amplitude * fn.y(input * frequency),
      z = amplitude * fn.z(input * frequency);
    return {
      t,
      y,
      z,
      valid:
        Number.isFinite(y) &&
        Number.isFinite(z) &&
        Math.abs(y) < 1e6 &&
        Math.abs(z) < 1e6 &&
        (!fn.limit || Math.abs(y) <= fn.limit * amplitude),
    };
  });
}
export function curvePath(points: Sample[], project: (p: Sample) => [number, number]): string {
  let drawing = false;
  let previous: Sample | undefined;
  return points
    .map((p) => {
      if (!p.valid) {
        drawing = false;
        previous = undefined;
        return '';
      }
      const jump = previous && Math.abs(p.y - previous.y) > 2 && p.y * previous.y < 0;
      const [x, y] = project(p);
      const command = drawing && !jump ? 'L' : 'M';
      drawing = true;
      previous = p;
      return `${command}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
