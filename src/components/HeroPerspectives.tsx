'use client';

import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,ScanLine} from 'lucide-react';
import {publicPath} from '@/lib/public-path';
import './interactive-experience.css';

const views=[
 {id:'launch',name:'The reveal',src:'/images/hero.jpg',alt:'The 2026 Aston Martin AMR26 in metallic green, photographed in a studio'},
 {id:'rear',name:'The other side',src:'/images/amr26-detail.jpg',alt:'Official rear three-quarter photograph of the Aston Martin AMR26'},
 {id:'front',name:'Head on',src:'/images/amr26-front.jpg',alt:'The Aston Martin AMR26 photographed from the front'},
];
export default function HeroPerspectives(){
 const[active,setActive]=useState(0);
 useEffect(()=>{views.slice(1).forEach(v=>{const img=new Image();img.src=publicPath(v.src)})},[]);
 const move=(direction:number)=>setActive(n=>(n+direction+views.length)%views.length);
 return <><div className="hero-media hero-perspectives" data-perspective={views[active].id}>
 {views.map((v,i)=><img key={v.id} className={'hero-image hero-perspective-image '+(i===active?'is-current':'')} src={publicPath(v.src)} alt={i===active?v.alt:''} aria-hidden={i!==active} width="3165" height="2110" fetchPriority={i===0?'high':'auto'} loading={i===0?'eager':'lazy'}/>)}</div>
 <div className="hero-perspective-controls" role="group" aria-label="Official car photography viewpoints"><div className="hero-perspective-label"><ScanLine size={13}/><span>CHANGE YOUR PERSPECTIVE</span></div><div><button onClick={()=>move(-1)} aria-label="Previous car perspective"><ArrowLeft size={13}/></button>{views.map((v,i)=><button key={v.id} aria-label={'View '+v.name} aria-pressed={active===i} className={active===i?'is-current':''} onClick={()=>setActive(i)}>{String(i+1).padStart(2,'0')}</button>)}<button onClick={()=>move(1)} aria-label="Next car perspective"><ArrowRight size={13}/></button></div><span className="hero-perspective-name" aria-live="polite">{views[active].name}</span></div></>;
}
