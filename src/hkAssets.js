/**
 * Hello Kitty–themed PNGs (hotlinked) + local SVG stickers under /stickers/.
 * PNG list mixes pngimg.com and pngfre.com poses for variety.
 */

const PNGIMG = (n) =>
  `https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG${n}.png`

/** pngimg uploads hello_kitty_PNG1 … PNG40 */
const PNGIMG_NUMS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
]

const PNGFRE = (n) =>
  `https://pngfre.com/wp-content/uploads/hello-kitty-${n}.png`

/** Verified 200 responses on pngfre (poses differ from pngimg set) */
const PNGFRE_NUMS = [
  25, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 49, 50,
]

export const HK_PNG_IMAGES = [
  ...PNGIMG_NUMS.map(PNGIMG),
  ...PNGFRE_NUMS.map(PNGFRE),
]

/** Local kawaii-style SVG stickers (served from /public/stickers/) */
export const HK_STICKER_SVGS = [
  '/stickers/hk-face.svg',
  '/stickers/hk-bow.svg',
  '/stickers/hk-heart.svg',
  '/stickers/hk-star.svg',
  '/stickers/hk-apple.svg',
  '/stickers/hk-flower.svg',
  '/stickers/hk-cloud.svg',
  '/stickers/hk-milk.svg',
  '/stickers/hk-bubble.svg',
  '/stickers/hk-rainbow.svg',
]

/**
 * Stable pick for a given day so images don’t flicker on re-render.
 * @param {number} dayCount
 * @param {number} salt  offsets slot (e.g. left vs right float)
 */
export function pickHkPng(dayCount, salt = 0) {
  const n = HK_PNG_IMAGES.length
  if (!n) return ''
  const i = ((Number(dayCount) || 0) * 17 + salt * 31) % n
  return HK_PNG_IMAGES[i < 0 ? i + n : i]
}

/** Rotating window of SVG stickers for the decorative strip */
export function pickStickerWindow(dayCount, count = 6) {
  const src = HK_STICKER_SVGS
  const n = src.length
  if (!n) return []
  const start = ((Number(dayCount) || 0) * 3) % n
  const out = []
  for (let k = 0; k < count; k++) out.push(src[(start + k) % n])
  return out
}
