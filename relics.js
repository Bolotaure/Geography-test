// Original relic illustrations for Wizard's Quiz Academy.
// Each drawing is an inline SVG with its own gradients, so nothing here is a studio asset.
let __relicN = 0;
function relicSVG(kind, accent) {
  const n = "rl" + (++__relicN) + kind;
  const A = accent || "#c9a227";
  const g = (name, stops, extra) => `<linearGradient id="${n}${name}" ${extra || 'x1="0" y1="0" x2="1" y2="1"'}>${stops}</linearGradient>`;
  const defs = `<defs>
    ${g("paper", '<stop offset="0%" stop-color="#fffaf0"/><stop offset="70%" stop-color="#f0ddb8"/><stop offset="100%" stop-color="#c9a56a"/>', 'x1="0" y1="0" x2="0" y2="1"')}
    ${g("gold", `<stop offset="0%" stop-color="#fff6d2"/><stop offset="42%" stop-color="${A}"/><stop offset="100%" stop-color="#5c3d12"/>`)}
    ${g("shine", '<stop offset="0%" stop-color="#fff" stop-opacity=".85"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>', 'x1="0" y1="0" x2="0" y2="1"')}
    <radialGradient id="${n}glow" cx="50%" cy="45%" r="50%"><stop offset="0%" stop-color="${A}" stop-opacity=".55"/><stop offset="100%" stop-color="${A}" stop-opacity="0"/></radialGradient>
    <filter id="${n}soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3a2412" flood-opacity=".35"/></filter>
  </defs>`;
  const frame = `<circle cx="100" cy="100" r="94" fill="url(#${n}paper)"/><circle cx="100" cy="100" r="94" fill="none" stroke="url(#${n}gold)" stroke-width="7"/>
    <circle cx="100" cy="100" r="82" fill="none" stroke="${A}" stroke-width="1.2" opacity=".55"/>
    <circle cx="100" cy="78" r="46" fill="url(#${n}glow)"/>`;
  const icons = {
    compass: `<circle cx="100" cy="104" r="48" fill="#1c140c" opacity=".15"/><circle cx="100" cy="102" r="46" fill="#f7efe0" stroke="url(#${n}gold)" stroke-width="6"/>
      <circle cx="100" cy="102" r="36" fill="none" stroke="${A}" stroke-width="1"/><g stroke="#5c4630" stroke-width="2">${[0,30,60,90,120,150].map(a=>`<line transform="rotate(${a} 100 102)" x1="100" y1="70" x2="100" y2="76"/>`).join("")}</g>
      <polygon points="100,68 108,104 100,98 92,104" fill="#b4232c"/><polygon points="100,136 92,104 100,110 108,104" fill="#2c2118"/>
      <circle cx="100" cy="102" r="5" fill="url(#${n}gold)"/><text x="100" y="64" text-anchor="middle" font-size="11" fill="#5c3d12" font-family="Palatino, serif">N</text>`,
    lantern: `<path d="M78 58 h44 l8 18 v46 l-8 16 H78 l-8-16 V76 z" fill="#3a2418"/><path d="M82 64 h36 l6 14 v38 l-6 12 H82 l-6-12 V78 z" fill="#ffb347"/>
      <path d="M90 78 h20 v28 H90 z" fill="#ffe7a3" opacity=".9"/><path d="M100 86 c6 8 6 16 0 24 c-6-8-6-16 0-24 z" fill="#fff6d0"/>
      <path d="M86 54 h28 v8 H86 z" fill="url(#${n}gold)"/><path d="M96 42 h8 v12 h-8 z" fill="#5c3d12"/><path d="M88 40 h24" stroke="#5c3d12" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="100" cy="150" rx="22" ry="5" fill="#000" opacity=".15"/>`,
    quill: `<path d="M128 46 c-30 8-58 36-74 78 c22-18 48-28 74-30 c-8 16-22 28-40 36 c18-2 36-12 48-28 c8-12 10-28 6-42 z" fill="#f4efe4" stroke="#5c3d12" stroke-width="2"/>
      <path d="M70 130 c18-16 40-24 62-26" fill="none" stroke="${A}" stroke-width="2"/><path d="M54 148 l18-22 8 6-16 24 z" fill="url(#${n}gold)"/>
      <path d="M48 162 c8-6 14-8 18-4" stroke="#2c2118" stroke-width="2" fill="none"/><circle cx="132" cy="52" r="4" fill="${A}"/>`,
    atlas: `<path d="M46 58 h48 c8 10 8 46 0 62 H46 z" fill="#f7efe0" stroke="#5c3d12" stroke-width="2.5"/><path d="M154 58 h-48 c-8 10-8 46 0 62 h48 z" fill="#efe2c4" stroke="#5c3d12" stroke-width="2.5"/>
      <path d="M94 58 v62" stroke="${A}" stroke-width="3"/><path d="M56 78 h24 M56 92 h20 M112 80 h22 M112 96 h18" stroke="#3d6b8a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="70" cy="104" r="6" fill="none" stroke="#1f6b4a" stroke-width="2"/><path d="M52 54 h96" stroke="url(#${n}gold)" stroke-width="4"/>`,
    gem: `<polygon points="100,42 146,78 132,150 68,150 54,78" fill="${A}" stroke="#3a2412" stroke-width="2"/><polygon points="100,42 122,78 100,150 78,78" fill="#fff" opacity=".28"/>
      <polygon points="78,78 54,78 68,150 100,150" fill="#000" opacity=".18"/><path d="M54 78 h92" stroke="#fff6d2" stroke-width="2" opacity=".7"/>
      <circle cx="100" cy="40" r="18" fill="url(#${n}glow)"/>`,
    globe: `<ellipse cx="100" cy="156" rx="36" ry="8" fill="#000" opacity=".12"/><path d="M78 150 h44 l-6 16 H84 z" fill="url(#${n}gold)"/>
      <circle cx="100" cy="96" r="46" fill="#d5e6f5" stroke="#2c2118" stroke-width="3"/><ellipse cx="100" cy="96" rx="18" ry="46" fill="none" stroke="${A}" stroke-width="2"/>
      <path d="M58 96 h84 M68 76 h64 M68 116 h64" fill="none" stroke="#2c2118" stroke-width="1.5"/><path d="M78 70 c10 16 14 30 10 52" fill="#7dba8a" opacity=".85"/><path d="M112 78 c8 10 6 28-4 40" fill="#7dba8a" opacity=".8"/>`,
    wand: `<path d="M48 160 L138 48" stroke="#5c3d12" stroke-width="8" stroke-linecap="round"/><path d="M52 156 L134 54" stroke="url(#${n}gold)" stroke-width="3" stroke-linecap="round"/>
      <path d="M138 48 l16-8 -6 16 z" fill="${A}"/><circle cx="154" cy="36" r="8" fill="#fff6d2" filter="url(#${n}soft)"/><circle cx="154" cy="36" r="3" fill="${A}"/>
      <path d="M70 132 l8 4 M96 100 l6 3" stroke="#fff6d2" stroke-width="2"/>`,
    book: `<path d="M48 52 h42 c10 12 10 62 0 78 H48 z" fill="#6e2a34"/><path d="M152 52 h-42 c-10 12-10 62 0 78 h42 z" fill="#8c1c2c"/>
      <path d="M90 52 v78" stroke="url(#${n}gold)" stroke-width="4"/><rect x="70" y="78" width="18" height="22" rx="2" fill="${A}"/><circle cx="118" cy="88" r="7" fill="${A}"/>
      <path d="M58 64 h22 M108 66 h24" stroke="#f6ead2" stroke-width="2" opacity=".7"/>`,
    ink: `<ellipse cx="100" cy="150" rx="34" ry="8" fill="#000" opacity=".12"/><path d="M70 96 h60 l-8 40 H78 z" fill="#1e3a5f" stroke="#0e1c30" stroke-width="2"/>
      <path d="M78 104 h44 l-4 22 H82 z" fill="#3d6b9a" opacity=".65"/><rect x="82" y="70" width="36" height="28" rx="4" fill="#f7efe0" stroke="#5c3d12" stroke-width="2"/>
      <path d="M100 70 v-16" stroke="#5c3d12" stroke-width="3"/><circle cx="100" cy="50" r="5" fill="${A}"/><ellipse cx="96" cy="112" rx="8" ry="4" fill="#fff" opacity=".25"/>`,
    rune: `<path d="M62 46 h76 l8 12 v84 l-10 12 H64 l-10-12 V58 z" fill="#d9d0c2" stroke="#5c4630" stroke-width="3"/>
      <path d="M86 78 h28 M100 78 v40 M86 118 h28" stroke="${A}" stroke-width="5" stroke-linecap="round" filter="url(#${n}soft)"/>
      <circle cx="100" cy="98" r="22" fill="url(#${n}glow)"/>`,
    circlet: `<path d="M42 118 h116 l-8 18 H50 z" fill="url(#${n}gold)"/><path d="M48 118 c8-36 20-52 32-52 c8 18 14 18 20 0 c12 0 24 16 32 52" fill="none" stroke="url(#${n}gold)" stroke-width="8"/>
      <circle cx="100" cy="70" r="8" fill="#b4232c"/><circle cx="70" cy="96" r="5" fill="#1e4d8c"/><circle cx="130" cy="96" r="5" fill="#1f6b4a"/>
      <path d="M58 124 h84" stroke="#fff6d2" stroke-width="2" opacity=".6"/>`,
    feather: `<path d="M118 40 c-8 30-24 62-52 92 c28-18 52-28 78-24 c-10 20-30 36-54 42 c22-4 44-18 58-40 c12-18 14-42 4-62 z" fill="#ffb347"/>
      <path d="M118 40 c-6 28-20 58-46 86" fill="none" stroke="#8c1c2c" stroke-width="2"/><path d="M90 78 c10 6 16 8 20 4 M78 100 c12 6 18 6 22 0" stroke="#fff6d2" stroke-width="2" fill="none"/>
      <circle cx="120" cy="42" r="16" fill="url(#${n}glow)"/>`,
    hourglass: `<path d="M62 46 h76 v12 H62 z M62 150 h76 v-12 H62 z" fill="url(#${n}gold)"/><path d="M70 58 c0 28 18 36 30 46 c12-10 30-18 30-46 z" fill="#1c140c" opacity=".85"/>
      <path d="M70 150 c0-28 18-36 30-46 c12 10 30 18 30 46 z" fill="#1c140c" opacity=".85"/><path d="M96 96 h8 l-4 28 h-4 z" fill="${A}"/>
      <ellipse cx="100" cy="132" rx="10" ry="4" fill="${A}" opacity=".8"/>`,
    gear: `<circle cx="100" cy="104" r="34" fill="none" stroke="url(#${n}gold)" stroke-width="10"/><circle cx="100" cy="104" r="14" fill="#1c140c"/><circle cx="100" cy="104" r="5" fill="${A}"/>
      ${[0,45,90,135].map(a=>`<rect x="94" y="58" width="12" height="16" rx="2" transform="rotate(${a} 100 104)" fill="url(#${n}gold)"/>`).join("")}
      <circle cx="100" cy="70" r="3" fill="#fff6d2"/>`,
    key: `<circle cx="78" cy="78" r="26" fill="none" stroke="url(#${n}gold)" stroke-width="8"/><circle cx="78" cy="78" r="10" fill="#1c140c"/>
      <path d="M100 90 l46 40" stroke="url(#${n}gold)" stroke-width="8" stroke-linecap="round"/><path d="M132 116 l16-6 M128 128 l14 8" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="78" cy="78" r="4" fill="${A}"/>`,
    prism: `<polygon points="100,40 156,150 44,150" fill="#f7fbff" stroke="#2c2118" stroke-width="3"/><polygon points="100,40 128,150 100,150" fill="${A}" opacity=".25"/>
      <path d="M78 150 l28-70" stroke="#e23b3b" stroke-width="3"/><path d="M86 150 l30-62" stroke="#e2b657" stroke-width="3"/><path d="M94 150 l28-52" stroke="#3d8f5a" stroke-width="3"/><path d="M70 150 l24-78" stroke="#3a6fbf" stroke-width="3"/>
      <circle cx="100" cy="48" r="14" fill="url(#${n}glow)"/>`,
    mirror: `<ellipse cx="100" cy="90" r="48" ry="56" fill="#d7e7f6" stroke="url(#${n}gold)" stroke-width="8"/><ellipse cx="86" cy="74" rx="14" ry="20" fill="#fff" opacity=".45"/>
      <path d="M100 146 v22" stroke="url(#${n}gold)" stroke-width="8" stroke-linecap="round"/><path d="M78 170 h44" stroke="#5c3d12" stroke-width="6" stroke-linecap="round"/>`,
    bookmark: `<path d="M70 40 h60 v112 l-30-18-30 18 z" fill="#8c1c2c" stroke="#5c1220" stroke-width="2"/><path d="M82 58 h36 M82 74 h28" stroke="#f6ead2" stroke-width="3" stroke-linecap="round"/>
      <circle cx="100" cy="96" r="8" fill="${A}"/><path d="M100 40 v-8" stroke="url(#${n}gold)" stroke-width="4"/>`,
    abacus: `<rect x="48" y="52" width="104" height="96" rx="8" fill="#f7efe0" stroke="#5c3d12" stroke-width="3"/>
      <path d="M62 74 h76 M62 100 h76 M62 126 h76" stroke="#5c3d12" stroke-width="3"/><g fill="${A}"><circle cx="78" cy="74" r="7"/><circle cx="110" cy="74" r="7"/><circle cx="92" cy="100" r="7"/><circle cx="124" cy="100" r="7"/><circle cx="78" cy="126" r="7"/><circle cx="108" cy="126" r="7"/></g>`,
    cauldron: `<ellipse cx="100" cy="150" rx="40" ry="10" fill="#000" opacity=".15"/><path d="M58 96 h84 l-10 48 H68 z" fill="#2a241c" stroke="#111" stroke-width="2"/>
      <path d="M66 104 h68 l-6 28 H74 z" fill="#3d3428"/><path d="M48 96 h104" stroke="url(#${n}gold)" stroke-width="6" stroke-linecap="round"/>
      <path d="M78 84 c0-16 44-16 44 0" fill="none" stroke="#9fd4c2" stroke-width="4"/><circle cx="100" cy="70" r="6" fill="#b7f3d8" opacity=".8"/>`,
    bell: `<path d="M70 78 h60 l10 48 H60 z" fill="url(#${n}gold)"/><path d="M78 86 h44 l6 28 H72 z" fill="#fff6d2" opacity=".35"/>
      <circle cx="100" cy="132" r="7" fill="#5c3d12"/><rect x="94" y="52" width="12" height="26" rx="3" fill="url(#${n}gold)"/><circle cx="100" cy="48" r="6" fill="${A}"/>`,
    lyre: `<path d="M70 150 c0-60 10-90 30-100 c20 10 30 40 30 100" fill="none" stroke="url(#${n}gold)" stroke-width="6"/><path d="M78 70 h44" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
      <path d="M90 78 v60 M100 74 v66 M110 78 v60" stroke="#5c3d12" stroke-width="1.6"/><circle cx="70" cy="148" r="8" fill="${A}"/><circle cx="130" cy="148" r="8" fill="${A}"/>`,
    seal: `<circle cx="100" cy="104" r="46" fill="#8c1c2c" stroke="url(#${n}gold)" stroke-width="6"/><circle cx="100" cy="104" r="30" fill="none" stroke="#f6ead2" stroke-width="2"/>
      <path d="M100 84 l6 14 h14 l-11 8 4 14-13-9-13 9 4-14-11-8 h14 z" fill="${A}"/><path d="M64 150 c12 10 24 14 36 14 s24-4 36-14" fill="none" stroke="#c9a56a" stroke-width="6"/>`,
  };
  const art = icons[kind] || icons.gem;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${frame}${art}</svg>`;
}
if (typeof window !== "undefined") window.relicSVG = relicSVG;
