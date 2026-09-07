import {data} from '../data.js';
import {concepts} from '../concepts/elegant-a.js?v=dark-assets-8';
import {studies,number} from './studies.js?v=finish-6';
import {mountStudyPage} from './study-page.js?v=dark-assets-8';

const params=new URLSearchParams(location.search);
const study=studies.find(item=>item.id===Number(params.get('study')||1))||studies[0];
const root=document.querySelector('#design-root');
root.innerHTML=concepts['21'].render(data);
document.title=`${number(study.id)} · ${study.title} — XiuYu Zhang`;
document.querySelector('#study-number').textContent=`${number(study.id)} / 10`;
document.querySelector('#study-title').textContent=study.title;
document.querySelector('#study-prev').href=`?study=${number(study.id===1?10:study.id-1)}`;
document.querySelector('#study-next').href=`?study=${number(study.id===10?1:study.id+1)}`;
if(params.has('capture'))document.documentElement.classList.add('capture');
await mountStudyPage(root,study);
window.designReady=true;
if(location.hash)document.querySelector(location.hash)?.scrollIntoView({behavior:'instant'});
