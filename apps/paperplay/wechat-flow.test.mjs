import test from 'node:test';
import assert from 'node:assert/strict';
import {auditFlowInsertion,auditRasterFlowInsertion,composeFlowHTML,composeRasterFlowHTML,flowSlots,rasterFlowPlan} from './wechat-flow.mjs';

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
 const inserted='<section style="background-image:url(x)"><svg viewBox="0 0 1080 400"><foreignObject><img src="x"></foreignObject><text>标题</text></svg><p data-paperplay-slot="music">在此插入音乐</p></section>';
 assert.deepEqual(auditFlowInsertion(before,before+inserted,inserted),[]);
 const stripped='<section><svg viewBox="0 0 1080 200"></svg><p>在此插入音乐</p></section>';
 assert.deepEqual(auditFlowInsertion(before,before+stripped,inserted),['连续底图 0/1','素材叠层 0/1','文字素材 0/1','图片素材 0/1','媒体插入点 0/1','画布高度 0/1']);
});

test('raster flow preserves an isolated animated poster and native media positions',()=>{
 const project={height:1200,width:750,color:'#ffffff',flowBackground:{url:'https://mmbiz.qpic.cn/tile.png'},flowSlots:[],layers:[
  {id:'poster',type:'image',name:'动态海报',x:75,y:50,w:600,h:150,fit:'contain',radius:0,images:[{name:'poster.gif',src:'data:image/gif;base64,AA==',url:'https://mmbiz.qpic.cn/poster.gif'}]},
  {id:'music',type:'media',mediaKind:'音乐',y:400,h:180},
  {id:'video',type:'media',mediaKind:'视频号',y:900,h:180},
 ]};
 const parts=rasterFlowPlan(project,500),strips=parts.filter(part=>part.type==='strip');
 assert.deepEqual(parts.map(part=>part.type),['strip','gif','strip','media','strip','media','strip']);
 assert.deepEqual(strips.map(part=>[part.start,part.end]),[[0,50],[200,400],[580,900],[1080,1200]]);
 const html=composeRasterFlowHTML(project,parts,strips.map(part=>({...part,url:`https://mmbiz.qpic.cn/strip-${part.start}.png`})));
 assert.equal((html.match(/<img\b/g)||[]).length,5);
 assert.equal((html.match(/<svg\b/g)||[]).length,0);
 assert.match(html,/poster\.gif/);
 assert.match(html,/在此插入视频号/);
 assert.deepEqual(auditRasterFlowInsertion('',html,html),[]);
 assert.deepEqual(auditRasterFlowInsertion('',html.replace(/background-image:/,'background:'),html),['连续底图 0/1']);
 const swapped=html.replace('https://mmbiz.qpic.cn/strip-0.png','PLACEHOLDER').replace('https://mmbiz.qpic.cn/strip-200.png','https://mmbiz.qpic.cn/strip-0.png').replace('PLACEHOLDER','https://mmbiz.qpic.cn/strip-200.png');
 assert.ok(auditRasterFlowInsertion('',swapped,html).includes('图片顺序发生变化'));
});

test('raster flow refuses to flatten overlapping animated artwork',()=>{
 const project={width:750,height:500,layers:[
  {id:'poster',type:'image',name:'动图',x:0,y:0,w:400,h:300,fit:'contain',images:[{src:'data:image/gif;base64,AA=='}]},
  {id:'title',type:'text',x:0,y:100,w:500,h:100},
 ]};
 assert.throws(()=>rasterFlowPlan(project),/重叠/);
});
