'use client';

import Link from 'next/link';
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, Shuffle } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { stories } from '@/lib/data';
import { publicPath } from '@/lib/public-path';
import './story-explorer.css';

const storageKey = 'pursuit-saved-stories';
const savedEvent = 'pursuit-reading-list';
const categories = [...new Set(stories.map((story) => story.category))];
const number = (value: number) => String(value).padStart(2, '0');

function readSaved(): string[] {
  const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
  return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string' && stories.some((story) => story.id === id)) : [];
}

export default function StoryExplorer({ compact = false }: { compact?: boolean }) {
  const [selectedId, setSelectedId] = useState(stories[0]?.id || '');
  const [category, setCategory] = useState('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [direction, setDirection] = useState<'next' | 'previous'>('next');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const gesture = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const stageId = useId();
  const helpId = useId();
  const candidates = stories.filter((story) => (category === 'all' || story.category === category) && (!savedOnly || savedIds.includes(story.id)));
  const selectedIndex = Math.max(0, candidates.findIndex((story) => story.id === selectedId));
  const selected = candidates[selectedIndex];
  const originalIndex = selected ? stories.findIndex((story) => story.id === selected.id) : -1;
  const isSaved = selected ? savedIds.includes(selected.id) : false;

  useEffect(() => {
    const sync = () => {
      try { setSavedIds(readSaved()); setStorageAvailable(true); }
      catch { setStorageAvailable(false); }
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(savedEvent, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(savedEvent, sync); };
  }, []);

  function select(id: string, nextDirection: 'next' | 'previous' = 'next') {
    setDirection(nextDirection);
    setSelectedId(id);
    const story = stories.find((item) => item.id === id);
    if (story) setAnnouncement(`${story.title} ${story.category}.`);
  }

  function move(offset: number) {
    if (candidates.length < 2) return;
    select(candidates[(selectedIndex + offset + candidates.length) % candidates.length].id, offset > 0 ? 'next' : 'previous');
  }

  function surprise() {
    const choices = candidates.filter((story) => story.id !== selected?.id);
    if (choices.length) select(choices[Math.floor(Math.random() * choices.length)].id);
  }

  function toggleSave() {
    if (!selected) return;
    const next = isSaved ? savedIds.filter((id) => id !== selected.id) : [...savedIds, selected.id];
    setSavedIds(next);
    setAnnouncement(`${selected.title} ${isSaved ? 'removed from' : 'added to'} your reading list.`);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageAvailable(true);
      window.dispatchEvent(new Event(savedEvent));
    } catch { setStorageAvailable(false); }
  }

  function chooseCategory(next: string) {
    setCategory(next);
    setDirection('next');
    setAnnouncement(next === 'all' ? 'Showing every story.' : `Showing ${next} stories.`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
    if (event.key === 'Home' && candidates[0]) { event.preventDefault(); select(candidates[0].id, 'previous'); }
    if (event.key === 'End' && candidates.length) { event.preventDefault(); select(candidates[candidates.length - 1].id); }
  }

  function pointerStart(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || (event.target as HTMLElement).closest('a,button')) return;
    gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  }

  function pointerEnd(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    if (Math.abs(horizontal) > 55 && Math.abs(horizontal) > Math.abs(vertical) * 1.5) move(horizontal < 0 ? 1 : -1);
  }

  return <section className={`story-explorer${compact ? ' story-explorer--compact' : ''}`} data-story-id={selected?.id || ''} data-category={category} data-saved-only={savedOnly} aria-label="Explore stories from the pursuit" aria-roledescription="story carousel">
    <div className="story-explorer-top"><div><span className="story-explorer-eyebrow"><span/> THE EDITORIAL ROOM</span><p>Different perspectives.<br/><strong>One relentless pursuit.</strong></p></div><span className="story-explorer-edition">VOLUME 01<br/>PEOPLE / MACHINES / IDEAS</span></div>
    <div className="story-explorer-filters" aria-label="Story selection"><div className="story-explorer-categories" aria-label="Story categories">{['all', ...categories].map((item) => <button key={item} type="button" onClick={() => chooseCategory(item)} aria-pressed={category === item}>{item === 'all' ? 'All perspectives' : item}</button>)}</div><button className={`story-explorer-saved-filter${savedOnly ? ' is-active' : ''}`} type="button" aria-pressed={savedOnly} onClick={() => { setSavedOnly(!savedOnly); setAnnouncement(savedOnly ? 'Showing every story.' : 'Showing your saved stories.'); }}><Bookmark size={12}/><span>Saved stories ({savedIds.length})</span></button></div>
    {selected ? <>
      <article id={stageId} className={`story-explorer-stage story-explorer-stage--${direction}`} tabIndex={0} onKeyDown={onKeyDown} onPointerDown={pointerStart} onPointerUp={pointerEnd} onPointerCancel={() => { gesture.current = null; }} aria-label={`Story ${selectedIndex + 1} of ${candidates.length}: ${selected.title}`} aria-describedby={helpId}>
        <img key={selected.id + '-image'} className="story-explorer-image" src={publicPath(selected.image)} alt="" width="1600" height="1000" loading="lazy" draggable={false}/><div className="story-explorer-image-shade"/>
        <div className="story-explorer-story-top"><span><i/> {selected.category.toUpperCase()}</span><span>FILE {number(originalIndex + 1)} / {number(stories.length)}</span></div>
        <span className="story-explorer-index" aria-hidden="true">{number(originalIndex + 1)}</span>
        <div key={selected.id + '-copy'} className="story-explorer-story-copy"><div className="story-explorer-meta"><span>{selected.date}</span><i/><span>{selected.readingTime}</span><i/><span>ORIGINAL EDITORIAL</span></div><Link className="story-explorer-title" href={`/stories/${selected.slug}`}><h3>{selected.title}</h3><span aria-hidden="true"><ArrowUpRight/></span></Link><p>{selected.description}</p><div className="story-explorer-story-actions"><Link href={`/stories/${selected.slug}`}>Read the story <ArrowUpRight size={15}/></Link><button type="button" onClick={toggleSave} aria-pressed={isSaved} aria-label={isSaved ? 'Remove saved story' : 'Save story'}>{isSaved ? <Check size={14}/> : <Bookmark size={14}/>}<span>{isSaved ? 'SAVED TO YOUR LIST' : 'SAVE FOR LATER'}</span></button></div></div>
        <span className="story-explorer-side-note" aria-hidden="true">STORIES FROM THE INSIDE LINE</span>
      </article>
      <div className="story-explorer-controls"><div className="story-explorer-arrows"><button type="button" onClick={() => move(-1)} disabled={candidates.length < 2} aria-label="Previous story" aria-controls={stageId}><ArrowLeft size={20}/></button><span><strong>{number(selectedIndex + 1)}</strong> / {number(candidates.length)}</span><button type="button" onClick={() => move(1)} disabled={candidates.length < 2} aria-label="Next story" aria-controls={stageId}><ArrowRight size={20}/></button></div><p id={helpId}>DRAG OR SWIPE TO EXPLORE<span> / </span>FOCUS THE IMAGE & USE ← →</p><button className="story-explorer-surprise" type="button" onClick={surprise} disabled={candidates.length < 2}><Shuffle size={13}/><span>Surprise me</span><ArrowDownLeft size={13}/></button></div>
      <div className="story-explorer-filmstrip" aria-label="Choose a featured story">{candidates.map((story, index) => <button key={story.id} type="button" aria-label={`Show story ${index + 1}: ${story.title}`} aria-pressed={story.id === selected.id} aria-controls={stageId} onClick={() => select(story.id, index < selectedIndex ? 'previous' : 'next')}><div><img src={publicPath(story.image)} alt="" width="240" height="140" loading="lazy" draggable={false}/><span>{number(stories.findIndex((item) => item.id === story.id) + 1)}</span>{savedIds.includes(story.id) && <Bookmark size={11} className="story-explorer-film-saved"/>}</div><span className="story-explorer-film-title">{story.title}</span><i/></button>)}</div>
    </> : <div className="story-explorer-empty"><Bookmark size={35}/><span className="story-explorer-eyebrow">YOUR NEXT READ IS WAITING.</span><h3>{savedOnly ? 'MAKE IT YOUR OWN.' : 'A DIFFERENT PERSPECTIVE.'}</h3><p>{savedOnly ? 'Save a story to build a reading list on this browser. Your selected category may also be hiding saved stories.' : 'Explore another category to find your next story.'}</p><button type="button" onClick={() => { setCategory('all'); setSavedOnly(false); }}>Explore every story <ArrowRight size={16}/></button></div>}
    <div className="story-explorer-footnote"><span>{storageAvailable ? 'YOUR READING LIST STAYS ON THIS BROWSER.' : 'STORAGE UNAVAILABLE. SAVED FOR THIS VISIT ONLY.'}</span><Link href="/sources">CREDITS & SOURCE NOTES <ArrowUpRight size={11}/></Link></div><span className="story-explorer-announcement" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </section>;
}
