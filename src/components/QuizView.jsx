import { useState, useEffect } from 'react';
import { kanjiData } from '../data/kanji';
import { componentsDb, kanjiDecompositions } from '../data/components';
import { 
  SlidersHorizontal, 
  Settings, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  Search, 
  BookOpen, 
  Play, 
  ArrowLeft, 
  ArrowRight, 
  Trash2 
} from 'lucide-react';
import { parseRangeString } from '../utils/rangeParser';

export default function QuizView() {
  // Setup states
  const [view, setView] = useState('setup'); // setup, playing, summary, study
  const [quizMode, setQuizMode] = useState('meaning'); // meaning, reading
  const [numQuestions, setNumQuestions] = useState(10); // 10, 20, 50, all
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(50);
  const [selectedIds, setSelectedIds] = useState(() => {
    return new Set(kanjiData.filter(k => k.id >= 1 && k.id <= 50 && !k.isRadical).map(k => k.id));
  });
  const [searchText, setSearchText] = useState('');
  const [customRangeText, setCustomRangeText] = useState('');
  const [checklistFilter, setChecklistFilter] = useState('all'); // all, selected
  const [studyIdx, setStudyIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [weakIdsCount, setWeakIdsCount] = useState(0);

  // Game states
  const [quizList, setQuizList] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing'); // playing, answered
  const [selectedOption, setSelectedOption] = useState(null);
  const [history, setHistory] = useState([]); // Array of { kanji, correct, userAnswer, correctAnswer }

  // Clean meanings helper
  const cleanMeaning = (meaning) => {
    if (!meaning) return '';
    const cleanStr = meaning.replace(/^\[Radical\]\s*/, '');
    return cleanStr.split(', ').slice(0, 2).join(', ');
  };

  // Format readings helper
  const formatReadingString = (readingStr) => {
    if (!readingStr) return '';
    return toHiragana(readingStr)
      .split(' / ')
      .map((r) => {
        if (r.includes('.')) {
          const [main, okuri] = r.split('.');
          return `${main}(${okuri})`;
        }
        return r;
      })
      .slice(0, 2) // Limit to top 2 readings on the button to prevent clutter
      .join(' / ');
  };

  // Kanjis available in the current selected range
  const rangeKanjis = kanjiData.filter((k) => {
    if (k.isRadical) return false;
    if (customRangeText.trim()) {
      const activeIds = parseRangeString(customRangeText, 1, 300);
      return activeIds.has(k.id);
    }
    return k.id >= rangeFrom && k.id <= rangeTo;
  });

  // Kanjis filtered by search text
  const filteredRangeKanjis = rangeKanjis.filter((k) => {
    if (!searchText) return true;
    const query = searchText.toLowerCase();
    const matchesChar = k.kanji.includes(query);
    const matchesMeaning = k.meaning?.toLowerCase().includes(query);
    const rawReading = (k.reading || '').toLowerCase();
    const onyomiString = (k.onyomi || []).join(' ').toLowerCase();
    const kunyomiString = (k.kunyomi || []).join(' ').toLowerCase();
    return (
      matchesChar || 
      matchesMeaning || 
      rawReading.includes(query) || 
      onyomiString.includes(query) || 
      kunyomiString.includes(query)
    );
  });

  // Kanjis to display in the checklist grid
  const displayedChecklistKanjis = filteredRangeKanjis.filter(k => {
    if (checklistFilter === 'selected') {
      return selectedIds.has(k.id);
    }
    return true;
  });

  // Load weak kanjis count on mount
  const getWeakKanjisCount = () => {
    try {
      const weakJson = localStorage.getItem('weak_kanji_ids') || '[]';
      const weakIds = JSON.parse(weakJson);
      return Array.isArray(weakIds) ? weakIds.length : 0;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    setWeakIdsCount(getWeakKanjisCount());
  }, []);

  const handleToggleKanji = (id) => {
    const nextIds = new Set(selectedIds);
    if (nextIds.has(id)) {
      nextIds.delete(id);
    } else {
      nextIds.add(id);
    }
    setSelectedIds(nextIds);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(rangeKanjis.map(k => k.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectAllFiltered = () => {
    const nextIds = new Set(selectedIds);
    filteredRangeKanjis.forEach((k) => nextIds.add(k.id));
    setSelectedIds(nextIds);
  };

  const handleClearAllFiltered = () => {
    const nextIds = new Set(selectedIds);
    filteredRangeKanjis.forEach((k) => nextIds.delete(k.id));
    setSelectedIds(nextIds);
  };

  const handleSelectFirstN = (n) => {
    const nextIds = new Set();
    filteredRangeKanjis.slice(0, n).forEach((k) => nextIds.add(k.id));
    setSelectedIds(nextIds);
  };

  const handleSelectRandomN = (n) => {
    const shuffled = shuffle(filteredRangeKanjis);
    const nextIds = new Set();
    shuffled.slice(0, n).forEach((k) => nextIds.add(k.id));
    setSelectedIds(nextIds);
  };

  const handlePresetRange = (from, to) => {
    setRangeFrom(from);
    setRangeTo(to);
    setSearchText('');
    setCustomRangeText(''); // Clear query when preset is clicked
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

  const handleSelectWeakKanjis = () => {
    try {
      const weakJson = localStorage.getItem('weak_kanji_ids') || '[]';
      const weakIds = new Set(JSON.parse(weakJson));
      const validWeakIds = new Set(
        Array.from(weakIds).filter(id => kanjiData.some(k => k.id === id && !k.isRadical))
      );
      setSelectedIds(validWeakIds);
      if (validWeakIds.size > 0) {
        const idsArray = Array.from(validWeakIds);
        setRangeFrom(Math.min(...idsArray));
        setRangeTo(Math.max(...idsArray));
        setSearchText('');
      }
    } catch (e) {
      setSelectedIds(new Set());
    }
  };

  const handleClearWeakKanjis = () => {
    localStorage.removeItem('weak_kanji_ids');
    setWeakIdsCount(0);
  };

  const startStudyMode = () => {
    if (selectedIds.size === 0) return;
    setStudyIdx(0);
    setIsFlipped(false);
    setView('study');
  };

  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

  const startQuiz = () => {
    if (selectedIds.size === 0) return;

    // Get the selected kanji items
    const selectedKanjis = kanjiData.filter(k => selectedIds.has(k.id));
    const shuffled = shuffle(selectedKanjis);
    
    // Slice to the selected number of questions
    const limit = numQuestions === 'all' ? shuffled.length : Math.min(numQuestions, shuffled.length);
    const quizItems = shuffled.slice(0, limit);

    setQuizList(quizItems);
    setCurrentIdx(0);
    setScore(0);
    setHistory([]);
    setGameState('playing');
    setSelectedOption(null);
    setView('playing');

    generateOptions(quizItems[0], selectedKanjis);
  };

  const generateOptions = (kanjiItem, pool) => {
    if (!kanjiItem) return;

    // Get correct text depending on mode
    const correctText = quizMode === 'meaning' 
      ? cleanMeaning(kanjiItem.meaning)
      : formatReadingString(itemRawReading(kanjiItem));

    // Gather potential wrong choices from the full kanji database (cleanly formatted)
    const otherKanjis = kanjiData.filter(k => k.id !== kanjiItem.id && !k.isRadical);
    
    const wrongOptions = otherKanjis.map(k => {
      return quizMode === 'meaning'
        ? cleanMeaning(k.meaning)
        : formatReadingString(itemRawReading(k));
    });

    // Shuffle and pick 3 unique wrong options (that aren't the same as correct text)
    const uniqueWrong = Array.from(new Set(wrongOptions))
      .filter(w => w !== correctText);
    
    const shuffledWrong = shuffle(uniqueWrong).slice(0, 3);
    
    setOptions(shuffle([...shuffledWrong, correctText]));
  };

  // Safely get raw reading
  const itemRawReading = (item) => {
    if (item.reading) return item.reading;
    const all = [...(item.kunyomi || []), ...(item.onyomi || [])];
    return all.join(' / ');
  };

  const handleOptionClick = (option) => {
    if (gameState !== 'playing') return;

    const kanjiItem = quizList[currentIdx];
    const correctText = quizMode === 'meaning' 
      ? cleanMeaning(kanjiItem.meaning)
      : formatReadingString(itemRawReading(kanjiItem));

    setSelectedOption(option);
    setGameState('answered');
    const isCorrect = option === correctText;

    if (isCorrect) {
      setScore(s => s + 1);
      // Remove from weak kanjis list in localStorage
      try {
        const weakJson = localStorage.getItem('weak_kanji_ids') || '[]';
        const weakIds = new Set(JSON.parse(weakJson));
        if (weakIds.has(kanjiItem.id)) {
          weakIds.delete(kanjiItem.id);
          localStorage.setItem('weak_kanji_ids', JSON.stringify(Array.from(weakIds)));
          setWeakIdsCount(weakIds.size);
        }
      } catch (e) {
        console.error('Error updating weak kanji', e);
      }
    } else {
      // Add to weak kanjis list in localStorage
      try {
        const weakJson = localStorage.getItem('weak_kanji_ids') || '[]';
        const weakIds = new Set(JSON.parse(weakJson));
        weakIds.add(kanjiItem.id);
        localStorage.setItem('weak_kanji_ids', JSON.stringify(Array.from(weakIds)));
        setWeakIdsCount(weakIds.size);
      } catch (e) {
        console.error('Error saving weak kanji', e);
      }
    }

    // Record history
    setHistory(prev => [
      ...prev,
      {
        kanji: kanjiItem.kanji,
        correct: isCorrect,
        userAnswer: option,
        correctAnswer: correctText
      }
    ]);
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < quizList.length) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setGameState('playing');
      setSelectedOption(null);
      // Regenerate options using the full pool
      const selectedKanjis = kanjiData.filter(k => selectedIds.has(k.id));
      generateOptions(quizList[nextIdx], selectedKanjis);
    } else {
      setView('summary');
    }
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
            <Settings className="icon" size={28} />
            <h2>Vocabulary Quiz Setup</h2>
          </div>

          {/* 1. Quiz Mode Selector */}
          <div className="setup-group">
            <h3>Quiz Mode</h3>
            <div className="mode-selector-buttons">
              <button 
                className={`mode-btn ${quizMode === 'meaning' ? 'active' : ''}`}
                onClick={() => setQuizMode('meaning')}
              >
                漢字 → 意味 (Kanji to Meaning)
              </button>
              <button 
                className={`mode-btn ${quizMode === 'reading' ? 'active' : ''}`}
                onClick={() => setQuizMode('reading')}
              >
                漢字 → 読み (Kanji to Reading)
              </button>
            </div>
          </div>

          {/* 2. Range Selector */}
          <div className="setup-group">
            <h3>Filter Range</h3>
            <div className="custom-range-inputs" style={{ marginBottom: '8px' }}>
              <div className="input-group">
                <label>From ID:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="300" 
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(Math.max(1, Math.min(300, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className="input-group">
                <label>To ID:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="300" 
                  value={rangeTo}
                  onChange={(e) => setRangeTo(Math.max(1, Math.min(300, parseInt(e.target.value) || 300)))}
                />
              </div>
            </div>

            <div className="preset-grid">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  className={`preset-button ${
                    rangeFrom === preset.from && rangeTo === preset.to ? 'active' : ''
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
                  placeholder="e.g. 101-140, !111-120"
                  value={customRangeText}
                  onChange={(e) => setCustomRangeText(e.target.value)}
                />
                <button className="quick-sel-btn apply-range-btn" onClick={handleApplyCustomRanges}>
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Weak Kanjis Practice Focus */}
          {weakIdsCount > 0 && (
            <div className="setup-group weak-kanjis-container">
              <h3>Weak Kanjis Focus ({weakIdsCount} incorrect previously)</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="control-button weak-focus-btn" onClick={handleSelectWeakKanjis}>
                  Select All Weak Kanjis
                </button>
                <button className="control-button danger weak-clear-btn" onClick={handleClearWeakKanjis}>
                  <Trash2 size={14} style={{ marginRight: '6px' }} /> Clear History
                </button>
              </div>
            </div>
          )}

          {/* 3. Detailed Kanji Checkbox Selection */}
          <div className="setup-group">
            <div className="kanji-selection-header">
              <h3>Select Kanjis to Quiz ({selectedIds.size} selected)</h3>
              <div className="select-links">
                <span className="select-link" onClick={handleSelectAllFiltered}>Select All Filtered</span>
                <span className="select-link" onClick={handleClearAllFiltered}>Clear All Filtered</span>
                <span className="select-link" onClick={handleSelectAll}>Select All Range</span>
                <span className="select-link" onClick={handleClearAll}>Clear All</span>
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

            {/* Quick Presets */}
            <div className="quick-selection-presets">
              <span className="quick-preset-label">Quick select of filtered:</span>
              <div className="quick-preset-buttons">
                <button className="quick-sel-btn" onClick={() => handleSelectFirstN(10)}>First 10</button>
                <button className="quick-sel-btn" onClick={() => handleSelectFirstN(20)}>First 20</button>
                <button className="quick-sel-btn" onClick={() => handleSelectRandomN(10)}>Random 10</button>
                <button className="quick-sel-btn" onClick={() => handleSelectRandomN(20)}>Random 20</button>
              </div>
            </div>

            {displayedChecklistKanjis.length === 0 ? (
              <div className="empty-message" style={{ padding: '20px' }}>
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
                      onChange={() => handleToggleKanji(k.id)}
                    />
                    <span className="char">{k.kanji}</span>
                    <span className="id">#{k.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 4. Question Count Selector */}
          <div className="setup-group">
            <h3>Number of Questions</h3>
            <div className="count-selector-buttons">
              {[10, 20, 50, 'all'].map(count => (
                <button 
                  key={count}
                  className={`count-btn ${numQuestions === count ? 'active' : ''}`}
                  onClick={() => setNumQuestions(count)}
                >
                  {count === 'all' ? `All Selected (${selectedIds.size})` : `${count} Questions`}
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Action Buttons (Quiz / Study) */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              className="control-button study-mode-btn" 
              style={{ flex: 1, borderRadius: '12px' }}
              disabled={selectedIds.size === 0}
              onClick={startStudyMode}
            >
              <BookOpen size={18} style={{ marginRight: '6px' }} />
              Study Selected ({selectedIds.size})
            </button>
            <button 
              className="action-button primary" 
              style={{ flex: 1.5, borderRadius: '12px' }}
              disabled={selectedIds.size === 0}
              onClick={startQuiz}
            >
              <Play size={18} style={{ marginRight: '6px' }} />
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'study') {
    const studyList = kanjiData.filter(k => selectedIds.has(k.id));
    const currentKanji = studyList[studyIdx];

    if (!currentKanji) {
      setView('setup');
      return null;
    }

    const decompComps = kanjiDecompositions[currentKanji.kanji] || [];

    return (
      <div className="quiz-container">
        <button className="back-button" onClick={() => setView('setup')}>
          <ArrowLeft size={18} />
          Back to Setup
        </button>

        <div className="study-header">
          <h2>Study Selected Kanjis</h2>
          <span className="score">Card {studyIdx + 1} of {studyList.length}</span>
        </div>

        {/* The Card */}
        <div 
          className={`flashcard-item ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flashcard-face front">
            <span className="card-id-badge">#{currentKanji.id}</span>
            <div className="card-kanji">{currentKanji.kanji}</div>
            <div className="card-hint">Click card to flip & reveal readings</div>
          </div>

          <div className="flashcard-face back">
            <span className="card-id-badge">#{currentKanji.id}</span>
            <div className="card-header-small">
              <span className="card-kanji-small">{currentKanji.kanji}</span>
              <div className="card-meaning-title">{currentKanji.meaning}</div>
            </div>

            {/* Visual Decomposition Formula */}
            {decompComps.length > 0 && (
              <div className="study-decomp-formula">
                <span className="study-decomp-equation">
                  {currentKanji.kanji} = {decompComps.join(' + ')}
                </span>
                <div className="study-decomp-meanings">
                  {decompComps.map((comp, idx) => {
                    const info = componentsDb[comp];
                    if (!info) return null;
                    const cleanMeaning = info.meaning.replace(/^\[Radical\]\s*/, '').split(', ')[0];
                    return (
                      <span key={idx} className="study-decomp-part-meaning">
                        <strong>{comp}</strong> ({cleanMeaning}){idx < decompComps.length - 1 ? ' + ' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card-readings-list">
              {currentKanji.kunyomi && currentKanji.kunyomi.length > 0 && (
                <div className="study-reading-row kun">
                  <span className="study-badge kun">Kun</span>
                  <span className="study-reading-vals">
                    {currentKanji.kunyomi.map((r, i) => {
                      let displayValue = r;
                      let okuriValue = '';
                      if (r.includes('.')) {
                        const [main, okuri] = r.split('.');
                        displayValue = main;
                        okuriValue = `(${okuri})`;
                      }
                      return (
                        <span key={i} className="r-val">
                          {displayValue}
                          {okuriValue && <span className="r-okuri">{okuriValue}</span>}
                          {i < currentKanji.kunyomi.length - 1 && <span className="comma">, </span>}
                        </span>
                      );
                    })}
                  </span>
                </div>
              )}

              {currentKanji.onyomi && currentKanji.onyomi.length > 0 && (
                <div className="study-reading-row on">
                  <span className="study-badge on">On</span>
                  <span className="study-reading-vals">
                    {currentKanji.onyomi.map((r, i) => (
                      <span key={i} className="r-val">
                        {toHiragana(r)}
                        {i < currentKanji.onyomi.length - 1 && <span className="comma">, </span>}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>

            {currentKanji.examples && currentKanji.examples.length > 0 && (
              <div className="study-compounds-section">
                <div className="study-label">Compounds</div>
                <div className="study-compounds-mini-grid">
                  {currentKanji.examples.slice(0, 3).map((ex, i) => (
                    <div key={i} className="study-compound-card">
                      <div className="comp-word-header">
                        <span className="c-word">{ex.word}</span>
                        <span className="c-reading">{ex.reading}</span>
                      </div>
                      <div className="c-meaning">{ex.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="study-controls">
          <button 
            className="control-button" 
            disabled={studyIdx === 0}
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(false);
              setStudyIdx(idx => idx - 1);
            }}
          >
            <ArrowLeft size={16} /> Previous
          </button>

          <button 
            className="action-button primary start-quiz-from-study"
            style={{ padding: '12px 24px', borderRadius: '12px' }}
            onClick={() => {
              startQuiz();
            }}
          >
            <Play size={16} style={{ marginRight: '6px' }} /> Start Quiz ({studyList.length})
          </button>

          <button 
            className="control-button" 
            disabled={studyIdx === studyList.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(false);
              setStudyIdx(idx => idx + 1);
            }}
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'playing') {
    const kanjiItem = quizList[currentIdx];
    const correctText = quizMode === 'meaning' 
      ? cleanMeaning(kanjiItem.meaning)
      : formatReadingString(itemRawReading(kanjiItem));

    return (
      <div className="quiz-container" style={{ paddingBottom: '40px' }}>
        <div className="header">
          <div className="progress">
            Question {currentIdx + 1} / {quizList.length}
          </div>
          <div className="score">
            Score: {score}
          </div>
        </div>

        <div className="glass-panel quiz-panel">
          <div className="kanji-display quiz">
            {kanjiItem?.kanji}
          </div>
          
          <div className="options-grid">
            {options.map((option, idx) => {
              let className = 'option-button';
              if (gameState === 'answered') {
                if (option === correctText) {
                  className += ' correct';
                } else if (option === selectedOption) {
                  className += ' incorrect';
                }
              }

              return (
                <button 
                  key={idx} 
                  className={className}
                  onClick={() => handleOptionClick(option)}
                  disabled={gameState !== 'playing'}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {gameState === 'answered' && (
            <div className="quiz-study-card animate-fade-in" style={{ marginTop: '24px' }}>
              <div className={`feedback-banner ${selectedOption === correctText ? 'correct' : 'incorrect'}`}>
                {selectedOption === correctText ? (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Correct Answer! (正解)</span>
                  </>
                ) : (
                  <>
                    <HelpCircle size={20} />
                    <span>Incorrect Answer (間違い)</span>
                  </>
                )}
              </div>

              <div className="study-card-details">
                <div className="study-header-row">
                  <span className="study-char">{kanjiItem.kanji}</span>
                  <div className="study-meanings-list">
                    <div className="study-label">Meaning</div>
                    <div className="study-value-text">{kanjiItem.meaning}</div>
                  </div>
                </div>

                <div className="study-readings-list">
                  {kanjiItem.kunyomi && kanjiItem.kunyomi.length > 0 && (
                    <div className="study-reading-row">
                      <span className="study-badge kun">Kunyomi</span>
                      <span className="study-reading-vals">
                        {kanjiItem.kunyomi.map((r, i) => {
                          if (r.includes('.')) {
                            const [main, okuri] = r.split('.');
                            return (
                              <span key={i} className="r-val">
                                {main}<span className="r-okuri">({okuri})</span>
                              </span>
                            );
                          }
                          return <span key={i} className="r-val">{r}</span>;
                        })}
                      </span>
                    </div>
                  )}
                  {kanjiItem.onyomi && kanjiItem.onyomi.length > 0 && (
                    <div className="study-reading-row">
                      <span className="study-badge on">Onyomi</span>
                      <span className="study-reading-vals">
                        {kanjiItem.onyomi.map((r, i) => (
                          <span key={i} className="r-val">{toHiragana(r)}</span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>

                {kanjiItem.examples && kanjiItem.examples.length > 0 && (
                  <div className="study-compounds-section">
                    <div className="study-label">Compounds (例文)</div>
                    <div className="study-compounds-mini-grid">
                      {kanjiItem.examples.slice(0, 3).map((ex, i) => (
                        <div key={i} className="study-compound-card">
                          <div className="comp-word-header">
                            <span className="c-word">{ex.word}</span>
                            <span className="c-reading">{ex.reading}</span>
                          </div>
                          <div className="c-meaning">{ex.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                className="action-button primary next-question-btn"
                style={{ width: '100%', borderRadius: '12px', marginTop: '16px' }}
                onClick={handleNextQuestion}
              >
                {currentIdx + 1 < quizList.length ? 'Next Question' : 'View Summary'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'summary') {
    return (
      <div className="quiz-container" style={{ maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel summary-panel" style={{ flex: 1, overflowY: 'auto' }}>
          <CheckCircle2 className="icon" size={60} style={{ color: 'var(--correct-color)', margin: '0 auto' }} />
          <h1>Quiz Complete!</h1>
          
          <div className="score-display">
            <span className="score-number">{score}</span>
            <span className="score-total">/ {quizList.length}</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button 
              className="action-button primary"
              onClick={startQuiz}
            >
              <RefreshCw size={18} style={{ marginRight: '6px' }} />
              Retry Same Quiz
            </button>
            <button 
              className="control-button"
              style={{ padding: '14px 40px', borderRadius: '99px' }}
              onClick={() => setView('setup')}
            >
              Configure Quiz
            </button>
          </div>

          {/* Detailed Question Review List */}
          <div className="review-list">
            <h3>Question Review (結果の確認)</h3>
            <div className="review-items">
              {history.map((h, idx) => (
                <div key={idx} className={`review-item ${h.correct ? 'correct' : 'incorrect'}`}>
                  <span className="review-char">{h.kanji}</span>
                  <div className="review-details">
                    <div className="user-ans">
                      Your Answer: <span className="ans-text">{h.userAnswer}</span>
                    </div>
                    {!h.correct && (
                      <div className="correct-ans">
                        Correct Answer: <span className="ans-text">{h.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                  <span className="status-icon">{h.correct ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
