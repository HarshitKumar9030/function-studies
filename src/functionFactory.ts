import { parseExpression } from './expression.ts';
import { sampleFunction, type FunctionSpec } from './functions.ts';
export type FunctionDefinition = {
  name: string;
  y: string;
  x: string;
  domain: [number, number];
  traveling: boolean;
  explanation: string;
};
export function createFunction(def: FunctionDefinition): FunctionSpec {
  if (
    typeof def.name !== 'string' ||
    typeof def.y !== 'string' ||
    typeof def.x !== 'string' ||
    typeof def.explanation !== 'string' ||
    !Array.isArray(def.domain) ||
    def.domain.length !== 2 ||
    typeof def.traveling !== 'boolean'
  )
    throw new Error('The function response is incomplete. Please try again.');
  const [low, high] = def.domain;
  if (
    !Number.isFinite(low) ||
    !Number.isFinite(high) ||
    low >= high ||
    Math.abs(low) > 1000 ||
    Math.abs(high) > 1000 ||
    high - low < 0.01
  )
    throw new Error('Choose a valid increasing domain between −1000 and 1000.');
  const y = parseExpression(def.y, '\\left(k t\\right)'),
    x = parseExpression(def.x, '\\left(k t\\right)');
  const fn: FunctionSpec = {
    id: 'custom',
    name: def.name.slice(0, 70),
    group: 'Custom',
    symbol: 'f(t)',
    domain: [low, high],
    y: y.evaluate,
    z: x.evaluate,
    fy: `A\\left[${y.tex}\\right]`,
    fz: `A\\left[${x.tex}\\right]`,
    description: def.explanation.slice(0, 1500),
    identity: '(x,y)=\\big(g(t),f(t)\\big)',
    traveling: def.traveling,
  };
  if (sampleFunction(fn, 1, 1, 160).filter((p) => p.valid).length < 3)
    throw new Error('There is no drawable real-valued curve in that domain.');
  return fn;
}
export function randomFunction(random = Math.random): FunctionDefinition {
  const a = 1 + Math.floor(random() * 5),
    b = 1 + Math.floor(random() * 5),
    c = (0.15 + random() * 0.6).toFixed(2),
    phase = (random() * Math.PI).toFixed(2);
  const designs: FunctionDefinition[] = [
    {
      name: 'Harmonic braid',
      y: `sin(${a}*t)+${c}*sin(${b + 2}*t)`,
      x: `cos(${b}*t+${phase})`,
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation:
        'Two frequencies weave a moving braid. Change the frequency to see how the pattern tightens.',
    },
    {
      name: 'A wave inside a wave',
      y: `sin(${a}*t+${c}*sin(${b}*t))`,
      x: `cos(${a}*t+${c}*sin(${b}*t))`,
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation:
        'A second oscillation modulates the phase of a circular wave. The radius stays constant while the spacing changes.',
    },
    {
      name: 'Fading spiral',
      y: `exp(-${c}*t)*sin(${a}*t)`,
      x: `exp(-${c}*t)*cos(${a}*t)`,
      domain: [0, 12],
      traveling: false,
      explanation:
        'An exponentially decaying envelope wraps around a spiral. The wall and floor show the same fading oscillation a quarter turn apart.',
    },
    {
      name: 'A breathing circle',
      y: `(1+${c}*cos(${b}*t))*sin(${a}*t)`,
      x: `(1+${c}*cos(${b}*t))*cos(${a}*t)`,
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation: 'The radius expands and contracts as a second frequency passes through it.',
    },
    {
      name: 'Bell-wave duet',
      y: `exp(-t^2/${a})*sin(${b}*t)`,
      x: `exp(-t^2/${a})*cos(${b}*t)`,
      domain: [-5, 5],
      traveling: false,
      explanation:
        'A Gaussian bell shapes a wave packet. Both oscillations fade smoothly toward the ends.',
    },
    {
      name: 'Lissajous ribbon',
      y: `sin(${a}*t+${phase})`,
      x: `sin(${b}*t)`,
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation:
        'Two independent oscillations draw a ribbon of loops. Their frequency ratio sets the pattern.',
    },
    {
      name: 'Rose petals',
      y: `cos(${a + 1}*t)*sin(t)`,
      x: `cos(${a + 1}*t)*cos(t)`,
      domain: [0, 4 * Math.PI],
      traveling: true,
      explanation: 'A radius that changes sign folds a circle into a flower.',
    },
    {
      name: 'Rolling loops',
      y: `sin(t)-${c}*sin(${a + 1}*t)`,
      x: `cos(t)+${c}*cos(${a + 1}*t)`,
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation: 'A small circular motion rides on a larger one, creating rolling loops.',
    },
    {
      name: 'A heart in motion',
      y: '(13*cos(t)-5*cos(2*t)-2*cos(3*t)-cos(4*t))/16',
      x: 'sin(t)^3',
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation: 'Several cosine harmonics and a cubed sine draw a familiar heart.',
    },
    {
      name: 'Figure-eight ribbon',
      y: `sin(t)*cos(t)/(1+sin(t)^2)`,
      x: 'cos(t)/(1+sin(t)^2)',
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation: 'A rational parametrization draws a figure eight, also called a lemniscate.',
    },
    {
      name: 'Square-wave sketch',
      y: `sin(t)+sin(3*t)/3+sin(5*t)/5`,
      x: `cos(t)+cos(3*t)/3+cos(5*t)/5`,
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation:
        'Three odd harmonics begin to approximate a square wave. The rounded edges reveal the missing higher frequencies.',
    },
    {
      name: 'Beating waves',
      y: `sin(${a + 2}*t)*cos(${c}*t)`,
      x: `cos(${a + 2}*t)*cos(${c}*t)`,
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation:
        'Close frequencies produce beats. A slow envelope makes a fast oscillation swell and fade.',
    },
    {
      name: 'Cycloid steps',
      y: '1-cos(t)',
      x: '(t-sin(t))/4',
      domain: [0, 4 * Math.PI],
      traveling: false,
      explanation:
        'A point on a rolling wheel traces a cycloid, with an arch between each contact point.',
    },
    {
      name: 'Hyperbolic arch',
      y: `cosh(t)-1`,
      x: `sinh(t)*${c}`,
      domain: [-2, 2],
      traveling: false,
      explanation:
        'Hyperbolic sine and cosine build a symmetric arch, related by cosh²(t) − sinh²(t) = 1.',
    },
    {
      name: 'Catenary sweep',
      y: `(cosh(t)-1)/2`,
      x: 't',
      domain: [-2.5, 2.5],
      traveling: false,
      explanation:
        'A catenary follows the shape of an ideal hanging chain. It resembles a parabola near its lowest point.',
    },
    {
      name: 'Soft S-curve',
      y: `tanh(${a}*t)`,
      x: `tanh(t)*cos(${b}*t)`,
      domain: [-3, 3],
      traveling: false,
      explanation:
        'Hyperbolic tangent approaches its limits smoothly while a second coordinate adds a gentle twist.',
    },
    {
      name: 'Double-well valley',
      y: '(t^4-2*t^2)/2',
      x: `t*${c}`,
      domain: [-1.8, 1.8],
      traveling: false,
      explanation: 'A quartic polynomial creates two valleys separated by a central ridge.',
    },
    {
      name: 'Rational loop',
      y: '2*t/(1+t^2)',
      x: '(1-t^2)/(1+t^2)',
      domain: [-8, 8],
      traveling: false,
      explanation:
        'Rational expressions trace most of a circle without using trigonometric functions.',
    },
    {
      name: 'Growing spiral',
      y: `exp(0.05*t)*sin(${a}*t)`,
      x: `exp(0.05*t)*cos(${a}*t)`,
      domain: [0, 4 * Math.PI],
      traveling: false,
      explanation: 'An exponential envelope grows the radius with every turn.',
    },
    {
      name: 'Butterfly turns',
      y: '(exp(cos(t))-2*cos(4*t)-sin(t/12)^5)*sin(t)/3',
      x: '(exp(cos(t))-2*cos(4*t)-sin(t/12)^5)*cos(t)/3',
      domain: [0, 12 * Math.PI],
      traveling: false,
      explanation: 'A changing radius produces wing-shaped loops in a butterfly curve.',
    },
    {
      name: 'Rounded diamond',
      y: 'sin(t)/sqrt(abs(sin(t))+0.08)',
      x: 'cos(t)/sqrt(abs(cos(t))+0.08)',
      domain: [0, 6 * Math.PI],
      traveling: true,
      explanation: 'Reshaping the circular coordinates with square roots produces a soft diamond.',
    },
    {
      name: 'Chirping spiral',
      y: `sin(t^2/${a})/(1+${c}*t)`,
      x: `cos(t^2/${a})/(1+${c}*t)`,
      domain: [0, 10],
      traveling: false,
      explanation:
        'The phase accelerates quadratically while the radius shrinks. Each turn arrives sooner than the last.',
    },
  ];
  return designs[Math.floor(random() * designs.length)];
}
