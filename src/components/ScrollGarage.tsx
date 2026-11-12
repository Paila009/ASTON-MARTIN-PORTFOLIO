'use client';

import { publicPath } from '@/lib/public-path';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import './scroll-garage.css';

const ScrollScene = dynamic(() => import('./GarageScene'), { ssr: false, loading: () => null });
const noAction = () => {};
const stillCommand = { sequence: 0, action: 'in' as const };
const chapters = [
  { number: '01', label: 'SHAPED BY THE INVISIBLE', title: 'THE AIR.', copy: 'Before the corner. Before the braking point. The first challenge is a force you cannot see.' },
  { number: '02', label: 'EVERY SURFACE HAS A PURPOSE', title: 'THE EDGE.', copy: 'A wing. A floor. A fraction of a millimetre. Thousands of decisions, working as one.' },
  { number: '03', label: 'NEVER FINISHED. ALWAYS FORWARD.', title: 'THE PURSUIT.', copy: 'The view changes. The obsession stays. Step inside the studio and discover the thinking beneath the bodywork.' },
];
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export default function ScrollGarage() {
  const section = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const immersive = supported === true && !failed && !reduced;
  const sceneAvailable = near && supported === true && !failed;
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { setFailed(true); setReady(false); }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(preference.matches || document.documentElement.dataset.motion === 'reduced' || document.documentElement.dataset.hero === 'paused');
    updateMotion(); preference.addEventListener('change', updateMotion); window.addEventListener('pursuit-motion', updateMotion);
    const attributes = new MutationObserver(updateMotion);
    attributes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion', 'data-hero'] });
    return () => { preference.removeEventListener('change', updateMotion); window.removeEventListener('pursuit-motion', updateMotion); attributes.disconnect(); };
  }, []);

  useEffect(() => {
    let intersects = false;
    const updateVisibility = () => setVisible(intersects && !document.hidden);
    const proximity = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNear(true); }, { rootMargin: '600px 0px' });
    const viewport = new IntersectionObserver(([entry]) => { intersects = entry.isIntersecting; updateVisibility(); }, { threshold: 0 });
    if (section.current) { proximity.observe(section.current); viewport.observe(section.current); }
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { proximity.disconnect(); viewport.disconnect(); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);

  useEffect(() => {
    if (!near) return;
    try { const canvas = document.createElement('canvas'); const gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); setSupported(!!gl); gl?.getExtension('WEBGL_lose_context')?.loseContext(); }
    catch { setSupported(false); }
  }, [near]);

  useEffect(() => {
    if (!immersive) { setProgress(0); return; }
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!section.current) return;
      const rectangle = section.current.getBoundingClientRect();
      setProgress(clamp(-rectangle.top / Math.max(1, rectangle.height - window.innerHeight)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure(); window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [immersive]);

  const chapterStyle = (index: number): CSSProperties | undefined => {
    if (!immersive) return undefined;
    const incoming = index === 0 ? 1 : clamp((progress - (index === 1 ? .21 : .64)) / .18);
    const outgoing = index === 2 ? 0 : clamp((progress - (index === 0 ? .17 : .57)) / .19);
    return { opacity: Math.min(incoming, 1 - outgoing), transform: `translate3d(${(1 - incoming) * 72 - outgoing * 90}vw,${(1 - incoming) * 35 - outgoing * 20}px,0)` };
  };
  const current = progress < .34 ? 0 : progress < .74 ? 1 : 2;

  return <section id="machine" ref={section} className={`scroll-garage${immersive ? ' scroll-garage--immersive' : ''}${ready && !failed ? ' scroll-garage--ready' : ''}`} data-progress={progress.toFixed(4)} data-scene={failed || supported === false ? 'fallback' : ready ? 'ready' : 'loading'} data-motion={reduced ? 'reduced' : 'full'} aria-label="The machine: a three-dimensional engineering journey">
    <div className="scroll-garage-stage">
      <img className="scroll-garage-poster" src={publicPath('/images/amr26-studio.jpg')} alt="Official studio photograph of the Aston Martin AMR26" width="2000" height="1333" loading="lazy"/>
      {sceneAvailable && <div className="scroll-garage-canvas" aria-hidden="true"><ScrollScene view="three-quarter" selectedHotspot={null} autoRotate={false} airflow={false} visible={visible} reducedMotion={reduced} command={stillCommand} resetKey={0} onSelect={noAction} onInteract={noAction} onReady={onReady} onError={onError} scrollProgress={reduced ? .36 : progress}/></div>}
      <div className="scroll-garage-shade"/>
      <div className="scroll-garage-topline"><span><i/> THE MACHINE / IN THREE DIMENSIONS</span><span>ASTON MARTIN · THE PURSUIT</span></div>
      <div className="scroll-garage-outline" aria-hidden="true" style={immersive ? { transform: `translate3d(${(progress - .5) * -16}vw,0,0)` } : undefined}>FORM / FUNCTION</div>
      <div className="scroll-garage-stories">{chapters.map((chapter, index) => <article className="scroll-garage-story" key={chapter.number} style={chapterStyle(index)}><div className="scroll-garage-kicker"><span>{chapter.number} / 03</span>{chapter.label}</div><h2>{chapter.title}</h2><p>{chapter.copy}</p></article>)}</div>
      <div className="scroll-garage-rail" aria-hidden="true"><div className="scroll-garage-rail-numbers">{chapters.map((chapter,index) => <span className={current === index ? 'is-current' : ''} key={chapter.number}>{chapter.number}</span>)}</div><div className="scroll-garage-rail-track"><i style={{ transform: `scaleX(${immersive ? progress : 1})` }}/></div><span><ArrowDown size={12}/>{immersive ? 'YOUR SCROLL. YOUR PERSPECTIVE.' : 'FORM. FUNCTION. FEELING.'}</span></div>
      <div className="scroll-garage-links"><Link href="/garage">Enter the 3D garage <ArrowUpRight size={19}/></Link><Link href="/cars/amr26">Discover the AMR26 <ArrowUpRight size={16}/></Link><a href="https://www.astonmartinf1.com/en-GB/news/announcement/aston-martin-aramco-launches-season-with-livery-reveal" target="_blank" rel="noreferrer">Official AMR26 story <ArrowUpRight size={13}/></a></div>
      <div className="scroll-garage-caption"><span>3D: illustrative study model · not a chassis-accurate AMR26 model.</span><span>Poster: Aston Martin Aramco Formula One Team.</span></div>
    </div>
  </section>;
}
