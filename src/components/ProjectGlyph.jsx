// Small animated line drawings that show a project's category at a glance.
export default function ProjectGlyph({ kind }) {
  return (
    <svg className={`glyph glyph-${kind}`} viewBox="0 0 160 110" aria-hidden="true">
      {kind === 'ai' && (
        <g className="g-figure">
          <circle cx="80" cy="24" r="9" />
          <line x1="80" y1="33" x2="80" y2="66" />
          <line className="g-arm-l" x1="80" y1="40" x2="56" y2="60" />
          <line className="g-arm-r" x1="80" y1="40" x2="104" y2="60" />
          <line x1="80" y1="66" x2="66" y2="92" />
          <line x1="80" y1="66" x2="94" y2="92" />
          {[[80, 40], [80, 66], [66, 92], [94, 92]].map(([x, y]) => (
            <circle key={`${x}-${y}`} className="g-joint" cx={x} cy={y} r="2.6" />
          ))}
          <circle className="g-joint g-hand-l" cx="56" cy="60" r="2.6" />
          <circle className="g-joint g-hand-r" cx="104" cy="60" r="2.6" />
        </g>
      )}
      {kind === 'mobile' && (
        <g>
          <rect x="58" y="8" width="44" height="94" rx="8" />
          <line x1="74" y1="15" x2="86" y2="15" />
          <g className="g-feed">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={i} transform={`translate(0 ${24 + i * 18})`}>
                <rect className="g-fill" x="64" y="0" width="10" height="10" rx="2" />
                <line x1="78" y1="3" x2="96" y2="3" />
                <line x1="78" y1="8" x2="90" y2="8" />
              </g>
            ))}
          </g>
        </g>
      )}
      {kind === 'web' && (
        <g>
          <rect x="22" y="16" width="116" height="78" rx="6" />
          <line x1="22" y1="30" x2="138" y2="30" />
          {[30, 37, 44].map((x) => <circle key={x} className="g-fill" cx={x} cy="23" r="1.8" />)}
          <rect className="g-load g-fill" x="22" y="30" width="116" height="2" />
          <rect x="32" y="40" width="44" height="28" rx="3" />
          <line x1="84" y1="44" x2="128" y2="44" />
          <line x1="84" y1="52" x2="120" y2="52" />
          <line x1="84" y1="60" x2="124" y2="60" />
          <line x1="32" y1="78" x2="128" y2="78" />
          <line x1="32" y1="85" x2="100" y2="85" />
        </g>
      )}
      {kind === 'design' && (
        <g>
          {[40, 60, 80, 100, 120].map((x) => <line key={`v${x}`} className="g-grid" x1={x} y1="10" x2={x} y2="100" />)}
          {[25, 45, 65, 85].map((y) => <line key={`h${y}`} className="g-grid" x1="25" y1={y} x2="135" y2={y} />)}
          <rect className="g-draw" x="40" y="25" width="60" height="40" rx="4" pathLength="1" />
          <path className="g-cursor g-fill" d="M0 0 L0 14 L4 10 L7 17 L9 16 L6 9 L11 9 Z" />
        </g>
      )}
    </svg>
  )
}
