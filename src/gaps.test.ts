import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gapBridges} from './gaps.ts';
test('interpolation bridges only interior missing runs without altering observations',()=>{
 const points=[null,2,null,null,5,6,null,9,null].map((y,x)=>({x,y}));
 assert.deepEqual(gapBridges(points),[[points[1],points[4]],[points[5],points[7]]]);
 assert.equal(points[2].y,null);
 assert.deepEqual(gapBridges([{y:0},{y:1}]),[]);
 assert.deepEqual(gapBridges([{y:null}]),[]);
});
