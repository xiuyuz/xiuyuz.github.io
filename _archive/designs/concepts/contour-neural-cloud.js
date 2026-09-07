import * as THREE from '../vendor/three/three.module.min.js';

// A granular sculpture with actual depth: the fragment shader renders tiny
// shaded spheres, writes their curved depth, and occludes the particles behind.
// Broad surface lighting describes the whole volume; grain lighting stays quiet.
const TAU=Math.PI*2;
function random(seed=31991){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function surface(theta,phi,side){
  const sin=Math.sin(phi),nx=Math.abs(sin*Math.cos(theta)),ny=Math.cos(phi),nz=sin*Math.sin(theta);
  const fold=Math.sin(ny*10.4+1.7*Math.sin(nz*4.2+nx*3.1)+side*.4);
  const ripple=Math.sin(nx*10.2+nz*5.4+1.2*Math.cos(ny*4.8));
  const r=1+.046*fold+.018*ripple;
  const taper=.94+.06*Math.tanh((ny+.4)*2);
  const fissure=Math.exp(-Math.pow(nx/.10,2));
  return new THREE.Vector3(
    side*(.075+nx*1.14*taper)*r,
    (ny*.98+.045*nz+side*.012)*r,
    nz*.96*r-fissure*.14*Math.max(0,nz)*(1-ny*ny)
  );
}
const vertexShader=`
  attribute vec3 aNormal;
  attribute float aRadius;
  attribute float aShell;
  attribute float aPhase;
  attribute float aSafety;
  uniform float uTime;
  uniform float uViewportHeight;
  uniform float uSafety;
  uniform float uFocus;
  varying vec3 vViewCenter;
  varying vec3 vMacroNormal;
  varying vec3 vPosition;
  varying float vRadius;
  varying float vShell;
  varying float vSafety;
  void main(){
    vec3 p=position;
    float offset=sin(uTime*.25+aPhase)*.003;
    float stray=aSafety*(1.0-uSafety);
    p+=aNormal*offset;
    p+=vec3(sin(aPhase*2.0),cos(aPhase),sin(aPhase))*stray*.018;
    vec4 view=modelViewMatrix*vec4(p,1.0);
    vViewCenter=view.xyz;vMacroNormal=normalize(normalMatrix*aNormal);
    vPosition=p;vRadius=aRadius;vShell=aShell;vSafety=aSafety;
    gl_Position=projectionMatrix*view;
    gl_PointSize=max(1.0,aRadius*uViewportHeight*projectionMatrix[1][1]/(-view.z));
  }
`;
const fragmentShader=`
  uniform mat4 projectionMatrix;
  uniform float uSafety;
  uniform float uFocus;
  varying vec3 vViewCenter;
  varying vec3 vMacroNormal;
  varying vec3 vPosition;
  varying float vRadius;
  varying float vShell;
  varying float vSafety;
  void main(){
    vec2 q=(gl_PointCoord-.5)*2.0;
    float d=dot(q,q);
    if(d>1.0)discard;
    vec3 grain=vec3(q.x,-q.y,sqrt(1.0-d));
    vec3 light=normalize(vec3(-.65,.85,1.3));
    vec3 macro=normalize(vMacroNormal);
    float diffuse=max(0.0,dot(macro,light));
    float fill=max(0.0,dot(macro,normalize(vec3(.85,.3,.45))));
    float grainLight=.82+.18*max(0.0,dot(grain,light));
    float illumination=clamp(.18+diffuse*.69+fill*.12,0.0,1.0)*grainLight;
    vec3 ink=mix(vec3(.245,.31,.40),vec3(.78,.82,.88),pow(illumination,.84));
    // Upper planes catch light; the receding, lower-right volume stays deeper.
    ink=mix(ink,vec3(.30,.37,.48),(.5-.5*vShell)*.38);
    float modality=1.0-smoothstep(-.45,-.18,vPosition.y);
    vec3 modal=mix(vec3(.49,.59,.73),vec3(.66,.58,.75),smoothstep(-.8,.1,vPosition.x));
    modal=mix(modal,vec3(.43,.65,.63),smoothstep(.1,.85,vPosition.x));
    ink=mix(ink,modal,modality*.12);
    vec3 aligned=mix(vec3(.66,.39,.43),vec3(.39,.59,.60),uSafety);
    ink=mix(ink,aligned,vSafety*.65);
    float top=smoothstep(.15,.38,vPosition.y);
    float middle=1.0-smoothstep(.12,.3,abs(vPosition.y));
    float bottom=1.0-smoothstep(-.4,-.15,vPosition.y);
    float selected=(1.0-step(.5,abs(uFocus-1.0)))*top
      +(1.0-step(.5,abs(uFocus-2.0)))*middle
      +(1.0-step(.5,abs(uFocus-3.0)))*bottom;
    ink=mix(ink,vec3(.39,.49,.65),selected*.14);
    vec4 clip=projectionMatrix*vec4(vViewCenter+grain*vRadius,1.0);
    gl_FragDepth=(clip.z/clip.w)*.5+.5;
    gl_FragColor=vec4(ink,1.0);
  }
`;
export function createNeuralField({compact=false,uniforms}){
  const rand=random(),count=compact?22000:44000;
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3);
  const radii=new Float32Array(count),shells=new Float32Array(count),phases=new Float32Array(count),safety=new Float32Array(count);
  const normal=new THREE.Vector3(),du=new THREE.Vector3(),dv=new THREE.Vector3();
  for(let i=0;i<count;i++){
    const theta=rand()*TAU,phi=Math.acos(2*rand()-1),side=rand()>.5?1:-1;
    const p=surface(theta,phi,side),shell=rand()>.10;
    du.copy(surface(theta+.002,phi,side)).sub(surface(theta-.002,phi,side));
    dv.copy(surface(theta,phi+.002,side)).sub(surface(theta,phi-.002,side));
    normal.crossVectors(du,dv).normalize();if(normal.dot(p)<0)normal.negate();
    const depth=shell?.993+rand()*.013:.76+rand()*.20;
    p.multiplyScalar(depth);positions.set(p.toArray(),i*3);normals.set(normal.toArray(),i*3);
    radii[i]=(compact?.0087:.0062)+Math.pow(rand(),3)*(compact?.0043:.0035);
    shells[i]=shell?1:0;phases[i]=rand()*TAU;
    safety[i]=p.x>.18&&Math.abs(p.y)<.18&&p.z>.35&&rand()>.94?.55+rand()*.45:0;
  }
  const geometry=new THREE.BufferGeometry();
  for(const[name,array,size]of[['position',positions,3],['aNormal',normals,3],['aRadius',radii,1],['aShell',shells,1],['aPhase',phases,1],['aSafety',safety,1]])geometry.setAttribute(name,new THREE.BufferAttribute(array,size));
  geometry.computeBoundingSphere();
  const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:false,depthWrite:true,depthTest:true,toneMapped:false});
  const field=new THREE.Points(geometry,material);field.name='volumetric-neural-field';return field;
}
