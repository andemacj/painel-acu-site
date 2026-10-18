/* Shared detail navigation: one owned history entry, exact scroll/focus return. */
(()=>{'use strict';
 let serial=0;
 const hashParams=new URLSearchParams(location.hash.slice(1)),bootParams=hashParams.has('city')?hashParams:new URLSearchParams(location.search);
 let bootRequest=bootParams.get('module')==='assistant'&&bootParams.get('assistant_detail')?{city:bootParams.get('city'),key:bootParams.get('assistant_detail')}:null;
 const signature=()=>JSON.stringify([...document.querySelectorAll('select[id],input[type=checkbox][id]')].map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));
 const plainState=()=>history.state&&typeof history.state==='object'?{...history.state}:{};
 function mount(api){
  const root=api.root,book=root.querySelector('.r85-detail-book'),bar=root.querySelector('.r86-return-bar'),button=bar.querySelector('[data-r86-return]');
  let origin=null,key=null,disposed=false,previousRestoration=null,pendingReturn=false,restoring=false,positionEpoch=0;
  const topButton=bar.querySelector('[data-r87-top]'),topTarget=root.querySelector('.r85-header');topTarget.id='r87-assistant-top';
  const current=()=>!disposed&&api.isCurrent();
  const resolve=k=>api.getRow(k)||api.rows().find(r=>r.indicator_id===k);
  const preferred=r=>r?.key.startsWith('pnad|')?'child-context':r?.key.startsWith('territory|')?'territory':r?.key.startsWith('violence|')?'violence':['pense','abandonment','distortion','ideb'].includes(r?.family)?'education':'overview';
  function fixedOffset(){
   const h=[...document.querySelectorAll('.topbar,.side-nav')].filter(e=>['fixed','sticky'].includes(getComputedStyle(e).position)).map(e=>e.getBoundingClientRect()).filter(r=>r.top<=80&&r.bottom>0&&r.width>innerWidth*.6);
   const top=Math.max(0,...h.map(r=>r.bottom))+8;root.style.setProperty('--r86-return-top',top+'px');return top;
  }
  const manualRestoration=()=>{if(previousRestoration===null){previousRestoration=history.scrollRestoration;history.scrollRestoration='manual';}};
  function releaseRestoration(){if(previousRestoration!==null){history.scrollRestoration=previousRestoration;previousRestoration=null;}}
  function cleanState(){const state=plainState();delete state.acuR86Detail;delete state.acuR86Origin;return state;}
  function hashWithoutDetail(){const p=new URLSearchParams(location.hash.slice(1));p.delete('assistant_detail');p.set('assistant_tab',api.getTab());return '#'+p;}
  function capture(source,r){
   const panel=source.closest('.r85-tab-panel'),matches=panel?[...panel.querySelectorAll('[data-r85-detail],[data-r85-evidence]')].filter(e=>(e.dataset.r85Detail||e.dataset.r85Evidence)===r.key):[];
   const id='r86-origin-'+encodeURIComponent(api.city+'|'+api.geography+'|'+api.getTab()+'|'+r.key+'|'+matches.indexOf(source));source.id=id;
   const scrolls=new Set(root.querySelectorAll('.r85-table-scroll,.r85-tabs'));
   for(let e=source.parentElement;e&&e!==document.body;e=e.parentElement)if(e.scrollHeight>e.clientHeight||e.scrollWidth>e.clientWidth)scrolls.add(e);
   return {id:'acu-r86-'+(++serial),city:api.city,geography:api.geography,token:api.token,signature:signature(),tab:api.getTab(),key:r.key,source,sourceId:id,occurrence:matches.indexOf(source),focused:document.activeElement,hash:hashWithoutDetail(),x:scrollX,y:scrollY,scrolls:[...scrolls].map(el=>({el,left:el.scrollLeft,top:el.scrollTop})),bookOpen:book.open,openDetails:[...book.querySelectorAll('.r85-evidence[open]')].map(e=>e.id),pushed:false};
  }
  function toolbar(r){button.textContent=origin?.tab==='overview'?'← Visão anterior':'← Indicadores';button.setAttribute('aria-label',origin?'Voltar à posição anterior na aba de origem':'Voltar aos indicadores da cidade atual');bar.querySelector('span').textContent=r?.label||'Indicadores da seleção atual';}
  function syncHash(p){
   if(p.get('city')!==api.city||p.get('territory')!==api.geography){key=null;origin=null;releaseRestoration();p.delete('assistant_detail');history.replaceState(cleanState(),'','#'+p);return;}
   if(key)p.set('assistant_detail',resolve(key)?.indicator_id||key);else p.delete('assistant_detail');
   const state=plainState();
   if(!origin){delete state.acuR86Detail;delete state.acuR86Origin;}
   history.replaceState(state,'','#'+p);
  }
  function position(detail){
   const epoch=++positionEpoch;requestAnimationFrame(()=>{if(!current()||epoch!==positionEpoch||!key||!book.open||!detail.open)return;const top=fixedOffset()+bar.getBoundingClientRect().height+12;
    window.scrollTo({top:Math.max(0,scrollY+detail.getBoundingClientRect().top-top),left:scrollX,behavior:'instant'});
    detail.querySelector('summary').focus({preventScroll:true});
   });
  }
  function open(k,source=null,options={}){
   if(!current())return false;const r=resolve(k);if(!r)return false;
   const detail=document.getElementById(r.detail_id);if(!detail)return false;
   const outside=source&&!source.closest('.r85-detail-book'),owned=outside&&originValid()&&origin.pushed&&history.state?.acuR86Detail===origin.id,prior=owned?origin:null;
   const entering=!key||outside&&!owned;
   if(outside){origin=capture(source,r);if(prior){origin.id=prior.id;origin.pushed=true;}}
   key=r.key;toolbar(r);manualRestoration();
   if(!options.fromHistory&&!options.direct){
    const p=new URLSearchParams(location.hash.slice(1));p.set('assistant_detail',r.indicator_id);p.set('assistant_tab',api.getTab());
    if(entering&&origin){
     history.replaceState({...cleanState(),acuR86Origin:origin.id},'',origin.hash);
     history.pushState({...cleanState(),acuR86Detail:origin.id},'','#'+p);origin.pushed=true;
    }else history.replaceState({...plainState(),...(origin?{acuR86Detail:origin.id}:{})},'','#'+p);
   }
   book.open=true;detail.open=true;position(detail);return true;
  }
  function originValid(){return current()&&origin&&origin.city===api.city&&origin.geography===api.geography&&origin.token===api.token&&origin.signature===signature();}
  function restore(saved){
   if(!current())return;positionEpoch++;restoring=true;api.setTab(saved.tab);key=null;
   book.querySelectorAll('.r85-evidence').forEach(e=>e.open=saved.openDetails.includes(e.id));book.open=saved.bookOpen;
   history.replaceState({...cleanState(),acuR86Origin:saved.id},'','#'+new URLSearchParams(saved.hash.slice(1)));
   requestAnimationFrame(()=>{if(!current()||!originValid())return;
    const panel=document.getElementById('r85-panel-'+saved.tab),matches=panel?[...panel.querySelectorAll('[data-r85-detail],[data-r85-evidence]')].filter(e=>(e.dataset.r85Detail||e.dataset.r85Evidence)===saved.key):[];
    const source=saved.source.isConnected?saved.source:document.getElementById(saved.sourceId)||matches[saved.occurrence]||matches[0];
    if(source){source.focus({preventScroll:true});source.classList.add('r86-returned');setTimeout(()=>source.classList.remove('r86-returned'),1600);}
    for(const s of saved.scrolls)if(s.el.isConnected){s.el.scrollLeft=s.left;s.el.scrollTop=s.top;}
    window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
    requestAnimationFrame(()=>{if(!current())return;for(const s of saved.scrolls)if(s.el.isConnected){s.el.scrollLeft=s.left;s.el.scrollTop=s.top;}window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});restoring=false;releaseRestoration();});
   });
  }
  function fallback(){
   if(!current())return;const r=resolve(key),target=preferred(r);origin=null;key=null;book.open=false;api.setTab(target);
   history.replaceState(cleanState(),'',hashWithoutDetail());releaseRestoration();
   requestAnimationFrame(()=>{if(!current())return;const panel=document.getElementById('r85-panel-'+target),source=r?[...panel.querySelectorAll('[data-r85-detail]')].find(e=>e.dataset.r85Detail===r.key):null;
    if(source){source.closest('details.r85-group')?.setAttribute('open','');source.focus({preventScroll:true});window.scrollTo({top:Math.max(0,scrollY+source.getBoundingClientRect().top-fixedOffset()-20),behavior:'instant'});}
    else {const tab=root.querySelector('[data-r83-tab="'+target+'"]');tab?.focus({preventScroll:true});tab?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
   });
  }
  function toTop(){
   if(!current())return;positionEpoch++;
   // Close neither the history nor its application-state hash: this is a scroll action.
   const vertical=e=>{const css=getComputedStyle(e);return /auto|scroll/.test(css.overflowY)&&e.scrollHeight>e.clientHeight;};
   for(const e of [book,...book.querySelectorAll('*')])if(vertical(e))e.scrollTop=0;
   const destination=root.querySelector('[data-r83-tab="'+api.getTab()+'"]');destination?.focus({preventScroll:true});
   const move=()=>{if(!current())return;
    for(let e=topTarget.parentElement;e&&e!==document.body;e=e.parentElement)if(vertical(e)){const y=topTarget.getBoundingClientRect().top-e.getBoundingClientRect().top;e.scrollTop+=y;}
    window.scrollTo({top:Math.max(0,scrollY+topTarget.getBoundingClientRect().top-fixedOffset()),left:scrollX,behavior:'instant'});
   };move();requestAnimationFrame(move);
  }
  function back(){
   if(!current()||pendingReturn)return;
   if(originValid()){
    if(origin.pushed&&history.state?.acuR86Detail===origin.id){pendingReturn=true;history.back();}
    else restore(origin);
   }else fallback();
  }
  function onPop(){
   if(!current())return;const p=new URLSearchParams(location.hash.slice(1));
   if(p.get('city')!==api.city||p.get('territory')&&p.get('territory')!==api.geography){
    releaseRestoration();
    // A pasted same-document deep link must pass through the normal city/territory loader.
    if(p.get('module')==='assistant'&&p.get('assistant_detail'))location.reload();
    return;
   }
   if(!p.get('assistant_detail')&&originValid()&&(pendingReturn||history.state?.acuR86Origin===origin.id)){pendingReturn=false;restore(origin);}
   else if(p.get('assistant_detail')){
    // Only our own Forward entry may reuse a remembered origin.
    if(!origin||history.state?.acuR86Detail!==origin.id){origin=null;pendingReturn=false;}
    const r=resolve(p.get('assistant_detail'));if(r)open(r.key,null,{fromHistory:true});else fallback();
   }
  }
  function onToggle(e){if(restoring)return;if(e.target===book){if(book.open)fixedOffset();else if(key)back();}if(e.target.matches('.r85-evidence')&&e.target.open){const r=api.rows().find(r=>r.detail_id===e.target.id);if(r){if(key!==r.key)origin=null;key=r.key;toolbar(r);}}}
  function onKey(e){if(e.key==='Escape'&&book.open){e.preventDefault();back();}}
  const observer=new MutationObserver(()=>{if(!api.isCurrent())releaseRestoration();});observer.observe(document.body,{attributes:true,attributeFilter:['data-active-module']});
  button.setAttribute('aria-keyshortcuts','Escape');button.title='Retornar à posição de origem (Esc)';
  topButton.setAttribute('aria-controls',topTarget.id);topButton.addEventListener('click',toTop);button.addEventListener('click',back);book.addEventListener('toggle',onToggle,true);root.addEventListener('keydown',onKey);window.addEventListener('popstate',onPop);window.addEventListener('resize',fixedOffset);window.addEventListener('pagehide',releaseRestoration);
  const boot=bootRequest;bootRequest=null;
  const direct=new URLSearchParams(location.hash.slice(1)).get('assistant_detail')||(boot?.city===api.city?boot.key:null);
  if(direct){const r=resolve(direct);if(r){key=r.key;const p=new URLSearchParams(location.hash.slice(1));p.set('assistant_detail',r.indicator_id);history.replaceState(cleanState(),'','#'+p);requestAnimationFrame(()=>open(key,null,{direct:true}));}else {key=null;history.replaceState(cleanState(),'',hashWithoutDetail());}}
  return {open,back,toTop,syncHash,dispose(){disposed=true;observer.disconnect();releaseRestoration();topButton.removeEventListener('click',toTop);button.removeEventListener('click',back);book.removeEventListener('toggle',onToggle,true);root.removeEventListener('keydown',onKey);window.removeEventListener('popstate',onPop);window.removeEventListener('resize',fixedOffset);window.removeEventListener('pagehide',releaseRestoration);},snapshot:()=>({key,has_origin:!!origin,origin_valid:!!originValid(),origin:origin?{city:origin.city,geography:origin.geography,tab:origin.tab,indicator:origin.key,x:origin.x,y:origin.y,sourceId:origin.sourceId,scrolls:origin.scrolls.map(s=>({left:s.left,top:s.top})),pushed:origin.pushed}:null})};
 }
 window.ACU_R86_DETAIL_NAV={mount};
})();
