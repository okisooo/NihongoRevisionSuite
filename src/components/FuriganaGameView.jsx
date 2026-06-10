import React, { useState, useEffect, useRef } from 'react';
import { kanjiData } from '../data/kanji';
import { sentencesData } from '../data/sentences';
import { romajiToHiragana } from '../utils/romajiConverter';
import { parseRangeString } from '../utils/rangeParser';
import { SlidersHorizontal, Settings, HelpCircle, RefreshCw, CheckCircle2, Play, ArrowLeft, ArrowRight, Eye, EyeOff, Keyboard, Search } from 'lucide-react';
import FuriganaWord from './FuriganaWord';

// Segment matcher function
function matchTypedSegments(segments, typedText) {
  let remaining = typedText;
  let errorOccurred = false;
  
  const result = segments.map((seg) => {
    if (errorOccurred) {
      return { ...seg, typedRt: '', status: 'pending' };
    }
    
    if (!seg.rt) {
      // Okurigana segment (e.g. "しい" or "つ")
      if (remaining.length === 0) {
        return { ...seg, typedRt: '', status: 'pending' };
      }
      
      let matchLength = 0;
      while (matchLength < seg.ruby.length && matchLength < remaining.length) {
        if (seg.ruby[matchLength] === remaining[matchLength]) {
          matchLength++;
        } else {
          break;
        }
      }
      
      if (matchLength === remaining.length) {
        remaining = '';
        return { ...seg, typedRt: '', status: 'partial' };
      } else if (matchLength < remaining.length && matchLength === seg.ruby.length) {
        remaining = remaining.substring(seg.ruby.length);
        return { ...seg, typedRt: '', status: 'correct' };
      } else {
        errorOccurred = true;
        remaining = '';
        return { ...seg, typedRt: '', status: 'error' };
      }
    } else {
      // Kanji segment with target reading (e.g. "あたら")
      if (remaining.length === 0) {
        return { ...seg, typedRt: '', status: 'pending' };
      }
      
      if (seg.rt.startsWith(remaining)) {
        const typed = remaining;
        remaining = '';
        return { ...seg, typedRt: typed, status: 'partial' };
      } else if (remaining.startsWith(seg.rt)) {
        remaining = remaining.substring(seg.rt.length);
        return { ...seg, typedRt: seg.rt, status: 'correct' };
      } else {
        errorOccurred = true;
        const typed = remaining;
        remaining = '';
        return { ...seg, typedRt: typed, status: 'error' };
      }
    }
  });
  
  // Entire word is correct only if all segments are 'correct' and no remaining typed text
  const allCorrect = result.every(s => s.status === 'correct') && remaining.length === 0;
  
  return { segments: result, hasError: errorOccurred, allCorrect };
}

export default function FuriganaGameView() {
  const [view, setView] = useState('setup'); // setup, playing, summary
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(50);
  const [selectedIds, setSelectedIds] = useState(() => {
    return new Set(kanjiData.filter(k => k.id >= 1 && k.id <= 50 && !k.isRadical).map(k => k.id));
  });
  const [searchText, setSearchText] = useState('');
  const [customRangeText, setCustomRangeText] = useState('');
  const [checklistFilter, setChecklistFilter] = useState('all'); // all, selected
  const [showTranslation, setShowTranslation] = useState(false);

  // Game states
  const [gameSentences, setGameSentences] = useState([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [activeTargetIdx, setActiveTargetIdx] = useState(0);
  const [typedInput, setTypedInput] = useState('');
  const [targetStates, setTargetStates] = useState([]); // Array of { word, reading, segments, status: 'pending'|'correct'|'error', typedText: '' }
  const [stats, setStats] = useState({ totalKeystrokes: 0, errors: 0, startTime: 0, endTime: 0 });

  const inputRef = useRef(null);

  // Focus input helper
  useEffect(() => {
    if (view === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [view, currentSentenceIdx, activeTargetIdx]);

  // Keep input focused
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Filter Kanjis based on range & search
  const rangeKanjis = kanjiData.filter((k) => {
    if (k.isRadical) return false;
    if (customRangeText.trim()) {
      const activeIds = parseRangeString(customRangeText, 1, 300);
      return activeIds.has(k.id);
    }
    return k.id >= rangeFrom && k.id <= rangeTo;
  });

  const filteredRangeKanjis = rangeKanjis.filter((k) => {
    if (!searchText) return true;
    const query = searchText.toLowerCase();
    const matchesChar = k.kanji.includes(query);
    const matchesMeaning = k.meaning?.toLowerCase().includes(query);
    const rawReading = (k.reading || '').toLowerCase();
    return matchesChar || matchesMeaning || rawReading.includes(query);
  });

  const displayedChecklistKanjis = filteredRangeKanjis.filter(k => {
    if (checklistFilter === 'selected') {
      return selectedIds.has(k.id);
    }
    return true;
  });

  // Handle preset range click
  const handlePresetRange = (from, to) => {
    setRangeFrom(from);
    setRangeTo(to);
    setSearchText('');
    setCustomRangeText('');
    const newKanjis = kanjiData.filter(k => k.id >= from && k.id <= to && !k.isRadical);
    setSelectedIds(new Set(newKanjis.map(k => k.id)));
  };

  const handleApplyCustomRanges = () => {
    if (!customRangeText.trim()) return;
    const finalIds = parseRangeString(customRangeText, 1, 300);
    if (finalIds.size > 0) {
      setSelectedIds(finalIds);
      setSearchText('');
    }
  };

  const handleSelectAllFiltered = () => {
    const nextIds = new Set(selectedIds);
    filteredRangeKanjis.forEach((k) => nextIds.add(k.id));
    setSelectedIds(nextIds);
  };

  const handleDeselectAllFiltered = () => {
    const nextIds = new Set(selectedIds);
    filteredRangeKanjis.forEach((k) => nextIds.delete(k.id));
    setSelectedIds(nextIds);
  };

  const handleToggleId = (id) => {
    const nextIds = new Set(selectedIds);
    if (nextIds.has(id)) {
      nextIds.delete(id);
    } else {
      nextIds.add(id);
    }
    setSelectedIds(nextIds);
  };

  // Start the game
  const startGame = () => {
    if (selectedIds.size === 0) return;

    // Filter sentences that contain any of the selected Kanji IDs
    const matchedSentences = sentencesData.filter(s => selectedIds.has(s.kanjiId));
    if (matchedSentences.length === 0) {
      alert("No sentences found containing your selected Kanjis. Please select a different range.");
      return;
    }

    // Shuffle and pick up to 10 sentences
    const shuffled = [...matchedSentences].sort(() => Math.random() - 0.5);
    const selectedSentences = shuffled.slice(0, Math.min(10, shuffled.length));

    setGameSentences(selectedSentences);
    setCurrentSentenceIdx(0);
    setupSentence(selectedSentences[0]);
    setStats({ totalKeystrokes: 0, errors: 0, startTime: Date.now(), endTime: 0 });
    setView('playing');
  };

  // Setup current sentence targets
  const setupSentence = (sentenceObj) => {
    if (!sentenceObj) return;
    const initialTargets = sentenceObj.targets.map(t => ({
      ...t,
      status: 'pending',
      typedText: ''
    }));
    setTargetStates(initialTargets);
    setActiveTargetIdx(0);
    setTypedInput('');
    setShowTranslation(false);
  };

  // Handle typing input
  const handleInputChange = (e) => {
    const val = e.target.value;
    // Convert Romaji to Hiragana in real-time
    const converted = romajiToHiragana(val);
    
    setTypedInput(val);
    setStats(s => ({ ...s, totalKeystrokes: s.totalKeystrokes + 1 }));

    const activeTarget = targetStates[activeTargetIdx];
    if (!activeTarget) return;

    // Match converted hiragana text with target segments
    const match = matchTypedSegments(activeTarget.segments, converted);

    // Update target state
    const nextStates = [...targetStates];
    nextStates[activeTargetIdx] = {
      ...activeTarget,
      typedText: converted,
      matchResult: match.segments,
      status: match.allCorrect ? 'correct' : (match.hasError ? 'error' : 'pending')
    };

    if (match.hasError) {
      setStats(s => ({ ...s, errors: s.errors + 1 }));
    }

    setTargetStates(nextStates);

    // If fully correct, advance to the next target word
    if (match.allCorrect) {
      setTypedInput('');
      if (activeTargetIdx + 1 < targetStates.length) {
        setActiveTargetIdx(idx => idx + 1);
      } else {
        // All targets in sentence correct!
        setTimeout(() => {
          handleNextSentence();
        }, 800);
      }
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIdx + 1 < gameSentences.length) {
      const nextIdx = currentSentenceIdx + 1;
      setCurrentSentenceIdx(nextIdx);
      setupSentence(gameSentences[nextIdx]);
    } else {
      // Game completed!
      setStats(s => ({ ...s, endTime: Date.now() }));
      setView('summary');
    }
  };

  // Render the sentence with interactive inputs
  const renderInteractiveSentence = () => {
    const currentSentence = gameSentences[currentSentenceIdx];
    if (!currentSentence) return null;

    const text = currentSentence.sentence;
    const targets = currentSentence.targets;

    // We split the sentence by target words and render them
    let elements = [];
    let lastIndex = 0;

    // Sort targets by their occurrence in the sentence to split properly
    const sortedTargets = [...targets].map(t => {
      const pos = text.indexOf(t.word);
      return { ...t, pos };
    }).sort((a, b) => a.pos - b.pos);

    sortedTargets.forEach((t, idx) => {
      const pos = text.indexOf(t.word, lastIndex);
      if (pos === -1) return;

      // Add preceding plain text
      if (pos > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`} className="sentence-plain-text">
            {text.substring(lastIndex, pos)}
          </span>
        );
      }

      // Add target Kanji word
      const targetStateIdx = targets.findIndex(orig => orig.word === t.word);
      const state = targetStates[targetStateIdx] || { status: 'pending', typedText: '', segments: t.segments };
      
      const isActive = targetStateIdx === activeTargetIdx;
      let targetClass = "game-target-word";
      if (isActive) targetClass += " active";
      if (state.status === 'correct') targetClass += " correct";
      if (state.status === 'error') targetClass += " error";

      // Render ruby segments with typed characters
      elements.push(
        <span key={`target-${idx}`} className={targetClass}>
          {state.segments.map((seg, sIdx) => {
            const matchSeg = state.matchResult ? state.matchResult[sIdx] : null;
            const typedRt = matchSeg ? matchSeg.typedRt : '';
            const isError = matchSeg?.status === 'error';
            const isCorrect = matchSeg?.status === 'correct' || matchSeg?.status === 'partial';

            return seg.rt ? (
              <ruby key={sIdx} className="game-ruby">
                {seg.ruby}
                <rt className={`game-rt ${isError ? 'error' : (isCorrect ? 'typed' : '')}`}>
                  {typedRt || <span className="placeholder-dot">.</span>}
                </rt>
              </ruby>
            ) : (
              <span key={sIdx} className="game-okurigana-part">{seg.ruby}</span>
            );
          })}
        </span>
      );

      lastIndex = pos + t.word.length;
    });

    // Add trailing plain text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-end`} className="sentence-plain-text">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <div className="interactive-sentence-container">{elements}</div>;
  };

  if (view === 'setup') {
    const presets = [
      { label: '1 - 50', from: 1, to: 50 },
      { label: '51 - 100', from: 51, to: 100 },
      { label: '101 - 150', from: 101, to: 150 },
      { label: '151 - 200', from: 151, to: 200 },
      { label: '201 - 250', from: 201, to: 250 },
      { label: '251 - 300', from: 251, to: 300 }
    ];

    return (
      <div className="quiz-container">
        <div className="glass-panel quiz-setup-panel">
          <div className="dictionary-header">
            <Keyboard className="icon" size={28} />
            <h2>Furigana Writing Practice</h2>
          </div>

          <p className="game-description-text" style={{ margin: '12px 0 24px', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Practice writing correct Kanji readings in full sentences! Type either in <strong>Romaji</strong> or <strong>Hiragana</strong>. Mistakes are flagged immediately. Complete the sentence by typing the readings of all highlighted Kanji words.
          </p>

          {/* 1. Range Selector */}
          <div className="setup-group">
            <h3>Filter Range</h3>
            <div className="preset-grid" style={{ marginBottom: '16px' }}>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  className={`preset-button ${
                    rangeFrom === preset.from && rangeTo === preset.to && !customRangeText ? 'active' : ''
                  }`}
                  onClick={() => handlePresetRange(preset.from, preset.to)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Multi-Range Input */}
            <div className="custom-multi-range-container">
              <label className="study-label">Multi-Range Input (Comma-separated ranges or IDs):</label>
              <div className="custom-range-input-row">
                <input 
                  type="text" 
                  className="selection-search-input range"
                  placeholder="e.g. 101-140, -111-120"
                  value={customRangeText}
                  onChange={(e) => setCustomRangeText(e.target.value)}
                />
                <button className="quick-sel-btn apply-range-btn" onClick={handleApplyCustomRanges}>
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* 2. Detailed Kanji Checkbox Selection Grid */}
          <div className="setup-group" style={{ marginTop: '16px' }}>
            <div className="kanji-selection-header">
              <h3>Select Kanjis to Practice ({selectedIds.size} selected)</h3>
              <div className="select-links">
                <span className="select-link" onClick={handleSelectAllFiltered}>Select All Filtered</span>
                <span className="select-link" onClick={handleDeselectAllFiltered}>Clear All</span>
              </div>
            </div>

            {/* Display Mode Toggles and Search */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              {/* Checklist display filter */}
              <div className="checklist-filter-selector">
                <button 
                  className={`filter-btn ${checklistFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setChecklistFilter('all')}
                >
                  Show All
                </button>
                <button 
                  className={`filter-btn ${checklistFilter === 'selected' ? 'active' : ''}`}
                  onClick={() => setChecklistFilter('selected')}
                >
                  Selected Only ({selectedIds.size})
                </button>
              </div>

              {/* Search Box */}
              <div className="selection-search-container" style={{ flex: 1 }}>
                <Search className="search-icon" size={16} />
                <input 
                  type="text"
                  className="selection-search-input"
                  placeholder="Search by Kanji, reading, meaning..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            {filteredRangeKanjis.length === 0 ? (
              <div className="empty-message" style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No Kanjis found matching search/filter.
              </div>
            ) : (
              <div className="kanji-selection-list">
                {displayedChecklistKanjis.map((k) => (
                  <label 
                    key={k.id} 
                    className={`kanji-select-box ${selectedIds.has(k.id) ? 'selected' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      style={{ display: 'none' }}
                      checked={selectedIds.has(k.id)} 
                      onChange={() => handleToggleId(k.id)}
                    />
                    <span className="char">{k.kanji}</span>
                    <span className="id">#{k.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Start Button */}
          <button 
            className="action-button primary start-quiz-btn"
            style={{ width: '100%', marginTop: '20px', padding: '16px', borderRadius: '14px', fontSize: '1.1rem' }}
            disabled={selectedIds.size === 0}
            onClick={startGame}
          >
            <Play size={20} style={{ marginRight: '8px' }} /> Start Furigana Practice
          </button>
        </div>
      </div>
    );
  }

  if (view === 'playing') {
    const currentSentence = gameSentences[currentSentenceIdx];
    const activeTarget = targetStates[activeTargetIdx];

    return (
      <div className="quiz-container" onClick={handleContainerClick} style={{ cursor: 'text' }}>
        <div className="header" style={{ marginBottom: '24px' }}>
          <div className="progress">
            Sentence {currentSentenceIdx + 1} / {gameSentences.length}
          </div>
          <div className="score">
            Errors: {stats.errors}
          </div>
        </div>

        <div className="glass-panel furigana-game-panel" style={{ padding: '48px 32px', textAlign: 'center', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Active target helper hint */}
          <div className="active-target-hint-banner">
            Type reading for: <span className="highlight-word">{activeTarget?.word}</span>
          </div>

          {/* Large Sentence Display */}
          <div className="game-sentence-display">
            {renderInteractiveSentence()}
          </div>

          {/* Inputs & Helpers */}
          <div className="game-input-section" style={{ marginTop: '36px' }}>
            {/* Hidden Input box but always focused */}
            <input 
              ref={inputRef}
              type="text" 
              value={typedInput}
              onChange={handleInputChange}
              className="game-keystroke-input"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder="Type reading here..."
            />

            {/* Helper display of typed input */}
            <div className="typed-preview-container">
              <span className="typed-preview-label">Active Input:</span>
              <span className="typed-preview-val">{romajiToHiragana(typedInput) || <span className="blink-cursor">|</span>}</span>
            </div>

            {/* Show/Hide Translation */}
            <div className="translation-toggle-container" style={{ marginTop: '24px' }}>
              <button 
                className="control-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTranslation(!showTranslation);
                }}
              >
                {showTranslation ? <EyeOff size={16} /> : <Eye size={16} />}
                {showTranslation ? "Hide English" : "Show English Translation"}
              </button>

              {showTranslation && (
                <div className="game-translation-card animate-fade-in">
                  <p>{currentSentence?.translation}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          className="control-button back-to-setup-btn"
          style={{ marginTop: '20px' }}
          onClick={(e) => {
            e.stopPropagation();
            setView('setup');
          }}
        >
          <ArrowLeft size={16} /> Quit Game
        </button>
      </div>
    );
  }

  if (view === 'summary') {
    const timeSpentSec = Math.round((stats.endTime - stats.startTime) / 1000);
    const min = Math.floor(timeSpentSec / 60);
    const sec = timeSpentSec % 60;
    const accuracy = stats.totalKeystrokes > 0 
      ? Math.round(((stats.totalKeystrokes - stats.errors) / stats.totalKeystrokes) * 100) 
      : 100;

    return (
      <div className="quiz-container">
        <div className="glass-panel summary-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <CheckCircle2 size={64} className="success-icon" style={{ color: '#10b981', margin: '0 auto 20px' }} />
          <h2>Practice Completed!</h2>
          <p className="summary-subtitle" style={{ color: 'rgba(255,255,255,0.7)', margin: '8px 0 32px' }}>
            Excellent job practicing your Kanji readings in context!
          </p>

          <div className="stats-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div className="stat-card" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="stat-label" style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>Sentences Practiced</span>
              <strong className="stat-val" style={{ fontSize: '2rem', color: '#6366f1' }}>{gameSentences.length}</strong>
            </div>
            <div className="stat-card" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="stat-label" style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>Accuracy Rate</span>
              <strong className="stat-val" style={{ fontSize: '2rem', color: '#10b981' }}>{accuracy}%</strong>
            </div>
            <div className="stat-card" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="stat-label" style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>Time Elapsed</span>
              <strong className="stat-val" style={{ fontSize: '2rem', color: '#f59e0b' }}>{min > 0 ? `${min}m ` : ''}{sec}s</strong>
            </div>
          </div>

          <div className="sentences-review-section" style={{ textAlign: 'left', marginTop: '30px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Sentence Review</h3>
            <div className="sentences-review-list" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
              {gameSentences.map((s, idx) => (
                <div key={idx} className="review-sentence-card" style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className="review-sentence-text" style={{ fontSize: '1.2rem', marginBottom: '8px', lineHeight: '1.8' }}>
                    {s.sentence.split('').map((char, cIdx) => {
                      const target = s.targets.find(t => t.word.includes(char));
                      if (target) {
                        return <strong key={cIdx} style={{ color: '#818cf8' }}>{char}</strong>;
                      }
                      return <span key={cIdx}>{char}</span>;
                    })}
                  </div>
                  <div className="review-sentence-targets" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {s.targets.map((t, tIdx) => (
                      <span key={tIdx} className="review-target-badge" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.85rem', color: '#c7d2fe' }}>
                        <FuriganaWord segments={t.segments} />
                      </span>
                    ))}
                  </div>
                  <div className="review-sentence-translation" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                    {s.translation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-controls" style={{ marginTop: '36px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button 
              className="action-button primary"
              style={{ padding: '12px 28px', borderRadius: '10px' }}
              onClick={() => setView('setup')}
            >
              <RefreshCw size={18} style={{ marginRight: '8px' }} /> Practice Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
