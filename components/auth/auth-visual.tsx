export function AuthVisual() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <svg
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="duskSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E1B3A" />
            <stop offset="55%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#3B3F8F" />
          </linearGradient>
          <linearGradient id="poolWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C7FF0" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5B5FEF" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="55%" stopColor="#15123A" stopOpacity="0" />
            <stop offset="100%" stopColor="#15123A" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        <rect width="400" height="600" fill="url(#duskSky)" />

        {/* stars */}
        {[
          [40, 40, 1.5],
          [120, 70, 1],
          [260, 50, 1.5],
          [340, 90, 1],
          [80, 120, 1],
          [300, 140, 1.5],
          [200, 30, 1],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#FFFFFF" opacity="0.4" />
        ))}

        {/* villa */}
        <rect x="50" y="120" width="300" height="180" rx="8" fill="#15123A" />
        <rect x="50" y="120" width="300" height="180" rx="8" stroke="#A5A8F5" strokeOpacity="0.15" />
        <rect x="42" y="112" width="316" height="10" rx="4" fill="#A5A8F5" opacity="0.2" />

        {/* lit windows */}
        {[0, 1, 2, 3, 4].map((col) =>
          [0, 1].map((row) => (
            <rect
              key={`${col}-${row}`}
              x={70 + col * 56}
              y={146 + row * 70}
              width="38"
              height="42"
              rx="3"
              fill="#FBBF24"
              opacity={0.55 + ((col + row) % 3) * 0.12}
            />
          )),
        )}

        {/* pool */}
        <rect x="40" y="340" width="320" height="170" rx="20" fill="url(#poolWater)" />
        <path
          d="M60,380 Q100,374 140,380 T220,380 T300,380 T380,380"
          stroke="#FFFFFF"
          strokeOpacity="0.25"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M55,420 Q95,414 135,420 T215,420 T295,420 T380,420"
          stroke="#FFFFFF"
          strokeOpacity="0.18"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M60,460 Q100,454 140,460 T220,460 T300,460 T380,460"
          stroke="#FFFFFF"
          strokeOpacity="0.15"
          strokeWidth="2"
          fill="none"
        />

        {/* palms */}
        <g opacity="0.7">
          <rect x="28" y="330" width="7" height="80" rx="2" fill="#15123A" />
          <circle cx="31" cy="320" r="20" fill="#15123A" />
          <rect x="368" y="300" width="7" height="110" rx="2" fill="#15123A" />
          <circle cx="371" cy="288" r="24" fill="#15123A" />
        </g>

        <rect width="400" height="600" fill="url(#vignette)" />
      </svg>

      <div className="absolute inset-x-10 bottom-10 text-white">
        <p className="text-lg font-medium leading-relaxed">
          Arkynex helps real estate professionals close more deals with less
          stress.
        </p>
        <p className="mt-3 text-sm text-white/60">— Built for modern agents</p>
      </div>
    </div>
  );
}
