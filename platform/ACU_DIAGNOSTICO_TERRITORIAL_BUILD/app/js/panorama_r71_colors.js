/* One absolute, fixed scale per indicator; no local ranks or adaptive limits. */
globalThis.R71Colors=(()=>{
 const stops=ACU_R75.palettes.red;
 const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
 const encode=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
 const anchorsFor=k=>(k==='residents'?ACU_R75.palettes.blue:ACU_R75.palettes.red).map(h=>[1,3,5].map(i=>linear(parseInt(h.slice(i,i+2),16)/255)));
 const knots=k=>k==='residents'?[1,2.4,3,3.6,5]:k==='joint'?[0,3.3560531560323163,6.712106312064633,10.06815946809695,13.424212624129265]:[0,25,50,75,100];
 function channels(value,k){const anchors=anchorsFor(k),a=knots(k),v=Math.max(a[0],Math.min(a[4],value));let i=0;while(i<3&&v>a[i+1])i++;const f=(v-a[i])/(a[i+1]-a[i]);return anchors[i].map((x,j)=>x+(anchors[i+1][j]-x)*f);}
 function color(v,k){return typeof v==='number'&&Number.isFinite(v)?'rgb('+channels(v,k).map(x=>(255*encode(x)).toFixed(3)).join(',')+')':'rgba(255,255,255,0.22)';}
 function luminance(v,k){return channels(v,k).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);}
 function paint(c,k){const ctx=c.getContext('2d'),a=knots(k);for(let x=0;x<c.width;x++){const q=4*x/(c.width-1),i=Math.min(3,Math.floor(q)),v=a[i]+(a[i+1]-a[i])*(q-i);ctx.fillStyle=color(v,k);ctx.fillRect(x,0,1,c.height);}}
 return {stops,knots,color,luminance,paint,interpolation:'linear-light sRGB, fixed numeric piecewise knots; equal-length legend segments represent unequal intervals for residents',saturation:'residents <=1 and >=5, original values remain in sheet'};
})();
