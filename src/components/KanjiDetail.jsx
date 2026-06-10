import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HanziWriter from 'hanzi-writer';
import { kanjiData } from '../data/kanji';
import { radicalsData } from '../data/radicals';
import { ArrowLeft, Play, Edit3, Trash2, Eye, EyeOff, Grid } from 'lucide-react';
import { componentsDb, kanjiDecompositions } from '../data/components';

export default function KanjiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  let kanjiItem;
  if (id && id.startsWith('r')) {
    const numericId = parseInt(id.substring(1));
    kanjiItem = radicalsData.find(k => k.id === numericId);
  } else {
    const numericId = parseInt(id && id.startsWith('k') ? id.substring(1) : id);
    kanjiItem = kanjiData.find(k => k.id === numericId);
  }
  
  const decompComps = kanjiItem ? (kanjiDecompositions[kanjiItem.kanji] || []) : [];
  
  const renderReadingBadge = (reading, type) => {
    const className = type === 'onyomi' ? 'onyomi-badge' : 'kunyomi-badge';
    if (reading.includes('.')) {
      const [main, okuri] = reading.split('.');
      return (
        <span className={className} key={reading}>
          {main}
          <span className="okurigana">({okuri})</span>
        </span>
      );
    }
    return (
      <span className={className} key={reading}>
        {reading}
      </span>
    );
  };
  
  const writerRef = useRef(null);
  const canvasRef = useRef(null);
  const [writer, setWriter] = useState(null);
  const [mode, setMode] = useState('animate'); // 'animate' or 'free-write'

  // Canvas drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGhost, setShowGhost] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!kanjiItem || !writerRef.current) return;

    // Clean up previous writer instance HTML if any
    writerRef.current.innerHTML = '';
    setLoadError(false);
    setIsExpanded(false); // Reset on character swap

    try {
      const newWriter = HanziWriter.create(writerRef.current, kanjiItem.kanji, {
        width: 250,
        height: 250,
        padding: 20,
        strokeAnimationSpeed: 1.5,
        delayBetweenStrokes: 150,
        strokeColor: '#4f46e5',
        radicalColor: '#10b981',
        outlineColor: 'rgba(15, 23, 42, 0.08)',
        drawingColor: '#0284c7',
        showOutline: true,
        showCharacter: false, // Start hidden to animate properly
      });

      setWriter(newWriter);
      
      // Initial animation
      setTimeout(() => {
        newWriter.animateCharacter().catch((err) => {
          console.warn('Failed to animate (probably missing SVG data):', err);
          setLoadError(true);
        });
      }, 500);
    } catch (e) {
      console.error('HanziWriter initialization failed:', e);
      setLoadError(true);
    }

  }, [kanjiItem]);

  // Handle Free Write canvas sizing and setup
  useEffect(() => {
    if (mode !== 'free-write' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = 250;
    canvas.height = 250;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8'; // Soft sky blue brush
    ctx.lineWidth = 6;
  }, [mode]);

  const handleAnimate = () => {
    setMode('animate');
    if (writer && !loadError) {
      writer.showOutline();
      writer.animateCharacter().catch(() => setLoadError(true));
    }
  };

  const handleEnterFreeWrite = () => {
    setMode('free-write');
    if (writer && !loadError) {
      // In free write, we show outline as a background guide depending on state
      if (showGhost) {
        writer.showOutline();
      } else {
        writer.hideOutline();
      }
    }
  };

  const handleToggleGhost = () => {
    const nextState = !showGhost;
    setShowGhost(nextState);
    if (writer && !loadError) {
      if (nextState) {
        writer.showOutline();
      } else {
        writer.hideOutline();
      }
    }
  };

  // Drawing Pad Logic
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!kanjiItem) {
    return <div className="glass-panel">Kanji not found.</div>;
  }

  return (
    <div className="kanji-detail-container">
      <button className="back-button" onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
        Back to Kanji
      </button>

      <div className="glass-panel detail-panel-split">
        
        {/* Left Column: Drawing & Animation Pad */}
        <div className="detail-left-col">
          <div className="workspace-card">
            <div className={`writer-container ${showGrid ? 'show-grid' : ''}`}>
              {/* Fallback for components without SVG */}
              {loadError && (
                <div className="static-kanji-fallback">
                  {kanjiItem.kanji}
                  <div className="fallback-note">
                    Stroke guide not available
                  </div>
                </div>
              )}

              {/* HanziWriter target (Ghost/Animation layer) */}
              <div 
                ref={writerRef} 
                className={`kanji-canvas ${loadError ? 'hidden' : ''}`} 
                style={{ opacity: showGhost || mode === 'animate' ? 1 : 0 }}
              />

              {/* Interactive Drawing canvas (Free write mode only) */}
              {mode === 'free-write' && (
                <canvas
                  ref={canvasRef}
                  className="drawing-pad-overlay"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              )}
            </div>
          </div>

          <div className="controls">
            <button 
              className={`control-button ${mode === 'animate' ? 'active' : ''}`}
              onClick={handleAnimate}
            >
              <Play size={18} />
              Watch Strokes
            </button>
            
            <button 
              className={`control-button ${mode === 'free-write' ? 'active' : ''}`}
              onClick={handleEnterFreeWrite}
            >
              <Edit3 size={18} />
              Free Write
            </button>
          </div>

          {/* Free write options */}
          {mode === 'free-write' && (
            <div className="free-write-options-panel">
              <button 
                className={`option-tool-btn ${showGhost ? 'active' : ''}`} 
                onClick={handleToggleGhost}
                title="Toggle ghost trace guide"
                disabled={loadError}
              >
                {showGhost ? <Eye size={18} /> : <EyeOff size={18} />}
                Guide
              </button>
              <button 
                className={`option-tool-btn ${showGrid ? 'active' : ''}`} 
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle grid lines"
              >
                <Grid size={18} />
                Grid
              </button>
              <button 
                className="option-tool-btn danger" 
                onClick={clearCanvas}
                title="Clear drawings"
              >
                <Trash2 size={18} />
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Readings & Example Compounds */}
        <div className="detail-right-col">
          <div className="kanji-info-section">
            <span className="kanji-id-badge">
              ID #{kanjiItem.id} {kanjiItem.isRadical ? '• Radical' : '• Kanji'}
            </span>
            <h1 className="detail-kanji-char">{kanjiItem.kanji}</h1>
            <div className="detail-meaning">{kanjiItem.meaning}</div>
          </div>

          {!kanjiItem.isRadical && (
            <>
              {/* Readings Group */}
              <div className="readings-box">
                <div className="reading-group">
                  <div className="reading-label">On'yomi (音読み - Chinese Reading)</div>
                  <div className="reading-values">
                    {kanjiItem.onyomi && kanjiItem.onyomi.length > 0 ? (
                      kanjiItem.onyomi.map((on) => renderReadingBadge(on, 'onyomi'))
                    ) : (
                      <span className="reading-none">None (Refer to compound examples)</span>
                    )}
                  </div>
                </div>

                <div className="reading-group">
                  <div className="reading-label">Kun'yomi (訓読み - Japanese Reading)</div>
                  <div className="reading-values">
                    {kanjiItem.kunyomi && kanjiItem.kunyomi.length > 0 ? (
                      kanjiItem.kunyomi.map((kun) => renderReadingBadge(kun, 'kunyomi'))
                    ) : (
                      <span className="reading-none">None (Refer to compound examples)</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Kanji Building Blocks */}
              {decompComps && decompComps.length > 0 && (
                <div className="decomposition-section">
                  <h3>Kanji Building Blocks (漢字の構成)</h3>
                  <div className="decomp-formula">
                    <span className="main-char">{kanjiItem.kanji}</span>
                    <span className="equals-sign">=</span>
                    {decompComps.map((comp, idx) => (
                      <span key={idx} className="formula-part">
                        {idx > 0 && <span className="plus-sign">+</span>}
                        <span className="part-char">{comp}</span>
                      </span>
                    ))}
                  </div>
                  
                  <div className="decomp-cards-grid">
                    {decompComps.map((comp, idx) => {
                      const info = componentsDb[comp];
                      if (!info) {
                        return (
                          <div key={idx} className="decomp-part-card">
                            <div className="decomp-part-header">
                              <span className="part-kanji">{comp}</span>
                            </div>
                            <div className="decomp-part-body">
                              <div className="part-meaning">Component</div>
                            </div>
                          </div>
                        );
                      }
                      
                      const isLinkable = info.type === 'kanji' || info.type === 'radical';
                      const linkPath = `/kanji/${info.id}`;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`decomp-part-card ${isLinkable ? 'linkable' : ''}`}
                          onClick={() => {
                            if (isLinkable) {
                              navigate(linkPath);
                            }
                          }}
                        >
                          <div className="decomp-part-header">
                            <span className="part-kanji">{comp}</span>
                            {isLinkable && (
                              <span className="part-id-badge">
                                {info.type === 'radical' ? `Radical` : `#${info.id}`}
                              </span>
                            )}
                          </div>
                          <div className="decomp-part-body">
                            <div className="part-meaning" title={info.meaning}>
                              {info.meaning}
                            </div>
                            {info.reading && info.reading !== 'n/a' && (
                              <div className="part-reading">
                                {info.reading.split(' / ').slice(0, 2).join(' / ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Example Compounds */}
              <div className="examples-section">
                <h3>Common Compounds (主な言葉)</h3>
                {kanjiItem.examples && kanjiItem.examples.length > 0 ? (
                  <>
                    <div className="examples-grid">
                      {(isExpanded ? kanjiItem.examples : kanjiItem.examples.slice(0, 4)).map((ex, idx) => (
                        <div key={idx} className="example-card">
                          <div className="example-word-header">
                            <span className="example-word">{ex.word}</span>
                            <span className="example-reading">【{ex.reading}】</span>
                          </div>
                          <div className="example-meaning">{ex.meaning}</div>
                        </div>
                      ))}
                    </div>
                    {kanjiItem.examples.length > 4 && (
                      <button 
                        className="expand-compounds-btn" 
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        {isExpanded ? 'Show Less' : `Show More (+${kanjiItem.examples.length - 4})`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty-examples">No common compounds recorded.</div>
                )}
              </div>
            </>
          )}

          {kanjiItem.isRadical && (
            <div className="radical-info-box">
              <h3>Radical Component (部首)</h3>
              <p>This entry serves as a basic radical/component taught in lessons. It is practiced to help master stroke counts and structure before writing full kanjis.</p>
              <div className="reading-group" style={{ marginTop: '16px' }}>
                <div className="reading-label">Radical Reading / Name</div>
                <div className="reading-values">
                  <span className="onyomi-badge">{kanjiItem.reading}</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
