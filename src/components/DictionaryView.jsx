import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { kanjiData } from '../data/kanji';
import { BookOpen, SlidersHorizontal } from 'lucide-react';

export default function DictionaryView() {
  const [rangeFrom, setRangeFrom] = useState(() => {
    const val = localStorage.getItem('kanji_range_from');
    return val !== null ? parseInt(val) : 100;
  });
  const [rangeTo, setRangeTo] = useState(() => {
    const val = localStorage.getItem('kanji_range_to');
    return val !== null ? parseInt(val) : 150;
  });

  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    localStorage.setItem('kanji_range_from', rangeFrom);
    localStorage.setItem('kanji_range_to', rangeTo);
  }, [rangeFrom, rangeTo]);

  const handlePresetClick = (from, to) => {
    setRangeFrom(from);
    setRangeTo(to);
  };

  const filteredKanjis = kanjiData.filter(
    (item) => item.id >= rangeFrom && item.id <= rangeTo
  );

  const presets = [
    { label: '100 - 150 (Focus)', from: 100, to: 150 },
    { label: '1 - 50', from: 1, to: 50 },
    { label: '51 - 100', from: 51, to: 100 },
    { label: '151 - 200', from: 151, to: 200 },
    { label: '201 - 250', from: 201, to: 250 },
    { label: '251 - 300', from: 251, to: 300 },
    { label: '301 - 356', from: 301, to: 356 },
    { label: 'Show All', from: 1, to: 356 }
  ];

  return (
    <div className="dictionary-container">
      <div className="glass-panel">
        <div className="dictionary-header">
          <BookOpen className="icon" size={28} />
          <h2>My Kanjis</h2>
          <button 
            className={`filter-toggle-button ${showFilter ? 'active' : ''}`}
            onClick={() => setShowFilter(!showFilter)}
          >
            <SlidersHorizontal size={18} />
            Filter
          </button>
        </div>

        {/* Filter controls panel */}
        {showFilter && (
          <div className="filter-controls-panel">
            <div className="custom-range-inputs">
              <div className="input-group">
                <label>From ID:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="356" 
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="input-group">
                <label>To ID:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="356" 
                  value={rangeTo}
                  onChange={(e) => setRangeTo(Math.min(356, parseInt(e.target.value) || 356))}
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
                  onClick={() => handlePresetClick(preset.from, preset.to)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="range-summary-text">
          Showing ID {rangeFrom} to {rangeTo} ({filteredKanjis.length} items found)
        </div>
        
        <div className="kanji-grid">
          {filteredKanjis.map((item) => (
            <Link to={`/kanji/${item.id}`} key={item.id} className="kanji-card">
              <div className="kanji-card-char">
                {item.kanji}
                {item.isRadical && <span className="radical-badge">*</span>}
              </div>
              <div className="kanji-card-info">
                <div className="kanji-card-reading">{item.reading}</div>
                <div className="kanji-card-meaning">{item.meaning}</div>
              </div>
            </Link>
          ))}
        </div>

        {filteredKanjis.length === 0 && (
          <div className="empty-message">
            No kanjis found in this ID range. Adjust the filters above!
          </div>
        )}
      </div>
    </div>
  );
}
