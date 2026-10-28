/* Mintly illustrations: hand-drawn style SVG, built from the page's own colour tokens so they follow
   the active role (student / parent / teacher) and light or dark mode.
   Usage: <div data-art="hero-student"></div>  ->  filled in on DOMContentLoaded.
   The wobble comes from one shared SVG filter (#m-rough) that nudges every stroke like a marker. */
(function () {
  const INK = "var(--ink)", ACC = "var(--acc)", SOFT = "var(--accsoft)", PAPER = "var(--panel)", SUN = "var(--sun)";
  const S = (w) => `stroke="${INK}" stroke-width="${w || 2.6}" stroke-linecap="round" stroke-linejoin="round"`;

  const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <filter id="m-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.4"/></filter>
    <pattern id="m-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="7" stroke="${INK}" stroke-width="1.1" opacity=".28"/></pattern>
  </defs></svg>`;

  const wrap = (vb, body, label) => `<svg viewBox="${vb}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><g>${body}</g></svg>`;

  // shared pieces ----------------------------------------------------------------------------------
  const hill = `<path d="M26 306C64 266 150 258 240 282C330 304 408 266 458 280C482 288 474 334 440 340L58 340C24 338 8 322 26 306Z" fill="${SOFT}" ${S(2.6)}/>
    <path d="M48 326C100 304 146 308 196 320" ${S(2)} fill="none" opacity=".5"/>`;
  const sun = `<circle cx="408" cy="70" r="30" fill="${SUN}" ${S(2.6)}/><path d="M408 20v-10M408 130v-10M358 70h-10M468 70h-10M373 35l-7-7M443 105l-7-7M443 35l7-7M373 105l-7 7" ${S(2.4)}/>`;
  const coin = (x, y, r) => `<g><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.42}" fill="${SUN}" ${S(2.4)}/><path d="M${x - r} ${y}v${r * 0.34}c0 ${r * 0.24} ${r * 2} ${r * 0.24} ${r * 2} 0v-${r * 0.34}" fill="${SUN}" ${S(2.4)}/><path d="M${x - r * 0.3} ${y - r * 0.05}h${r * 0.6}" ${S(2)}/></g>`;
  const stack = (x, y) => coin(x, y + 30, 26) + coin(x, y + 15, 26) + coin(x, y, 26);
  const sprout = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0C-2 -34 2 -62 0 -92" fill="none" ${S(3)}/><path d="M0 -62C-6 -88 -34 -96 -58 -82C-54 -58 -28 -50 0 -62Z" fill="${ACC}" ${S(2.6)}/><path d="M1 -86C6 -112 30 -124 56 -114C54 -88 30 -76 1 -86Z" fill="${SOFT}" ${S(2.6)}/><path d="M-50 -80C-36 -76 -18 -68 -6 -62" ${S(1.8)} fill="none" opacity=".6"/></g>`;
  const person = (x, y, o) => { // simple seated/standing doodle figure
    o = o || {};
    const skin = o.skin || "#E9B48D", cloth = o.cloth || ACC, h = o.h || 1;
    return `<g transform="translate(${x} ${y}) scale(${h})">
      <path d="M-22 0C-26 -34 -22 -62 0 -66C22 -62 26 -34 22 0Z" fill="${cloth}" ${S()}/>
      <path d="M-18 -64C-8 -58 8 -58 18 -64" ${S(2)} fill="none" opacity=".5"/>
      <circle cx="0" cy="-92" r="22" fill="${skin}" ${S()}/>
      <path d="M-22 -94C-24 -118 -4 -124 12 -118C24 -112 24 -100 22 -92C14 -100 -8 -104 -22 -94Z" fill="${o.hair || INK}" ${S(2.2)}/>
      <circle cx="-7" cy="-90" r="1.9" fill="${INK}"/><circle cx="8" cy="-90" r="1.9" fill="${INK}"/>
      <path d="M-5 -80C0 -76 5 -76 9 -80" ${S(1.8)} fill="none"/>
    </g>`; };

  const ART = {
    "hero-student": () => wrap("0 0 480 360", `${sun}${hill}
      <path d="M40 250L120 210L190 226L270 160L350 120" fill="none" stroke="${ACC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M326 114l30 4-12 26" fill="none" stroke="${ACC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      ${sprout(402, 304, 1.1)}${stack(88, 262)}
      <rect x="190" y="236" width="102" height="70" rx="10" fill="${PAPER}" ${S()}/><path d="M204 288l20-22 18 12 22-26 14 8" fill="none" stroke="${ACC}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M180 306h122" ${S(3)}/>
      ${person(150, 300, { cloth: ACC, hair: "#3A2418" })}
      <path d="M62 120c12-14 30-14 42 0M70 100c8-8 20-8 28 0" ${S(2)} fill="none" opacity=".55"/>`, "Illustration of a student studying a rising chart beside a growing sprout and a stack of coins"),

    "hero-parent": () => wrap("0 0 480 360", `${sun}${hill}
      <rect x="120" y="226" width="250" height="14" rx="6" fill="${SOFT}" ${S()}/><path d="M146 240v70M344 240v70" ${S(3.4)}/>
      ${person(176, 232, { cloth: ACC, h: 1.18, hair: "#5A3A28", skin: "#DDA27A" })}${person(310, 232, { cloth: SUN, h: .86, hair: "#2A1C14" })}
      <rect x="222" y="190" width="60" height="38" rx="8" fill="${PAPER}" ${S(2.4)}/><path d="M232 218l12-12 10 6 16-16" fill="none" stroke="${ACC}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(404 304)"><ellipse cx="0" cy="-26" rx="32" ry="24" fill="${SOFT}" ${S()}/><path d="M-22 -8v14M18 -8v14" ${S(3)}/><circle cx="14" cy="-32" r="2.4" fill="${INK}"/><path d="M-4 -50h10" ${S(3)}/><path d="M-32 -30c-9-2-10 8-2 8" fill="none" ${S(2.4)}/></g>
      <path d="M52 92c0-22 30-22 30 0c0 18-30 30-30 30c0 0-30-12-30-30c0-22 30-22 30 0Z" transform="translate(22 6) scale(.8)" fill="${ACC}" opacity=".9" ${S(2.4)}/>`, "Illustration of a parent and a teenager at a table reviewing progress together"),

    "hero-teacher": () => wrap("0 0 480 360", `${sun}${hill}
      <rect x="86" y="82" width="250" height="168" rx="12" fill="${PAPER}" ${S(3)}/>
      <path d="M118 214V160M164 214V132M210 214V176M256 214V110M302 214V150" stroke="${ACC}" stroke-width="16" stroke-linecap="round" opacity=".9"/>
      <path d="M110 214h210" ${S(2.6)}/><path d="M112 112h80M112 128h46" ${S(2)} fill="none" opacity=".45"/>
      <path d="M150 250l-18 66M272 250l18 66" ${S(3.4)}/>
      ${person(384, 312, { cloth: SUN, hair: "#2A1C14", skin: "#C98C66" })}
      <path d="M356 262L322 190" ${S(3.4)}/><circle cx="321" cy="188" r="5" fill="${ACC}" ${S(2)}/>
      ${sprout(60, 322, .7)}`, "Illustration of a teacher presenting a class progress chart on a board"),

    "leaf": () => wrap("0 0 160 160", `
      <path d="M80 140C78 100 82 70 80 46" fill="none" ${S(3.6)}/>
      <path d="M80 100C54 108 24 94 18 66C46 56 74 72 80 100Z" fill="${SOFT}" ${S(3)}/>
      <path d="M80 112C70 70 96 34 138 28C146 70 118 112 80 112Z" fill="${ACC}" ${S(3)}/>
      <path d="M92 96C104 78 116 60 130 46" ${S(2.2)} fill="none" stroke="${PAPER}"/>
      <circle cx="104" cy="78" r="4" fill="${PAPER}" ${S(1.6)}/><circle cx="120" cy="64" r="4" fill="${PAPER}" ${S(1.6)}/>
      <path d="M106 90c4 4 10 4 14 0" ${S(2)} fill="none" stroke="${PAPER}"/>`, "Leaf, Mintly's learning partner"),

    // spot icons -----------------------------------------------------------------------------------
    "book": () => wrap("0 0 80 80", `<path d="M10 20C24 14 34 16 40 24C46 16 56 14 70 20V62C56 56 46 58 40 66C34 58 24 56 10 62Z" fill="${SOFT}" ${S()}/><path d="M40 24V66" ${S(2.2)}/><path d="M18 30c6-2 12-1 16 3M18 40c6-2 12-1 16 3M62 30c-6-2-12-1-16 3" ${S(1.8)} fill="none" opacity=".6"/><circle cx="58" cy="14" r="5" fill="${SUN}" ${S(2)}/>`, ""),
    "search": () => wrap("0 0 80 80", `<circle cx="34" cy="34" r="20" fill="${SOFT}" ${S()}/><path d="M49 49L68 68" ${S(5)}/><path d="M24 36l7 7 13-15" fill="none" stroke="${ACC}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`, ""),
    "chat": () => wrap("0 0 80 80", `<path d="M12 16h56a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H40L24 68V56H12a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6Z" fill="${SOFT}" ${S()}/><circle cx="26" cy="36" r="3" fill="${INK}"/><circle cx="40" cy="36" r="3" fill="${INK}"/><circle cx="54" cy="36" r="3" fill="${INK}"/>`, ""),
    "scale": () => wrap("0 0 80 80", `<path d="M40 12V66M24 66H56" ${S(3.4)}/><path d="M16 26H64" ${S(3)}/><path d="M16 26L8 46C12 52 24 52 28 46Z" fill="${SOFT}" ${S(2.4)}/><path d="M64 26L52 46C56 52 68 52 72 46Z" fill="${ACC}" ${S(2.4)}/><circle cx="40" cy="12" r="4" fill="${SUN}" ${S(2)}/>`, ""),
    "chart": () => wrap("0 0 80 80", `<path d="M10 66H70M10 66V12" ${S(3)}/><path d="M20 54L34 40L44 48L66 22" fill="none" stroke="${ACC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="66" cy="22" r="5" fill="${SUN}" ${S(2)}/>`, ""),
    "piggy": () => wrap("0 0 80 80", `<ellipse cx="40" cy="44" rx="28" ry="20" fill="${SOFT}" ${S()}/><path d="M24 62v10M52 62v10" ${S(3.4)}/><path d="M64 38l8-4v10l-6-2" fill="${SOFT}" ${S(2.4)}/><circle cx="52" cy="38" r="2.6" fill="${INK}"/><path d="M30 24h14" ${S(3.4)}/><path d="M36 14c0 6 0 6 0 10" ${S(2)} fill="none"/><circle cx="36" cy="10" r="5" fill="${SUN}" ${S(2)}/>`, ""),
    "bank": () => wrap("0 0 80 80", `<path d="M8 30L40 12L72 30Z" fill="${SOFT}" ${S()}/><path d="M16 34V58M32 34V58M48 34V58M64 34V58" ${S(5)}/><path d="M8 62H72V70H8Z" fill="${ACC}" ${S(2.6)}/><circle cx="40" cy="24" r="3" fill="${INK}"/>`, ""),
    "coins": () => wrap("0 0 80 80", stack(40, 28).replace(/<\/?g>/g, ""), ""),
    "card": () => wrap("0 0 80 80", `<rect x="8" y="18" width="64" height="44" rx="8" fill="${SOFT}" ${S()}/><path d="M8 32H72" ${S(5)}/><path d="M16 50h20" ${S(2.6)}/><circle cx="58" cy="50" r="5" fill="${SUN}" ${S(2)}/>`, ""),
    "tag": () => wrap("0 0 80 80", `<path d="M12 12H40L70 42L42 70L12 40Z" fill="${SOFT}" ${S()}/><circle cx="26" cy="26" r="5" fill="${INK}"/><path d="M40 38l12 12" ${S(2.6)}/>`, ""),
    "shield": () => wrap("0 0 80 80", `<path d="M40 8L66 18V40C66 54 54 64 40 72C26 64 14 54 14 40V18Z" fill="${SOFT}" ${S()}/><path d="M28 40l9 9 17-19" fill="none" stroke="${ACC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`, ""),
    "people": () => wrap("0 0 80 80", `<circle cx="28" cy="28" r="10" fill="${SOFT}" ${S()}/><path d="M8 62C8 46 20 42 28 42S48 46 48 62Z" fill="${ACC}" ${S()}/><circle cx="56" cy="32" r="8" fill="${SOFT}" ${S(2.4)}/><path d="M50 46C64 44 72 50 72 62H54" fill="${SUN}" ${S(2.4)}/>`, ""),
    "percent": () => wrap("0 0 80 80", `<circle cx="40" cy="40" r="28" fill="${SOFT}" ${S()}/><circle cx="29" cy="30" r="5" fill="${PAPER}" ${S(2.4)}/><circle cx="51" cy="50" r="5" fill="${PAPER}" ${S(2.4)}/><path d="M53 27L27 53" ${S(3.6)}/><circle cx="62" cy="14" r="5" fill="${SUN}" ${S(2)}/>`, ""),
    "wallet": () => wrap("0 0 80 80", `<path d="M10 24C10 18 14 16 20 16H58L62 24" fill="none" ${S()}/><rect x="8" y="24" width="64" height="42" rx="9" fill="${SOFT}" ${S()}/><path d="M50 40H72V54H50a7 7 0 0 1 0-14Z" fill="${ACC}" ${S(2.6)}/><circle cx="55" cy="47" r="2.6" fill="${PAPER}"/><circle cx="28" cy="12" r="5" fill="${SUN}" ${S(2)}/>`, ""),
    "alert": () => wrap("0 0 80 80", `<path d="M40 10L72 66H8Z" fill="${SUN}" ${S()}/><path d="M40 30v18" ${S(5)}/><circle cx="40" cy="57" r="3.2" fill="${INK}"/>`, ""),
    "plan": () => wrap("0 0 80 80", `<rect x="14" y="10" width="52" height="62" rx="8" fill="${SOFT}" ${S()}/><path d="M28 6h24v10H28z" fill="${ACC}" ${S(2.4)}/><path d="M24 34l5 5 9-10M24 54l5 5 9-10" fill="none" stroke="${ACC}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 35h14M44 55h14" ${S(3)}/>`, ""),
    "trophy": () => wrap("0 0 80 80", `<path d="M22 12H58V30C58 42 50 50 40 50S22 42 22 30Z" fill="${SUN}" ${S()}/><path d="M22 18H10C10 30 14 34 22 34M58 18H70C70 30 66 34 58 34" fill="none" ${S(2.6)}/><path d="M40 50V62M28 68H52" ${S(3.4)}/>`, ""),
    "target": () => wrap("0 0 80 80", `<circle cx="38" cy="42" r="26" fill="${SOFT}" ${S()}/><circle cx="38" cy="42" r="15" fill="${PAPER}" ${S(2.4)}/><circle cx="38" cy="42" r="5" fill="${ACC}" ${S(2)}/><path d="M38 42L68 12M60 10l10 0 0 10" ${S(3)} fill="none"/>`, "")
  };

  function mount() {
    if (!document.getElementById("m-rough")) document.body.insertAdjacentHTML("afterbegin", defs);
    document.querySelectorAll("[data-art]").forEach((el) => {
      const f = ART[el.dataset.art];
      if (f) { el.innerHTML = f(); if (el.dataset.label) el.firstChild.setAttribute("aria-label", el.dataset.label); }
    });
  }
  window.MintlyArt = { render: (n) => (ART[n] ? ART[n]() : ""), mount, names: Object.keys(ART) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
