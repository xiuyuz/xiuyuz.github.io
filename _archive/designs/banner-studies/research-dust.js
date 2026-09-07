// The selected study's particle distribution continues in the figure margins.
// The figure rectangle is explicitly excluded from drawing.
export function mountResearchDust(root,study){
  const carousel=root.querySelector('.publication-carousel');
  const old=carousel?.querySelector('[data-pc-effects-toggle]');
  if(!carousel||!old)return()=>{};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const button=old.cloneNode(true);old.replaceWith(button);
  let seed=719+study.id;
  const rand=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const [rx,ry,rz]=study.rotation||[.20,-.35,-.08];
  const particles=Array.from({length:2100},(_,i)=>{
    const sample=study.sample(rand,i,2100),[x,y,z]=sample.position;
    // Match the banner's XYZ Euler pose before applying the slow shared yaw.
    const x1=x*Math.cos(rz)-y*Math.sin(rz),y1=x*Math.sin(rz)+y*Math.cos(rz);
    const x2=x1*Math.cos(ry)+z*Math.sin(ry),z2=-x1*Math.sin(ry)+z*Math.cos(ry);
    return{...sample,position:[x2,y1*Math.cos(rx)-z2*Math.sin(rx),y1*Math.sin(rx)+z2*Math.cos(rx)]};
  });
  const cells=[...carousel.querySelectorAll('.pc-enlarge')].map(host=>{
    host.querySelector('.pc-orbit-field')?.remove();
    const canvas=document.createElement('canvas');canvas.className='study-research-dust';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
    return{host,canvas,context:canvas.getContext('2d'),slide:host.closest('.pc-slide'),width:0,height:0,mask:null};
  });
  let frame=0,last=0,time=0,paused=false,inView=false,disposed=false;
  let colors=['91,119,160','145,123,172','87,142,147'];
  const onTheme=()=>{colors=document.documentElement.dataset.theme==='dark'?['140,175,207','171,152,194','125,185,180']:['91,119,160','145,123,172','87,142,147'];paint();};
  function paint(){
    const angle=Math.sin(time*.12)*.24;
    const c=Math.cos(angle),s=Math.sin(angle);
    for(const cell of cells){
      if(cell.slide.inert||!cell.width)continue;
      const{context:ctx,width:w,height:h,mask}=cell;
      ctx.clearRect(0,0,w,h);
      for(const sample of particles){
        const p=sample.position;
        const px=p[0]*c+p[2]*s,pz=-p[0]*s+p[2]*c;
        const depth=4.5/(4.5-pz);
        const x=w*.53+px*w*.52*depth;
        const y=h*.57-(p[1]+Math.sin(time*.16+p[0]*2)*.016)*h*.41*depth;
        if(x<0||x>w||y<0||y>h)continue;
        if(mask&&x>mask.left&&x<mask.right&&y>mask.top&&y<mask.bottom)continue;
        const alpha=(.11+.10*Math.max(0,Math.min(1,(pz+1.5)/3)))*(sample.density||.8);
        ctx.fillStyle=`rgba(${colors[sample.region||0]},${alpha.toFixed(3)})`;
        const size=.8+depth*.40;
        ctx.fillRect(x,y,size,size);
      }
    }
    carousel.dataset.dustPhase=time.toFixed(3);
  }
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.5);
    for(const cell of cells){
      const bounds=cell.host.getBoundingClientRect();cell.width=bounds.width;cell.height=bounds.height;
      cell.canvas.width=Math.round(bounds.width*dpr);cell.canvas.height=Math.round(bounds.height*dpr);
      cell.context.setTransform(dpr,0,0,dpr,0,0);
      const figure=cell.host.querySelector('img').getBoundingClientRect();
      cell.mask={left:figure.left-bounds.left-3,right:figure.right-bounds.left+3,top:figure.top-bounds.top-3,bottom:figure.bottom-bounds.top+3};
    }
    paint();
  }
  function tick(now){
    frame=0;if(disposed||paused||reduced.matches||document.hidden||!inView)return;
    if(!last)last=now;
    if(now-last>1000/24){time+=Math.min(now-last,80)/1000;last=now;paint();}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);frame=last=0;
    const still=paused||reduced.matches;
    button.disabled=reduced.matches;button.dataset.paused=String(still);button.setAttribute('aria-pressed',String(still));
    button.setAttribute('aria-label',reduced.matches?'Research motion disabled by reduced motion preference':still?'Play research particles':'Pause research particles');
    button.querySelector('.pc-effects-label').textContent=reduced.matches?'Motion reduced':still?'Play particles':'Pause particles';
    paint();if(!still&&!document.hidden&&inView)frame=requestAnimationFrame(tick);
  }
  const onPause=()=>{paused=!paused;sync();};
  button.addEventListener('click',onPause);reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  const size=new ResizeObserver(resize);cells.forEach(cell=>size.observe(cell.host));
  const view=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();});view.observe(carousel);
  const slides=new MutationObserver(()=>{resize();sync();});slides.observe(carousel,{subtree:true,attributes:true,attributeFilter:['inert']});
  window.addEventListener('ct-theme-change',onTheme);
  resize();onTheme();sync();
  return()=>{disposed=true;window.removeEventListener('ct-theme-change',onTheme);cancelAnimationFrame(frame);size.disconnect();view.disconnect();slides.disconnect();button.removeEventListener('click',onPause);reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
}
