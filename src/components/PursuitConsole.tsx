'use client';

import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Command,Compass,Dices,Flag,MoveRight,ScanLine,Sparkles,X} from 'lucide-react';
import {stories} from '@/lib/data';
import './interactive-experience.css';

const experiences=[
 {title:'Take the wheel',detail:'Rotate the model. Change the light. Trace the air.',href:'/garage',icon:ScanLine,tag:'3D INSPECTION'},
 {title:'Beat your last start',detail:'Five red lights. One moment. Your reaction.',href:'/fan-experience#lights-out',icon:Flag,tag:'REACTION CHALLENGE'},
 {title:'Find the next story',detail:'A swipeable collection. Save what stays with you.',href:'/stories',icon:Compass,tag:'STORY EXPLORER'},
 {title:'Compare the machines',detail:'Two chassis. Their published details, side by side.',href:'/cars#compare',icon:MoveRight,tag:'CAR COMPARISON'},
];
export default function PursuitConsole(){
 const[open,setOpen]=useState(false);const[visited,setVisited]=useState<string[]>([]);const dialog=useRef<HTMLDialogElement>(null);const trigger=useRef<HTMLButtonElement>(null);const pathname=usePathname();const router=useRouter();
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem('pursuit-explored')||'[]');if(Array.isArray(saved))setVisited(saved.filter(x=>typeof x==='string').map(x=>x.replace(/\/+$/,'')||'/'))}catch{}},[]);
 useEffect(()=>{setOpen(false);setVisited(previous=>{const next=[...new Set([...previous,pathname.replace(/\/+$/,'')||'/'])];try{sessionStorage.setItem('pursuit-explored',JSON.stringify(next))}catch{}return next})},[pathname]);
 useEffect(()=>{if(open)dialog.current?.showModal();else if(dialog.current?.open)dialog.current.close()},[open]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(n=>!n)}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 const close=()=>{setOpen(false);trigger.current?.focus()};
 const surprise=()=>{setOpen(false);router.push('/stories/'+stories[Math.floor(Math.random()*stories.length)].slug)};
 return <><button ref={trigger} className="pursuit-console-trigger" onClick={()=>setOpen(true)} aria-label="Open experience console" aria-haspopup="dialog"><Compass size={17}/><span>EXPLORE THE EXPERIENCE</span><kbd>⌘ K</kbd></button>
 <dialog className="pursuit-console" ref={dialog} aria-labelledby="pursuit-console-title" onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close()}}><div className="pursuit-console-top"><span><i/> YOUR PURSUIT / YOUR RULES</span><button onClick={close} aria-label="Close experience console"><X size={21}/></button></div><h2 id="pursuit-console-title">CHOOSE YOUR<br/><em>NEXT OBSESSION.</em></h2><p>There’s more than one way to experience the pursuit.</p><div className="pursuit-console-grid">{experiences.map(({title,detail,href,tag,icon:Icon})=><Link href={href} key={href} onClick={()=>setOpen(false)} className="pursuit-console-card"><span className="pursuit-console-card-top"><Icon size={21}/><span>{tag}</span>{visited.includes(href.split('#')[0])&&<small>EXPLORED</small>}</span><h3>{title}</h3><p>{detail}</p><ArrowUpRight className="pursuit-console-arrow" size={21}/></Link>)}</div><div className="pursuit-console-bottom"><button onClick={surprise}><Dices size={17}/> Take me somewhere unexpected <ArrowUpRight size={15}/></button><span><Command size={12}/> K TO OPEN / ESC TO CLOSE</span></div></dialog></>;
}
