import { test } from 'node:test';
import assert from 'node:assert/strict';
import { functions, sampleFunction, curvePath } from './functions.ts';
test('Every study yields finite drawable samples throughout its configured domain', () => {
  for (const fn of functions) {
    const samples = sampleFunction(fn, 1, 1);
    assert.ok(samples.filter((p) => p.valid).length > 100, fn.id);
    assert.ok(
      samples.filter((p) => p.valid).every((p) => Number.isFinite(p.y) && Number.isFinite(p.z)),
      fn.id,
    );
  }
});
test('Circle and hyperbola preserve their defining identities', () => {
  for (const p of sampleFunction(functions[0], 1.7, 1.3))
    assert.ok(Math.abs(p.y * p.y + p.z * p.z - 1.7 ** 2) < 1e-10);
  for (const p of sampleFunction(
    functions.find((f) => f.id === 'hyper')!,
    1,
    1,
  ))
    assert.ok(Math.abs(p.z * p.z - p.y * p.y - 1) < 1e-10);
});
test('Parabola has a zero vertex and symmetric arms', () => {
  const samples = sampleFunction(
    functions.find((f) => f.id === 'parabola')!,
    1,
    1,
    100,
  );
  assert.equal(samples[50].y, 0);
  assert.equal(samples[0].y, samples[100].y);
});
test('Tangent path breaks at poles instead of connecting across them', () => {
  const samples = sampleFunction(
    functions.find((f) => f.id === 'tan')!,
    1,
    1,
  );
  assert.ok(samples.some((p) => !p.valid));
  const path = curvePath(samples, (p) => [p.t, p.y]);
  assert.ok((path.match(/M/g) || []).length >= 5);
  assert.ok(!path.includes('NaN'));
});
