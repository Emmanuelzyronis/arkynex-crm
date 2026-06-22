type Tone = "light" | "dusk";
export type Kind = "residential" | "commercial" | "land";

type IllustrationProps = {
  className?: string;
  tone?: Tone;
  /** Tint used for the building/plot/sign elements on light-tone illustrations. */
  accent?: string;
  /** Roughly maps to property_type — residential, office/commercial tower, or land. */
  kind?: Kind;
  /**
   * Unique id used to namespace the inline <linearGradient>. Required when
   * rendering many instances on one page (e.g. a property grid) so each
   * card's gradient doesn't collide with another's.
   */
  gradientId?: string;
};

export function BuildingIllustration({
  className,
  tone = "light",
  accent = "#5B5FEF",
  kind = "residential",
  gradientId,
}: IllustrationProps) {
  const isDusk = tone === "dusk";
  const gradId = `sky-${gradientId ?? tone}`;

  if (!isDusk && kind === "land") {
    return <LandIllustration className={className} accent={accent} gradId={gradId} />;
  }

  if (!isDusk && kind === "commercial") {
    return <CommercialIllustration className={className} accent={accent} gradId={gradId} />;
  }

  const skyFrom = isDusk ? "#312E81" : accent;
  const skyOpacityFrom = isDusk ? 0.92 : 0.12;
  const skyOpacityTo = isDusk ? 0.55 : 0.04;
  const buildingFill = isDusk ? "#1E1B3A" : accent;
  const buildingOpacity = isDusk ? 0.92 : 0.1;
  const strokeColor = isDusk ? "#A5A8F5" : accent;
  const strokeOpacity = isDusk ? 0.25 : 0.3;
  const accentOpacity = isDusk ? 0.3 : 0.16;
  const windowFill = isDusk ? "#FBBF24" : accent;

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyFrom} stopOpacity={skyOpacityFrom} />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity={skyOpacityTo} />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${gradId})`} />

      {/* terrace line */}
      <rect x="30" y="240" width="340" height="3" rx="1.5" fill={strokeColor} opacity={isDusk ? 0.35 : 0.15} />

      {/* side wing */}
      <rect x="300" y="150" width="65" height="90" rx="6" fill={buildingFill} opacity={buildingOpacity * 0.8} />
      <rect x="300" y="150" width="65" height="90" rx="6" stroke={strokeColor} strokeOpacity={strokeOpacity} />

      {/* main block */}
      <rect x="80" y="90" width="225" height="150" rx="6" fill={buildingFill} opacity={buildingOpacity} />
      <rect x="80" y="90" width="225" height="150" rx="6" stroke={strokeColor} strokeOpacity={strokeOpacity} />

      {/* roofline */}
      <rect x="72" y="80" width="241" height="10" rx="4" fill={strokeColor} opacity={isDusk ? 0.5 : 0.25} />

      {/* window grid */}
      {[0, 1, 2, 3].map((col) =>
        [0, 1].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={102 + col * 50}
            y={112 + row * 56}
            width="36"
            height="36"
            rx="3"
            fill={windowFill}
            opacity={isDusk ? 0.85 : 0.16 + (col + row) * 0.03}
          />
        )),
      )}

      {/* tree accents */}
      <circle cx="55" cy="220" r="14" fill={strokeColor} opacity={accentOpacity} />
      <rect x="52" y="220" width="6" height="22" fill={strokeColor} opacity={accentOpacity} />
      <circle cx="352" cy="208" r="18" fill={strokeColor} opacity={accentOpacity} />
      <rect x="348" y="208" width="8" height="30" fill={strokeColor} opacity={accentOpacity} />
    </svg>
  );
}

/** Empty plot with a surveyed boundary + "for sale" sign — used for property_type = 'land'. */
function LandIllustration({
  className,
  accent,
  gradId,
}: {
  className?: string;
  accent: string;
  gradId: string;
}) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.1" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${gradId})`} />

      {/* ground */}
      <rect x="0" y="190" width="400" height="110" fill={accent} opacity="0.06" />

      {/* surveyed plot boundary */}
      <path
        d="M70,190 L330,190 L300,280 L100,280 Z"
        fill={accent}
        fillOpacity="0.08"
        stroke={accent}
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeDasharray="8 6"
      />
      {[
        [70, 190],
        [330, 190],
        [300, 280],
        [100, 280],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill={accent} opacity="0.5" />
      ))}

      {/* for-sale sign */}
      <rect x="128" y="138" width="4" height="55" fill={accent} opacity="0.35" />
      <rect
        x="106"
        y="116"
        width="64"
        height="26"
        rx="3"
        fill={accent}
        fillOpacity="0.18"
        stroke={accent}
        strokeOpacity="0.35"
      />

      {/* sparse vegetation */}
      <circle cx="252" cy="206" r="13" fill={accent} opacity="0.16" />
      <rect x="249" y="206" width="5" height="20" fill={accent} opacity="0.16" />
      <circle cx="62" cy="226" r="10" fill={accent} opacity="0.14" />
      <rect x="59" y="226" width="5" height="16" fill={accent} opacity="0.14" />
    </svg>
  );
}

/** Single office tower with a regular window grid — used for commercial / office. */
function CommercialIllustration({
  className,
  accent,
  gradId,
}: {
  className?: string;
  accent: string;
  gradId: string;
}) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${gradId})`} />

      {/* ground line */}
      <rect x="20" y="270" width="360" height="3" rx="1.5" fill={accent} opacity="0.15" />

      {/* low annex */}
      <rect x="40" y="190" width="95" height="80" rx="6" fill={accent} opacity="0.08" />
      <rect x="40" y="190" width="95" height="80" rx="6" stroke={accent} strokeOpacity="0.25" />

      {/* main tower */}
      <rect x="150" y="30" width="150" height="240" rx="8" fill={accent} opacity="0.1" />
      <rect x="150" y="30" width="150" height="240" rx="8" stroke={accent} strokeOpacity="0.3" />

      {/* rooftop */}
      <rect x="143" y="20" width="164" height="10" rx="4" fill={accent} opacity="0.25" />

      {/* window grid: 3 cols x 6 rows */}
      {[0, 1, 2].map((col) =>
        [0, 1, 2, 3, 4, 5].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={168 + col * 38}
            y={48 + row * 36}
            width="26"
            height="26"
            rx="2"
            fill={accent}
            opacity={0.14 + ((col + row) % 4) * 0.04}
          />
        )),
      )}

      {/* entrance */}
      <rect x="195" y="240" width="60" height="30" rx="3" fill={accent} opacity="0.2" />

      {/* small tree */}
      <circle cx="335" cy="245" r="14" fill={accent} opacity="0.16" />
      <rect x="332" y="245" width="6" height="24" fill={accent} opacity="0.16" />
    </svg>
  );
}
