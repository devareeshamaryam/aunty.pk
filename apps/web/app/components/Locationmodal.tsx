'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronDown, MapPin } from 'lucide-react'

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  orderType: 'delivery' | 'pickup'
  setOrderType: (type: 'delivery' | 'pickup') => void
  selectedLocation: string
  setSelectedLocation: (loc: string) => void
  onConfirm: () => void
}

export default function LocationModal({
  isOpen,
  onClose,
  orderType,
  setOrderType,
  selectedLocation,
  setSelectedLocation,
  onConfirm,
}: LocationModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 999999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 16,
          width: '100%',
          maxWidth: 448,
          padding: 24,
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, padding: 6, borderRadius: '50%', border: 'none', background: '#f3f4f6', cursor: 'pointer' }}
        >
          <X size={18} color="#6b7280" />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden' }}>
            <Image src="/image.png" alt="Logo" width={64} height={64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, color: '#1f2937', marginBottom: 16 }}>
          Select your order type
        </h2>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setOrderType('delivery')}
            style={{ flex: 1, padding: '10px 0', borderRadius: 999, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', background: orderType === 'delivery' ? '#14b8a6' : '#f3f4f6', color: orderType === 'delivery' ? 'white' : '#4b5563' }}
          >DELIVERY</button>
          <button
            onClick={() => setOrderType('pickup')}
            style={{ flex: 1, padding: '10px 0', borderRadius: 999, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', background: orderType === 'pickup' ? '#14b8a6' : '#f3f4f6', color: orderType === 'pickup' ? 'white' : '#4b5563' }}
          >PICK-UP</button>
        </div>

        {orderType === 'pickup' ? (
          <>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#4b5563', marginBottom: 12 }}>Which outlet would you like to pick-up from?</p>
            <button style={{ width: '100%', marginBottom: 12, padding: '10px 16px', background: '#14b8a6', color: 'white', borderRadius: 999, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MapPin size={16} /> Use Current Location
            </button>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{ width: '100%', padding: '10px 36px 10px 16px', border: '1px solid #d1d5db', borderRadius: 12, fontSize: 14, color: '#374151', appearance: 'none', background: 'white' }}
              >
                <option value="">Select location</option>
                <option value="Aunty.pk Multan">Aunty.pk Multan</option>
              </select>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <ChevronDown size={16} color="#9ca3af" />
              </div>
            </div>
            {selectedLocation && (
              <div style={{ marginBottom: 16, padding: '10px 16px', background: '#f0fdfa', borderRadius: 12, border: '1px solid #ccfbf1' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#0d9488' }}>Location:</p>
                <p style={{ fontSize: 12, color: '#4b5563' }}>Multan, Pakistan</p>
              </div>
            )}
            <button
              onClick={onConfirm}
              disabled={!selectedLocation}
              style={{ width: '100%', padding: '10px 0', borderRadius: 999, fontWeight: 700, color: 'white', fontSize: 14, border: 'none', cursor: selectedLocation ? 'pointer' : 'not-allowed', background: selectedLocation ? '#14b8a6' : '#d1d5db' }}
            >Select</button>
          </>
        ) : (
          <>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#4b5563', marginBottom: 12 }}>Enter your delivery location</p>
            <input
              type="text"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              placeholder="Enter your location"
              style={{ width: '100%', padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 12, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
            />
            <button
              onClick={onConfirm}
              disabled={!selectedLocation}
              style={{ width: '100%', padding: '10px 0', borderRadius: 999, fontWeight: 700, color: 'white', fontSize: 14, border: 'none', cursor: selectedLocation ? 'pointer' : 'not-allowed', background: selectedLocation ? '#14b8a6' : '#d1d5db' }}
            >Confirm Location</button>
          </>
        )}
      </div>
    </div>
  )
}