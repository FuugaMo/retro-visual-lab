import test from 'node:test';
import assert from 'node:assert/strict';
import {auditFlowInsertion,composeFlowHTML,flowSlots} from './wechat-flow.mjs';

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

test('canvas media layers become export slots at their saved coordinates',()=>{
 const project={...state,layers:[{id:'card-1',type:'media',mediaKind:'视频号',x:120,y:250,w:700,h:320}],flowSlots:[]};
 const ranges=[];
 const html=composeFlowHTML(project,(start,end)=>{ranges.push([start,end]);return '<svg></svg>'});
 assert.deepEqual(ranges,[[0,250],[570,1200]]);
 assert.match(html,/在此插入视频号/);
});

test('audits what WeChat actually retained after insertion',()=>{
 const before='<p>原有内容</p><svg></svg>';
 const inserted='<section style="background-image:url(x)"><svg><foreignObject><img src="x"></foreignObject></svg><p data-paperplay-slot="music">在此插入音乐</p></section>';
 assert.deepEqual(auditFlowInsertion(before,before+inserted,inserted),[]);
 const stripped='<section><svg></svg><p>在此插入音乐</p></section>';
 assert.deepEqual(auditFlowInsertion(before,before+stripped,inserted),['连续底图 0/1','图片素材 0/1','媒体插入点 0/1']);
});
