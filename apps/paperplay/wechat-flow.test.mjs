import test from 'node:test';
import assert from 'node:assert/strict';
import {composeFlowHTML,flowSlots} from './wechat-flow.mjs';

const state={height:1200,color:'#dce3cb',flowBackground:{url:'https://mmbiz.qpic.cn/test.png'},layers:[{id:'music-1',type:'music',y:400,h:180}],flowSlots:[{id:'video-1',kind:'视频号',y:900}]};

test('one repeating background wraps normal-flow media points',()=>{
 const ranges=[];
 const html=composeFlowHTML(state,(start,end)=>{ranges.push([start,end]);return `<svg data-range="${start}-${end}"></svg>`});
 assert.deepEqual(ranges,[[0,400],[580,900],[900,1200]]);
 assert.equal((html.match(/background-image:/g)||[]).length,1);
 assert.match(html,/background-repeat:repeat-y/);
 assert.match(html,/在此插入音乐/);
 assert.match(html,/在此插入视频号/);
 assert.equal(flowSlots(state).length,2);
});

test('rejects overlapping media and unuploaded background',()=>{
 assert.throws(()=>composeFlowHTML({...state,flowBackground:null},()=>''),/背景纹理/);
 assert.throws(()=>composeFlowHTML({...state,flowSlots:[{id:'x',kind:'音频',y:450}]},()=>''),/重叠/);
});
