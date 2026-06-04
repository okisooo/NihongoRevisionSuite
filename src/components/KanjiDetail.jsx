import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HanziWriter from 'hanzi-writer';
import { kanjiData } from '../data/kanji';
import { ArrowLeft, Play, Edit3, Trash2, Eye, EyeOff, Grid } from 'lucide-react';

export default function KanjiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const kanjiItem = kanjiData.find(k => k.id === parseInt(id));
  
  const writerRef = useRef(null);
  const canvasRef = useRef(null);
  const [writer, setWriter] = useState(null);
  const [mode, setMode] = useState('animate'); // 'animate' or 'free-write'

  // Canvas drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGhost, setShowGhost] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!kanjiItem || !writerRef.current) return;

    // Clean up previous writer instance HTML if any
    writerRef.current.innerHTML = '';
    setLoadError(false);

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

      <div className="glass-panel detail-panel">
        <div className="kanji-info-header">
          <div className="info-reading">{kanjiItem.reading}</div>
          <div className="info-meaning">{kanjiItem.meaning}</div>
        </div>

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
    </div>
  );
}
