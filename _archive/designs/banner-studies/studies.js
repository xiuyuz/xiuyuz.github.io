import {distributions as first} from './particle-distributions-a.js';
import {distributions as second} from './particle-distributions-b.js';
import {createParticleStudy} from './particle-material.js?v=finish-6';

const shortlist=new Set([1,4,7,9]);
// More fine grains and closer framing give the shortlisted clouds more presence.
// Gallery and phone budgets remain smaller than the full desktop artwork.
const refinedRendering={
  desktopCount:84000,mobileCount:36000,previewCount:21000,
  desktopScale:1.24,mobileScale:1.12,previewScale:1.18,
  desktopGrain:.82,mobileGrain:.90,previewGrain:.90
};
export const studies=[...first,...second].sort((a,b)=>a.id-b.id).map(distribution=>{
  const study={...distribution,particles:true,rendering:shortlist.has(distribution.id)?refinedRendering:null};
  return{...study,build:THREE=>createParticleStudy(THREE,study)};
});
export const number=id=>String(id).padStart(2,'0');
