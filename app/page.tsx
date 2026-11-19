'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Compass, Heart, House, MapPin, Sparkles, X } from 'lucide-react';
import type { Decision, Match, Profile, SwipeResult } from '../lib/types';

type View = 'discover' | 'home' | 'matches';
const tabs = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'discover', label: 'Discover', Icon: Compass },
  { id: 'matches', label: 'Matches', Icon: Heart },
] as const;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...options });
  if (!response.ok) throw new Error('Request failed.');
  return response.json();
}

export default function DiscoverApp() {
  const [view, setView] = useState<View>('discover');
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState('');
  const [swipeError, setSwipeError] = useState('');
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<Decision | null>(null);
  const [newMatch, setNewMatch] = useState<Match | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const drag = useRef<{ id: number; start: number } | null>(null);
  const committing = useRef(false);
  const swipedIds = useRef(new Set<string>());
  const dialog = useRef<HTMLDialogElement>(null);
  const likeButton = useRef<HTMLButtonElement>(null);
  const profile = profiles?.[0];

  useEffect(() => {
    function readHash() {
      const hash = window.location.hash.slice(1);
      setView(hash === 'home' || hash === 'matches' ? hash : 'discover');
    }
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  useEffect(() => {
    if (view === 'home') return;
    const controller = new AbortController();
    const options = { signal: controller.signal };

    async function load() {
      setError('');
      try {
        if (view === 'discover') {
          const result = await request<{ profiles: Profile[] }>('/feed', options);
          if (!controller.signal.aborted) {
            setProfiles(result.profiles.filter(profile => !swipedIds.current.has(profile.id)));
          }
        } else {
          const result = await request<{ matches: Match[] }>('/matches', options);
          if (!controller.signal.aborted) setMatches(result.matches);
        }
      } catch {
        if (!controller.signal.aborted) setError('Couldn’t load this view. Try again.');
      }
    }

    void load();
    return () => controller.abort();
  }, [view, reloadKey]);

  useEffect(() => {
    if (newMatch && !dialog.current?.open) dialog.current?.showModal();
  }, [newMatch]);

  function navigate(next: View) {
    setView(next);
    window.location.hash = next;
  }

  async function swipe(decision: Decision) {
    if (!profile || committing.current) return;
    committing.current = true;
    setSwipeError('');
    setLeaving(decision);
    const animation = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250;
    const finished = new Promise(resolve => window.setTimeout(resolve, animation));
    try {
      const [result] = await Promise.all([
        request<SwipeResult>('/swipe', {
          method: 'POST',
          signal: AbortSignal.timeout(10000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: profile.id, decision }),
        }),
        finished,
      ]);
      swipedIds.current.add(profile.id);
      setProfiles(current => current?.filter(item => item.id !== profile.id) ?? null);
      setStatus(`${result.recordedDecision === 'like' ? 'Liked' : 'Passed on'} ${profile.name}.`);
      if (result.match) {
        setReloadKey(key => key + 1);
        if (result.createdMatch) setNewMatch(result.match);
      }
    } catch {
      await finished;
      setSwipeError('Couldn’t confirm your swipe. Try again to continue.');
    } finally {
      setLeaving(null);
      setOffset(0);
      committing.current = false;
    }
  }

  function pointerDown(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0 || committing.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, start: event.clientX };
    setDragging(true);
  }

  function pointerMove(event: PointerEvent<HTMLElement>) {
    if (drag.current?.id === event.pointerId) setOffset(event.clientX - drag.current.start);
  }

  function release(event: PointerEvent<HTMLElement>, cancelled = false) {
    if (drag.current?.id !== event.pointerId) return;
    const distance = event.clientX - drag.current.start;
    drag.current = null;
    setDragging(false);
    if (!cancelled && Math.abs(distance) >= 78) {
      void swipe(distance > 0 ? 'like' : 'pass');
    } else {
      setOffset(0);
    }
  }

  const stamp = leaving ?? (offset > 28 ? 'like' : offset < -28 ? 'pass' : null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <a href="#discover" onClick={() => navigate('discover')} className="wordmark" aria-label="Coy Discover">
            <Sparkles size={20} strokeWidth={1.8} aria-hidden="true" /> coy<span>.</span>
          </a>
          <nav aria-label="Main navigation">
            {tabs.map(({ id, label, Icon }) => (
              <a key={id} href={`#${id}`} aria-current={view === id ? 'page' : undefined}
                onClick={event => { event.preventDefault(); navigate(id); }}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" /> <span>{label}</span>
              </a>
            ))}
          </nav>
        </div>
      </header>

      {view === 'home' && <main aria-label="Home" />}

      {view === 'discover' && (
        <main className="page" aria-label="Discover">
          <div className="page-heading">
            <div>
              <h1>Discover<span>.</span></h1>
              <p>Swipe right to like, left to pass. A match takes two.</p>
            </div>
            {profiles && profiles.length > 0 && (
              <p className="remaining"><span />{profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'} left</p>
            )}
          </div>

          {error ? (
            <div className="state" role="alert"><p>{error}</p><button className="primary" onClick={() => setReloadKey(key => key + 1)}>Try again</button></div>
          ) : profiles === null ? (
            <div className="state" role="status"><Compass className="loading" aria-hidden="true" /><p>Loading profiles…</p></div>
          ) : profile ? (
            <div className="deck">
              <article key={profile.id}
                className={`profile-card${dragging ? ' dragging' : ''}${leaving ? ' leaving ' + leaving : ''}`}
                style={{ '--drag-x': `${offset}px`, '--drag-rotation': `${offset / 36}deg` } as React.CSSProperties}
                onPointerDown={pointerDown} onPointerMove={pointerMove}
                onPointerUp={event => release(event)} onPointerCancel={event => release(event, true)}
                onLostPointerCapture={event => release(event, true)}
                aria-label={`${profile.name}, ${profile.age}`}>
                <div className="profile-photo">
                  {/* The seed uses small, local WebP placeholders. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.photo} alt={`Portrait placeholder for ${profile.name}`} draggable={false} />
                  {stamp && <span className={`stamp ${stamp}`} aria-hidden="true">{stamp === 'like' ? 'LIKE' : 'PASS'}</span>}
                </div>
                <div className="profile-details">
                  <div className="profile-identity">
                    <p className="location"><MapPin size={16} aria-hidden="true" /> {profile.city}</p>
                    <h2>{profile.name}<span>, {profile.age}</span></h2>
                  </div>
                  <p className="bio">{profile.bio}</p>
                  <ul className="interests" aria-label="Interests">
                    {profile.interests.map(interest => <li key={interest}>{interest}</li>)}
                  </ul>
                </div>
              </article>
              <div className="actions" aria-label="Swipe controls">
                <button className="pass-button" disabled={Boolean(leaving)} onClick={() => void swipe('pass')}>
                  <X size={22} aria-hidden="true" /> Pass
                </button>
                <button ref={likeButton} className="primary like-button" disabled={Boolean(leaving)} onClick={() => void swipe('like')}>
                  <Heart size={21} aria-hidden="true" /> Like
                </button>
              </div>
              {swipeError && <p className="swipe-error" role="alert">{swipeError}</p>}
            </div>
          ) : (
            <div className="state">
              <Compass size={32} aria-hidden="true" />
              <h2>You’re all caught up.</h2>
              <p>You’ve seen every profile in Discover.</p>
              <button className="primary" onClick={() => navigate('matches')}>View matches <ArrowRight size={17} aria-hidden="true" /></button>
            </div>
          )}
        </main>
      )}

      {view === 'matches' && (
        <main className="page" aria-label="Matches">
          <div className="page-heading">
            <div><h1>Matches<span>.</span></h1><p>People you’ve liked who liked you back.</p></div>
          </div>
          {error ? (
            <div className="state" role="alert"><p>{error}</p><button className="primary" onClick={() => setReloadKey(key => key + 1)}>Try again</button></div>
          ) : matches === null ? (
            <div className="state" role="status"><Heart aria-hidden="true" /><p>Loading matches…</p></div>
          ) : matches.length === 0 ? (
            <div className="state">
              <Heart size={32} aria-hidden="true" /><h2>No matches yet.</h2>
              <p>When the interest is mutual, the match will appear here.</p>
              <button className="primary" onClick={() => navigate('discover')}><ArrowLeft size={17} aria-hidden="true" /> Back to Discover</button>
            </div>
          ) : (
            <ul className="match-list">
              {matches.map(({ profile: person, matchedAt }) => (
                <li key={person.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.photo} alt="" loading="lazy" />
                  <div><h2>{person.name}, {person.age}</h2><p>{person.city}</p>
                    <time dateTime={matchedAt}>{new Date(matchedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</time>
                  </div>
                  <Heart className="mutual-heart" size={20} aria-hidden="true" />
                </li>
              ))}
            </ul>
          )}
        </main>
      )}

      <p className="visually-hidden" role="status">{status}</p>
      <dialog ref={dialog} className="match-dialog" aria-labelledby="match-title"
        onClose={() => { setNewMatch(null); likeButton.current?.focus(); }}>
        {newMatch && (
          <>
            <div className="match-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={newMatch.profile.photo} alt="" />
              <span><Heart size={23} fill="currentColor" aria-hidden="true" /></span>
            </div>
            <h2 id="match-title">It’s a match!</h2>
            <p>You and {newMatch.profile.name} liked each other.</p>
            <button className="primary" onClick={() => dialog.current?.close()} autoFocus>Keep discovering</button>
            <button className="text-button" onClick={() => { dialog.current?.close(); navigate('matches'); }}>View matches <ArrowRight size={16} aria-hidden="true" /></button>
          </>
        )}
      </dialog>
    </div>
  );
}
