import { pickStickerWindow } from '../hkAssets'

export default function HkStickerStrip({ dayCount }) {
  const stickers = pickStickerWindow(dayCount, 6)

  return (
    <div className="hk-sticker-strip" aria-hidden="true">
      {stickers.map((src, i) => (
        <img
          key={`${src}-${i}`}
          className={`hk-sticker hk-sticker--${i % 6}`}
          src={src}
          alt=""
          draggable={false}
        />
      ))}
    </div>
  )
}
