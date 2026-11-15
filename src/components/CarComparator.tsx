'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowLeftRight,ArrowUpRight,Plus} from 'lucide-react';
import {cars,drivers,seasons,type Car} from '@/lib/data';
import {publicPath} from '@/lib/public-path';
import './interactive-experience.css';

const defaults=['amr23','amr26'];
export default function CarComparator(){
 const[selected,setSelected]=useState(defaults);const[open,setOpen]=useState(false);
 useEffect(()=>{const p=new URLSearchParams(location.search);const ids=(p.get('compare')||'').split(',');if(ids.length===2&&ids[0]!==ids[1]&&ids.every(id=>cars.some(c=>c.id===id))){setSelected(ids);setOpen(true)}if(location.hash==='#compare')setOpen(true);const onHash=()=>{if(location.hash==='#compare')setOpen(true)};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash)},[]);
 const select=(index:number,id:string)=>{const next=[...selected];if(next[1-index]===id){next[1-index]=next[index]}next[index]=id;setSelected(next);const u=new URL(location.href);u.searchParams.set('compare',next.join(','));history.replaceState({},'',u)};
 const pair=selected.map(id=>cars.find(c=>c.id===id)!);
 const values=(c:Car)=>{const s=seasons.find(s=>s.carId===c.id);return [String(c.year),c.powerUnit,c.driverIds.map(id=>drivers.find(d=>d.id===id)?.name).filter(Boolean).join(' / '),s?`${s.points} points`:'Not loaded',s?String(s.podiums):'Not loaded',c.specs.map(s=>`${s.label}: ${s.value} (${s.kind})`).slice(0,3).join(' · ')||'No audited specification imported']};
 return <section className={'car-comparator '+(open?'is-open':'')} id="compare" aria-labelledby="comparator-title"><div className="car-comparator-heading"><div><span className="eyebrow">THE DEVELOPMENT LINE / YOUR COMPARISON</span><h2 id="comparator-title">TWO MACHINES.<br/><em>A DIFFERENT PERSPECTIVE.</em></h2></div><button onClick={()=>{setOpen(n=>!n);if(open&&location.hash==='#compare'){const url=new URL(location.href);url.hash='';history.replaceState({},'',url)}}} aria-expanded={open} aria-controls="car-comparison-panel"><ArrowLeftRight size={18}/>{open?'Close comparison':'Compare the cars'}<Plus size={17} style={{transform:open?'rotate(45deg)':undefined}}/></button></div>
 {open&&<div id="car-comparison-panel"><div className="car-comparison-pair">{pair.map((c,i)=><article key={i}><label>CHALLENGER 0{i+1}<select value={c.id} aria-label={'Select challenger '+(i+1)} onChange={e=>select(i,e.target.value)}>{cars.map(item=><option key={item.id} value={item.id}>{item.name} / {item.year}</option>)}</select></label><div className="car-comparison-image">{c.image?<img src={publicPath(c.image)} alt={c.name} width="1100" height="650" loading="lazy"/>:<span>{c.name}</span>}</div><div className="car-comparison-title"><h3>{c.name}</h3><Link href={'/cars/'+c.slug} aria-label={'Full '+c.name+' record'}><ArrowUpRight size={23}/></Link></div></article>)}</div><div className="car-comparison-table" role="region" aria-label="Chassis comparison" tabIndex={0}><table><thead><tr><th scope="col">THE RECORD</th>{pair.map(c=><th scope="col" key={c.id}>{c.name}</th>)}</tr></thead><tbody>{['Season','Power unit','Race drivers','Team season points','Team season podiums','Selected published details'].map((label,i)=><tr key={label}><th scope="row">{label}</th>{pair.map(c=><td key={c.id}>{values(c)[i]}</td>)}</tr>)}</tbody></table></div><p className="car-comparison-note">Team season records and selected sourced specifications. These totals are dated snapshots, not a prediction or a measure of relative performance. Regulatory limits are labelled in each full record. Your selection is shareable in the URL.</p></div>}</section>;
}
