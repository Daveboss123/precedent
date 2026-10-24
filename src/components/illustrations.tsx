/**
 * Filled illustrations.
 *
 * Flat shapes, no outlines, warm paper tones. These are drawn for the product
 * cards, where a photograph would say "catalogue" and a line drawing would say
 * "wireframe". The editorial scenes live in /public/illus.
 */

interface ArtProps {
  className?: string;
}

export function CoffeeArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 200 150"
      role="img"
      aria-label="A bag of coffee beans and a cup"
    >
      <ellipse cx="100" cy="137" rx="74" ry="7" fill="var(--paper-3)" opacity="0.8" />

      <path d="M166 34c8-10 18-10 24-4-7 8-17 9-24 4Z" fill="var(--forest)" />
      <path d="M166 34c4-8 10-13 18-15-1 8-7 13-18 15Z" fill="#4a7059" />
      <path d="M166 34c-1 7 2 12 7 15 2-7 0-12-7-15Z" fill="var(--forest)" opacity="0.72" />

      <ellipse cx="92" cy="130" rx="44" ry="6" fill="var(--paper-3)" />

      <path
        d="M54 42c0-4 3-7 7-7h62c4 0 7 3 7 7v82c0 4-3 7-7 7H61c-4 0-7-3-7-7V42Z"
        fill="var(--accent-soft)"
      />
      <path
        d="M104 35h19c4 0 7 3 7 7v82c0 4-3 7-7 7h-19V35Z"
        fill="#e4c6ba"
      />
      <path d="M54 42 62 24h56l8 18H54Z" fill="#dfb9ab" />
      <path d="M62 24h56v6H62v-6Z" fill="#cfa393" />
      <rect x="78" y="22" width="22" height="5" rx="2.5" fill="var(--ink-2)" />

      <rect x="66" y="55" width="34" height="50" rx="4" fill="var(--card)" />
      <rect x="73" y="63" width="20" height="3" rx="1.5" fill="var(--ink-2)" opacity="0.8" />
      <rect x="73" y="70" width="13" height="2.5" rx="1.25" fill="var(--faint)" opacity="0.6" />
      <ellipse cx="83" cy="87" rx="6.5" ry="8" fill="var(--accent)" />
      <path d="M83 81c-3 3-3 9 0 12-1.6-3-1.6-9 0-12Z" fill="var(--accent-soft)" />

      <path
        d="M174 92c10 0 17 7 17 16s-7 16-17 16v-7c6 0 10-4 10-9s-4-9-10-9v-7Z"
        fill="var(--card)"
      />
      <path
        d="M138 84h36l-5 36c-.4 3-3 5-6 5h-14c-3 0-5.6-2-6-5l-5-36Z"
        fill="var(--card)"
      />
      <ellipse cx="156" cy="86" rx="18" ry="5" fill="var(--accent)" />
      <ellipse cx="156" cy="86" rx="12" ry="3" fill="#6f2f23" opacity="0.5" />
      <ellipse cx="156" cy="127" rx="28" ry="5" fill="var(--paper-3)" />

      <path d="M144 70c-7-9 5-15 0-25 10 9 9 17 0 25Z" fill="var(--rule-strong)" opacity="0.5" />
      <path d="M160 66c-6-8 4-13 0-22 9 8 8 15 0 22Z" fill="var(--rule-strong)" opacity="0.36" />

      <ellipse cx="38" cy="124" rx="8" ry="5" transform="rotate(-18 38 124)" fill="var(--accent)" />
      <path d="M32 123c3-1.5 6-1.5 9 0-3 1.5-6 1.5-9 0Z" fill="var(--accent-soft)" opacity="0.75" />
      <ellipse cx="52" cy="133" rx="7" ry="4.5" transform="rotate(14 52 133)" fill="var(--accent-2)" />
      <path d="M47 132c2.6-1.4 5.2-1.4 7.8 0-2.6 1.4-5.2 1.4-7.8 0Z" fill="var(--accent-soft)" opacity="0.75" />
    </svg>
  );
}

export function OatMilkArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 260 190"
      role="img"
      aria-label="A carton of oat milk, a glass, and a bowl of oats"
    >
      <ellipse cx="130" cy="176" rx="94" ry="8" fill="var(--paper-3)" opacity="0.85" />

      <path d="M222 54c8-11 18-13 26-7-7 9-17 11-26 7Z" fill="var(--forest)" />
      <path d="M222 54c3-8 9-14 17-17-1 8-6 14-17 17Z" fill="#4a7059" />
      <path d="M222 54c-1 7 2 12 8 15 1-7-1-12-8-15Z" fill="var(--forest)" opacity="0.72" />

      <path d="M102 20 142 46v120h-40V20Z" fill="#e5d6c6" />
      <path d="M102 20 62 46v120h40V20Z" fill="var(--card)" />
      <path d="M102 20 62 46h40V20Z" fill="#f0e7d7" />
      <path d="M102 20l40 26h-40V20Z" fill="#d9c8b6" />
      <path d="M102 20l4-2 40 26-4 2-40-26Z" fill="var(--accent-soft)" />
      <rect x="116" y="38" width="12" height="7" rx="2" fill="var(--accent)" />

      <rect x="70" y="74" width="26" height="58" rx="4" fill="var(--accent-soft)" />
      <rect x="76" y="82" width="14" height="2.5" rx="1.25" fill="var(--accent)" opacity="0.8" />
      <ellipse cx="83" cy="96" rx="3.5" ry="5" fill="var(--accent)" opacity="0.8" />
      <ellipse cx="83" cy="108" rx="3.5" ry="5" fill="var(--accent)" opacity="0.64" />
      <ellipse cx="83" cy="120" rx="3.5" ry="5" fill="var(--accent)" opacity="0.48" />
      <rect x="62" y="146" width="40" height="9" fill="var(--accent-soft)" />

      <path
        d="M170 96h44l-6 62c-.4 4-3 7-7 7h-18c-4 0-6.6-3-7-7l-6-62Z"
        fill="#e9e0d1"
      />
      <ellipse cx="192" cy="96" rx="22" ry="6" fill="#f4eee2" />
      <path
        d="M173 112h38l-5 44c-.3 3-2.6 5-5.6 5h-16.8c-3 0-5.3-2-5.6-5l-5-44Z"
        fill="#f7eedb"
      />
      <ellipse cx="192" cy="112" rx="19" ry="5" fill="#fbf5e7" />
      <rect
        x="200"
        y="62"
        width="5"
        height="38"
        rx="2.5"
        transform="rotate(8 202 81)"
        fill="var(--accent)"
      />

      <path d="M18 148c0 16 10 26 25 26s25-10 25-26H18Z" fill="var(--accent-soft)" />
      <ellipse cx="43" cy="148" rx="25" ry="7" fill="#d8b585" />
      <ellipse cx="35" cy="147" rx="3" ry="4" transform="rotate(-20 35 147)" fill="#c49b64" />
      <ellipse cx="45" cy="150" rx="3" ry="4" transform="rotate(18 45 150)" fill="#c49b64" />
      <ellipse cx="53" cy="146" rx="2.8" ry="3.8" transform="rotate(-12 53 146)" fill="#c49b64" />
      <ellipse cx="28" cy="154" rx="2.6" ry="3.6" transform="rotate(24 28 154)" fill="#c49b64" />

      <ellipse cx="112" cy="170" rx="3.4" ry="2.2" transform="rotate(-24 112 170)" fill="#c49b64" />
      <ellipse cx="122" cy="174" rx="3.4" ry="2.2" transform="rotate(16 122 174)" fill="#d8b585" />
      <ellipse cx="102" cy="176" rx="3" ry="2" transform="rotate(10 102 176)" fill="#c49b64" />
    </svg>
  );
}

export function StreamingArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 200 150"
      role="img"
      aria-label="A television with a blocked subscription card"
    >
      <ellipse cx="100" cy="136" rx="72" ry="6" fill="var(--paper-3)" opacity="0.8" />

      <rect x="82" y="108" width="22" height="12" rx="3" fill="var(--ink-2)" />
      <rect x="62" y="120" width="62" height="7" rx="3.5" fill="var(--ink-2)" />

      <rect x="14" y="14" width="138" height="92" rx="12" fill="var(--ink-2)" />
      <rect x="22" y="22" width="122" height="76" rx="7" fill="var(--paper-2)" />
      <path d="M72 44l30 16-30 16V44Z" fill="var(--accent)" />
      <rect x="34" y="82" width="76" height="4" rx="2" fill="var(--rule)" />
      <rect x="34" y="82" width="34" height="4" rx="2" fill="var(--accent)" />

      <rect x="118" y="70" width="70" height="58" rx="9" fill="var(--accent-soft)" />
      <rect x="128" y="80" width="30" height="3" rx="1.5" fill="var(--accent)" opacity="0.8" />
      <rect x="128" y="88" width="20" height="3" rx="1.5" fill="var(--accent)" opacity="0.45" />
      <rect x="128" y="102" width="24" height="15" rx="3" fill="var(--accent)" opacity="0.16" />
      <path d="M134 106l9 4-9 4v-8Z" fill="var(--accent)" opacity="0.7" />
      <circle cx="166" cy="84" r="11" fill="var(--accent)" />
      <rect x="160" y="82.5" width="12" height="3" rx="1.5" fill="var(--accent-soft)" />
      <rect
        x="120"
        y="94"
        width="66"
        height="4"
        rx="2"
        transform="rotate(38 153 96)"
        fill="var(--accent)"
      />

      <rect x="166" y="24" width="18" height="44" rx="9" fill="var(--paper-2)" />
      <circle cx="175" cy="36" r="3" fill="var(--accent)" />
      <rect x="171" y="46" width="8" height="3" rx="1.5" fill="var(--rule-strong)" />
      <rect x="171" y="54" width="8" height="3" rx="1.5" fill="var(--rule-strong)" />
    </svg>
  );
}

export function MonitorArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 180 140"
      role="img"
      aria-label="A desktop display"
    >
      <ellipse cx="90" cy="128" rx="56" ry="5" fill="var(--paper-3)" opacity="0.75" />
      <rect x="18" y="14" width="144" height="94" rx="11" fill="var(--ink-2)" />
      <rect x="26" y="22" width="128" height="78" rx="6" fill="var(--paper-2)" />
      <rect x="80" y="108" width="20" height="12" fill="var(--ink-2)" />
      <rect x="56" y="120" width="68" height="7" rx="3.5" fill="var(--ink-2)" />
      <rect x="38" y="70" width="12" height="18" rx="3" fill="var(--amber)" opacity="0.8" />
      <rect x="56" y="58" width="12" height="30" rx="3" fill="var(--forest)" opacity="0.85" />
      <rect x="74" y="64" width="12" height="24" rx="3" fill="var(--accent)" opacity="0.8" />
      <rect x="92" y="46" width="12" height="42" rx="3" fill="var(--forest)" opacity="0.65" />
      <rect x="110" y="54" width="12" height="34" rx="3" fill="var(--amber)" opacity="0.55" />
      <rect x="38" y="88" width="100" height="2" rx="1" fill="var(--rule-strong)" />
      <circle cx="132" cy="36" r="5" fill="var(--accent)" />
    </svg>
  );
}

export function QuestionArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 120 120"
      role="img"
      aria-label="A question bubble"
    >
      <ellipse cx="60" cy="104" rx="34" ry="5" fill="var(--paper-3)" opacity="0.8" />
      <rect x="12" y="16" width="96" height="70" rx="20" fill="var(--amber-soft)" />
      <path d="M30 82l-7 21 23-13-16-8Z" fill="var(--amber-soft)" />
      <text
        x="60"
        y="66"
        textAnchor="middle"
        fill="var(--accent)"
        fontSize="44"
        fontWeight="650"
        style={{ fontFamily: 'var(--sans)' }}
      >
        ?
      </text>
      <circle cx="96" cy="24" r="8" fill="var(--accent)" opacity="0.9" />
      <circle cx="96" cy="24" r="3" fill="var(--paper)" />
    </svg>
  );
}

export function RuleArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 120 120"
      role="img"
      aria-label="A written rule with a check"
    >
      <ellipse cx="58" cy="106" rx="36" ry="5" fill="var(--paper-3)" opacity="0.8" />
      <rect x="18" y="12" width="68" height="90" rx="8" fill="var(--card)" />
      <rect x="18" y="12" width="68" height="12" rx="8" fill="var(--accent-soft)" />
      <rect x="28" y="38" width="40" height="3.5" rx="1.75" fill="var(--ink-2)" opacity="0.7" />
      <rect x="28" y="49" width="30" height="3" rx="1.5" fill="var(--rule-strong)" />
      <rect x="28" y="59" width="36" height="3" rx="1.5" fill="var(--rule-strong)" />
      <rect x="28" y="69" width="24" height="3" rx="1.5" fill="var(--rule-strong)" />
      <rect x="28" y="82" width="20" height="3.5" rx="1.75" fill="var(--accent)" opacity="0.8" />
      <circle cx="88" cy="82" r="23" fill="var(--forest)" />
      <path d="M77 82l7 7 15-16 3 3-18 19-10-10 3-3Z" fill="var(--paper)" />
      <rect
        x="82"
        y="20"
        width="8"
        height="40"
        rx="4"
        transform="rotate(32 86 40)"
        fill="var(--amber)"
      />
      <path d="M94 51l4 8-9-1 5-7Z" fill="var(--ink-2)" />
    </svg>
  );
}

export function QuietArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 120 120"
      role="img"
      aria-label="A cup with steam and a check"
    >
      <ellipse cx="56" cy="102" rx="38" ry="6" fill="var(--paper-3)" opacity="0.8" />
      <path
        d="M22 50h58v18c0 14-11 25-25 25h-8c-14 0-25-11-25-25V50Z"
        fill="var(--card)"
      />
      <ellipse cx="51" cy="50" rx="29" ry="7" fill="var(--card)" />
      <ellipse cx="51" cy="50" rx="23" ry="5" fill="var(--accent)" />
      <ellipse cx="51" cy="50" rx="15" ry="3" fill="#6f2f23" opacity="0.45" />
      <path
        d="M80 56h5c8 0 14 6 14 14s-6 14-14 14h-5v-7h4c5 0 8-3 8-7s-3-7-8-7h-4v-7Z"
        fill="var(--card)"
      />
      <path d="M36 38c-7-9 5-14 0-24 10 9 9 17 0 24Z" fill="var(--rule-strong)" opacity="0.5" />
      <path d="M52 34c-6-8 4-12 0-21 9 8 8 15 0 21Z" fill="var(--rule-strong)" opacity="0.34" />
      <circle cx="90" cy="86" r="21" fill="var(--forest)" />
      <path d="M80 86l6 6 14-15 3 3-17 18-9-9 3-3Z" fill="var(--paper)" />
    </svg>
  );
}

export function ReceiptArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 120 120"
      role="img"
      aria-label="A receipt"
    >
      <ellipse cx="60" cy="110" rx="30" ry="4" fill="var(--paper-3)" opacity="0.7" />
      <path
        d="M30 10h60v98l-7.5-5-7.5 5-7.5-5-7.5 5-7.5-5-7.5 5-7.5-5-7.5 5V10Z"
        fill="var(--card)"
      />
      <rect x="38" y="22" width="44" height="4" rx="2" fill="var(--ink-2)" opacity="0.75" />
      <rect x="38" y="34" width="30" height="3" rx="1.5" fill="var(--rule-strong)" />
      <rect x="38" y="44" width="38" height="3" rx="1.5" fill="var(--rule-strong)" />
      <rect x="38" y="54" width="24" height="3" rx="1.5" fill="var(--rule-strong)" />
      <rect x="38" y="64" width="34" height="3" rx="1.5" fill="var(--rule-strong)" />
      <rect x="38" y="82" width="20" height="4" rx="2" fill="var(--accent)" />
      <rect x="66" y="82" width="16" height="4" rx="2" fill="var(--accent)" opacity="0.55" />
    </svg>
  );
}

export function BasketArt({ className = '' }: ArtProps) {
  return (
    <svg
      className={`ill ${className}`}
      viewBox="0 0 180 140"
      role="img"
      aria-label="A shopping basket with groceries"
    >
      <ellipse cx="90" cy="126" rx="62" ry="6" fill="var(--paper-3)" opacity="0.8" />
      <path d="M42 58h96l-10 56H52L42 58Z" fill="var(--amber-soft)" />
      <path d="M52 68h76M49 84h82M46 100h88" stroke="var(--amber)" strokeWidth="2" opacity="0.28" />
      <path
        d="M58 58c0-20 14-34 32-34s32 14 32 34"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M74 30c2-8 8-13 16-15-1 8-6 14-16 15Z" fill="var(--forest)" />
      <path d="M92 28c7-6 14-6 20-1-6 5-13 6-20 1Z" fill="#4a7059" />
      <rect x="106" y="22" width="16" height="26" rx="3" fill="var(--card)" />
      <rect x="109" y="18" width="10" height="6" rx="2" fill="var(--accent)" />
      <rect x="54" y="36" width="8" height="22" rx="4" transform="rotate(-18 58 47)" fill="var(--amber)" />
      <circle cx="136" cy="38" r="15" fill="var(--forest)" />
      <path d="M129 38l5 5 11-12 2 2-13 15-7-7 2-3Z" fill="var(--paper)" />
    </svg>
  );
}
