/**
 * Fixed Hello Kitty stickers scattered along both sides of the viewport.
 * Each sticker has unique size, rotation, edge-offset, and animation timing.
 */

// [src, side, topVh, widthPx, edgePx, rotateDeg, opacity, delay, duration]
const SIDE_STICKERS = [
  // ── Left strip ────────────────────────────────────────────────────────────
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG7.png',   'left',  3,   78,  28,  -14, 0.90, '0s',   '6.2s'],
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG14.png',  'left',  24, 105,   8,   8,  0.75, '1.3s', '5.1s'],
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG22.png',  'left',  46,  62,  55,  -6,  0.85, '0.7s', '7.0s'],
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG31.png',  'left',  65,  90,  15,  18,  0.70, '1.9s', '5.6s'],
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG9.png',   'left',  83,  70,  40,  -10, 0.80, '0.4s', '6.8s'],

  // ── Right strip ───────────────────────────────────────────────────────────
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG3.png',   'right', 8,   96,  10,  12,  0.80, '0.5s', '6.6s'],
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG18.png',  'right', 30,  68,  50,  -16, 0.72, '1.6s', '5.9s'],
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG26.png',  'right', 52, 108,  18,   6,  0.88, '1.0s', '6.4s'],
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG39.png',  'right', 71,  80,  44,  -8,  0.78, '2.2s', '5.4s'],
  ['https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG20.png',  'right', 88,  60,  22,  20,  0.65, '0.9s', '7.2s'],
]

export default function HkDecorations() {
  return (
    <>
      {SIDE_STICKERS.map(([src, side, topVh, width, edgePx, rotateDeg, opacity, delay, duration], i) => (
        <img
          key={i}
          src={src}
          alt=""
          aria-hidden="true"
          draggable="false"
          className={`hk-side hk-side--${side}`}
          style={{
            top: `${topVh}vh`,
            width: `${width}px`,
            [side]: `${edgePx}px`,
            transform: `rotate(${rotateDeg}deg)`,
            opacity,
            animationDelay: delay,
            animationDuration: duration,
          }}
        />
      ))}
    </>
  )
}
