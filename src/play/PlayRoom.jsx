import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Headphones, Lightbulb, Play, RotateCcw, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { useProgress, updateProgress, getWarning } from '../study/store';
import { rushOf } from '../rush/mastery';
import { matchTarget } from '../rush/engine';
import { romajiFor } from '../rush/romaji';
import { say, setSound, sfx } from '../rush/audio';
import { ROUNDS, recommendedSet, roundDeck, currentPrompt, startRound, changeRound } from './round';

const labels = { kana: 'sound trail', kanji: 'character trail' };
const answerOf = prompt => prompt.kind === 'meaning' ? prompt.answers[0] : romajiFor(prompt.answers[0]);
const taskOf = prompt => prompt.kind === 'meaning' ? 'what does it mean?' : 'how does it sound?';

function useRoundSave() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const working = useRef(false);
  const save = useCallback(async change => {
    if (working.current) return false;
    working.current = true;
    setBusy(true);
    try {
      await updateProgress(change);
      setError('');
      return true;
    } catch {
      setError('could not save. your answer is still here — free some space and try again.');
      return false;
    } finally {
      working.current = false;
      setBusy(false);
    }
  }, []);
  return { save, busy, error };
}

export function PlayRoom() {
  const progress = useProgress();
  const rush = rushOf(progress);
  const [track, setTrack] = useState(() => progress.flow?.track || (Object.keys(rush.kanji).length ? 'kanji' : 'kana'));
  const [chosen, setChosen] = useState(null);
  const { save, busy, error } = useRoundSave();
  const navigate = useNavigate();
  const active = progress.flow && !progress.flow.finished ? progress.flow : null;
  const set = ROUNDS[track].find(s => s.id === chosen) || (active?.track === track ? ROUNDS[track].find(s => s.id === active.set) : null) || recommendedSet(progress, track);
  const deck = roundDeck(track, set.id);
  const symbols = [...new Set(deck.map(p => p.text))].slice(0, 5);
  const resumable = active?.track === track && active.set === set.id;
  const known = Object.values(track === 'kana' ? rush.kana : rush.kanji).some(v => v.learned);
  const begin = async () => {
    if (resumable || await save(p => startRound(p, track, set.id, Date.now()))) navigate('/play');
  };
  return (
    <section className="play-room" aria-label="play room">
      <div className="room-topline"><span><i /> the play room</span><span>{rush.total.toLocaleString('en')} points</span></div>
      <div className="room-welcome"><h1>a little practice.<br /><em>a little play.</em></h1><p>pick it up. find a rhythm. see what sticks.</p></div>
      <div className="room-cartridge">
        <div className="room-track-switch" role="group" aria-label="practice track">
          {['kana', 'kanji'].map(t => <button key={t} aria-pressed={track === t} onClick={() => { setTrack(t); setChosen(null); }}>{t === 'kana' ? 'sounds' : 'characters'}</button>)}
        </div>
        <div className="room-symbols" role="group" aria-label="characters in this set">
          {symbols.map((glyph, i) => <span key={glyph} className="room-key" style={{ '--i': i }} lang="ja">{glyph}</span>)}
        </div>
        <div className="room-selection">
          <div><span className="room-kicker">{labels[track]}</span><h2>{set.name}</h2></div>
          <label className="room-set-select"><span className="sr-only">choose a set</span><select value={set.id} onChange={e => setChosen(e.target.value)}>{ROUNDS[track].map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><ChevronDown size={15} /></label>
        </div>
        <button className="room-start" onClick={begin} disabled={busy}><span>{busy ? 'getting ready…' : resumable ? 'back to your round' : 'let’s play'}</span><ArrowRight size={23} /></button>
        <p className="room-promise">{resumable ? `${active.clean} clean recalls saved. right where you left off.` : 'a few new faces. then remember them for yourself.'}</p>
      </div>
      <div className="room-bottom"><span>play at your pace</span><div>{known ? <Link to={`/${track}/play?mode=challenge`}><Zap size={14} /> rush</Link> : <span className="room-locked"><Zap size={14} /> rush opens after a round</span>}<Link to={`/${track}`}>practice tools <ArrowRight size={14} /></Link></div></div>
      {error && <p className="room-error" role="alert">{error}</p>}
      {getWarning() && <p className="room-error" role="alert">{getWarning()} <Link to="/settings">open backups</Link></p>}
    </section>
  );
}

function RoundComplete({ flow, progress, save, busy, error }) {
  const next = recommendedSet(progress, flow.track);
  const again = (set = next.id) => save(p => startRound(p, flow.track, set, Date.now()));
  return <section className="flow-end" aria-labelledby="round-complete">
    <div className="flow-end-mark"><Check size={35} strokeWidth={2.5} /></div>
    <p className="room-kicker">round complete</p><h1 id="round-complete">that’s sticking.</h1>
    <p className="flow-end-copy">{flow.ids.length} {flow.track === 'kana' ? 'sounds' : 'skills'} recalled twice, without the answer showing.</p>
    <div className="flow-end-stats"><div><strong>+{flow.score}</strong><span>points</span></div><div><strong>{flow.maxCombo}</strong><span>best combo</span></div><div><strong>{flow.clean}</strong><span>clean recalls</span></div></div>
    <button className="room-start" onClick={() => again()} disabled={busy}>one more round <ArrowRight size={22} /></button>
    <p className="flow-next-label">up next · {next.name}</p>
    <div className="flow-end-links"><button onClick={() => again(flow.set)} disabled={busy}><RotateCcw size={14} /> replay this set</button><Link to="/">back to the room <ArrowRight size={14} /></Link></div>
    {error && <p className="room-error" role="alert">{error}</p>}
  </section>;
}

export function FlowPlay() {
  const progress = useProgress();
  const flow = progress.flow;
  const rush = rushOf(progress);
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState(false);
  const { save, busy, error } = useRoundSave();
  const input = useRef(null);
  const composing = useRef(false);
  const feedback = flow?.feedback;
  const current = flow?.queue[0];
  const prompt = flow && !flow.finished ? currentPrompt(flow) : null;
  const guide = current?.guide || flow?.assisted;
  const answer = prompt ? answerOf(prompt) : '';
  const advance = useCallback(async () => {
    if (await save(p => changeRound(p, 'next', null, Date.now()))) { setText(''); setWrong(false); }
  }, [save]);

  useEffect(() => { setSound(rush.settings.sound); }, [rush.settings.sound]);
  useEffect(() => {
    if (!feedback) return;
    if (feedback.kind === 'clean') sfx.clear(flow.combo, false);
    else sfx.hint();
    const timer = setTimeout(advance, 560);
    return () => clearTimeout(timer);
  }, [feedback, flow?.combo, advance]);
  useEffect(() => { input.current?.focus({ preventScroll: true }); }, [prompt?.id, current?.guide, feedback]);

  const submit = async value => {
    if (!prompt || busy || feedback) return;
    if (matchTarget(prompt, value).complete) {
      await save(p => changeRound(p, 'answer', value, Date.now()));
    } else {
      setWrong(true);
      sfx.wrong();
      await save(p => changeRound(p, 'reveal', null, Date.now()));
      input.current?.select();
    }
  };
  const typed = value => {
    setText(value);
    setWrong(false);
    if (!composing.current && prompt) {
      const match = matchTarget(prompt, value);
      if (match.complete && !match.more) submit(value);
    }
  };
  const toggleSound = () => save(p => {
    const r = rushOf(p);
    return { ...p, rush: { ...r, settings: { ...r.settings, sound: !r.settings.sound } } };
  });

  if (!flow) return <section className="flow-empty"><Play size={32} /><h1>ready when you are.</h1><Link className="room-start" to="/">choose a round <ArrowRight /></Link></section>;
  if (flow.finished) return <RoundComplete flow={flow} progress={progress} save={save} busy={busy} error={error} />;
  const completed = flow.clean;
  const total = flow.ids.length * 2;
  return <section className={`flow-stage ${feedback ? `has-feedback feedback-${feedback.kind}` : ''}`} aria-label="practice round">
    <div className="flow-topbar"><Link to="/" aria-label="leave round and save your place"><X size={20} /></Link><span>{labels[flow.track]} <i>/</i> {ROUNDS[flow.track].find(s => s.id === flow.set)?.name}</span><button aria-label={rush.settings.sound ? 'mute sound' : 'enable sound'} onClick={toggleSound} disabled={busy}>{rush.settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button></div>
    <div className="flow-progress" role="progressbar" aria-label="clean recalls" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}><div style={{ width: `${completed / total * 100}%` }} /></div>
    <div className="flow-scoreline"><span>{current.guide ? 'meet a new one' : flow.assisted ? 'let’s get this one' : 'from memory'}</span><strong className={flow.combo >= 3 ? 'is-combo' : ''}>{flow.combo >= 3 ? <Zap size={14} /> : null}{flow.combo >= 3 ? `${flow.combo} combo` : `${flow.score} pts`}</strong></div>
    <div className="flow-question" key={`${prompt.id}:${current.guide}:${flow.clears}`}>
      <p className="flow-task">{taskOf(prompt)}</p>
      <h1 lang="ja">{prompt.text}</h1>
      <div className="flow-cue" aria-live="polite">{guide ? <><strong>{answer}</strong><span>{wrong ? 'type this once. we’ll bring it back.' : current.guide ? 'type it once. then we’ll hide it.' : 'a little help. try it again in a moment.'}</span></> : <span>you’ve met this one. take your time.</span>}</div>
      {prompt.kind !== 'meaning' && <button className="flow-hear" onClick={() => say(prompt.say, { rate: 0.85 })} aria-label="hear the sound"><Headphones size={16} /> listen</button>}
    </div>
    <form className="flow-answer" onSubmit={e => { e.preventDefault(); submit(text); }}>
      <label htmlFor="flow-answer" className="sr-only">{prompt.kind === 'meaning' ? 'type an English meaning' : 'type in romaji or kana'}</label>
      <div className={`flow-input ${wrong ? 'is-wrong' : ''}`}><input ref={input} id="flow-answer" value={text} onChange={e => composing.current ? setText(e.target.value) : typed(e.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={e => { composing.current = false; typed(e.currentTarget.value); }} disabled={busy || !!feedback} placeholder={prompt.kind === 'meaning' ? 'type the meaning…' : 'type the sound…'} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} enterKeyHint="go" /><button type="submit" aria-label="check answer" disabled={busy || !!feedback || !text.trim()}>{feedback ? <Check size={21} /> : <ArrowRight size={21} />}</button></div>
      <div className="flow-feedback" role="status">{feedback ? <span className="flow-success">{feedback.kind === 'clean' ? `nice. +${feedback.points}` : feedback.kind === 'learn' ? 'got it. now make it yours.' : 'got it. this one will come back.'}</span> : <span>{error || (wrong ? 'a little reset. try the answer above.' : 'enter to check · correct answers move on')}</span>}</div>
    </form>
    {error && <p className="room-error" role="alert">{error} <button onClick={feedback ? advance : () => submit(text)} disabled={busy}>try saving again</button></p>}
    <div className="flow-bottom"><span>{completed} / {total} clean recalls</span><button disabled={busy || !!feedback || !!guide} onClick={() => save(p => changeRound(p, 'reveal', null, Date.now()))}><Lightbulb size={15} /> show me</button></div>
    <Link className="flow-leave" to="/"><ArrowLeft size={13} /> save & leave</Link>
  </section>;
}
