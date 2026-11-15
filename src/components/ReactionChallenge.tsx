'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { ArrowDownRight, ArrowUpRight, RotateCcw } from 'lucide-react';
import './reaction-challenge.css';

type Phase = 'idle' | 'arming' | 'holding' | 'go' | 'result' | 'jump';
type PracticeRecord = { best: number | null; runs: number[] };
type Result = { milliseconds: number; isBest: boolean; first: boolean };

const STORAGE_KEY = 'pursuit.reaction.v1';
const EMPTY_RECORD: PracticeRecord = { best: null, runs: [] };
const ACTIVE_PHASES: Phase[] = ['arming', 'holding', 'go'];

// Stored values are local practice results, never a driver benchmark or a ranking.
function readRecord(): PracticeRecord {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...EMPTY_RECORD, runs: [] };
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') return { ...EMPTY_RECORD, runs: [] };
  const value = parsed as { version?: unknown; best?: unknown; runs?: unknown };
  const validTime = (time: unknown): time is number =>
    typeof time === 'number' && Number.isFinite(time) && time >= 0 && time <= 10_000;
  if (value.version !== 1) return { ...EMPTY_RECORD, runs: [] };
  const runs = Array.isArray(value.runs) ? value.runs.filter(validTime).slice(-5) : [];
  const best = validTime(value.best) ? value.best : null;
  return { best, runs };
}

function formatTime(time: number) {
  return Math.round(time).toString();
}

/** A self-contained, opt-in browser practice game. No audio or external service. */
export function ReactionChallenge({ className = '', id }: { className?: string; id?: string }) {
  const generatedId = useId();
  const instanceId = id ?? `reaction-${generatedId.replace(/:/g, '')}`;
  const [phase, setPhase] = useState<Phase>('idle');
  const [litBanks, setLitBanks] = useState(0);
  const [record, setRecord] = useState<PracticeRecord>(EMPTY_RECORD);
  const [result, setResult] = useState<Result | null>(null);
  const [notice, setNotice] = useState('Five red lights. One moment to move.');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const phaseRef = useRef<Phase>('idle');
  const recordRef = useRef<PracticeRecord>(EMPTY_RECORD);
  const goAtRef = useRef<number | null>(null);
  const runRef = useRef(0);
  const timersRef = useRef<Set<number>>(new Set());
  const frameRef = useRef<number | null>(null);
  const paddleRef = useRef<HTMLButtonElement>(null);
  const heldKeyRef = useRef(false);
  const active = ACTIVE_PHASES.includes(phase);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(timer => window.clearTimeout(timer));
    timersRef.current.clear();
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const reset = useCallback((message = 'Lights reset. Start when you’re ready.') => {
    runRef.current += 1;
    clearTimers();
    phaseRef.current = 'idle';
    goAtRef.current = null;
    heldKeyRef.current = false;
    setPhase('idle');
    setLitBanks(0);
    setResult(null);
    setNotice(message);
  }, [clearTimers]);

  useEffect(() => {
    try {
      const saved = readRecord();
      recordRef.current = saved;
      setRecord(saved);
    } catch {
      // Storage can be unavailable in private/embedded browsing. Play still works.
      setStorageAvailable(false);
    }

    const abortIfActive = () => {
      if (ACTIVE_PHASES.includes(phaseRef.current)) {
        reset('Run paused when you left the game. Start a fresh run when you’re ready.');
      }
    };
    const onVisibility = () => {
      if (document.hidden) abortIfActive();
    };
    const releaseKey = () => { heldKeyRef.current = false; };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', abortIfActive);
    window.addEventListener('keyup', releaseKey);
    return () => {
      runRef.current += 1;
      clearTimers();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', abortIfActive);
      window.removeEventListener('keyup', releaseKey);
    };
  }, [clearTimers, reset]);

  const start = () => {
    if (ACTIVE_PHASES.includes(phaseRef.current) || document.hidden) return;
    clearTimers();
    const run = ++runRef.current;
    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timersRef.current.delete(timer);
        if (runRef.current === run) callback();
      }, delay);
      timersRef.current.add(timer);
    };

    phaseRef.current = 'arming';
    goAtRef.current = null;
    heldKeyRef.current = false;
    flushSync(() => {
      setPhase('arming');
      setLitBanks(0);
      setResult(null);
      setNotice('Run armed. Wait until every red light goes out.');
      setAttempt(value => value + 1);
    });
    paddleRef.current?.focus({ preventScroll: true });

    for (let bank = 1; bank <= 5; bank += 1) {
      later(() => {
        setLitBanks(bank);
        if (bank === 5) {
          phaseRef.current = 'holding';
          setPhase('holding');
          setNotice('All five banks are red. Hold. Wait for lights out.');
        }
      }, 350 + (bank - 1) * 600);
    }

    // No visible countdown: each fresh run has an independent, unpredictable hold.
    const hold = 1_400 + Math.random() * 2_400;
    later(() => {
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (runRef.current !== run || document.hidden) return;
        // Commit the extinguished lamps before starting the monotonic clock.
        // Browser display/input latency remains part of this practice measurement.
        flushSync(() => {
          setLitBanks(0);
          setPhase('go');
          setNotice('Lights out. Your move. Press the reaction paddle now.');
        });
        goAtRef.current = performance.now();
        phaseRef.current = 'go';
        later(() => reset('No input recorded. Start another run when you’re ready.'), 10_000);
      });
    }, 2_750 + hold);
  };

  const react = () => {
    const currentPhase = phaseRef.current;
    if (currentPhase === 'arming' || currentPhase === 'holding') {
      runRef.current += 1;
      clearTimers();
      phaseRef.current = 'jump';
      goAtRef.current = null;
      setPhase('jump');
      setLitBanks(0);
      setNotice('Jump start. You moved before the lights went out. No time recorded.');
      return;
    }
    if (currentPhase !== 'go' || goAtRef.current === null) return;

    const elapsed = performance.now() - goAtRef.current;
    runRef.current += 1;
    clearTimers();
    phaseRef.current = 'result';
    goAtRef.current = null;
    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 10_000) {
      reset('That run expired. Start a fresh run when you’re ready.');
      return;
    }
    // Keep one decimal in storage. The large display rounds to the nearest ms.
    const milliseconds = Math.round(elapsed * 10) / 10;
    let previous = recordRef.current;
    try {
      previous = readRecord();
      // Preserve this visit's best if a storage write previously failed.
      if (recordRef.current.best !== null && (previous.best === null || recordRef.current.best < previous.best)) {
        previous = recordRef.current;
      }
    } catch {
      setStorageAvailable(false);
    }
    const first = previous.best === null;
    const isBest = first || milliseconds < previous.best!;
    const next: PracticeRecord = {
      best: isBest ? milliseconds : previous.best,
      runs: [...previous.runs, milliseconds].slice(-5),
    };
    recordRef.current = next;
    setRecord(next);
    setResult({ milliseconds, isBest, first });
    setPhase('result');
    setNotice(`${formatTime(milliseconds)} milliseconds.${first ? ' First clean run.' : isBest ? ' A new personal best.' : ' Clean reaction recorded.'} Start another run to try again.`);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...next }));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  };

  const onPaddleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.code !== 'Space' && event.key !== 'Enter') return;
    event.preventDefault();
    if (event.repeat || heldKeyRef.current) return;
    heldKeyRef.current = true;
    react();
  };

  const onPaddlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    react();
  };

  const displayLabel = phase === 'result'
    ? result?.first ? 'FIRST CLEAN RUN' : result?.isBest ? 'NEW PERSONAL BEST' : 'REACTION RECORDED'
    : phase === 'jump' ? 'TOO SOON' : phase === 'go' ? 'LIGHTS OUT' : phase === 'holding' ? 'HOLD YOUR NERVE' : phase === 'arming' ? 'STAY READY' : 'YOUR NEXT CHALLENGE';
  const lightLabel = phase === 'go' ? 'GO' : phase === 'jump' ? 'JUMP START' : phase === 'result' ? 'RUN COMPLETE' : active ? 'WAIT' : 'STANDING BY';
  const maxHistory = Math.max(1, ...record.runs);

  return (
    <section id={instanceId} className={`reaction-challenge ${className}`} data-phase={phase} data-state={phase} aria-labelledby={`${instanceId}-title`}>
      <div className="reaction-studio">
        <div className="reaction-topline">
          <span><i aria-hidden="true" />THE PURSUIT / REACTION LAB</span>
          <span>PRACTICE {String(attempt).padStart(2, '0')}</span>
        </div>
        <div className="reaction-heading">
          <div>
            <span className="reaction-kicker">A SMALL TEST OF COMPOSURE</span>
            <h2 id={`${instanceId}-title`}>LIGHTS OUT.</h2>
          </div>
          <ArrowDownRight size={38} strokeWidth={1} aria-hidden="true" />
        </div>

        <div className="reaction-gantry" aria-hidden="true">
          <div className="reaction-gantry-rail"><span>START PROCEDURE</span><span>05 / RED</span></div>
          <div className="reaction-light-banks">
            {[1, 2, 3, 4, 5].map(bank => (
              <div className={`reaction-bank ${litBanks >= bank ? 'is-lit' : ''}`} key={bank}>
                <span className="reaction-bank-number">0{bank}</span>
                <i className="reaction-lamp" />
                <i className="reaction-lamp" />
                <span className="reaction-bank-screw" />
              </div>
            ))}
          </div>
          <div className="reaction-gantry-base"><span>{active && phase !== 'go' ? `${String(litBanks).padStart(2, '0')} / 05` : '05 / 05'}</span><span className={phase === 'go' ? 'is-go' : ''}>{lightLabel}</span><i /></div>
        </div>

        <p id={`${instanceId}-instructions`} className="reaction-instructions">Start a run. Watch the five banks build. When <strong>every red light goes out</strong>, tap the paddle or press <kbd>Space</kbd> with it focused. Move early and it’s a jump start.</p>
        <div className="reaction-run-controls">
          <button type="button" className="reaction-start" onClick={start} disabled={active}>
            <span>{phase === 'result' || phase === 'jump' ? 'One more run' : 'Start practice'}</span><ArrowUpRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className="reaction-reset" onClick={() => reset(active ? 'Run aborted. Start a fresh run when you’re ready.' : undefined)}>
            <RotateCcw size={13} aria-hidden="true" />{active ? 'Abort run' : 'Reset lights'}
          </button>
        </div>

        <div className="reaction-history">
          <div className="reaction-history-heading"><span>YOUR LAST FIVE</span><span>LOWER IS QUICKER</span></div>
          {record.runs.length ? (
            <ol aria-label="Your last five measured reactions, oldest first">
              {record.runs.map((time, index) => (
                <li key={`${index}-${time}`} className={index === record.runs.length - 1 ? 'is-latest' : ''}>
                  <span className="reaction-history-run">0{index + 1}</span>
                  <span className="reaction-history-bar" aria-hidden="true"><i style={{ width: `${Math.max(4, time / maxHistory * 100)}%` }} /></span>
                  <strong>{formatTime(time)}<small> ms</small></strong>
                </li>
              ))}
            </ol>
          ) : <p>Your clean runs will appear here. Every time is your own.</p>}
        </div>
      </div>

      <div className="reaction-readout">
        <span className="reaction-kicker">{displayLabel}</span>
        <div className="reaction-result-display" aria-hidden="true">
          {phase === 'result' && result ? <><strong className="reaction-time">{formatTime(result.milliseconds)}</strong><span className="reaction-time-unit">MILLISECONDS</span></>
            : phase === 'jump' ? <strong className="reaction-jump">JUMP<br />START.</strong>
              : phase === 'go' ? <strong className="reaction-your-move">YOUR<br /><span>MOVE.</span></strong>
                : <strong className="reaction-your-move">YOUR<br />MOVE<span className="reaction-title-stop">.</span></strong>}
        </div>
        <p className="reaction-status" id={`${instanceId}-status`} role="status" aria-live="polite" aria-atomic="true">{notice}</p>

        <button
          ref={paddleRef}
          type="button"
          className="reaction-paddle"
          aria-label="Reaction paddle. Press Space or Enter when every red light goes out."
          aria-describedby={`${instanceId}-instructions ${instanceId}-status`}
          aria-disabled={!active}
          onPointerDown={onPaddlePointerDown}
          onClick={event => { if (event.detail === 0) react(); }}
          onKeyDown={onPaddleKeyDown}
          onKeyUp={event => {
            if (event.code === 'Space' || event.key === 'Enter') {
              event.preventDefault();
              heldKeyRef.current = false;
            }
          }}
          onBlur={() => { heldKeyRef.current = false; }}
        >
          <span><small>REACTION PADDLE</small><strong>{phase === 'go' ? 'NOW.' : active ? 'WAIT FOR IT.' : phase === 'result' ? 'RUN COMPLETE' : phase === 'jump' ? 'TRY AGAIN' : 'ARM THE LIGHTS FIRST'}</strong></span>
          <span className="reaction-paddle-key" aria-hidden="true">↵</span>
        </button>

        <div className="reaction-personal-best">
          <div><span>PERSONAL BEST</span><small>{storageAvailable ? 'SAVED IN THIS BROWSER' : 'THIS VISIT · STORAGE UNAVAILABLE'}</small></div>
          <strong>{record.best === null ? '—' : formatTime(record.best)}<small>{record.best === null ? '' : ' ms'}</small></strong>
        </div>
        <p className="reaction-disclaimer">Just a browser practice game. Display and input delays affect your time. No real driver comparison, rankings or race data.</p>
      </div>
    </section>
  );
}

export default ReactionChallenge;
