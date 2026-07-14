// Ilustração de marca do MenuFlex: cardápio no bolso, vapor virando sinal de proximidade.
// `framed=false` remove o cartão de fundo escuro — use assim quando o elemento pai já é escuro.
export default function BrandArt({ framed = true, className = 'max-w-[220px]' }: { framed?: boolean; className?: string }) {
  return (
    <div className={`${framed ? 'rounded-2xl bg-slate-950 p-4' : ''} mb-6 mx-auto ${className}`}>
      <style>{`
        @keyframes menuflex-drift{ 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-4px) } }
        @keyframes menuflex-pulse{ 0%{ opacity:.9; transform: scale(.94) } 50%{ opacity:.25; transform: scale(1.06) } 100%{ opacity:.9; transform: scale(.94) } }
        @keyframes menuflex-rise{ 0%{ transform: translateY(6px); opacity:0 } 30%{ opacity:1 } 100%{ transform: translateY(-46px); opacity:0 } }
        @keyframes menuflex-spin{ to{ transform: rotate(360deg) } }
        .mf-float{ animation: menuflex-drift 5.5s ease-in-out infinite; transform-origin: 260px 300px; }
        .mf-ring{ transform-origin: 260px 300px; }
        .mf-ring1{ animation: menuflex-pulse 3.2s ease-in-out infinite; }
        .mf-ring2{ animation: menuflex-pulse 3.2s ease-in-out infinite .5s; }
        .mf-ring3{ animation: menuflex-pulse 3.2s ease-in-out infinite 1s; }
        .mf-steam path{ animation: menuflex-rise 3.6s ease-in infinite; }
        .mf-steam path:nth-child(2){ animation-delay: .8s }
        .mf-steam path:nth-child(3){ animation-delay: 1.6s }
        .mf-orbit{ transform-origin: 260px 300px; animation: menuflex-spin 22s linear infinite; }
        .mf-orbit-rev{ transform-origin: 260px 300px; animation: menuflex-spin 30s linear infinite reverse; }
      `}</style>
      <svg viewBox="60 60 400 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <defs>
          <radialGradient id="mf-glow" cx="50%" cy="46%" r="55%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#fb923c" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mf-phoneBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="mf-plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="100%" stopColor="#fde8d0" />
          </linearGradient>
          <linearGradient id="mf-bun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf62" />
            <stop offset="100%" stopColor="#ea8a2e" />
          </linearGradient>
          <linearGradient id="mf-patty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3f24" />
            <stop offset="100%" stopColor="#5a2d18" />
          </linearGradient>
          <linearGradient id="mf-accent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <filter id="mf-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <circle cx="260" cy="300" r="230" fill="url(#mf-glow)" />

        <g className="mf-ring mf-ring1">
          <circle cx="260" cy="300" r="200" stroke="#fb923c" strokeOpacity="0.25" strokeWidth="1.5" />
        </g>
        <g className="mf-ring mf-ring2">
          <circle cx="260" cy="300" r="165" stroke="#fb923c" strokeOpacity="0.3" strokeWidth="1.5" />
        </g>
        <g className="mf-ring mf-ring3">
          <circle cx="260" cy="300" r="130" stroke="#fb923c" strokeOpacity="0.35" strokeWidth="1.5" />
        </g>

        <g className="mf-orbit">
          <circle cx="260" cy="90" r="6" fill="#fb923c" />
          <circle cx="440" cy="300" r="4.5" fill="#fde8d0" />
          <circle cx="90" cy="380" r="5" fill="#fb923c" opacity="0.8" />
        </g>
        <g className="mf-orbit-rev">
          <circle cx="410" cy="150" r="4" fill="#fde8d0" opacity="0.8" />
          <circle cx="130" cy="150" r="5" fill="#fb923c" opacity="0.7" />
        </g>

        <g className="mf-float">
          <rect x="165" y="140" width="190" height="330" rx="34" fill="url(#mf-phoneBody)" stroke="#334155" strokeWidth="2" />
          <rect x="178" y="156" width="164" height="298" rx="20" fill="#0b1224" />
          <rect x="235" y="150" width="50" height="6" rx="3" fill="#334155" />

          <ellipse cx="260" cy="300" rx="78" ry="78" fill="url(#mf-plate)" />
          <ellipse cx="260" cy="300" rx="78" ry="78" fill="none" stroke="#f2c78e" strokeWidth="2" opacity="0.6" />

          <path d="M198 292 q62 -46 124 0 z" fill="url(#mf-bun)" />
          <rect x="200" y="292" width="120" height="12" rx="6" fill="#dfe6ee" />
          <rect x="196" y="304" width="128" height="16" rx="6" fill="url(#mf-patty)" />
          <rect x="200" y="320" width="120" height="10" rx="5" fill="#7fae4a" />
          <path d="M198 330 q62 30 124 0 q-10 22 -62 22 q-52 0 -62 -22 z" fill="url(#mf-bun)" />
          <circle cx="230" cy="284" r="2.6" fill="#fff" opacity="0.85" />
          <circle cx="252" cy="279" r="2.6" fill="#fff" opacity="0.85" />
          <circle cx="276" cy="283" r="2.6" fill="#fff" opacity="0.85" />
          <circle cx="292" cy="290" r="2.6" fill="#fff" opacity="0.85" />

          <g className="mf-steam" stroke="#fde8d0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9">
            <path d="M226 250 q-10 -22 6 -34 q16 -12 4 -34" />
            <path d="M260 244 q-10 -22 6 -34 q16 -12 4 -34" />
            <path d="M294 250 q-10 -22 6 -34 q16 -12 4 -34" />
          </g>

          <rect x="228" y="446" width="64" height="5" rx="2.5" fill="#334155" />
        </g>

        <g transform="translate(372 410)">
          <path
            d="M0 0 C 20 0 34 14 34 32 C 34 54 0 82 0 82 C 0 82 -34 54 -34 32 C -34 14 -20 0 0 0 Z"
            fill="url(#mf-accent)"
            filter="url(#mf-soft)"
            opacity="0.16"
          />
          <path
            d="M0 6 C 15 6 26 16 26 30 C 26 47 0 68 0 68 C 0 68 -26 47 -26 30 C -26 16 -15 6 0 6 Z"
            fill="url(#mf-accent)"
          />
          <circle cx="0" cy="28" r="9" fill="#0b1224" />
        </g>
      </svg>
    </div>
  )
}
