 'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, MapPin, Phone, Mail, User, MessageCircle, Package, Mic, MicOff, Play, Pause, Trash2, CheckCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { getImageUrl, createOrder } from '../lib/api'
import Link from 'next/link'

// ─── Voice Recording Hook ────────────────────────────────────────────────────
function useVoiceRecorder() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobEvent['data'][]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number | null>(null)

  const MAX_DURATION = 60 // seconds

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setRecordingState('recorded')
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start(100)
      setRecordingState('recording')
      setRecordingDuration(0)

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording()
            return MAX_DURATION
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      alert('Microphone access denied. Please allow microphone permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setAudioBlob(null)
    setRecordingState('idle')
    setRecordingDuration(0)
    setIsPlaying(false)
    setPlaybackProgress(0)
  }

  const togglePlayback = () => {
    if (!audioUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setPlaybackProgress(0)
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    } else {
      audioRef.current.play()
      setIsPlaying(true)

      const updateProgress = () => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
          setPlaybackProgress(isNaN(progress) ? 0 : progress)
          animationRef.current = requestAnimationFrame(updateProgress)
        }
      }
      animationRef.current = requestAnimationFrame(updateProgress)
    }
  }

  const getBase64 = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!audioBlob) return resolve(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.readAsDataURL(audioBlob)
    })
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [])

  return {
    recordingState, audioUrl, audioBlob, recordingDuration,
    isPlaying, playbackProgress, startRecording, stopRecording,
    deleteRecording, togglePlayback, getBase64, formatTime, MAX_DURATION
  }
}

// ─── Voice Recorder UI Component ─────────────────────────────────────────────
function VoiceOrderSection({ recorder }: { recorder: ReturnType<typeof useVoiceRecorder> }) {
  const {
    recordingState, recordingDuration, isPlaying, playbackProgress,
    startRecording, stopRecording, deleteRecording, togglePlayback,
    formatTime, MAX_DURATION
  } = recorder

  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <Mic size={18} className="text-teal-500" />
        Voice Order Message
        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Record a voice message with your order — special instructions, customization, or anything else.
      </p>

      {/* IDLE STATE */}
      {recordingState === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 hover:bg-teal-100 hover:border-teal-400 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mic size={20} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-teal-700">Record a voice message</p>
            <p className="text-xs text-teal-500">Max {MAX_DURATION} seconds</p>
          </div>
        </button>
      )}

      {/* RECORDING STATE */}
      {recordingState === 'recording' && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-semibold text-red-700">Recording...</span>
            </div>
            <span className="text-sm font-mono text-red-600">
              {formatTime(recordingDuration)} / {formatTime(MAX_DURATION)}
            </span>
          </div>

          <div className="w-full h-1.5 bg-red-200 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${(recordingDuration / MAX_DURATION) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-0.5 h-8 mb-4">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-400 rounded-full animate-bounce"
                style={{
                  animationDelay: `${(i * 0.07) % 0.5}s`,
                  animationDuration: `${0.4 + (i % 5) * 0.1}s`,
                  height: `${20 + Math.sin(i) * 12}px`
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <MicOff size={18} />
            Stop Recording
          </button>
        </div>
      )}

      {/* RECORDED STATE */}
      {recordingState === 'recorded' && (
        <div className="rounded-xl border-2 border-teal-400 bg-teal-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-teal-600" />
            <span className="text-sm font-semibold text-teal-700">Voice message recorded!</span>
            <span className="ml-auto text-xs text-gray-500 font-mono">{formatTime(recordingDuration)}</span>
          </div>

          <div className="w-full h-1.5 bg-teal-200 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-100"
              style={{ width: `${playbackProgress}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex-1 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={deleteRecording}
              className="p-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              title="Delete recording"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <p className="text-xs text-teal-600 mt-2 text-center">
            ✓ This message will be sent with your order
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const voiceRecorder = useVoiceRecorder()

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    alternateMobile: '',
    address: '',
    city: '',
    area: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string>('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required'
    } else if (!/^03\d{9}$/.test(formData.mobile.replace(/-/g, ''))) {
      newErrors.mobile = 'Invalid mobile number format (03xxxxxxxxx)'
    }

    if (!formData.address.trim()) newErrors.address = 'Delivery address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setApiError('')

    try {
      const voiceMessageBase64 = await voiceRecorder.getBase64()

      const orderData = {
        customerName: formData.fullName,
        customerEmail: `${formData.mobile}@guest.com`,
        items: items.map(item => ({
          product: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          variantName: item.variant,
        })),
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.area || formData.city,
          zipCode: '00000',
          phone: formData.mobile,
        },
        paymentMethod: 'COD' as const,
        ...(voiceMessageBase64 && {
          voiceMessage: {
            data: voiceMessageBase64,
            mimeType: 'audio/webm',
            durationSeconds: voiceRecorder.recordingDuration,
          }
        }),
      }

      const response = await createOrder(orderData)

      const orderDetails = items.map(item =>
        `• ${item.name}${item.variant ? ` (${item.variant})` : ''}\n  Qty: ${item.quantity} × Rs. ${item.price.toLocaleString()} = Rs. ${(item.price * item.quantity).toLocaleString()}`
      ).join('\n\n')

      const voiceNote = voiceMessageBase64 ? `\n🎙️ Voice message attached (${voiceRecorder.formatTime(voiceRecorder.recordingDuration)})\n` : ''

      const message = `🛍️ *New Order #${response.order._id}*\n\n` +
        `*Customer Details:*\n` +
        `Name: ${formData.fullName}\n` +
        `Mobile: ${formData.mobile}\n` +
        `${formData.alternateMobile ? `Alternate: ${formData.alternateMobile}\n` : ''}` +
        `\n*Delivery Address:*\n` +
        `${formData.address}\n` +
        `${formData.area ? `Area: ${formData.area}\n` : ''}` +
        `City: ${formData.city}\n` +
        `${formData.notes ? `\nNotes: ${formData.notes}\n` : ''}` +
        voiceNote +
        `\n*Order Items:*\n${orderDetails}\n\n` +
        `*Total Amount: Rs. ${totalPrice.toLocaleString()}*\n` +
        `Payment: Cash on Delivery\n\n` +
        `Order ID: ${response.order._id}`

      const whatsappNumber = '923105717097'
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

      setTimeout(() => {
        clearCart()
        router.push(`/order-success?orderId=${response.order._id}`)
      }, 1500)

    } catch (error: any) {
      console.error('Order creation failed:', error)
      setApiError(error.message || 'Failed to create order. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Package size={64} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">No items in cart</h1>
          <p className="text-gray-500 mb-6">Add some items before checkout</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Cart</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500">Just a last step, please fill your information below</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Customer Information</h2>

              {apiError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">{apiError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                {/* Mobile Numbers */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="03xx-xxxxxxx"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${errors.mobile ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Mobile Number</label>
                    <input
                      type="tel"
                      name="alternateMobile"
                      value={formData.alternateMobile}
                      onChange={handleInputChange}
                      placeholder="03xx-xxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-teal-500" />
                    Delivery Address
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complete Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="House/Flat no., Street, Landmark"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g., Karachi, Lahore"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area/Locality</label>
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="e.g., Gulshan, DHA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions for delivery"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* VOICE ORDER SECTION */}
                <VoiceOrderSection recorder={voiceRecorder} />

                {/* Payment Method */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Method</h3>
                  <div className="bg-teal-50 border-2 border-teal-500 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                      <Package className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Your Order</h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variant || ''}`} className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                      {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                      <p className="text-sm text-gray-600">{item.quantity} × Rs. {item.price.toLocaleString()}</p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Voice indicator in summary */}
              {voiceRecorder.recordingState === 'recorded' && (
                <div className="flex items-center gap-2 py-2 px-3 bg-teal-50 rounded-lg mb-3">
                  <Mic size={14} className="text-teal-600" />
                  <span className="text-xs text-teal-700 font-medium">
                    Voice message attached ({voiceRecorder.formatTime(voiceRecorder.recordingDuration)})
                  </span>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs. {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-teal-600">Rs. {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full mt-6 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>

              <Link
                href="/cart"
                className="block text-center text-teal-600 hover:text-teal-700 text-sm font-medium mt-3"
              >
                ← Continue to add more items
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}