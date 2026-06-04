import { useState, useEffect } from 'react';
import { kanjiData } from '../data/kanji';

export default function QuizView() {
  const [rangeFrom] = useState(() => {
    const val = localStorage.getItem('kanji_range_from');
    return val !== null ? parseInt(val) : 100;
  });
  const [rangeTo] = useState(() => {
    const val = localStorage.getItem('kanji_range_to');
    return val !== null ? parseInt(val) : 150;
  });

  const [currentKanjiIndex, setCurrentKanjiIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing'); // playing, answered, summary
  const [selectedOption, setSelectedOption] = useState(null);

  // Filter Kanjis based on stored range
  const filteredKanjis = kanjiData.filter(
    (item) => item.id >= rangeFrom && item.id <= rangeTo
  );

  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

  const generateOptions = (kanjiItem) => {
    if (!kanjiItem) return [];

    // Gather potential wrong choices (prefer same range, fallback to full list if range is too small)
    const sourceList = filteredKanjis.length >= 4 ? filteredKanjis : kanjiData;
    
    const wrongOptions = sourceList
      .filter((k) => k.id !== kanjiItem.id)
      .map(k => `${k.reading} - ${k.meaning}`);
    
    const shuffledWrong = shuffle(wrongOptions).slice(0, 3);
    const correctOption = `${kanjiItem.reading} - ${kanjiItem.meaning}`;
    
    return shuffle([...shuffledWrong, correctOption]);
  };

  useEffect(() => {
    if (filteredKanjis.length > 0 && gameState === 'playing') {
      setOptions(generateOptions(filteredKanjis[currentKanjiIndex]));
    }
  }, [currentKanjiIndex, gameState, rangeFrom, rangeTo]);

  const handleOptionClick = (option) => {
    if (gameState !== 'playing') return;
    
    const kanjiItem = filteredKanjis[currentKanjiIndex];
    const correctOption = `${kanjiItem.reading} - ${kanjiItem.meaning}`;
    
    setSelectedOption(option);
    setGameState('answered');
    
    if (option === correctOption) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentKanjiIndex + 1 < filteredKanjis.length) {
        setCurrentKanjiIndex(i => i + 1);
        setGameState('playing');
        setSelectedOption(null);
      } else {
        setGameState('summary');
      }
    }, 1500);
  };

  if (filteredKanjis.length === 0) {
    return (
      <div className="glass-panel summary-panel">
        <h1>No Kanjis to Quiz!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Please go to the Dictionary tab and select a wider ID range first.
        </p>
      </div>
    );
  }

  if (gameState === 'summary') {
    return (
      <div className="glass-panel summary-panel">
        <h1>Quiz Complete!</h1>
        <div className="score-display">
          <span className="score-number">{score}</span>
          <span className="score-total">/ {filteredKanjis.length}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          Range: ID {rangeFrom} to {rangeTo}
        </p>
        <button 
          className="action-button primary"
          onClick={() => {
            setCurrentKanjiIndex(0);
            setScore(0);
            setGameState('playing');
            setSelectedOption(null);
          }}
        >
          Restart
        </button>
      </div>
    );
  }

  const kanjiItem = filteredKanjis[currentKanjiIndex];
  const correctOption = kanjiItem ? `${kanjiItem.reading} - ${kanjiItem.meaning}` : '';

  return (
    <div className="quiz-container">
      <div className="header">
        <div className="progress">
          Question {currentKanjiIndex + 1} / {filteredKanjis.length}
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
              if (option === correctOption) {
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
      </div>
    </div>
  );
}
