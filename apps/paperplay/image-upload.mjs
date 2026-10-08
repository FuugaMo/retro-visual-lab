const canvasBlob=(canvas,type,quality)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('图片编码失败')),type,quality));

function hasTransparency(context,width,height){
 const alpha=context.getImageData(0,0,width,height).data;
 for(let index=3;index<alpha.length;index+=4)if(alpha[index]!==255)return true;
 return false;
}

export async function encodeWechatImage(image,{name='图片',background='#ffffff',limit=900*1024,preferPNG=true}={}){
 if(!image?.naturalWidth||!image?.naturalHeight)throw Error(`${name} 无法解码`);
 let width=Math.min(image.naturalWidth,1080),smallest=null;
 for(let attempt=0;attempt<8;attempt++){
  const height=Math.max(1,Math.round(image.naturalHeight*width/image.naturalWidth));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,width,height);
  if(hasTransparency(context,width,height)){
   const blob=await canvasBlob(canvas,'image/png');
   if(!smallest||blob.size<smallest.size)smallest=blob;
   if(blob.size<=limit)return {blob,width,height,mime:'image/png',extension:'png'};
  }else{
   if(preferPNG){const png=await canvasBlob(canvas,'image/png');if(png.size<=limit)return {blob:png,width,height,mime:'image/png',extension:'png'}}
   context.globalCompositeOperation='destination-over';context.fillStyle=background;context.fillRect(0,0,width,height);context.globalCompositeOperation='source-over';
   for(const quality of [.92,.88,.84,.78,.72,.65,.58,.5,.42]){
    const blob=await canvasBlob(canvas,'image/jpeg',quality);
    if(!smallest||blob.size<smallest.size)smallest=blob;
    if(blob.size<=limit)return {blob,width,height,mime:'image/jpeg',extension:'jpg',quality};
   }
  }
  if(width<=320)break;
  width=Math.max(320,Math.floor(width*.82));
 }
 throw Error(`${name} 无法压到 ${Math.round(limit/1024)}KB 内，最小输出仍有 ${Math.ceil((smallest?.size||0)/1024)}KB`);
}
