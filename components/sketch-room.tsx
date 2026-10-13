// A walk-in closet drawn like an interior designer's marker sketch: thin
// ink lines over soft, streaky marker washes, in one-point perspective.
// Both backgrounds use this with their own colors and window view.

type Pt = [number, number];

// The room, in a 390 × 560 drawing. The back wall runs from (95, 120) to
// (295, 330); everything else narrows towards it.
const BACK = { left: 95, right: 295, top: 120, bottom: 330 };

// t = depth (0 at the front edge, 1 at the back wall); h = height
// (0 floor, 1 ceiling); u = across the floor (0 left, 1 right).
const wallY = (t: number, h: number) => {
  const bottom = 560 - (560 - BACK.bottom) * t;
  const top = BACK.top * t;
  return bottom - h * (bottom - top);
};
const L = (t: number, h: number): Pt => [BACK.left * t, wallY(t, h)];
const R = (t: number, h: number): Pt => [
  390 - (390 - BACK.right) * t,
  wallY(t, h),
];
const F = (u: number, t: number): Pt => {
  const left = BACK.left * t;
  const right = 390 - (390 - BACK.right) * t;
  return [left + u * (right - left), 560 - (560 - BACK.bottom) * t];
};
const pts = (...p: Pt[]) =>
  p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

// A flat panel on the left or right wall, from depth t0..t1, height h0..h1.
const panel = (
  side: typeof L,
  t0: number,
  t1: number,
  h0: number,
  h1: number,
) => pts(side(t0, h0), side(t1, h0), side(t1, h1), side(t0, h1));

export type SketchTheme = {
  id: string;
  ink: string;
  wall: string;
  sideWall: string;
  ceiling: string;
  floor: string;
  floorLine: string;
  cabinet: string;
  cabinetShade: string;
  knob: string;
  rug: string;
  rugBorder: string;
  rugPattern: string;
  garments: string[];
  shelfThings: string[];
  chandelier: "palm" | "linear";
  window: "ocean" | "city";
};

export function SketchRoom({ theme }: { theme: SketchTheme }) {
  const id = (name: string) => `${theme.id}-${name}`;
  const ref = (name: string) => `url(#${id(name)})`;
  const ink = {
    stroke: theme.ink,
    strokeWidth: 1.1,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  // Hanging clothes along the left wall.
  const garments: { t: number; w: number; drop: number; color: string }[] = [];
  for (let t = 0.2, i = 0; t < 0.86; i++) {
    const w = 0.035 + ((i * 7) % 3) * 0.012;
    garments.push({
      t,
      w,
      drop: 0.3 + ((i * 5) % 4) * 0.05,
      color: theme.garments[i % theme.garments.length],
    });
    t += w + 0.006;
  }

  // Cubbies on the upper right wall.
  const cubbyT = [0.12, 0.32, 0.52, 0.72, 0.9];
  const cubbyH = [0.5, 0.7, 0.92];

  return (
    <svg
      viewBox="0 0 390 560"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        {/* Marker washes: ragged, slightly streaky edges. */}
        <filter id={id("marker")} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.25"
            numOctaves="2"
            seed="4"
          />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
        {/* Gentler washes for small things (bags, folded clothes). */}
        <filter
          id={id("markerSoft")}
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves="1"
            seed="7"
          />
          <feDisplacementMap in="SourceGraphic" scale="1.6" />
        </filter>
        {/* Ink: a little hand wobble. */}
        <filter id={id("ink")} x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.6"
            numOctaves="1"
            seed="9"
          />
          <feDisplacementMap in="SourceGraphic" scale="1.4" />
        </filter>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor={theme.window === "ocean" ? "#bfe6e4" : "#cfdbe4"}
          />
          <stop
            offset="1"
            stopColor={theme.window === "ocean" ? "#fbf1db" : "#eef1f3"}
          />
        </linearGradient>
        <linearGradient id={id("sea")} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor={theme.window === "ocean" ? "#5fb3b0" : "#5d8fa8"}
          />
          <stop
            offset="1"
            stopColor={theme.window === "ocean" ? "#bfe6dc" : "#a9c6d3"}
          />
        </linearGradient>
        <clipPath id={id("window")}>
          {theme.window === "ocean" ? (
            <path d="M138 312 V210 A57 57 0 0 1 252 210 V312 Z" />
          ) : (
            <rect x="120" y="150" width="150" height="162" />
          )}
        </clipPath>
      </defs>

      {/* Paper */}
      <rect width="390" height="560" fill="#fdfcf9" />

      {/* Marker washes */}
      <g filter={ref("marker")} opacity="0.9">
        <polygon
          points={pts(
            [0, 0],
            [390, 0],
            [BACK.right, BACK.top],
            [BACK.left, BACK.top],
          )}
          fill={theme.ceiling}
          opacity="0.55"
        />
        <polygon
          points={pts(L(0, 1), L(1, 1), L(1, 0), L(0, 0))}
          fill={theme.sideWall}
          opacity="0.6"
        />
        <polygon
          points={pts(R(0, 1), R(1, 1), R(1, 0), R(0, 0))}
          fill={theme.sideWall}
          opacity="0.6"
        />
        <rect
          x={BACK.left}
          y={BACK.top}
          width={BACK.right - BACK.left}
          height={BACK.bottom - BACK.top}
          fill={theme.wall}
          opacity="0.7"
        />
        <polygon
          points={pts(F(0, 0), F(1, 0), F(1, 1), F(0, 1))}
          fill={theme.floor}
          opacity="0.75"
        />

        {/* Rug runner down the middle */}
        <polygon
          points={pts(F(0.3, 0.02), F(0.7, 0.02), F(0.62, 0.62), F(0.38, 0.62))}
          fill={theme.rugBorder}
          opacity="0.75"
        />
        <polygon
          points={pts(F(0.34, 0.06), F(0.66, 0.06), F(0.6, 0.58), F(0.4, 0.58))}
          fill={theme.rug}
          opacity="0.8"
        />
      </g>
      <g filter={ref("markerSoft")}>
        {/* Left: hanging clothes inside a built-in */}
        <polygon
          points={panel(L, 0.12, 0.9, 0.06, 0.94)}
          fill={theme.cabinetShade}
          opacity="0.45"
        />
        {garments.map((g) => (
          <polygon
            key={g.t}
            points={pts(
              L(g.t, 0.74),
              L(g.t + g.w, 0.74),
              L(g.t + g.w, g.drop),
              L(g.t, g.drop),
            )}
            fill={g.color}
            opacity="0.85"
          />
        ))}
        {[0.2, 0.42, 0.64].map((t, i) => (
          <polygon
            key={t}
            points={panel(L, t, t + 0.16, 0.8, 0.88)}
            fill={theme.shelfThings[i % theme.shelfThings.length]}
            opacity="0.7"
          />
        ))}

        {/* Right: drawers below, cubbies above */}
        <polygon
          points={panel(R, 0.05, 0.95, 0, 0.38)}
          fill={theme.cabinet}
          opacity="0.8"
        />
        <polygon
          points={panel(R, 0.05, 0.95, 0.38, 0.41)}
          fill={theme.knob}
          opacity="0.5"
        />
        <polygon
          points={panel(R, 0.1, 0.92, 0.48, 0.94)}
          fill={theme.cabinetShade}
          opacity="0.4"
        />
        {cubbyT.slice(0, -1).map((t0, i) =>
          cubbyH.slice(0, -1).map((h0, j) => {
            const t1 = cubbyT[i + 1];
            const color =
              theme.shelfThings[(i + j * 2) % theme.shelfThings.length];
            const mid = (t0 + t1) / 2;
            return (i + j) % 3 === 2 ? (
              <polygon
                key={`${i}-${j}`}
                points={panel(R, t0 + 0.03, t1 - 0.03, h0 + 0.03, h0 + 0.1)}
                fill={color}
                opacity="0.7"
              />
            ) : (
              <path
                key={`${i}-${j}`}
                d={`M${pts(R(mid - 0.05, h0 + 0.02))} L${pts(R(mid + 0.05, h0 + 0.02))} L${pts(R(mid + 0.04, h0 + 0.11))} L${pts(R(mid - 0.04, h0 + 0.11))} Z`}
                fill={color}
                opacity="0.8"
              />
            );
          }),
        )}
      </g>

      {/* Window view (crisp, behind the ink frame) */}
      <g clipPath={ref("window")}>
        <rect x="110" y="140" width="170" height="180" fill={ref("sky")} />
        {theme.window === "ocean" ? (
          <>
            <circle cx="228" cy="198" r="12" fill="#ffd75e" opacity="0.9" />
            <rect x="110" y="250" width="170" height="70" fill={ref("sea")} />
            <path d="M110 300 Q195 288 280 302 V320 H110 Z" fill="#f3e2bf" />
            <g
              stroke="#ffffff"
              strokeOpacity="0.8"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            >
              <path d="M150 264 q5 -3 10 0 t10 0" />
              <path d="M205 274 q5 -3 10 0 t10 0" />
              <path d="M170 286 q5 -3 10 0 t10 0" />
            </g>
          </>
        ) : (
          <>
            <circle cx="244" cy="178" r="9" fill="#f4f1e8" />
            <rect x="196" y="250" width="80" height="70" fill={ref("sea")} />
            <g fill="#8a939c">
              <rect x="120" y="214" width="14" height="100" />
              <rect x="136" y="186" width="16" height="128" />
              <rect x="154" y="222" width="12" height="92" />
              <rect x="168" y="200" width="16" height="114" />
              <rect x="186" y="236" width="12" height="78" />
            </g>
            <g fill="#f4e7b8" fillOpacity="0.85">
              {[198, 210, 222, 234, 246, 258].map((y) => (
                <g key={y}>
                  <rect x="140" y={y} width="3" height="4" />
                  <rect x="146" y={y + 5} width="3" height="4" />
                  <rect x="172" y={y + 10} width="3" height="4" />
                </g>
              ))}
            </g>
            <g
              stroke="#ffffff"
              strokeOpacity="0.7"
              strokeWidth="1"
              strokeLinecap="round"
            >
              <path d="M214 270 h12 M240 284 h14 M220 298 h10" />
            </g>
          </>
        )}
      </g>

      {/* Ink lines */}
      <g {...ink} filter={ref("ink")}>
        {/* Room edges */}
        <path
          d={`M0 0 L${BACK.left} ${BACK.top} M390 0 L${BACK.right} ${BACK.top} M0 560 L${BACK.left} ${BACK.bottom} M390 560 L${BACK.right} ${BACK.bottom}`}
        />
        <rect
          x={BACK.left}
          y={BACK.top}
          width={BACK.right - BACK.left}
          height={BACK.bottom - BACK.top}
        />
        <path
          d={`M${BACK.left} ${BACK.bottom - 6} H${BACK.right}`}
          strokeWidth="0.7"
        />
        {/* Crown moulding */}
        <path
          d={`M0 14 L${BACK.left} ${BACK.top + 6} H${BACK.right} L390 14`}
          strokeWidth="0.7"
        />

        {/* Window frame */}
        {theme.window === "ocean" ? (
          <>
            <path
              d="M138 312 V210 A57 57 0 0 1 252 210 V312 Z"
              strokeWidth="1.6"
            />
            <path
              d="M132 312 V208 A63 63 0 0 1 258 208 V312"
              strokeWidth="0.8"
            />
            <path d="M195 153 V312 M138 250 H252" strokeWidth="0.9" />
            <path d="M128 316 H262" strokeWidth="1.4" />
            {/* Sheer curtains */}
            <path
              d="M122 140 C128 200 118 260 126 316 M268 140 C262 200 272 260 264 316"
              strokeWidth="0.7"
            />
            <path d="M116 140 H274" strokeWidth="1.2" />
          </>
        ) : (
          <>
            <rect x="120" y="150" width="150" height="162" strokeWidth="2.2" />
            <path
              d="M170 150 V312 M220 150 V312 M120 231 H270"
              strokeWidth="1.4"
            />
          </>
        )}

        {/* Left built-in and hanging rail */}
        <polygon points={panel(L, 0.12, 0.9, 0.06, 0.94)} />
        <path
          d={`M${pts(L(0.14, 0.76))} L${pts(L(0.88, 0.76))}`}
          strokeWidth="1.4"
        />
        <path
          d={`M${pts(L(0.12, 0.8))} L${pts(L(0.9, 0.8))}`}
          strokeWidth="0.8"
        />
        {garments.map((g) => (
          <g key={g.t}>
            <path
              d={`M${pts(L(g.t + g.w / 2, 0.76))} L${pts(L(g.t + g.w / 2, 0.74))}`}
              strokeWidth="0.8"
            />
            <polygon
              points={pts(
                L(g.t, 0.74),
                L(g.t + g.w, 0.74),
                L(g.t + g.w, g.drop),
                L(g.t, g.drop),
              )}
              strokeWidth="0.7"
            />
          </g>
        ))}
        {[0.2, 0.42, 0.64].map((t) => (
          <polygon
            key={t}
            points={panel(L, t, t + 0.16, 0.8, 0.88)}
            strokeWidth="0.7"
          />
        ))}
        <path
          d={`M${pts(L(0.12, 0.2))} L${pts(L(0.9, 0.2))}`}
          strokeWidth="0.8"
        />

        {/* Right drawers */}
        <polygon points={panel(R, 0.05, 0.95, 0, 0.38)} />
        <polygon points={panel(R, 0.03, 0.97, 0.38, 0.41)} />
        {[0.13, 0.26].map((h) => (
          <path
            key={h}
            d={`M${pts(R(0.05, h))} L${pts(R(0.95, h))}`}
            strokeWidth="0.8"
          />
        ))}
        {[0.27, 0.5, 0.73].map((t) => (
          <path
            key={t}
            d={`M${pts(R(t, 0))} L${pts(R(t, 0.38))}`}
            strokeWidth="0.8"
          />
        ))}

        {/* Right cubbies */}
        <polygon points={panel(R, 0.1, 0.92, 0.48, 0.94)} />
        {cubbyT.map((t) => (
          <path
            key={t}
            d={`M${pts(R(t, 0.48))} L${pts(R(t, 0.94))}`}
            strokeWidth="0.8"
          />
        ))}
        {cubbyH.map((h) => (
          <path
            key={h}
            d={`M${pts(R(0.1, h))} L${pts(R(0.92, h))}`}
            strokeWidth="0.8"
          />
        ))}

        {/* Floor boards towards the back wall */}
        <g stroke={theme.floorLine} strokeWidth="0.7">
          {Array.from({ length: 11 }, (_, i) => i / 10).map((u) => (
            <path key={u} d={`M${pts(F(u, 0))} L${pts(F(u, 1))}`} />
          ))}
          {[0.25, 0.55, 0.8].map((t) => (
            <path
              key={t}
              d={`M${pts(F(0, t))} L${pts(F(1, t))}`}
              strokeOpacity="0.4"
            />
          ))}
        </g>

        {/* Rug */}
        <polygon
          points={pts(F(0.3, 0.02), F(0.7, 0.02), F(0.62, 0.62), F(0.38, 0.62))}
        />
        <polygon
          points={pts(F(0.34, 0.06), F(0.66, 0.06), F(0.6, 0.58), F(0.4, 0.58))}
          strokeWidth="0.7"
        />
        {[0.14, 0.26, 0.38, 0.5].map((t) => {
          const [cx, cy] = F(0.5, t);
          const [ex] = F(0.56, t);
          const dx = ex - cx;
          const dy = 10 * (1 - t * 0.6);
          return (
            <path
              key={t}
              d={`M${cx - dx} ${cy} L${cx} ${cy - dy} L${cx + dx} ${cy} L${cx} ${cy + dy} Z`}
              stroke={theme.rugPattern}
              strokeWidth="1"
            />
          );
        })}
        {/* Fringe */}
        <g strokeWidth="0.6">
          {Array.from({ length: 14 }, (_, i) => 0.3 + (i * 0.4) / 13).map(
            (u) => {
              const [x, y] = F(u, 0.02);
              return <path key={u} d={`M${x} ${y} v6`} />;
            },
          )}
        </g>
      </g>

      {/* Gold drawer knobs */}
      <g fill={theme.knob}>
        {[0.16, 0.38, 0.61, 0.84].flatMap((t) =>
          [0.07, 0.2, 0.32].map((h) => {
            const [x, y] = R(t, h);
            return <circle key={`${t}-${h}`} cx={x} cy={y} r={2.4 - t * 0.9} />;
          }),
        )}
      </g>

      {/* Chandelier */}
      {theme.chandelier === "palm" ? (
        <g filter={ref("ink")}>
          <path d="M195 0 V70" stroke={theme.knob} strokeWidth="2" />
          <g fill="#ffffff" stroke={theme.ink} strokeWidth="0.8">
            {[-70, -45, -20, 0, 20, 45, 70, -110, 110].map((angle) => (
              <path
                key={angle}
                transform={`translate(195 78) rotate(${angle})`}
                d="M0 0 C-8 -12 -6 -34 0 -46 C6 -34 8 -12 0 0 Z M0 -4 V-42 M0 -14 l-4 -4 M0 -22 l4 -4 M0 -30 l-4 -4"
              />
            ))}
          </g>
          <circle cx="195" cy="78" r="4" fill={theme.knob} />
        </g>
      ) : (
        <g filter={ref("ink")}>
          <path d="M150 0 V58 M240 0 V58" stroke={theme.ink} strokeWidth="1" />
          <rect x="130" y="58" width="130" height="7" rx="3" fill={theme.ink} />
          <path
            d="M136 66 H254"
            stroke="#f4e7b8"
            strokeWidth="2"
            strokeOpacity="0.8"
          />
        </g>
      )}

      {/* A few loose marker streaks for the hand-drawn feel */}
      <g
        stroke={theme.ceiling}
        strokeOpacity="0.35"
        strokeWidth="6"
        strokeLinecap="round"
        filter={ref("marker")}
      >
        <path d="M120 30 L130 100 M250 24 L262 96 M300 40 L306 90" />
      </g>
    </svg>
  );
}
