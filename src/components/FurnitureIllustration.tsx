export function FurnitureIllustration({ category, variant = '' }: { category: string; variant?: string }) {
  return <svg viewBox="0 0 240 160" fill="none" aria-hidden="true" className="furniture-art">
    <ellipse cx="122" cy="140" rx="83" ry="9" fill="#4a3826" opacity=".07" />
    {category === 'Seating' && (variant.includes('chair') ? <>
      <path d="m70 119-7 25m105-25 7 25" stroke="#74614b" strokeWidth="7" />
      <rect x="64" y="36" width="111" height="83" rx="26" fill="#9b624a" />
      <rect x="68" y="91" width="102" height="35" rx="13" fill="#b4795e" />
      <rect x="53" y="73" width="24" height="54" rx="11" fill="#aa6d51" /><rect x="163" y="73" width="24" height="54" rx="11" fill="#aa6d51" />
      <path d="M88 49c12-4 43-4 59 0" stroke="#c09277" strokeWidth="2" />
    </> : <>
      <path d="M47 124v16m148-16v16" stroke="#6a5b43" strokeWidth="7" />
      <rect x="33" y="54" width="176" height="65" rx="18" fill="#7e896b" />
      <rect x="43" y="59" width="75" height="50" rx="12" fill="#9aa184" /><rect x="123" y="59" width="75" height="50" rx="12" fill="#909a7c" />
      <rect x="37" y="100" width="169" height="29" rx="9" fill="#a4ad8e" />
      <path d="M121 103v22" stroke="#788269" /><rect x="23" y="86" width="25" height="44" rx="8" fill="#8b9677" /><rect x="194" y="86" width="25" height="44" rx="8" fill="#8b9677" />
      <path d="m54 79 23-8 14 29-25 5z" fill="#e7d7b9" />
    </>)}
    {category === 'Tables' && <>
      <path d="m77 92-10 47m94-47 11 47m-54-39v37" stroke="#947454" strokeWidth="9" />
      <ellipse cx="120" cy="91" rx="76" ry="28" fill="#a57e55" /><ellipse cx="120" cy="85" rx="76" ry="28" fill="#ceb08a" />
      <ellipse cx="120" cy="84" rx="62" ry="21" stroke="#dbc09c" />
      <path d="M132 68h16l-2 12h-12z" fill="#f2eddf" /><path d="M140 69V51m0 7 7-5m-7 8-6-4" stroke="#687556" strokeWidth="2" />
    </>}
    {category === 'Lighting' && <>
      <ellipse cx="114" cy="140" rx="31" ry="6" fill="#625a45" /><path d="M113 139V47q0-25 28-25h17" stroke="#7a7259" strokeWidth="5" />
      <path d="M134 30h41l14 36h-68z" fill="#d2b87e" /><ellipse cx="155" cy="66" rx="34" ry="5" fill="#eee0b8" />
    </>}
    {category === 'Rugs' && <>
      <path d="m63 49 147 42-42 57L20 102z" fill="#d5b19a" /><path d="m68 58 127 37-30 43-127-38z" stroke="#f1dcc1" strokeWidth="3" />
      <path d="m81 66 18 55m14-46 19 56m12-46 17 51" stroke="#e8cbb0" strokeWidth="6" />
      <path d="m24 108-8 9m16-6-8 9m16-6-8 9m16-6-8 9m131 19-7 9m16-7-7 9" stroke="#c4a085" strokeWidth="2" />
    </>}
    {category === 'Storage' && <>
      <path d="M64 143V25h114v118M64 64h114M64 103h114M64 138h114" stroke="#b18e64" strokeWidth="7" />
      <path d="M77 61V36h10v25m4 0V41h9v20m5 0-4-25 10-2 4 27" stroke="#a4a58a" strokeWidth="6" />
      <path d="M141 100h20l-3-24h-14z" fill="#bb836b" /><path d="M150 79V60m0 7 9-9m-9 15-8-7" stroke="#677b53" strokeWidth="3" />
      <rect x="78" y="116" width="45" height="19" rx="3" fill="#ded0b5" />
    </>}
  </svg>;
}
