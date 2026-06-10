import React from 'react';

/**
 * Renders a Japanese word with Furigana.
 * 
 * @param {Object} props
 * @param {Array} props.segments - Array of { ruby: string, rt?: string }
 * @param {string} [props.className] - Optional CSS class
 */
export default function FuriganaWord({ segments, className = "" }) {
  if (!segments || !Array.isArray(segments)) return null;

  return (
    <span className={`furigana-word ${className}`}>
      {segments.map((seg, idx) => (
        seg.rt ? (
          <ruby key={idx}>
            {seg.ruby}
            <rt className="furigana-rt">{seg.rt}</rt>
          </ruby>
        ) : (
          <span key={idx} className="okurigana-part">{seg.ruby}</span>
        )
      ))}
    </span>
  );
}
