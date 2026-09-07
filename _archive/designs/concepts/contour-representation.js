import * as THREE from '../vendor/three/three.module.min.js';
import {createNeuralField} from './contour-neural-cloud.js';

// A single sculptural field holds three subtle research processes.
// Motion stays inside the artwork; the research headings remain still.
const instances=new WeakMap();
const MODES=['reasoning','safety','multimodal'];
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const vector=(x,y,z)=>new THREE.Vector3(x,y,z);
const palette=['#7184a4','#6c9998','#9485ac'].map(color=>new THREE.Color(color));

export function renderRepresentation(){
  return `<div class="ct-representation" aria-hidden="true"><picture><source media="(max-width:760px)" srcset="/assets/img/banner/research-brain-mobile.png"><img class="ct-representation-fallback" src="/assets/img/banner/research-brain.png" alt="" decoding="async"></picture><div class="ct-representation-shadow"></div><canvas class="ct-representation-canvas"></canvas></div>`;
}

const pointVertex=`
  attribute float aSize;
  attribute float aOpacity;
  uniform float uDpr;
  varying vec3 vColor;
  varying float vOpacity;
  void main(){
    vColor=color;vOpacity=aOpacity;
    vec4 mv=modelViewMatrix*vec4(position,1.0);
    gl_Position=projectionMatrix*mv;
    gl_PointSize=aSize*uDpr*(5.0/-mv.z);
  }
`;
const pointFragment=`
  varying vec3 vColor;
  varying float vOpacity;
  void main(){
    float d=length(gl_PointCoord-.5)*2.0;
    if(d>1.0)discard;
    float core=exp(-d*d*12.0);
    float halo=exp(-d*d*3.4)*.15;
    gl_FragColor=vec4(vColor,(core+halo)*vOpacity*(1.0-smoothstep(.7,1.0,d)));
    #include <colorspace_fragment>
  }
`;
function points(positions,colors,sizes,uniforms){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  geometry.setAttribute('aOpacity',new THREE.Float32BufferAttribute(sizes.map(()=>1),1));
  const material=new THREE.ShaderMaterial({uniforms,vertexShader:pointVertex,fragmentShader:pointFragment,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.NormalBlending});
  return new THREE.Points(geometry,material);
}
function lineSegments(curves,color,opacity){
  const positions=[];
  for(const curve of curves)for(let i=0;i<24;i++)positions.push(...curve.getPoint(i/24).toArray(),...curve.getPoint((i+1)/24).toArray());
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const parsed=new THREE.Color(color),colors=[];
  for(let i=0;i<positions.length/3;i++)colors.push(parsed.r,parsed.g,parsed.b);
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  return new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity,depthWrite:false}));
}
function curveBetween(a,b,bend=.015){return new THREE.QuadraticBezierCurve3(a,a.clone().lerp(b,.5).add(vector(0,bend,.035)),b);}

function createProcesses(uniforms){
  const group=new THREE.Group();
  const reasoningPoints=[vector(-.85,.33,.65),vector(-.65,.59,.67),vector(-.40,.39,.88),vector(-.12,.61,.80),vector(.17,.39,.90),vector(.43,.57,.73),vector(.69,.26,.66)];
  const edgePairs=[[0,2],[1,2],[2,3],[2,4],[3,5],[4,5],[4,6]];
  const reasoningCurves=edgePairs.map(([a,b])=>curveBetween(reasoningPoints[a],reasoningPoints[b]));
  const reasonLines=lineSegments(reasoningCurves,'#8294b0',.29);
  const reasonNodes=points(reasoningPoints.flatMap(p=>p.toArray()),reasoningPoints.flatMap(()=>palette[0].toArray()),reasoningPoints.map(()=>8),uniforms);
  const reasonPackets=points(reasoningCurves.flatMap(c=>c.v0.toArray()),reasoningCurves.flatMap(()=>new THREE.Color('#5e759b').toArray()),reasoningCurves.map(()=>9),uniforms);
  group.add(reasonLines,reasonNodes,reasonPackets);

  const safetyTargets=Array.from({length:9},(_,i)=>vector(-.67+i*.175,-.03+Math.sin(i*.34)*.055,.79+Math.sin(i*.42)*.13));
  const safetyOffsets=safetyTargets.map((_,i)=>vector(Math.sin(i*2.7)*.09,Math.cos(i*2.1)*.16,Math.sin(i*1.6)*.08));
  const safetyNodes=points(safetyTargets.flatMap(p=>p.toArray()),safetyTargets.flatMap(()=>palette[1].toArray()),safetyTargets.map(()=>8),uniforms);
  const safetyCurves=safetyTargets.slice(1).map((p,i)=>curveBetween(safetyTargets[i],p,0));
  const safetyLines=lineSegments(safetyCurves,'#8dacab',.22);
  group.add(safetyLines,safetyNodes);

  const sources=[vector(-.77,-.51,.58),vector(0,-.79,.63),vector(.78,-.48,.53)];
  const hub=vector(.04,-.28,.94);
  const modalCurves=sources.map((p,i)=>new THREE.QuadraticBezierCurve3(p,vector((p.x+hub.x)*.6,-.29-i*.045,.87),hub));
  const modalLines=lineSegments(modalCurves,'#95a6b7',.40);
  const modalColors=['#758bad','#9a8daf','#719b99'].map(color=>new THREE.Color(color));
  const modalLineColors=modalLines.geometry.attributes.color;
  modalColors.forEach((color,m)=>{for(let i=0;i<48;i++)modalLineColors.setXYZ(m*48+i,color.r,color.g,color.b);});
  const modalPositions=[],modalColorValues=[],modalSizes=[];
  for(let m=0;m<3;m++)for(let i=0;i<34;i++){
    const p=modalCurves[m].getPoint(i/34);modalPositions.push(...p.toArray());
    modalColorValues.push(...modalColors[m].toArray());modalSizes.push(i%7===0?6:3.5);
  }
  const modalParticles=points(modalPositions,modalColorValues,modalSizes,uniforms);
  const modalHub=points(hub.toArray(),new THREE.Color('#6c7e97').toArray(),[15],uniforms);
  group.add(modalLines,modalParticles,modalHub);
  return {group,reasoningPoints,reasoningCurves,reasonLines,reasonNodes,reasonPackets,safetyTargets,safetyOffsets,safetyNodes,safetyLines,modalCurves,modalParticles,modalHub};
}

export function mountRepresentation(root){
  if(instances.has(root))return instances.get(root);
  const panel=root.querySelector('.ct-representation-panel');
  const stage=panel?.querySelector('.ct-representation');
  if(!stage)return()=>{};
  const canvas=stage.querySelector('canvas'),toggle=panel.querySelector('.ct-motion-toggle');
  const labels=[...panel.querySelectorAll('.ct-interest')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  const compact=matchMedia('(max-width:760px)').matches;
  let renderer,scene,camera,brain,processes;
  let disposed=false,contextLost=false,renderFailed=false,frame=0,lastFrame=0,time=3.5;
  let userPaused=false,inView=true,targetX=0,targetY=0,pointerX=0,pointerY=0,focus=0;
  let stageWidth=1,stageHeight=1;
  const uniforms={uTime:{value:time},uDpr:{value:Math.min(devicePixelRatio||1,1.75)},uScale:{value:1},uViewportHeight:{value:500},uSafety:{value:0},uFocus:{value:0}};
  const projected=new THREE.Vector3(),scratchColor=new THREE.Color();
  const coral=new THREE.Color('#b67980'),teal=new THREE.Color('#648f92');
  const linePale=new THREE.Color('#cad3df'),lineInk=new THREE.Color('#7288a9');
  const state=()=>renderFailed||contextLost?'static':reduced.matches?'reduced':userPaused?'paused':document.hidden?'hidden':!inView?'offscreen':'running';

  function paint(dt=0){
    pointerX+=(targetX-pointerX)*(1-Math.exp(-dt*2.4));pointerY+=(targetY-pointerY)*(1-Math.exp(-dt*2.4));
    const reasoning=(time%15)/15, safety=(time%19)/19;
    const aligned=smooth((safety-.16)/.57);
    const safetyVisibility=Math.min(smooth(safety/.05),1-smooth((safety-.93)/.07));
    uniforms.uTime.value=time;uniforms.uSafety.value=aligned;
    uniforms.uFocus.value=focus;
    if(renderer&&!contextLost){
      brain.rotation.set(.31+Math.sin(time*.11)*.065+pointerY*.07,-.65+Math.sin(time*.14)*.30+pointerX*.13,-.10+Math.sin(time*.085)*.025);
      brain.position.y=Math.sin(time*.16)*.009;
      const lineColors=processes.reasonLines.geometry.attributes.color;
      const packetPositions=processes.reasonPackets.geometry.attributes.position;
      const packetOpacity=processes.reasonPackets.geometry.attributes.aOpacity;
      processes.reasoningCurves.forEach((curve,i)=>{
        const build=smooth((reasoning*1.7-i*.08)/.2);
        const dissolve=1-smooth((reasoning-.9)/.1);
        scratchColor.copy(linePale).lerp(lineInk,build*dissolve);
        for(let j=0;j<48;j++)lineColors.setXYZ(i*48+j,scratchColor.r,scratchColor.g,scratchColor.b);
        curve.getPoint((time*.3-i*.1+2)%1,projected);
        packetPositions.setXYZ(i,projected.x,projected.y,projected.z);packetOpacity.setX(i,build*dissolve*.85);
      });
      lineColors.needsUpdate=packetPositions.needsUpdate=packetOpacity.needsUpdate=true;
      const reasonOpacity=processes.reasonNodes.geometry.attributes.aOpacity;
      processes.reasoningPoints.forEach((_,i)=>reasonOpacity.setX(i,.30+.65*smooth((reasoning*1.7-i*.08)/.18)));
      reasonOpacity.needsUpdate=true;
      const safetyPosition=processes.safetyNodes.geometry.attributes.position;
      const safetyColor=processes.safetyNodes.geometry.attributes.color;
      const safetyOpacity=processes.safetyNodes.geometry.attributes.aOpacity;
      processes.safetyTargets.forEach((target,i)=>{
        const converge=smooth(clamp(aligned*1.2-i*.026));
        projected.copy(target).addScaledVector(processes.safetyOffsets[i],1-converge);
        safetyPosition.setXYZ(i,projected.x,projected.y,projected.z);
        scratchColor.copy(coral).lerp(teal,converge);
        safetyColor.setXYZ(i,scratchColor.r,scratchColor.g,scratchColor.b);safetyOpacity.setX(i,safetyVisibility*.95);
      });
      safetyPosition.needsUpdate=safetyColor.needsUpdate=safetyOpacity.needsUpdate=true;
      processes.safetyLines.material.opacity=.04+aligned*safetyVisibility*.23;
      const modalPosition=processes.modalParticles.geometry.attributes.position;
      const modalOpacity=processes.modalParticles.geometry.attributes.aOpacity;
      processes.modalCurves.forEach((curve,m)=>{
        for(let i=0;i<34;i++){
          const t=(time*.085+i/34)%1;
          curve.getPoint(t,projected);
          const spread=(1-t)*.025;
          projected.x+=Math.sin(i*2.7+time*.15)*spread;
          projected.y+=Math.cos(i*1.8)*spread;
          modalPosition.setXYZ(m*34+i,projected.x,projected.y,projected.z);
          modalOpacity.setX(m*34+i,(.3+Math.sin(t*Math.PI)*.55)*(i%7===0?1:.65));
        }
      });
      modalPosition.needsUpdate=modalOpacity.needsUpdate=true;
      renderer.render(scene,camera);

    }
    stage.dataset.phase=time.toFixed(3);
  }
  function resize(){
    const bounds=stage.getBoundingClientRect();
    stageWidth=bounds.width;stageHeight=bounds.height;
    uniforms.uViewportHeight.value=stageHeight*uniforms.uDpr.value;
    if(renderer&&!contextLost){
      renderer.setSize(stageWidth,stageHeight,false);camera.aspect=stageWidth/stageHeight;
      const visibleHeight=Math.max(2.78,3.04/camera.aspect);
      camera.position.z=visibleHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
      camera.updateProjectionMatrix();uniforms.uScale.value=clamp(stageWidth/700,.78,1.12);
    }
    paint();
  }
  function tick(now){
    frame=0;if(disposed||state()!=='running')return;
    if(!lastFrame)lastFrame=now;
    const delta=now-lastFrame;
    if(delta>=1000/30-.6){const dt=Math.min(delta,80)/1000;time+=dt;lastFrame=now;paint(dt);}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    if(disposed)return;
    cancelAnimationFrame(frame);frame=lastFrame=0;panel.dataset.motionState=state();
    if(toggle){
      const paused=userPaused||reduced.matches;
      toggle.disabled=reduced.matches;toggle.dataset.paused=String(paused);toggle.setAttribute('aria-pressed',String(paused));
      toggle.setAttribute('aria-label',reduced.matches?'Particle motion disabled by reduced motion preference':userPaused?'Play particle animation':'Pause particle animation');
      toggle.querySelector('.ct-motion-text').textContent=reduced.matches?'Motion reduced':userPaused?'Play motion':'Pause motion';
    }
    if(reduced.matches){time=7;pointerX=pointerY=targetX=targetY=0;}
    paint();if(state()==='running')frame=requestAnimationFrame(tick);
  }
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});
    renderer.setPixelRatio(uniforms.uDpr.value);renderer.setClearColor(0xffffff,0);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.1,30);camera.position.set(0,0,5);camera.lookAt(0,0,0);
    brain=new THREE.Group();scene.add(brain);brain.add(createNeuralField({compact,uniforms}));
    processes=createProcesses(uniforms);brain.add(processes.group);
    resize();stage.classList.add('is-webgl-ready');panel.dataset.renderer='webgl';
  }catch{
    scene?.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});renderer?.dispose();renderer=null;renderFailed=true;canvas.hidden=true;panel.dataset.renderer='static';
  }
  const onPause=()=>{userPaused=!userPaused;sync();};
  const onPointerMove=event=>{
    if(event.pointerType!=='mouse'||!finePointer.matches||state()!=='running')return;
    const bounds=stage.getBoundingClientRect();targetX=clamp((event.clientX-bounds.left)/bounds.width*2-1,-1,1);targetY=clamp((event.clientY-bounds.top)/bounds.height*2-1,-1,1);
    const label=event.target.closest('.ct-interest');focus=label?MODES.indexOf(label.dataset.researchFocus)+1:0;
  };
  const onPointerLeave=()=>{targetX=targetY=focus=0;};
  const onContextLost=event=>{event.preventDefault();contextLost=true;stage.classList.remove('is-webgl-ready');panel.dataset.renderer='static';sync();};
  const onContextRestored=()=>{contextLost=false;stage.classList.add('is-webgl-ready');panel.dataset.renderer='webgl';resize();sync();};
  panel.addEventListener('pointermove',onPointerMove,{passive:true});panel.addEventListener('pointerleave',onPointerLeave,{passive:true});toggle?.addEventListener('click',onPause);
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);canvas.addEventListener('webglcontextlost',onContextLost);canvas.addEventListener('webglcontextrestored',onContextRestored);
  const intersection=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();});intersection.observe(panel);
  const observer=new ResizeObserver(resize);observer.observe(stage);observer.observe(panel);
  labels.forEach(label=>observer.observe(label));document.fonts?.ready.then(()=>{if(!disposed)resize();});
  resize();sync();root.dataset.representationMounted='true';
  const dispose=()=>{
    disposed=true;cancelAnimationFrame(frame);intersection.disconnect();observer.disconnect();
    panel.removeEventListener('pointermove',onPointerMove);panel.removeEventListener('pointerleave',onPointerLeave);toggle?.removeEventListener('click',onPause);
    reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);canvas.removeEventListener('webglcontextlost',onContextLost);canvas.removeEventListener('webglcontextrestored',onContextRestored);
    scene?.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});renderer?.dispose();delete root.dataset.representationMounted;instances.delete(root);
  };
  instances.set(root,dispose);return dispose;
}
