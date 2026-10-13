// A modern closet in greys: a tall black-framed window onto a city skyline
// and the ocean, dark shelves, a black hanging rail, a concrete floor, and
// a floor lamp. Made for Sloane's older brother.
export function CityClosetArt() {
  return (
    <svg
      viewBox="0 0 390 560"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eceef0" />
          <stop offset="1" stopColor="#dcdfe3" />
        </linearGradient>
        <linearGradient id="cSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d8e4" />
          <stop offset="1" stopColor="#eef1f3" />
        </linearGradient>
        <linearGradient id="cSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d8fa8" />
          <stop offset="1" stopColor="#9fc0cf" />
        </linearGradient>
        <linearGradient id="cFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7cacd" />
          <stop offset="1" stopColor="#b3b7bb" />
        </linearGradient>
        <clipPath id="cWindow">
          <rect x="66" y="34" width="258" height="270" />
        </clipPath>
      </defs>

      <rect width="390" height="560" fill="url(#cWall)" />

      {/* Window: city on the left, ocean on the right */}
      <g clipPath="url(#cWindow)">
        <rect x="66" y="34" width="258" height="270" fill="url(#cSky)" />
        <circle cx="282" cy="96" r="14" fill="#f4f1e8" />
        <path d="M200 200 H324 V304 H200 Z" fill="url(#cSea)" />
        <path d="M160 214 H324 V304 H160 Z" fill="url(#cSea)" />
        <g stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round">
          <path d="M228 236 h18 M268 252 h20 M236 272 h16 M286 286 h18" />
        </g>
        <g fill="#7d8791">
          <rect x="66" y="150" width="22" height="154" />
          <rect x="90" y="118" width="26" height="186" />
          <rect x="118" y="164" width="18" height="140" />
          <rect x="138" y="96" width="24" height="208" />
          <rect x="164" y="176" width="20" height="128" />
        </g>
        <g fill="#5e6873">
          <rect x="76" y="190" width="18" height="114" />
          <rect x="104" y="170" width="20" height="134" />
          <rect x="144" y="200" width="22" height="104" />
          <path d="M146 96 L150 76 L154 96 Z" />
        </g>
        <g fill="#f4e7b8" fillOpacity="0.8">
          {[130, 146, 162, 178, 194, 210].map((y) => (
            <g key={y}>
              <rect x="95" y={y} width="4" height="5" />
              <rect x="105" y={y + 6} width="4" height="5" />
              <rect x="143" y={y - 10} width="4" height="5" />
              <rect x="153" y={y} width="4" height="5" />
            </g>
          ))}
        </g>
      </g>
      <g fill="none" stroke="#1f2328" strokeWidth="5">
        <rect x="66" y="34" width="258" height="270" />
        <path d="M152 34 V304 M238 34 V304 M66 170 H324" strokeWidth="3" />
      </g>

      {/* Left: dark shelves with folded clothes */}
      <rect x="0" y="60" width="46" height="380" fill="#3a3f45" />
      <g fill="#2a2e33">
        <rect x="0" y="150" width="46" height="4" />
        <rect x="0" y="240" width="46" height="4" />
        <rect x="0" y="330" width="46" height="4" />
      </g>
      <rect x="5" y="128" width="36" height="10" rx="2" fill="#9aa3ad" />
      <rect x="6" y="138" width="34" height="10" rx="2" fill="#ffffff" />
      <rect x="5" y="218" width="36" height="10" rx="2" fill="#2f4a66" />
      <rect x="6" y="228" width="34" height="10" rx="2" fill="#c9cdd2" />
      <rect x="5" y="308" width="36" height="10" rx="2" fill="#6f7a86" />
      <rect x="6" y="318" width="34" height="10" rx="2" fill="#1f2328" />

      {/* Right: black rail with shirts and a jacket */}
      <rect x="344" y="60" width="46" height="380" fill="#f4f5f6" />
      <rect x="344" y="94" width="46" height="4" fill="#1f2328" />
      {[
        { x: 352, c: "#2f4a66" },
        { x: 363, c: "#9aa3ad" },
        { x: 374, c: "#ffffff" },
        { x: 385, c: "#3a3f45" },
      ].map(({ x, c }) => (
        <g key={x}>
          <path d={`M${x} 98 v6`} stroke="#1f2328" strokeWidth="1.5" />
          <path
            d={`M${x - 8} 110 L${x} 104 L${x + 8} 110 L${x + 7} 200 L${x - 7} 200 Z`}
            fill={c}
            stroke="#c9cdd2"
            strokeWidth="0.6"
          />
        </g>
      ))}

      {/* Concrete floor, rug, floor lamp */}
      <rect x="0" y="440" width="390" height="120" fill="url(#cFloor)" />
      <g stroke="#a6aaae" strokeWidth="1" strokeOpacity="0.7">
        <path d="M0 500 H390 M130 440 V500 M260 440 V500 M65 500 V560 M195 500 V560 M325 500 V560" />
      </g>
      <rect x="55" y="488" width="280" height="44" rx="4" fill="#8e959c" />
      <rect x="63" y="494" width="264" height="32" rx="3" fill="none" stroke="#a9afb5" strokeWidth="1.5" />
      <g>
        <path d="M30 470 V340" stroke="#1f2328" strokeWidth="3" />
        <path d="M16 340 H44 L38 316 H22 Z" fill="#1f2328" />
        <ellipse cx="30" cy="472" rx="12" ry="3" fill="#1f2328" />
      </g>
    </svg>
  );
}
