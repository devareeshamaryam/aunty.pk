 'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Star, ShoppingCart, Minus, Plus, ArrowLeft, MessageCircle } from 'lucide-react'
import { fetchProductBySlug, getImageUrl, ProductItem, ReviewItem, fetchProductReviews, fetchProducts } from '@/app/lib/api'
import { useCart } from '@/app/context/CartContext'
import ImageLightbox from '@/app/components/ImageLightbox'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { addItem } = useCart()

  const [product, setProduct] = useState<ProductItem | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (slug) {
      const canonicalUrl = `https://www.aunty.pk/product/${slug}`
      let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null

      if (link) {
        link.setAttribute('href', canonicalUrl)
      } else {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        link.setAttribute('href', canonicalUrl)
        document.head.appendChild(link)
      }
    }
  }, [slug])

  useEffect(() => {
    if (slug) {
      fetchProductData()
    }
  }, [slug])

  const fetchProductData = async () => {
    try {
      setLoading(true)
      const productData = await fetchProductBySlug(slug)
      setProduct(productData)
      
      const reviewsData = await fetchProductReviews(productData._id)
      setReviews(reviewsData.filter((r) => r.status === 'approved'))
      
      if (productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]?.name || null)
      }

      try {
        let relatedData = await fetchProducts({ featured: true, limit: 8 })
        
        if (!relatedData.products || relatedData.products.length === 0) {
          relatedData = await fetchProducts({ limit: 8 })
        }
        
        const filtered = relatedData.products.filter((p) => p._id !== productData._id).slice(0, 4)
        setRelatedProducts(filtered)
      } catch (err) {
        console.error('Failed to fetch related products:', err)
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    const variant = product.variants?.find((v) => v.name === selectedVariant)
    const price = variant ? variant.price : product.price
    const maxStock = variant ? variant.stock : product.stock

    addItem({
      productId: product._id,
      name: product.name,
      price,
      quantity,
      image: product.images[0],
      variant: selectedVariant || undefined,
      slug: product.slug,
      maxStock,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleWhatsAppOrder = () => {
    if (!product) return

    const variant = product.variants?.find((v) => v.name === selectedVariant)
    const price = variant ? variant.price : product.price
    const variantText = selectedVariant ? ` (${selectedVariant})` : ''
    
    const message = `Hi, I want to order:\n\n*${product.name}*${variantText}\nQuantity: ${quantity}\nPrice: Rs. ${(price * quantity).toLocaleString()}\n\nPlease confirm availability.`
    
    const whatsappNumber = '923105717097'
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
  }

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleNextImage = () => {
    if (!product) return
    setSelectedImage((prev) => (prev + 1) % product.images.length)
  }

  const handlePrevImage = () => {
    if (!product) return
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          Back to Home
        </button>
      </div>
    )
  }

  const currentPrice = product.variants?.find((v) => v.name === selectedVariant)?.price || product.price

  return (
    <>
      {lightboxOpen && product && (
        <ImageLightbox
          images={product.images.map(img => getImageUrl(img))}
          currentIndex={selectedImage}
          onClose={() => setLightboxOpen(false)}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="px-4 md:px-8 py-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </button>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Left: Images */}
              <div className="space-y-3">
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in hover:opacity-95 transition-opacity w-full"
                >
                  <Image
                    src={getImageUrl(product.images[selectedImage])}
                    alt={product.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </button>

                {product.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          selectedImage === idx
                            ? 'border-teal-500'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        <Image
                          src={getImageUrl(img)}
                          alt={`${product.name} ${idx + 1}`}
                          fill
                          className="object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product Info */}
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  
                  {product.category && (
                    <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs rounded-full mb-3">
                      {product.category.name}
                    </span>
                  )}

                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= averageRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {averageRating.toFixed(1)} ({reviews.length} reviews)
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-3xl font-bold text-teal-600">
                  Rs. {currentPrice.toLocaleString()}
                </div>

                <div className="text-sm">
                  {product.stock > 0 ? (
                    <span className="text-green-600 font-medium">✓ In Stock</span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Out of Stock</span>
                  )}
                </div>

                {product.variants && product.variants.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {product.variantType || 'Size'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.name}
                          onClick={() => setSelectedVariant(variant.name)}
                          disabled={variant.stock === 0}
                          className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                            selectedVariant === variant.name
                              ? 'border-teal-500 bg-teal-50 text-teal-700 font-semibold'
                              : variant.stock === 0
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 hover:border-teal-300'
                          }`}
                        >
                          <div className="font-medium">{variant.name}</div>
                          <div className="text-xs text-gray-500">Rs. {variant.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={decrementQuantity}
                      className="w-8 h-8 rounded-md bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-base font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      className="w-8 h-8 rounded-md bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || addedToCart}
                    className={`flex-1 py-2 rounded-md text-sm font-semibold text-white transition-all flex items-center justify-center gap-1.5 ${
                      addedToCart
                        ? 'bg-green-500'
                        : product.stock === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-teal-500 hover:bg-teal-600 active:scale-95'
                    }`}
                  >
                    <ShoppingCart size={16} />
                    {addedToCart ? 'Added!' : 'Add to Cart'}
                  </button>
                  
                  <button
                    onClick={handleWhatsAppOrder}
                    className="flex-1 py-2 rounded-md text-sm font-semibold bg-teal-500 hover:bg-teal-600 text-white transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="border-t border-gray-200">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === 'description'
                      ? 'bg-teal-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  DESCRIPTION
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === 'reviews'
                      ? 'bg-teal-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  REVIEWS
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'description' && (
                  <div className="prose prose-sm max-w-none">
                    {product.description ? (
                      <div 
                        className="text-gray-700 leading-relaxed whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    ) : (
                      <p className="text-gray-500 italic">No description available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.slice(0, 5).map((review) => (
                          <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    className={
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {review.user?.name || review.reviewerName || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-gray-600 text-sm">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-center py-4">No reviews yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* You May Also Like Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">You May Also Like</h2>
              <div className="space-y-3">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct._id}
                    className="relative bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all overflow-hidden group"
                  >
                    <Link
                      href={`/product/${relatedProduct.slug}`}
                      className="flex items-center p-4 gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base line-clamp-2 group-hover:text-teal-600 transition-colors">
                          {relatedProduct.name}
                        </h3>
                        <p className="text-sm text-teal-600 font-semibold mt-1">
                          Rs. {relatedProduct.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-gray-200 group-hover:border-teal-300 transition-colors">
                          <Image
                            src={getImageUrl(relatedProduct.images[0])}
                            alt={relatedProduct.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            addItem({
                              productId: relatedProduct._id,
                              name: relatedProduct.name,
                              price: relatedProduct.price,
                              quantity: 1,
                              image: relatedProduct.images[0],
                              slug: relatedProduct.slug,
                              maxStock: relatedProduct.stock,
                            })
                          }}
                          className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 z-10"
                          aria-label={`Add ${relatedProduct.name} to cart`}
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}