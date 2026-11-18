import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cycleAngle,cycleSlot,polarPosition,cyclePoints} from './polar.ts';
test('clockwise positions begin at twelve o’clock',()=>{assert.deepEqual(polarPosition(cycleAngle(0,24),100),[0,-100]);const [x,y]=polarPosition(cycleAngle(6,24),100);assert.ok(Math.abs(x-100)<1e-10&&Math.abs(y)<1e-10);});
test('polar pointer picking round-trips every hour, weekday and month',()=>{for(const count of [24,7,12])for(let slot=0;slot<count;slot++){const [x,y]=polarPosition(cycleAngle(slot,count),100);assert.equal(cycleSlot(x,y,count),slot);}});
test('pointer picking wraps across midnight without an out-of-range slot',()=>{assert.equal(cycleSlot(-.01,-100,24),0);assert.equal(cycleSlot(.01,-100,24),0);});
test('the cycle seam joins adjacent last and first values',()=>{const p=cyclePoints([{x:0,y:2},{x:1,y:3},{x:2,y:4}],3);assert.deepEqual(p.at(-1),{x:3,y:2});});
test('missing cycle positions remain gaps, not invented observations',()=>{const p=cyclePoints([{x:0,y:2},{x:2,y:4}],3);assert.deepEqual(p[1],{x:1,y:null});assert.deepEqual(p.at(-1),{x:3,y:2});const missingStart=cyclePoints([{x:1,y:3},{x:2,y:4}],3);assert.equal(missingStart.length,3);assert.equal(missingStart[0].y,null);});
