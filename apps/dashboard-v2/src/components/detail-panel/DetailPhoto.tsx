import { useState } from 'react'

interface DetailPhotoProps {
  photos: string[]
  alt: string
}

export function DetailPhoto({ photos, alt }: DetailPhotoProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  if (!photos || photos.length === 0) {
    return (
      <div className="detail-photo detail-photo-empty">
        <span>📷 Sin fotos</span>
      </div>
    )
  }

  const mainPhoto = photos[selectedIdx] || photos[0]

  return (
    <div className="detail-photo">
      <div className="photo-main">
        <img
          src={mainPhoto}
          alt={alt}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://storage.googleapis.com/e24static/images/no-image.jpg'
          }}
        />
      </div>
      {photos.length > 1 && (
        <div className="photo-thumbs">
          {photos.map((p, i) => (
            <button
              key={i}
              className={`photo-thumb ${i === selectedIdx ? 'active' : ''}`}
              onClick={() => setSelectedIdx(i)}
            >
              <img
                src={p}
                alt={`${alt} ${i + 1}`}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://storage.googleapis.com/e24static/images/no-image.jpg'
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
