import { useRef, useState } from "react";

/** Free practice accepts every stroke; it never grades or advances. */
export function FreePracticePad({ glyph, size = 280 }) {
  const [paths, setPaths] = useState([]);
  const [model, setModel] = useState(false);
  const surface = useRef(null);
  const pointer = useRef(null);
  const point = event => {
    const bounds = surface.current.getBoundingClientRect();
    return [Math.max(0,Math.min(360,(event.clientX-bounds.left)*360/bounds.width)), Math.max(0,Math.min(360,(event.clientY-bounds.top)*360/bounds.height))];
  };
  const start = event => {
    if (pointer.current !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    const [x,y] = point(event);
    setPaths(previous=>[...previous,`M${x},${y} l0.01,0`]);
  };
  const move = event => {
    if (pointer.current !== event.pointerId) return;
    event.preventDefault();
    const [x,y] = point(event);
    setPaths(previous=>previous.map((path,i)=>i===previous.length-1 ? `${path} L${x},${y}` : path));
  };
  const stop = event => {
    if (pointer.current !== event.pointerId) return;
    pointer.current=null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div className="sr-free-pad" style={{"--practice-size":`${size}px`}}>
    <svg ref={surface} viewBox="0 0 360 360" role="img" aria-label="free drawing surface, practice only" onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={()=>{pointer.current=null;}}>
      <path className="sr-free-grid" d="M180 0V360 M0 180H360" />
      {model && <text x="180" y="285" textAnchor="middle" className="sr-free-model" lang="ja">{glyph}</text>}
      {paths.map((path,i)=><path key={i} d={path} className="sr-free-ink" />)}
    </svg>
    <div className="sr-free-tools">
      <button type="button" className="text-button" disabled={!paths.length} onClick={()=>setPaths(p=>p.slice(0,-1))}>undo stroke</button>
      <button type="button" className="text-button" disabled={!paths.length} onClick={()=>setPaths([])}>clear pad</button>
      <button type="button" className="text-button" aria-pressed={model} onClick={()=>setModel(v=>!v)}>{model ? "hide model" : "show model"}</button>
    </div>
  </div>;
}
