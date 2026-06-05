import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { kanjiData } from '../data/kanji';
import { radicalsData } from '../data/radicals';
import { BookOpen, SlidersHorizontal } from 'lucide-react';

export default function DictionaryView() {
  const [typeFilter, setTypeFilter] = useState(() => {
    return localStorage.getItem('kanji_type_filter') || 'all';
  });

  const [rangeFrom, setRangeFrom] = useState(() => {
    const val = localStorage.getItem('kanji_range_from');
    if (val !== null) return parseInt(val);
    return typeFilter === 'radical' ? 4 : 100;
  });
  const [rangeTo, setRangeTo] = useState(() => {
    const val = localStorage.getItem('kanji_range_to');
    if (val !== null) return parseInt(val);
    return typeFilter === 'radical' ? 61 : 150;
  });

  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    localStorage.setItem('kanji_range_from', rangeFrom);
    localStorage.setItem('kanji_range_to', rangeTo);
    localStorage.setItem('kanji_type_filter', typeFilter);
  }, [rangeFrom, rangeTo, typeFilter]);

  const handleTypeFilterChange = (newType) => {
    setTypeFilter(newType);
    const minVal = newType === 'radical' ? 4 : 1;
    const maxVal = newType === 'radical' ? 61 : 300;

    // Adjust rangeFrom/rangeTo automatically to stay within valid limits for the selection
    setRangeFrom((prev) => {
      if (newType === 'radical' && (prev > 61 || prev < 4)) {
        return 4;
      }
      return Math.max(minVal, Math.min(maxVal, prev));
    });

    setRangeTo((prev) => {
      if (newType === 'radical' && (prev > 61 || prev < 4)) {
        return 61;
      }
      return Math.max(minVal, Math.min(maxVal, prev));
    });
  };

  const handlePresetClick = (from, to) => {
    setRangeFrom(from);
    setRangeTo(to);
  };

  const getSourceData = () => {
    if (typeFilter === 'kanji') {
      return kanjiData;
    }
    if (typeFilter === 'radical') {
      return radicalsData;
    }
    // merge both and sort by ID
    const merged = [...kanjiData, ...radicalsData];
    return merged.sort((a, b) => {
      if (a.id === b.id) {
        return a.isRadical ? 1 : -1;
      }
      return a.id - b.id;
    });
  };

  const filteredKanjis = getSourceData().filter(
    (item) => item.id >= rangeFrom && item.id <= rangeTo
  );

  const getPresets = () => {
    if (typeFilter === 'radical') {
      return [
        { label: '4 - 20', from: 4, to: 20 },
        { label: '21 - 40', from: 21, to: 40 },
        { label: '41 - 61', from: 41, to: 61 },
        { label: 'Show All (4-61)', from: 4, to: 61 }
      ];
    } else {
      return [
        { label: '1 - 50', from: 1, to: 50 },
        { label: '51 - 100', from: 51, to: 100 },
        { label: '101 - 150', from: 101, to: 150 },
        { label: '151 - 200', from: 151, to: 200 },
        { label: '201 - 250', from: 201, to: 250 },
        { label: '251 - 300', from: 251, to: 300 },
        { label: 'Show All (1-300)', from: 1, to: 300 }
      ];
    }
  };

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
      .join(' / ');
  };

  const minLimit = typeFilter === 'radical' ? 4 : 1;
  const maxLimit = typeFilter === 'radical' ? 61 : 300;

  return (
    <div className="dictionary-container">
      <div className="glass-panel">
        <div className="dictionary-header">
          <BookOpen className="icon" size={28} />
          <h2>Kanji Dictionary</h2>
          
          <div className="type-filters">
            <button 
              className={`type-filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleTypeFilterChange('all')}
            >
              All
            </button>
            <button 
              className={`type-filter-btn ${typeFilter === 'kanji' ? 'active' : ''}`}
              onClick={() => handleTypeFilterChange('kanji')}
            >
              Kanji
            </button>
            <button 
              className={`type-filter-btn ${typeFilter === 'radical' ? 'active' : ''}`}
              onClick={() => handleTypeFilterChange('radical')}
            >
              Radicals
            </button>
          </div>

          <button 
            className={`filter-toggle-button ${showFilter ? 'active' : ''}`}
            onClick={() => setShowFilter(!showFilter)}
          >
            <SlidersHorizontal size={18} />
            Filter Range
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
                  min={minLimit} 
                  max={maxLimit} 
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(Math.max(minLimit, Math.min(maxLimit, parseInt(e.target.value) || minLimit)))}
                />
              </div>
              <div className="input-group">
                <label>To ID:</label>
                <input 
                  type="number" 
                  min={minLimit} 
                  max={maxLimit} 
                  value={rangeTo}
                  onChange={(e) => setRangeTo(Math.max(minLimit, Math.min(maxLimit, parseInt(e.target.value) || maxLimit)))}
                />
              </div>
            </div>

            <div className="preset-grid">
              {getPresets().map((preset, idx) => (
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
            <Link 
              to={`/kanji/${item.isRadical ? 'r' : 'k'}${item.id}`} 
              key={`${item.isRadical ? 'r' : 'k'}-${item.id}`} 
              className="kanji-card"
            >
              <div className="kanji-card-char">
                {item.kanji}
                {item.isRadical && <span className="radical-badge">*</span>}
              </div>
              <div className="kanji-card-info">
                <div className="kanji-card-reading">{formatReadingString(item.reading)}</div>
                <div className="kanji-card-meaning">{item.meaning}</div>
              </div>
            </Link>
          ))}
        </div>

        {filteredKanjis.length === 0 && (
          <div className="empty-message">
            No items found matching this filter in this range.
          </div>
        )}
      </div>
    </div>
  );
}
