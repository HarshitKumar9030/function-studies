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
  ];
  return designs[Math.floor(random() * designs.length)];
}
