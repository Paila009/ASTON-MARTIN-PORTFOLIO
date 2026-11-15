'use client';

import { publicPath } from '@/lib/public-path';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Box, Grid3X3, Hand, Minus, MousePointer2, Plus, RotateCcw, SlidersHorizontal, Wind } from 'lucide-react';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import type { GarageCommand, GarageInspection, GarageLighting, GarageView } from './Garage';
import './scroll-garage.css';

const ScrollScene = dynamic(() => import('./GarageScene'), { ssr: false, loading: () => null });
const noAction = () => {};
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
  const [manual, setManual] = useState(false);
  const [view, setView] = useState<GarageView>('three-quarter');
  const [command, setCommand] = useState<GarageCommand>({ sequence: 0, action: 'in' });
  const [resetKey, setResetKey] = useState(0);
  const [airflow, setAirflow] = useState(false);
  const [inspection, setInspection] = useState<GarageInspection>('solid');
  const [lighting, setLighting] = useState<GarageLighting>('green');
  const immersive = supported === true && !failed && !reduced;
  const sceneAvailable = near && supported === true && !failed;
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { setFailed(true); setReady(false); }, []);
  const act = (action: GarageCommand['action']) => setCommand((previous) => ({ sequence: previous.sequence + 1, action }));
  const chooseView = (next: GarageView) => { setView(next); setResetKey((previous) => previous + 1); };
  const toggleControl = () => { setManual((previous) => !previous); setCommand({ sequence: 0, action: 'in' }); };
  const reset = () => { chooseView('three-quarter'); setAirflow(false); setInspection('solid'); setLighting('green'); };

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

  return <section id="machine" ref={section} className={`scroll-garage${immersive ? ' scroll-garage--immersive' : ''}${ready && !failed ? ' scroll-garage--ready' : ''}${manual ? ' scroll-garage--manual' : ''}`} data-progress={progress.toFixed(4)} data-scene={failed || supported === false ? 'fallback' : ready ? 'ready' : 'loading'} data-motion={reduced ? 'reduced' : 'full'} data-control={manual ? 'manual' : 'scroll'} data-inspection={inspection} data-lighting={lighting} aria-label="The machine: a three-dimensional engineering journey">
    <div className="scroll-garage-stage">
      <img className="scroll-garage-poster" src={publicPath('/images/amr26-studio.jpg')} alt="Official studio photograph of the Aston Martin AMR26" width="2000" height="1333" loading="lazy"/>
      {sceneAvailable && <div className="scroll-garage-canvas" aria-hidden={!manual} role={manual ? 'region' : undefined} aria-label={manual ? 'Interactive Formula car. Drag to rotate, pinch or scroll to zoom. Arrow keys rotate, plus and minus zoom.' : undefined} tabIndex={manual ? 0 : -1} onKeyDown={(event) => {
        if (!manual || event.target !== event.currentTarget && (event.target as HTMLElement).tagName !== 'CANVAS') return;
        if (event.key === 'Escape') { setManual(false); setCommand({ sequence: 0, action: 'in' }); return; }
        const actions: Record<string, GarageCommand['action']> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out' };
        if (actions[event.key]) { event.preventDefault(); act(actions[event.key]); }
      }}><ScrollScene view={view} selectedHotspot={null} autoRotate={false} airflow={airflow && manual} visible={visible} reducedMotion={reduced} command={command} resetKey={resetKey} inspection={inspection} lighting={lighting} manualControl={manual} onSelect={noAction} onInteract={noAction} onReady={onReady} onError={onError} scrollProgress={reduced ? .36 : progress}/></div>}
      <div className="scroll-garage-shade"/>
      <div className="scroll-garage-topline"><span><i/> THE MACHINE / IN THREE DIMENSIONS</span><span>ASTON MARTIN · THE PURSUIT</span></div>
      <div className="scroll-garage-control-switch"><button type="button" aria-pressed={manual} onClick={toggleControl} disabled={!ready || failed} aria-label={manual ? 'Follow scroll' : 'Take control'}>{manual ? <ArrowDown size={14}/> : <Hand size={14}/>}<span>{failed || supported === false ? '3D unavailable' : !ready ? 'Preparing the studio' : manual ? 'Follow scroll' : 'Take control'}</span><i>{manual ? 'AUTO' : '3D'}</i></button><span aria-live="polite">{ready && !failed ? manual ? 'YOU HAVE THE CAMERA.' : 'A LIVE 3D STUDY. YOUR MOVE.' : 'THE STUDY IS LOADING.'}</span></div>
      <div className="scroll-garage-outline" aria-hidden="true" style={immersive ? { transform: `translate3d(${(progress - .5) * -16}vw,0,0)` } : undefined}>FORM / FUNCTION</div>
      <div className="scroll-garage-stories" aria-hidden={manual}>{chapters.map((chapter, index) => <article className="scroll-garage-story" key={chapter.number} style={chapterStyle(index)}><div className="scroll-garage-kicker"><span>{chapter.number} / 03</span>{chapter.label}</div><h2>{chapter.title}</h2><p>{chapter.copy}</p></article>)}</div>
      {manual && <><div className="scroll-garage-manual-title"><span>THE CAMERA IS YOURS.</span><h2>GO OFF<br/><em>SCRIPT.</em></h2><p><MousePointer2 size={12}/> Drag to rotate. Pinch or scroll to zoom.</p></div><div className="scroll-garage-console" aria-label="Live 3D study controls"><div className="scroll-garage-console-head"><SlidersHorizontal size={12}/><span>YOUR STUDIO</span><span>LIVE / 3D</span></div><div className="scroll-garage-console-views" role="group" aria-label="Home car viewpoints">{([{ id: 'three-quarter', label: 'Overview' }, { id: 'front', label: 'Front' }, { id: 'side', label: 'Side' }, { id: 'rear', label: 'Rear' }, { id: 'overhead', label: 'Top' }, { id: 'cockpit', label: 'Cockpit' }] as const).map((preset) => <button type="button" key={preset.id} aria-label={`Home car ${preset.label.toLowerCase()} view`} aria-pressed={view === preset.id} onClick={() => chooseView(preset.id)}>{preset.label}</button>)}</div><div className="scroll-garage-console-camera" role="group" aria-label="Home camera controls"><button type="button" onClick={() => act('left')} aria-label="Home camera rotate left"><ArrowLeft size={14}/></button><button type="button" onClick={() => act('right')} aria-label="Home camera rotate right"><ArrowRight size={14}/></button><button type="button" onClick={() => act('up')} aria-label="Home camera rotate up"><ArrowUp size={14}/></button><button type="button" onClick={() => act('down')} aria-label="Home camera rotate down"><ArrowDown size={14}/></button><button type="button" onClick={() => act('out')} aria-label="Home camera zoom out"><Minus size={14}/></button><button type="button" onClick={() => act('in')} aria-label="Home camera zoom in"><Plus size={14}/></button></div><div className="scroll-garage-console-surfaces" role="group" aria-label="Home model rendering"><button type="button" aria-label="Home solid surfaces" aria-pressed={inspection === 'solid'} onClick={() => setInspection('solid')}><Box size={12}/>Surfaces</button><button type="button" aria-label="Home wireframe study" aria-pressed={inspection === 'wireframe'} onClick={() => setInspection('wireframe')}><Grid3X3 size={12}/>Mesh</button><button type="button" aria-label="Home conceptual airflow" aria-pressed={airflow} onClick={() => setAirflow((previous) => !previous)}><Wind size={12}/>Airflow</button></div><div className="scroll-garage-console-lights" role="group" aria-label="Home studio lighting"><span>LIGHT</span>{(['green', 'lime', 'white'] as const).map((preset) => <button type="button" key={preset} aria-label={`Home ${preset} studio lighting`} aria-pressed={lighting === preset} onClick={() => setLighting(preset)}><i className={`scroll-garage-light--${preset}`}/>{preset}</button>)}</div><div className="scroll-garage-console-foot"><span>{airflow ? 'ILLUSTRATION · NOT CFD' : inspection === 'wireframe' ? 'ILLUSTRATIVE STUDY MESH' : 'DRAG THE CAR TO EXPLORE'}</span><button type="button" onClick={reset} aria-label="Reset home 3D study"><RotateCcw size={11}/>Reset</button></div></div></>}
      <div className="scroll-garage-rail" aria-hidden="true"><div className="scroll-garage-rail-numbers">{chapters.map((chapter,index) => <span className={current === index ? 'is-current' : ''} key={chapter.number}>{chapter.number}</span>)}</div><div className="scroll-garage-rail-track"><i style={{ transform: `scaleX(${immersive ? progress : 1})` }}/></div><span><ArrowDown size={12}/>{immersive ? 'YOUR SCROLL. YOUR PERSPECTIVE.' : 'FORM. FUNCTION. FEELING.'}</span></div>
      <div className="scroll-garage-links"><Link href="/garage">Enter the 3D garage <ArrowUpRight size={19}/></Link><Link href="/cars/amr26">Discover the AMR26 <ArrowUpRight size={16}/></Link><a href="https://www.astonmartinf1.com/en-GB/news/announcement/aston-martin-aramco-launches-season-with-livery-reveal" target="_blank" rel="noreferrer">Official AMR26 story <ArrowUpRight size={13}/></a></div>
      <div className="scroll-garage-caption"><span>3D: illustrative study model · not a chassis-accurate AMR26 model.</span><span>Poster: Aston Martin Aramco Formula One Team.</span></div>
    </div>
  </section>;
}
