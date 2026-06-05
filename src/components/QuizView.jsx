import { useState, useEffect } from 'react';
import { kanjiData } from '../data/kanji';
import { SlidersHorizontal, Settings, HelpCircle, RefreshCw, CheckCircle2, Search } from 'lucide-react';

export default function QuizView() {
  // Setup states
  const [view, setView] = useState('setup'); // setup, playing, summary
  const [quizMode, setQuizMode] = useState('meaning'); // meaning, reading
  const [numQuestions, setNumQuestions] = useState(10); // 10, 20, 50, all
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(50);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchText, setSearchText] = useState('');

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
    return readingStr
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
  const rangeKanjis = kanjiData.filter(
    (k) => k.id >= rangeFrom && k.id <= rangeTo && !k.isRadical
  );

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

  // Initialize/adjust selectedIds when range changes
  useEffect(() => {
    const ids = new Set(rangeKanjis.map(k => k.id));
    setSelectedIds(ids);
  }, [rangeFrom, rangeTo]);

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
          </div>

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

            {/* Search Box */}
            <div className="selection-search-container">
              <Search className="search-icon" size={16} />
              <input 
                type="text"
                className="selection-search-input"
                placeholder="Search by Kanji, reading, or meaning..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
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

            {filteredRangeKanjis.length === 0 ? (
              <div className="empty-message" style={{ padding: '20px' }}>
                No Kanjis found matching search.
              </div>
            ) : (
              <div className="kanji-selection-list">
                {filteredRangeKanjis.map((k) => (
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

          {/* Start Quiz Action */}
          <button 
            className="action-button primary" 
            style={{ width: '100%', borderRadius: '12px', marginTop: '10px' }}
            disabled={selectedIds.size === 0}
            onClick={startQuiz}
          >
            Start Quiz
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
                          <span key={i} className="r-val">{r}</span>
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
