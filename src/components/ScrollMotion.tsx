'use client';

import {useEffect} from 'react';
import './scroll-motion.css';

const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));

/** Scroll-linked presentation only. Native document scrolling stays in control. */
export default function ScrollMotion(){
 useEffect(()=>{
  const root=document.documentElement;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero=document.querySelector<HTMLElement>('.hero');
  const marquee=document.querySelector<HTMLElement>('.speed-marquee');
  const driverCards=[...document.querySelectorAll<HTMLElement>('.driver-feature')];
  const depthItems=[...document.querySelectorAll<HTMLElement>('[data-depth]')];
  const targets=[...document.querySelectorAll<HTMLElement>('.people-section .section-heading,.race-preview .section-heading,.race-preview-grid,.heritage-copy,.stories-section .section-heading,.story-card,.fan-banner>div,.factory-copy')];
  targets.forEach((el,index)=>{el.classList.add('motion-reveal');el.style.setProperty('--reveal-delay',`${(index%3)*80}ms`)});
  let disabled=false,frame=0,lastY=window.scrollY,velocity=0,pointerX=0,pointerY=0,lastPaint=0;
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}})},{threshold:.08,rootMargin:'0px 0px -20px 0px'});
  targets.forEach(el=>observer.observe(el));
  function reset(){
   hero?.removeAttribute('style');marquee?.removeAttribute('style');
   driverCards.forEach(el=>['--card-slide','--card-rise','--card-turn','--card-scale','--card-opacity'].forEach(key=>el.style.removeProperty(key)));
   depthItems.forEach(el=>['--depth-shift','--depth-turn'].forEach(key=>el.style.removeProperty(key)));
   root.style.removeProperty('--page-progress');
  }
  function paint(time:number){
   frame=0;if(disabled||document.hidden)return;
   const y=window.scrollY,h=window.innerHeight,w=window.innerWidth;
   velocity+=(clamp((y-lastY)/Math.max(1,time-lastPaint)*2,-8,8)-velocity)*.25;
   lastY=y;lastPaint=time;
   root.style.setProperty('--page-progress',String(clamp(y/Math.max(1,root.scrollHeight-h))));
   if(hero){const bounds=hero.getBoundingClientRect();const p=clamp(-bounds.top/Math.max(1,bounds.height));hero.style.setProperty('--hero-progress',p.toFixed(4));hero.style.setProperty('--hero-lift',`${p*(w<640?80:160)}px`);hero.style.setProperty('--hero-scale',String(1+p*.2));hero.style.setProperty('--hero-turn',`${p*-3}deg`);hero.style.setProperty('--hero-title-first',`${-p*(w<640?90:210)}px`);hero.style.setProperty('--hero-title-last',`${p*(w<640?60:150)}px`);hero.style.setProperty('--pointer-x',`${pointerX*12}px`);hero.style.setProperty('--pointer-y',`${pointerY*8}px`);hero.style.setProperty('--pointer-turn',`${pointerX*.7}deg`)}
   if(marquee){const bounds=marquee.getBoundingClientRect();if(bounds.top<h+300&&bounds.bottom>-300){const p=clamp((h-bounds.top)/(h+bounds.height));marquee.style.setProperty('--marquee-x',`${-p*(w<640?280:650)}px`);marquee.style.setProperty('--marquee-skew',`${velocity*.35}deg`)}}
   driverCards.forEach((el,index)=>{const bounds=el.getBoundingClientRect();if(bounds.top>h+200||bounds.bottom<-200)return;const entry=clamp((h-bounds.top)/(h*.7));const side=index%2===0?-1:1;el.style.setProperty('--card-slide',`${side*(1-entry)*(w<640?42:120)}px`);el.style.setProperty('--card-rise',`${(1-entry)*75}px`);el.style.setProperty('--card-turn',`${side*(1-entry)*13}deg`);el.style.setProperty('--card-scale',String(.94+entry*.06));el.style.setProperty('--card-opacity',String(.25+entry*.75))});
   depthItems.forEach(el=>{const bounds=el.getBoundingClientRect();if(bounds.top>h+250||bounds.bottom<-250)return;const p=clamp((h-bounds.top)/(h+bounds.height));const intensity=Number(el.dataset.depth)||60;el.style.setProperty('--depth-shift',`${(.5-p)*intensity}px`);el.style.setProperty('--depth-turn',`${(.5-p)*5}deg`)});
  }
  function schedule(){if(!disabled&&!frame)frame=requestAnimationFrame(paint)}
  function updatePreference(){disabled=preference.matches||root.dataset.motion==='reduced'||root.dataset.hero==='paused';root.dataset.scrollEffects=disabled?'reduced':'active';if(disabled){cancelAnimationFrame(frame);frame=0;reset();targets.forEach(el=>el.classList.add('is-visible'))}else schedule()}
  function pointer(event:PointerEvent){if(disabled||event.pointerType!=='mouse'||!hero)return;const rect=hero.getBoundingClientRect();if(rect.bottom<0)return;pointerX=clamp(event.clientX/window.innerWidth*2-1,-1,1);pointerY=clamp((event.clientY-rect.top)/rect.height*2-1,-1,1);schedule()}
  function pointerLeave(){pointerX=0;pointerY=0;schedule()}
  const preferenceObserver=new MutationObserver(updatePreference);preferenceObserver.observe(root,{attributes:true,attributeFilter:['data-motion','data-hero']});
  preference.addEventListener('change',updatePreference);window.addEventListener('pursuit-motion',updatePreference);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('pointermove',pointer,{passive:true});document.addEventListener('pointerleave',pointerLeave);document.addEventListener('visibilitychange',schedule);
  updatePreference();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();preferenceObserver.disconnect();preference.removeEventListener('change',updatePreference);window.removeEventListener('pursuit-motion',updatePreference);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('pointermove',pointer);document.removeEventListener('pointerleave',pointerLeave);document.removeEventListener('visibilitychange',schedule);delete root.dataset.scrollEffects;reset();targets.forEach(el=>{el.classList.remove('motion-reveal','is-visible');el.style.removeProperty('--reveal-delay')})};
 },[]);
 return <div className="scroll-progress" aria-hidden="true"><span/></div>;
}

export function PursuitMarquee(){return <div className="speed-marquee" aria-hidden="true"><div className="speed-marquee-track">{[0,1,2,3].map(n=><span key={n}>EVERY CURVE.<i>✳</i>EVERY THOUSANDTH.<i>↗</i></span>)}</div><div className="speed-marquee-caption"><span>THE PURSUIT / ALWAYS IN MOTION</span><span>SCROLL TO FEEL THE DIFFERENCE ↓</span></div></div>}
