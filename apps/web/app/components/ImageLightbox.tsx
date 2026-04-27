 'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageLightboxProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [onClose, onNext, onPrev])

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>
      </div>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ChevronLeft size={32} className="text-white" />
        </button>
      )}

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center p-16">
        <div className="relative w-full h-full max-w-5xl max-h-[80vh]">
          <Image
            src={images[currentIndex] ?? ''}
            alt={`Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Next Button */}
      {images.length > 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ChevronRight size={32} className="text-white" />
        </button>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-white/10 backdrop-blur-sm p-2 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                const diff = idx - currentIndex
                if (diff > 0) {
                  for (let i = 0; i < diff; i++) onNext()
                } else if (diff < 0) {
                  for (let i = 0; i < Math.abs(diff); i++) onPrev()
                }
              }}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-white scale-110'
                  : 'border-white/30 hover:border-white/60'
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}