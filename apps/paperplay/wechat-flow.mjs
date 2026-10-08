const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function flowSlots(state){
 const music=state.layers.filter(layer=>layer.type==='music').map(layer=>({id:layer.id,kind:'音乐',y:layer.y,end:layer.y+layer.h}));
 const manual=(state.flowSlots||[]).map(slot=>({id:slot.id,kind:slot.kind,y:slot.y,end:slot.y}));
 return [...music,...manual].filter(slot=>Number.isFinite(slot.y)&&slot.y>=0&&slot.y<state.height).sort((a,b)=>a.y-b.y||a.end-b.end);
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
  parts.push(`<p data-paperplay-slot="${escapeHTML(slot.id)}" style="margin:0;padding:24px 16px;min-height:1em;text-align:center;color:#333333;line-height:1.6;">在此插入${escapeHTML(slot.kind)}</p>`);
  cursor=slot.end;
 }
 if(cursor<state.height)parts.push(renderStrip(cursor,state.height));
 return `<section style="margin:0;padding:0;background-color:${escapeHTML(state.color)};background-image:url(&quot;${escapeHTML(tile.url)}&quot;);background-position:0 0;background-size:100% auto;background-repeat:repeat-y;line-height:normal;">${parts.join('')}</section>`;
}
