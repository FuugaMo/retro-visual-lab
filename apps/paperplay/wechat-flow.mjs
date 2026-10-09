const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slotHTML=slot=>`<p data-paperplay-slot="${escapeHTML(slot.id)}" style="box-sizing:border-box;height:${Math.max(1,slot.end-slot.y)}px;margin:0;padding:24px 16px;min-height:1px;text-align:center;color:#333333;line-height:1.6;overflow:hidden;">在此插入${escapeHTML(slot.kind)}</p>`;

export function flowSlots(state){
 const music=state.layers.filter(layer=>layer.type==='music').map(layer=>({id:layer.id,kind:'音乐',y:layer.y,end:layer.y+layer.h}));
 const media=state.layers.filter(layer=>layer.type==='media').map(layer=>({id:layer.id,kind:layer.mediaKind||'音频',y:layer.y,end:layer.y+layer.h}));
 const manual=(state.flowSlots||[]).map(slot=>({id:slot.id,kind:slot.kind,y:slot.y,end:slot.y}));
 return [...music,...media,...manual].filter(slot=>Number.isFinite(slot.y)&&slot.y>=0&&slot.y<state.height).sort((a,b)=>a.y-b.y||a.end-b.end);
}

export function composeFlowHTML(state,renderStrip){
 const tile=state.flowBackground;
 if(!tile||!/^https:\/\/mmbiz\.(?:qpic|qlogo)\.cn\//.test(tile.url||''))throw Error('请先上传一张可上下循环的背景纹理');
 const slots=flowSlots(state);
 let cursor=0;
 const parts=[];
 for(const slot of slots){
  if(slot.y<cursor)throw Error('媒体插入点与音乐区域重叠，请调整位置');
  if(slot.y>cursor)parts.push(renderStrip(cursor,slot.y));
  parts.push(slotHTML(slot));
  cursor=slot.end;
 }
 if(cursor<state.height)parts.push(renderStrip(cursor,state.height));
 return `<section style="margin:0;padding:0;background-color:${escapeHTML(state.color)};background-image:url(&quot;${escapeHTML(tile.url)}&quot;);background-position:0 0;background-size:100% auto;background-repeat:repeat-y;line-height:normal;">${parts.join('')}</section>`;
}

export function rasterFlowPlan(state,maxStripHeight=1600){
 const animated=state.layers.filter(layer=>layer.type==='image'&&/^(?:data:image\/gif;base64,|https?:\/\/[^\s]+\.gif(?:[?#]|$))/i.test(layer.images?.[0]?.src||''));
 const occupied=[...flowSlots(state).map(slot=>({...slot,type:'media'})),...animated.map(layer=>({id:layer.id,type:'gif',y:layer.y,end:layer.y+layer.h,layer}))].sort((a,b)=>a.y-b.y||a.end-b.end);
 let cursor=0;const parts=[];
 const strips=(start,end)=>{for(let y=start;y<end;y=Math.min(end,y+maxStripHeight))parts.push({type:'strip',start:y,end:Math.min(end,y+maxStripHeight)})};
 for(const slot of occupied){if(slot.y<cursor)throw Error('GIF 与其他图层或媒体插入点重叠，不能安全导出动画');strips(cursor,slot.y);parts.push(slot);cursor=slot.end}
 strips(cursor,state.height);
 for(const slot of occupied.filter(item=>item.type==='gif')){
  const layer=slot.layer;
  if(state.layers.some(other=>other.id!==layer.id&&!['music','media'].includes(other.type)&&other.y<slot.end&&other.y+other.h>slot.y))throw Error(`${layer.name||'GIF'} 与其他视觉图层重叠，无法保持动画和准确位置`);
  if(layer.rotation||layer.radius||layer.fit!=='contain')throw Error(`${layer.name||'GIF'} 使用了旋转、圆角或裁切；请改为完整显示后再导出动画`);
 }
 return parts;
}

export function refineRasterFlowPlan(parts,assets){
 return parts.flatMap(part=>{
  if(part.type!=='strip')return [part];
  const strips=assets.filter(asset=>asset.start>=part.start&&asset.end<=part.end).sort((a,b)=>a.start-b.start);
  let cursor=part.start;
  for(const strip of strips){if(strip.start!==cursor||strip.end<=strip.start)throw Error(`视觉分段 ${part.start}–${part.end}px 不连续`);cursor=strip.end}
  if(cursor!==part.end)throw Error(`视觉分段 ${part.start}–${part.end}px 不完整`);
  return strips.map(strip=>({type:'strip',start:strip.start,end:strip.end}));
 });
}

export function composeRasterFlowHTML(state,parts,stripAssets){
 const tile=state.flowBackground;
 if(!tile||!/^https:\/\/mmbiz\.(?:qpic|qlogo)\.cn\//.test(tile.url||''))throw Error('请先上传连续背景纹理');
 const inner=parts.map(part=>{
  if(part.type==='strip'){
   const asset=stripAssets.find(item=>item.start===part.start&&item.end===part.end);
   if(!asset||!/^https:\/\/mmbiz\.(?:qpic|qlogo)\.cn\//.test(asset.url||''))throw Error(`第 ${part.start}–${part.end}px 段尚未上传`);
   return `<img data-paperplay-strip="${part.start}-${part.end}" src="${escapeHTML(asset.url)}" width="${state.width}" height="${part.end-part.start}" style="display:block;width:100%;height:auto;margin:0;padding:0;border:0;vertical-align:top;"/>`;
  }
  if(part.type==='gif'){
   const layer=part.layer,asset=layer.images[0];
   if(!/^https:\/\/mmbiz\.(?:qpic|qlogo)\.cn\//.test(asset.url||''))throw Error(`${asset.name} 尚未上传`);
   return `<img data-paperplay-gif="${escapeHTML(layer.id)}" src="${escapeHTML(asset.url)}" width="${Math.round(layer.w)}" height="${Math.round(layer.h)}" style="display:block;width:${layer.w/state.width*100}%;height:auto;margin:0 0 0 ${layer.x/state.width*100}%;padding:0;border:0;vertical-align:top;"/>`;
  }
  return slotHTML(part);
 }).join('');
 return `<section style="display:block;box-sizing:border-box;width:100%;margin:0;padding:0;border:0;background-color:${escapeHTML(state.color)};background-image:url(&quot;${escapeHTML(tile.url)}&quot;);background-position:0 0;background-size:100% auto;background-repeat:repeat-y;font-size:0;line-height:0;overflow:hidden;">${inner}</section>`;
}

export function auditRasterFlowInsertion(before,after,inserted){
 const count=(html,pattern)=>(String(html||'').match(pattern)||[]).length;
 const backgroundCount=html=>[...String(html||'').matchAll(/\bstyle\s*=\s*(["'])(.*?)\1/gi)].filter(match=>/(?:^|;)\s*background(?:-image)?\s*:\s*(?:url\(|[^;]*\burl\()/i.test(match[2])).length;
 const expectedBackground=backgroundCount(inserted),actualBackground=backgroundCount(after)-backgroundCount(before);
 const checks=[['图像分段',/<img\b/gi],['媒体插入点',/在此插入(?:音乐|音频|视频号)/gi]];
 const missing=checks.flatMap(([label,pattern])=>{const expected=count(inserted,pattern),actual=count(after,pattern)-count(before,pattern);return expected>actual?[`${label} ${Math.max(0,actual)}/${expected}`]:[]});
 if(expectedBackground>actualBackground)missing.unshift(`连续底图 ${Math.max(0,actualBackground)}/${expectedBackground}`);
 const paths=[...String(inserted).matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map(match=>{try{return new URL(match[1].replace(/&amp;/g,'&')).pathname.replace(/\/(?:0|300|640)$/,'')}catch{return ''}}).filter(Boolean);
 const actual=String(after||''),previous=String(before||'');
 if(paths.some(path=>count(actual,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))<=count(previous,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))))missing.push('图片地址未全部保留');
 let last=-1;if(paths.some(path=>{const index=actual.indexOf(path,last+1);if(index<0||index<last)return true;last=index;return false}))missing.push('图片顺序发生变化');
 return missing;
}

export function auditFlowInsertion(before,after,inserted){
 const count=(html,pattern)=>(String(html||'').match(pattern)||[]).length;
 const missing=[];
 for(const [label,pattern] of [
  ['连续底图',/background-image\s*:/gi],
  ['SVG 排版',/<svg\b/gi],
  ['素材叠层',/<foreignObject\b/gi],
  ['文字素材',/<text\b/gi],
  ['图片素材',/<img\b/gi],
  ['媒体插入点',/data-paperplay-slot\s*=/gi],
 ]){
  const expected=count(inserted,pattern),actual=count(after,pattern)-count(before,pattern);
  if(expected>actual)missing.push(`${label} ${Math.max(0,actual)}/${expected}`);
 }
 const boxes=html=>[...String(html||'').matchAll(/<svg\b[^>]*\bviewBox\s*=\s*["']([^"']+)["']/gi)].map(match=>match[1].trim().replace(/\s+/g,' '));
 const expected=boxes(inserted),beforeBoxes=boxes(before),afterBoxes=boxes(after);
 let retained=0;
 for(const box of new Set(expected)){
  const needed=expected.filter(value=>value===box).length;
  const added=afterBoxes.filter(value=>value===box).length-beforeBoxes.filter(value=>value===box).length;
  retained+=Math.min(needed,Math.max(0,added));
 }
 if(retained<expected.length)missing.push(`画布高度 ${retained}/${expected.length}`);
 return missing;
}
