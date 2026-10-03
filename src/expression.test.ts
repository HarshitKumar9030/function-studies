import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseExpression } from './expression.ts';
import { functions, sampleFunction } from './functions.ts';
test('Expressions support precedence, powers, implicit multiplication and hyperbolic functions', () => {
  assert.equal(parseExpression('-t^2').evaluate(3), -9);
  assert.equal(parseExpression('2^3^2').evaluate(0), 512);
  assert.equal(parseExpression('2t + 3(t-1)').evaluate(2), 7);
  assert.ok(Math.abs(parseExpression('sin(pi/2)').evaluate(0) - 1) < 1e-12);
  assert.ok(Math.abs(parseExpression('cosh(t)^2-sinh(t)^2').evaluate(1) - 1) < 1e-12);
});
test('Invalid syntax and non-math access are rejected', () => {
  for (const input of ['', 'sin(', 't+', 'process.exit()', 't=1', '[1,2]', 'constructor(t)', '2;3'])
    assert.throws(() => parseExpression(input), input);
  assert.ok(!Number.isFinite(parseExpression('sqrt(-1)').evaluate(0)));
});
test('Rotating driver, helix and both projections share the same phase', () => {
  const fn = functions[0];
  const first = sampleFunction(fn, 1.3, 0.75, 180, 1);
  const second = sampleFunction(fn, 1.3, 0.75, 180, 2);
  assert.notEqual(first[0].y, second[0].y);
  assert.notEqual(first[80].y, second[80].y);
  assert.ok(Math.abs(second[0].y - 1.3 * Math.sin(1.5)) < 1e-12);
  assert.ok(Math.abs(second[0].z - 1.3 * Math.cos(1.5)) < 1e-12);
  for (const p of second) assert.ok(Math.abs(p.y * p.y + p.z * p.z - 1.3 ** 2) < 1e-12);
});
