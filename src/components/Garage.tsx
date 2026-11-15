'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Box, ChevronDown, Crosshair, Expand, Grid3X3, Minus, MousePointer2, Pause, Play, Plus, RotateCcw, Sun, Wind, X } from 'lucide-react';
import './garage.css';

export type GarageView = 'three-quarter' | 'front' | 'side' | 'rear' | 'overhead' | 'cockpit';
export type HotspotId = 'front-wing' | 'rear-wing' | 'floor' | 'sidepods' | 'suspension' | 'cockpit' | 'steering' | 'tyres' | 'power-unit';
export type GarageCommand = { sequence: number; action: 'left' | 'right' | 'up' | 'down' | 'in' | 'out' };
export type GarageInspection = 'solid' | 'wireframe';
export type GarageLighting = 'green' | 'lime' | 'white';

const Scene = dynamic(() => import('./GarageScene'), { ssr: false, loading: () => <div className="garage-loading"><span className="garage-loading-orbit"/><span>PREPARING YOUR STUDIO</span></div> });

const details: { id: HotspotId; label: string; title: string; text: string; principle: string; tag: string }[] = [
  { id: 'front-wing', label: 'Front wing', title: 'The first conversation with the air.', text: 'The front wing creates aerodynamic load and shapes the flow approaching the front tyres and the rest of the car. Small geometry changes can influence the balance of the whole package.', principle: 'Load. Balance. Flow conditioning.', tag: 'AERODYNAMICS' },
  { id: 'rear-wing', label: 'Rear wing', title: 'Confidence at the limit.', text: 'A rear wing trades drag for aerodynamic load at the rear axle. Its contribution must work with the floor and front wing to give a driver a predictable car through a corner.', principle: 'Rear stability, with a drag trade-off.', tag: 'AERODYNAMICS' },
  { id: 'floor', label: 'Floor', title: 'Performance beneath the surface.', text: 'The floor manages the pressure and airflow beneath the car. Its edges, ride height and rear exit shape affect how consistently it can generate aerodynamic load.', principle: 'Pressure management under the car.', tag: 'AERODYNAMICS' },
  { id: 'sidepods', label: 'Sidepods', title: 'Cooling meets sculpture.', text: 'Sidepods package cooling hardware while guiding air towards the rear of the car. Their shape is a compromise between cooling demand, packaging and aerodynamic performance.', principle: 'A cooling system with an aerodynamic role.', tag: 'PACKAGING' },
  { id: 'suspension', label: 'Suspension', title: 'Precision through every contact.', text: 'Suspension links control wheel movement and help maintain the car’s attitude. The arrangement must manage mechanical loads while operating in an aerodynamically sensitive area.', principle: 'Wheel control and a stable platform.', tag: 'VEHICLE DYNAMICS' },
  { id: 'cockpit', label: 'Cockpit & halo', title: 'The human at the centre.', text: 'The survival cell surrounds the driver. Above the cockpit, the halo is a structural protection device. Seating position, visibility and controls are designed around the driver.', principle: 'Protection. Visibility. Driver fit.', tag: 'DRIVER ENVIRONMENT' },
  { id: 'steering', label: 'Steering wheel', title: 'A race in the fingertips.', text: 'A Formula One steering wheel combines steering with switches, paddles and a display. Drivers use it to make adjustments and manage systems while processing information at speed.', principle: 'Control and information in one place.', tag: 'DRIVER INTERFACE' },
  { id: 'tyres', label: 'Tyres', title: 'Where every idea meets the road.', text: 'The tyres transmit braking, acceleration and cornering forces. Their grip depends on compound, load, temperature and condition, linking vehicle setup to race strategy.', principle: 'Four contact patches. One complete system.', tag: 'MECHANICAL GRIP' },
  { id: 'power-unit', label: 'Power unit', title: 'Energy, carefully orchestrated.', text: 'A modern Formula One power unit integrates combustion and electrical systems. Energy deployment, cooling and packaging must work together over a complete lap.', principle: 'Power delivery is a systems challenge.', tag: 'ENERGY & PERFORMANCE' },
];
const views: { id: GarageView; label: string; short: string }[] = [
  { id: 'three-quarter', label: 'Three quarter view', short: 'Overview' }, { id: 'front', label: 'Front view', short: 'Front' },
  { id: 'side', label: 'Side view', short: 'Side' }, { id: 'rear', label: 'Rear view', short: 'Rear' },
  { id: 'overhead', label: 'Overhead view', short: 'Top' }, { id: 'cockpit', label: 'Cockpit view', short: 'Cockpit' },
];

export default function Garage() {
  const container = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<GarageView>('three-quarter');
  const [selected, setSelected] = useState<HotspotId | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [airflow, setAirflow] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [command, setCommand] = useState<GarageCommand>({ sequence: 0, action: 'in' });
  const [resetKey, setResetKey] = useState(0);
  const [inspection, setInspection] = useState<GarageInspection>('solid');
  const [lighting, setLighting] = useState<GarageLighting>('green');
  const detail = details.find((item) => item.id === selected);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      const enabled = motion.matches || document.documentElement.dataset.motion === 'reduced';
      setReducedMotion(enabled);
      if (enabled) setAutoRotate(false);
    };
    updateMotion();
    motion.addEventListener('change', updateMotion);
    window.addEventListener('pursuit-motion', updateMotion);
    const motionPreferenceObserver = new MutationObserver(updateMotion);
    motionPreferenceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setSupported(!!gl);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { setSupported(false); }
    return () => { motion.removeEventListener('change', updateMotion); window.removeEventListener('pursuit-motion', updateMotion); motionPreferenceObserver.disconnect(); };
  }, []);

  useEffect(() => {
    let inViewport = true;
    const updateVisibility = () => setVisible(inViewport && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; updateVisibility(); }, { rootMargin: '80px' });
    if (container.current) observer.observe(container.current);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);

  const act = (action: GarageCommand['action']) => { setAutoRotate(false); setCommand((current) => ({ sequence: current.sequence + 1, action })); };
  const chooseView = (next: GarageView) => { setView(next); setSelected(null); setAutoRotate(false); setResetKey((key) => key + 1); };
  const chooseHotspot = (next: HotspotId) => { setSelected(next); setAutoRotate(false); if (['front-wing', 'rear-wing', 'floor', 'sidepods'].includes(next)) setAirflow(true); };
  const reset = () => { chooseView('three-quarter'); setAirflow(false); setInspection('solid'); setLighting('green'); };
  const hasScene = supported === true && !failed;

  return (
    <div className="garage-experience" ref={container} data-inspection={inspection} data-lighting={lighting}>
      <div className="garage-topline"><div><span className="garage-status-dot"/>INTERACTIVE STUDIO <span className="garage-topline-divider">/</span> 01</div><span>FORM. FUNCTION. FEELING.</span></div>
      <div className="garage-stage" tabIndex={0} aria-label="Interactive Formula car study. Arrow keys rotate, plus and minus zoom, Escape closes engineering detail." onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const keyActions: Record<string, GarageCommand['action']> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out' };
        if (keyActions[event.key]) { event.preventDefault(); act(keyActions[event.key]); }
        if (event.key === 'Escape') setSelected(null);
      }}>
        <div className="garage-scene-heading"><span className="garage-eyebrow">THE ENGINEERING STUDY</span><h2>Every angle.<br/><em>One obsession.</em></h2></div>
        <div className="garage-scene-number" aria-hidden="true">01—09</div>
        {supported === null && <div className="garage-loading"><span className="garage-loading-orbit"/><span>OPENING THE STUDIO</span></div>}
        {hasScene && <Scene view={view} selectedHotspot={selected} autoRotate={autoRotate && !reducedMotion} airflow={airflow} visible={visible} reducedMotion={reducedMotion} command={command} resetKey={resetKey} inspection={inspection} lighting={lighting} onSelect={chooseHotspot} onInteract={() => setAutoRotate(false)} onReady={() => setReady(true)} onError={() => setFailed(true)}/>}
        {(supported === false || failed) && <div className="garage-fallback"><Crosshair size={24} strokeWidth={1}/><h3>The engineering is still yours to explore.</h3><svg className="garage-static-study" viewBox="0 0 600 230" role="img" aria-label="Illustrative top view of a Formula car. Numbered systems correspond to the nine engineering controls below."><g fill="#193c2b" stroke="#9dab7e" strokeWidth="1.2"><path d="M74 104L209 89 247 65 351 63 415 84 493 96 493 132 415 144 351 165 247 163 209 139 74 125Z"/><path d="M180 78L442 73 464 155 180 150Z" fill="#102117"/><path d="M70 75L108 75 114 155 70 155Z"/><path d="M482 67L517 67 517 163 482 163Z"/><path d="M101 111L252 97 394 97 473 109 473 121 394 133 252 133 101 119Z" fill="#00624d"/><path d="M229 84Q285 70 375 87L418 99 377 109 231 101Z" fill="#00624d"/><path d="M229 146Q285 160 375 143L418 131 377 121 231 129Z" fill="#00624d"/>{[146,426].map((x)=><g key={x}><rect x={x} y="47" width="48" height="36" rx="9" fill="#0a100b"/><rect x={x} y="147" width="48" height="36" rx="9" fill="#0a100b"/></g>)}<path d="M170 80L212 100 170 148M451 80L408 103 451 149" fill="none"/><ellipse cx="291" cy="115" rx="39" ry="16" fill="#090d0b"/><path d="M253 115Q267 79 323 101M253 115Q267 151 323 129" fill="none" strokeWidth="3"/><path d="M268 103V127" strokeWidth="4"/></g>{[[1,87,183],[2,502,190],[3,215,182],[4,350,48],[5,190,105],[6,306,193],[7,261,65],[8,451,29],[9,391,184]].map(([n,x,y])=><g key={n}><circle cx={x} cy={y} r="10" fill={selected===details[n-1].id?'#d7f000':'#263c25'} stroke="#a7bb79"/><text x={x} y={y+3} textAnchor="middle" fill={selected===details[n-1].id?'#102010':'#dfebc6'} fontSize="8" fontFamily="monospace">{String(n).padStart(2,'0')}</text></g>)}</svg><p>This browser couldn’t open the 3D studio. Select any numbered system below to explore the annotated study.</p><button className="garage-text-button" onClick={() => { setFailed(false); setSupported(null); window.location.reload(); }}>Reload studio <ArrowUpRight size={15}/></button></div>}
        {hasScene && ready && !detail && <div className="garage-drag-hint"><MousePointer2 size={13}/><span>DRAG TO EXPLORE <span className="garage-hint-dot">·</span> SCROLL TO ZOOM</span></div>}
        {detail && <aside className="garage-detail" aria-live="polite"><div className="garage-detail-top"><span>{String(details.indexOf(detail) + 1).padStart(2, '0')} / {detail.tag}</span><button onClick={() => setSelected(null)} aria-label="Close engineering detail"><X size={17}/></button></div><h3>{detail.title}</h3><p>{detail.text}</p><div className="garage-detail-principle"><span>THE PRINCIPLE</span><strong>{detail.principle}</strong></div><Link className="garage-detail-link" href="/engineering">Explore engineering <ArrowUpRight size={12}/></Link></aside>}
        <div className="garage-stage-bottom"><span className="garage-model-caption">Illustrative study model · not a chassis-accurate AMR26 model</span><span className="garage-axis" aria-hidden="true"><i/>X <i/>Y <i/>Z</span></div>
        {airflow && hasScene && <div className="garage-airflow-label"><Wind size={13}/> CONCEPTUAL AIRFLOW · ILLUSTRATION, NOT CFD</div>}
        {inspection === 'wireframe' && hasScene && <div className="garage-inspection-label"><Grid3X3 size={12}/> STUDY MESH · ILLUSTRATIVE GEOMETRY</div>}
      </div>
      <div className="garage-toolbar" aria-label="3D studio controls">
        <div className="garage-view-controls" aria-label="Camera viewpoints">{views.map((item) => <button key={item.id} className={view === item.id && !selected ? 'is-active' : ''} aria-label={item.label} aria-pressed={view === item.id && !selected} onClick={() => chooseView(item.id)} disabled={!hasScene}>{item.short}</button>)}</div>
        <div className="garage-tool-controls"><button onClick={() => act('out')} aria-label="Zoom out" disabled={!hasScene}><Minus size={17}/></button><button onClick={() => act('in')} aria-label="Zoom in" disabled={!hasScene}><Plus size={17}/></button><span className="garage-tool-separator"/><button onClick={() => setAutoRotate((value) => !value)} aria-label={autoRotate ? 'Pause rotation' : 'Start rotation'} aria-pressed={autoRotate} disabled={!hasScene || reducedMotion}>{autoRotate ? <Pause size={16}/> : <Play size={16}/>}</button><button className={airflow ? 'is-active' : ''} aria-label="Toggle conceptual airflow illustration" aria-pressed={airflow} onClick={() => setAirflow((value) => !value)} disabled={!hasScene}><Wind size={18}/></button><button onClick={reset} aria-label="Reset view" disabled={!hasScene}><RotateCcw size={16}/></button><button onClick={async () => { try { if (!document.fullscreenElement) await container.current?.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch { /* The host may not allow full-screen mode. */ } }} aria-label="Toggle full screen" disabled={!hasScene}><Expand size={16}/></button></div>
      </div>
      <div className="garage-inspection-bar"><div className="garage-inspection-group" role="group" aria-label="Study model surface rendering"><span>INSPECT</span><button aria-label="Solid surfaces" aria-pressed={inspection === 'solid'} className={inspection === 'solid' ? 'is-active' : ''} onClick={() => setInspection('solid')} disabled={!hasScene}><Box size={13}/>Surfaces</button><button aria-label="Wireframe study" aria-pressed={inspection === 'wireframe'} className={inspection === 'wireframe' ? 'is-active' : ''} onClick={() => setInspection('wireframe')} disabled={!hasScene}><Grid3X3 size={13}/>Wireframe</button></div><div className="garage-inspection-group garage-lighting-group" role="group" aria-label="Studio lighting"><span><Sun size={11}/> LIGHT</span>{(['green', 'lime', 'white'] as const).map((preset) => <button key={preset} aria-label={`${preset[0].toUpperCase() + preset.slice(1)} studio`} aria-pressed={lighting === preset} className={lighting === preset ? 'is-active' : ''} onClick={() => setLighting(preset)} disabled={!hasScene}><i className={`garage-light-swatch garage-light-swatch--${preset}`}/>{preset[0].toUpperCase() + preset.slice(1)}</button>)}</div></div>
      <div className="garage-systems"><div className="garage-systems-intro"><span className="garage-eyebrow">LOOK CLOSER</span><p>Nine systems.<br/>A single purpose.</p><ChevronDown size={15}/></div><div className="garage-hotspot-list" aria-label="Engineering systems">{details.map((item, index) => <button key={item.id} className={selected === item.id ? 'is-selected' : ''} aria-pressed={selected === item.id} onClick={() => chooseHotspot(item.id)}><span>{String(index + 1).padStart(2, '0')}</span>{item.label}<ArrowUpRight size={13}/></button>)}</div></div>
      <div className="garage-accessibility-controls"><span>KEYBOARD CAMERA</span><button onClick={() => act('left')} aria-label="Rotate camera left" disabled={!hasScene}><ArrowLeft size={13}/></button><button onClick={() => act('right')} aria-label="Rotate camera right" disabled={!hasScene}><ArrowRight size={13}/></button><button onClick={() => act('up')} aria-label="Rotate camera up" disabled={!hasScene}><ArrowUp size={13}/></button><button onClick={() => act('down')} aria-label="Rotate camera down" disabled={!hasScene}><ArrowDown size={13}/></button><span>{reducedMotion ? 'Reduced motion enabled' : 'Drag with one finger. Pinch to zoom.'}</span></div>
    </div>
  );
}
