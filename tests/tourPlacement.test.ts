import assert from 'node:assert/strict';
import test from 'node:test';
import { placeBalloon } from '../src/tourPlacement.js';

test('tour balloons avoid highlighted targets and remain inside desktop viewport', () => {
  const positions = [];
  for (const target of [
    { x: 1400, y: 220, width: 140, height: 40 },
    { x: 300, y: 150, width: 250, height: 70 },
    { x: 430, y: 560, width: 740, height: 150 },
    { x: 305, y: 290, width: 1200, height: 40 },
  ]) {
    const placement = placeBalloon(target, { width: 360, height: 300 }, { width: 1600, height: 900 });
    assert.equal(placement.overlap, 0);
    assert.ok(placement.x >= 14 && placement.x + 360 <= 1586);
    assert.ok(placement.y >= 14 && placement.y + 300 <= 886);
    positions.push(`${placement.x},${placement.y}`);
  }
  assert.ok(new Set(positions).size > 1);
});

test('tour balloon fits below or above compact mobile targets', () => {
  for (const y of [100, 280, 500, 650]) {
    const placement = placeBalloon({ x: 18, y, width: 354, height: 60 }, { width: 342, height: 290 }, { width: 390, height: 844 });
    assert.equal(placement.overlap, 0);
    assert.ok(placement.x >= 14 && placement.x + 342 <= 376);
    assert.ok(placement.y >= 14 && placement.y + 290 <= 830);
  }
});
