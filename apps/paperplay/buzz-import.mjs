import JSZip from 'jszip';
import * as kiwi from 'kiwi-schema';
import * as pako from 'pako';
import {decompress as decompressZstd} from 'fzstd';

const guid=node=>node?.sessionID+':'+node?.localID;
const hashHex=hash=>hash?Array.from({length:20},(_,index)=>Number(hash[index]??0).toString(16).padStart(2,'0')).join(''):'';
const colorHex=color=>color?'#'+['r','g','b'].map(key=>Math.round(Math.max(0,Math.min(1,color[key]??0))*255).toString(16).padStart(2,'0')).join(''):'#ffffff';
const id=()=>globalThis.crypto?.randomUUID?.()||'buzz-'+Math.random().toString(36).slice(2);
const mime=bytes=>bytes[0]===0x89&&bytes[1]===0x50?'image/png':bytes[0]===0xff&&bytes[1]===0xd8?'image/jpeg':bytes[0]===0x47&&bytes[1]===0x49?'image/gif':bytes[0]===0x52&&bytes[1]===0x49?'image/webp':null;

export async function parseBuzz(arrayBuffer){
 const zip=await JSZip.loadAsync(arrayBuffer),entry=zip.file('canvas.fig');
 if(!entry)throw Error('不是有效的 Figma Buzz 工程：缺少 canvas.fig');
 const bytes=await entry.async('uint8array'),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(new TextDecoder().decode(bytes.slice(0,8))!=='fig-buzz')throw Error('暂不支持此 Buzz 文件版本');
 const schemaEnd=16+view.getUint32(12,true);
 if(schemaEnd+4>=bytes.length)throw Error('Buzz 图层数据不完整');
 const schema=kiwi.decodeBinarySchema(pako.inflateRaw(bytes.slice(16,schemaEnd)));
 const packed=bytes.slice(schemaEnd+4),message=packed[0]===0x28&&packed[1]===0xb5?decompressZstd(packed):pako.inflateRaw(packed);
 const document=kiwi.compileSchema(schema).decodeMessage(message),nodes=document.nodeChanges||[];
 const frame=nodes.filter(node=>node.type==='FRAME'&&node.size?.x>=320&&node.size?.y>=320).sort((a,b)=>b.size.x*b.size.y-a.size.x*a.size.y)[0];
 if(!frame)throw Error('Buzz 中没有可导入的画板');
 const width=Math.round(frame.size.x),height=Math.round(frame.size.y);
 if(width>8000||height>60000)throw Error('Buzz 画板超出当前编辑器尺寸上限');
 const children=nodes.filter(node=>guid(node.parentIndex?.guid)===guid(frame.guid)&&node.visible!==false);
 const imageNodes=children.filter(node=>node.fillPaints?.some(paint=>paint.type==='IMAGE'&&paint.visible!==false&&paint.image?.hash));
 const fullWidth=imageNodes.filter(node=>Math.abs((node.transform?.m02||0))<=2&&Math.abs(node.size?.x-width)<=2&&Math.abs((node.transform?.m01||0))<.001&&Math.abs((node.transform?.m10||0))<.001);
 const groups=new Map();for(const node of fullWidth){const hash=hashHex(node.fillPaints.find(paint=>paint.type==='IMAGE')?.image?.hash);if(!groups.has(hash))groups.set(hash,[]);groups.get(hash).push(node)}
 let backgroundNodes=[];for(const group of groups.values()){const sorted=[...group].sort((a,b)=>a.transform.m12-b.transform.m12);let edge=0;for(const node of sorted){if(Math.abs(node.transform.m12-edge)>2)break;edge+=node.size.y}if(sorted.length>=2&&Math.abs(edge-height)<=2&&sorted.length>backgroundNodes.length)backgroundNodes=sorted}
 const usedImages=new Map();async function imageAsset(node){const paint=node.fillPaints.find(item=>item.type==='IMAGE'&&item.image?.hash),hash=hashHex(paint?.image?.hash);if(usedImages.has(hash))return usedImages.get(hash);const item=zip.file('images/'+hash);if(!item)throw Error('Buzz 缺少图片素材 '+hash);const data=await item.async('uint8array'),type=mime(data);if(!type)throw Error('Buzz 中有不支持的图片格式：'+node.name);const base64=await item.async('base64'),asset={id:id(),name:(paint.image.name||node.name||'Buzz 图片')+'.'+type.split('/')[1].replace('jpeg','jpg'),src:'data:'+type+';base64,'+base64,url:''};usedImages.set(hash,asset);return asset}
 let background=null,backgroundRepeatHeight=0;if(backgroundNodes.length){background=await imageAsset(backgroundNodes[0]);backgroundRepeatHeight=Math.round(backgroundNodes[0].size.y)}
 const excluded=new Set(backgroundNodes),layers=[],skipped=[];
 const ordered=[...children].sort((a,b)=>{const left=a.parentIndex?.position||'',right=b.parentIndex?.position||'';return left<right?-1:left>right?1:0});
 for(const node of ordered){if(excluded.has(node))continue;const transform=node.transform||{},scaleX=Math.hypot(transform.m00??1,transform.m10??0),scaleY=Math.hypot(transform.m01??0,transform.m11??1),x=Math.round(transform.m02||0),y=Math.round(transform.m12||0),w=Math.round((node.size?.x||0)*scaleX),h=Math.round((node.size?.y||0)*scaleY);
  if(w<30||h<24||x>=width||y>=height||x+w<=0||y+h<=0){skipped.push(node.name||node.type);continue}
  const base={id:id(),name:String(node.name||node.type),x,y,w,h};
  if(node.type==='TEXT'&&node.textData?.characters){layers.push({...base,type:'text',text:node.textData.characters,fontSize:Math.round(node.fontSize||24),lineHeight:Math.round(node.fontSize||24),fontFamily:String(node.fontName?.family||'sans-serif'),color:colorHex(node.fillPaints?.find(paint=>paint.type==='SOLID')?.color),align:node.textAlignHorizontal==='CENTER'?'center':node.textAlignHorizontal==='RIGHT'?'right':'left'});continue}
  if(node.fillPaints?.some(paint=>paint.type==='IMAGE'&&paint.image?.hash)){try{layers.push({...base,type:'image',images:[await imageAsset(node)],fit:'cover',radius:Math.round(node.cornerRadius||0),rotation:Math.atan2(transform.m10||0,transform.m00||1)*180/Math.PI})}catch(error){skipped.push(node.name+': '+error.message)}continue}
  skipped.push(node.name||node.type);
 }
 const fill=frame.fillPaints?.find(paint=>paint.type==='SOLID');
 return {project:{version:1,name:String(frame.name==='Untitled'?(zip.file('meta.json')?JSON.parse(await zip.file('meta.json').async('text')).file_name:'Buzz 工程'):frame.name),width,height,color:colorHex(fill?.color),background,backgroundRepeatHeight,layers},report:{total:nodes.length,images:layers.filter(layer=>layer.type==='image').length,text:layers.filter(layer=>layer.type==='text').length,backgroundTiles:backgroundNodes.length,skipped}};
}
