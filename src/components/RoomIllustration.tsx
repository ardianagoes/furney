/** Decorative, static SVG artwork — deliberately not a room renderer. */
export function RoomIllustration({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 640 520" fill="none" aria-hidden="true" className={className}>
    <defs>
      <linearGradient id="wall" x1="150" y1="100" x2="400" y2="350" gradientUnits="userSpaceOnUse"><stop stopColor="#f3efe2" /><stop offset="1" stopColor="#dedbcc" /></linearGradient>
      <linearGradient id="floor" x1="160" y1="400" x2="500" y2="270" gradientUnits="userSpaceOnUse"><stop stopColor="#cfb391" /><stop offset="1" stopColor="#e7d6b9" /></linearGradient>
      <filter id="shadow"><feGaussianBlur stdDeviation="14" /></filter>
      <pattern id="wood" width="55" height="55" patternUnits="userSpaceOnUse" patternTransform="rotate(29)"><path d="M0 0v55M27 0v55" stroke="#b49b7b" strokeOpacity=".25" /></pattern>
    </defs>
    <ellipse cx="328" cy="445" rx="220" ry="35" fill="#4b4e36" opacity=".12" filter="url(#shadow)" />
    <path d="m79 314 245-137 251 143-246 153z" fill="url(#floor)" />
    <path d="m79 314 245-137 251 143-246 153z" fill="url(#wood)" />
    <path d="M79 314V124l245-136v189z" fill="url(#wall)" />
    <path d="M324-12 575 131v189L324 177z" fill="#e8e4d5" />
    <path d="m79 308 245-137 251 143" stroke="#c6c3b3" strokeWidth="5" />
    <path d="m121 132 125-70v115l-125 71z" fill="#c1ccb9" stroke="#fcfaf1" strokeWidth="10" />
    <path d="m184 97 1 114m-63-18 124-70" stroke="#fcfaf1" strokeWidth="6" />
    <path d="m128 149 50-28v37l-50 28z" fill="#d9e0c8" />
    <path d="m118 250 135-75v9l-135 75z" fill="#c4b9a2" />
    <path d="m392 89 69 39v72l-69-39z" fill="#d4b892" stroke="#b89c79" strokeWidth="5" />
    <path d="m401 109 49 29v46l-49-29z" fill="#ede8d7" /><path d="m413 142 12-13 13 40z" fill="#8d9674" />
    <path d="m186 326 172-100 146 85-171 102z" fill="#eeeadc" />
    <path d="m199 326 159-91 133 77-158 93z" stroke="#d4cbb6" strokeWidth="2" />
    <path d="m160 288 115-64 105 60-115 68z" fill="#637453" />
    <path d="M160 288v38l105 62v-36z" fill="#8b9b74" />
    <path d="m265 352 115-68v38l-115 66z" fill="#6e815c" />
    <path d="M159 276v-49q0-12 11-6l106 61v49z" fill="#9ba789" />
    <path d="m170 220 111-64q8-4 15 0l97 57-117 69z" fill="#aeb89b" />
    <path d="m277 282 116-69v51l-116 67z" fill="#8b9c75" />
    <path d="m183 275 43-25 42 24-43 25zm49-28 44-25 43 24-44 26z" fill="#b7c0a3" />
    <path d="m151 286 19-11 100 57-19 12z" fill="#aab593" /><path d="M151 286v45l100 58v-45z" fill="#8e9e77" />
    <path d="m251 344 19-12v44l-19 13z" fill="#6e815c" />
    <path d="m280 303 113-67 17 10-114 68z" fill="#acb898" /><path d="m296 314 114-68v41l-114 67z" fill="#83956b" />
    <path d="m189 273 21-12 4 28-22 12z" fill="#e0cfab" /><path d="m224 253 24-12 7 24-24 14z" fill="#c4b392" />
    <path d="M162 334v14m97 42v14m137-106v15" stroke="#625945" strokeWidth="6" />
    <ellipse cx="370" cy="341" rx="56" ry="32" fill="#92744f" opacity=".12" />
    <path d="m328 333-5 37m90-37 5 37m-47-28v42" stroke="#9f7b50" strokeWidth="7" />
    <ellipse cx="371" cy="323" rx="55" ry="31" fill="#ae8759" /><ellipse cx="371" cy="316" rx="55" ry="31" fill="#d5b58a" />
    <path d="m349 308 20-11 22 12-20 12z" fill="#f2ecd9" /><path d="m349 308v4l22 13 20-12v-4l-20 12z" fill="#c6b79b" />
    <path d="M386 311v-12h11v12q-5 5-11 0" fill="#9a6b4d" /><ellipse cx="391.5" cy="299" rx="5.5" ry="3" fill="#bd926b" />
    <ellipse cx="482" cy="302" rx="18" ry="10" fill="#746f56" /><path d="M482 298V174" stroke="#736e53" strokeWidth="4" />
    <path d="m461 166 22-13 24 14-6 28-33-2z" fill="#ded2ad" /><ellipse cx="482" cy="191" rx="19" ry="10" fill="#efe4c6" />
    <path d="m514 340 3 35q18 12 32-1l4-34" fill="#bc886a" /><ellipse cx="533" cy="340" rx="20" ry="11" fill="#9c7358" />
    <path d="M533 342v-78m0 36q-34 2-32-26 29-4 32 26m1 16q33-4 28-31-28 3-28 31m-1-34q-22-11-13-34 24 6 13 34m1-12q29-14 15-35-22 12-15 35" fill="#6e8058" />
    <path d="m76 355 248 144m22-1 234-143" stroke="#9b9f87" strokeWidth="1.3" strokeDasharray="4 5" />
    <path d="m76 348v14m248 130v14m22-15v14m234-157v14" stroke="#9b9f87" strokeWidth="1.3" />
  </svg>;
}
