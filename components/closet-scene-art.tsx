// The drawn closet: an arched window onto the ocean, sheer curtains, white
// shelves with folded clothes, a hanging rail, a light wood floor, a rug,
// and a palm. The mirror (with Sloane in it) sits on top as HTML.
export function ClosetSceneArt() {
  return (
    <svg
      viewBox="0 0 390 560"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="1" stopColor="#f7efe2" />
        </linearGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe6e4" />
          <stop offset="1" stopColor="#fdf3dc" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fb3b0" />
          <stop offset="0.6" stopColor="#8fd0c6" />
          <stop offset="1" stopColor="#d6efe6" />
        </linearGradient>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e6c8" />
          <stop offset="1" stopColor="#efd9b0" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecdcc2" />
          <stop offset="1" stopColor="#e2cdac" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#ffe28a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe28a" stopOpacity="0" />
        </radialGradient>
        <clipPath id="windowClip">
          <path d="M70 300 V140 A125 110 0 0 1 320 140 V300 Z" />
        </clipPath>
      </defs>

      {/* Wall */}
      <rect width="390" height="560" fill="url(#wall)" />

      {/* Window onto the ocean */}
      <g clipPath="url(#windowClip)">
        <rect x="60" y="20" width="270" height="290" fill="url(#sky)" />
        <circle cx="262" cy="150" r="46" fill="url(#sunGlow)" />
        <circle cx="262" cy="150" r="17" fill="#ffd75e" />
        <path d="M60 205 H330 V310 H60 Z" fill="url(#sea)" />
        <g stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" fill="none">
          <path d="M95 222 q8 -4 16 0 t16 0" />
          <path d="M200 232 q8 -4 16 0 t16 0" />
          <path d="M140 250 q8 -4 16 0 t16 0" />
          <path d="M250 262 q8 -4 16 0 t16 0" />
          <path d="M100 274 q8 -4 16 0 t16 0" />
        </g>
        <path d="M60 286 Q195 270 330 290 V310 H60 Z" fill="url(#sand)" />
      </g>
      <path
        d="M70 300 V140 A125 110 0 0 1 320 140 V300 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="9"
      />
      <path d="M195 30 V300" stroke="#ffffff" strokeWidth="5" />
      <rect x="62" y="298" width="266" height="9" rx="3" fill="#ffffff" />

      {/* Sheer curtains */}
      <path d="M52 24 C70 120 46 220 66 316 L46 316 C30 220 44 120 34 24 Z" fill="#ffffff" fillOpacity="0.75" />
      <path d="M338 24 C320 120 344 220 324 316 L344 316 C360 220 346 120 356 24 Z" fill="#ffffff" fillOpacity="0.75" />
      <rect x="26" y="18" width="338" height="5" rx="2.5" fill="#e9a92b" />

      {/* Left: open shelves with folded clothes */}
      <g>
        <rect x="0" y="70" width="44" height="370" fill="#ffffff" />
        <g fill="#f1e6d4">
          <rect x="0" y="150" width="44" height="4" />
          <rect x="0" y="230" width="44" height="4" />
          <rect x="0" y="310" width="44" height="4" />
          <rect x="0" y="390" width="44" height="4" />
        </g>
        <rect x="4" y="128" width="34" height="9" rx="3" fill="#bfe3d6" />
        <rect x="6" y="137" width="32" height="9" rx="3" fill="#f6c9b8" />
        <rect x="4" y="208" width="34" height="9" rx="3" fill="#ffd75e" />
        <rect x="6" y="217" width="32" height="9" rx="3" fill="#ffffff" stroke="#e8dcc8" />
        <rect x="4" y="288" width="34" height="9" rx="3" fill="#9fd3cf" />
        <rect x="6" y="297" width="32" height="9" rx="3" fill="#f28c38" fillOpacity="0.75" />
        <rect x="5" y="368" width="33" height="20" rx="5" fill="#e9d6b7" />
      </g>

      {/* Right: hanging rail */}
      <g>
        <rect x="346" y="70" width="44" height="370" fill="#ffffff" />
        <rect x="346" y="96" width="44" height="4" rx="2" fill="#e9a92b" />
        {[
          { x: 352, c: "#bfe3d6" },
          { x: 362, c: "#ffd75e" },
          { x: 372, c: "#f6c9b8" },
          { x: 382, c: "#9fd3cf" },
        ].map(({ x, c }) => (
          <g key={x}>
            <path d={`M${x} 100 v6`} stroke="#c9b28a" strokeWidth="1.5" />
            <path d={`M${x - 8} 112 L${x} 106 L${x + 8} 112 L${x + 6} 190 L${x - 6} 190 Z`} fill={c} />
          </g>
        ))}
        <rect x="350" y="400" width="36" height="34" rx="6" fill="#f3e7d3" />
      </g>

      {/* Floor and rug */}
      <rect x="0" y="440" width="390" height="120" fill="url(#floor)" />
      <g stroke="#d8c19c" strokeWidth="1" strokeOpacity="0.7">
        <path d="M0 470 H390" />
        <path d="M0 502 H390" />
        <path d="M0 536 H390" />
        <path d="M80 440 V470 M210 470 V502 M130 502 V536 M300 440 V470 M330 502 V536 M40 536 V560 M250 536 V560" />
      </g>
      <ellipse cx="195" cy="512" rx="150" ry="30" fill="#d9efe8" />
      <ellipse cx="195" cy="512" rx="128" ry="22" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 6" />

      {/* Palm in a pot */}
      <g>
        <path d="M30 470 L54 470 L50 500 L34 500 Z" fill="#f6efe2" stroke="#e2d2b5" />
        <g fill="#6fae96">
          <path d="M42 470 C30 440 12 430 4 432 C18 440 30 452 40 470 Z" />
          <path d="M42 470 C40 432 30 412 22 408 C30 424 36 446 41 470 Z" />
          <path d="M42 470 C52 436 66 424 76 424 C62 434 52 450 44 470 Z" />
          <path d="M42 470 C58 452 76 450 84 454 C70 456 56 462 44 470 Z" />
        </g>
      </g>
    </svg>
  );
}
