import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFunction, randomFunction, type FunctionDefinition } from './functionFactory.ts';
import { sampleFunction } from './functions.ts';
test('Random functions remain real and drawable for repeated selections', () => {
  for (let i = 0; i < 100; i++) {
    const def = randomFunction();
    const fn = createFunction(def);
    assert.ok(sampleFunction(fn, 1, 1).filter((p) => p.valid).length > 500);
    assert.ok(def.y.length <= 200 && def.x.length <= 200);
  }
});
test('Generated definitions reject invalid domains, unsupported code and empty curves', () => {
  const base: FunctionDefinition = {
    name: 'Test',
    y: 'sin(t)',
    x: 'cos(t)',
    domain: [0, 10],
    traveling: true,
    explanation: 'Test function',
  };
  for (const def of [
    { ...base, domain: [4, 1] },
    { ...base, y: 'eval(t)' },
    { ...base, y: 'sqrt(-1)' },
    { ...base, domain: [0, 1001] },
  ])
    assert.throws(() => createFunction(def as FunctionDefinition));
});
test('Factory preserves expressions and hyperbolic evaluation', () => {
  const fn = createFunction({
    name: 'Hyperbola',
    y: 'sinh(t)',
    x: 'cosh(t)',
    domain: [-2, 2],
    traveling: false,
    explanation: 'Hyperbolic pair',
  });
  assert.ok(Math.abs(fn.z(1) ** 2 - fn.y(1) ** 2 - 1) < 1e-12);
  assert.ok(!fn.fy.includes('operatorname{sinh{k'));
});
