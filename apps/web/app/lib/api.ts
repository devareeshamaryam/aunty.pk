 import { getAccessToken, getRefreshToken, refreshTokens, clearTokens, setTokens } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '/cdn';

const getBaseUrl = () => {
  try {
    if (API_URL.startsWith('http')) {
      const url = new URL(API_URL);
      return url.origin;
    }
    return '';
  } catch {
    return '';
  }
};

const BASE_URL = getBaseUrl();

/**
 * Resolve image path to a full URL.
 * - Absolute (http://, data:) → returned as-is
 * - `/cdn/<file>` → served by CDN service
 * - `/api/uploads/<file>` or `/uploads/<file>` → legacy API-served (backward compat)
 * - Bare filenames → treated as legacy uploads/<file>
 */
export function getImageUrl(path: string | null | undefined) {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (path === '/placeholder.jpg') return path;
  // CDN paths — use CDN_URL (relative or absolute)
  if (path.startsWith('/cdn/')) {
    if (CDN_URL.startsWith('http')) {
      return `${CDN_URL}${path.slice(4)}`; // strip "/cdn" prefix and append
    }
    return path; // same-origin via Nginx
  }
  // Legacy API-served uploads — keep working with old DB records
  if ((path.startsWith('/api/') || path.startsWith('/uploads/')) && BASE_URL) {
    return `${BASE_URL}${path}`;
  }
  if (!path.startsWith('/') && BASE_URL) {
    return `${BASE_URL}/uploads/${path}`;
  }
  return path;
}

// Authenticated fetch (for admin/protected routes)
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed.access_token}`;
      const retryRes = await fetch(url, { ...options, headers });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ message: retryRes.statusText }));
        throw new Error(err.message || 'Request failed');
      }
      if (retryRes.status === 204) return {} as T;
      return retryRes.json();
    } else {
      clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// Public fetch — no auth headers, for guest actions like placing orders
export async function publicApiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// --- User types ---
export interface UserItem {
  _id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  total: number;
  admins: number;
  users: number;
  recentUsers: UserItem[];
}

// --- Users API ---
export async function fetchUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}): Promise<UsersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.role) searchParams.set('role', params.role);

  const query = searchParams.toString();
  return apiFetch(`/users${query ? `?${query}` : ''}`);
}

export async function fetchUserStats(): Promise<UserStats> {
  return apiFetch('/users/stats');
}

export async function fetchUser(id: string): Promise<UserItem> {
  return apiFetch(`/users/${id}`);
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
}): Promise<UserItem> {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: 'USER' | 'ADMIN';
    password?: string;
  },
): Promise<UserItem> {
  return apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  return apiFetch(`/users/${id}`, {
    method: 'DELETE',
  });
}

// --- Category types ---
export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Product types ---
export interface Variant {
  name: string;
  price: number;
  stock: number;
}

export interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  isFeatured: boolean;
  variantType?: string;
  variants?: Variant[];
  category?: CategoryItem;
  /** Populated when fetching single product; array of IDs when sent in payload. */
  relatedProducts?: (string | ProductItem)[];
  avgRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// --- Banners ---
export interface BannerItem {
  _id: string;
  imageUrl: string;
  imageUrlMobile?: string;
  linkUrl?: string;
  alt?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchBanners(): Promise<BannerItem[]> {
  return publicApiFetch('/banners');
}

export async function fetchAdminBanners(): Promise<BannerItem[]> {
  return apiFetch('/banners/admin');
}

export async function createBanner(data: Partial<BannerItem>): Promise<BannerItem> {
  return apiFetch('/banners', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateBanner(id: string, data: Partial<BannerItem>): Promise<BannerItem> {
  return apiFetch(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteBanner(id: string): Promise<{ message: string }> {
  return apiFetch(`/banners/${id}`, { method: 'DELETE' });
}

export interface ProductsResponse {
  products: ProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Categories API ---
export async function fetchCategories(): Promise<CategoryItem[]> {
  return apiFetch('/categories');
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryItem> {
  return apiFetch(`/categories/slug/${slug}`);
}

export async function fetchCategory(id: string): Promise<CategoryItem> {
  return apiFetch(`/categories/${id}`);
}

export async function createCategory(data: Partial<CategoryItem>): Promise<CategoryItem> {
  return apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: Partial<CategoryItem>): Promise<CategoryItem> {
  return apiFetch(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<{ message: string }> {
  return apiFetch(`/categories/${id}`, {
    method: 'DELETE',
  });
}

// --- Products API ---
export async function fetchProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.featured !== undefined) searchParams.set('featured', String(params.featured));
  if (params?.minPrice !== undefined) searchParams.set('minPrice', String(params.minPrice));
  if (params?.maxPrice !== undefined) searchParams.set('maxPrice', String(params.maxPrice));

  const query = searchParams.toString();
  return apiFetch(`/products${query ? `?${query}` : ''}`);
}

export async function fetchProduct(id: string): Promise<ProductItem> {
  return apiFetch(`/products/${id}`);
}

export async function fetchProductBySlug(slug: string): Promise<ProductItem> {
  return apiFetch(`/products/slug/${slug}`);
}

export async function createProduct(data: Omit<Partial<ProductItem>, 'category'> & { category?: string }): Promise<ProductItem> {
  return apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: string, data: Omit<Partial<ProductItem>, 'category'> & { category?: string }): Promise<ProductItem> {
  return apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string): Promise<{ message: string }> {
  return apiFetch(`/products/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Upload one or more files to the CDN service.
 * Requires admin JWT (Authorization: Bearer <token>).
 * Returns array of `{ url, filename, ... }` where url is `/cdn/<filename>`.
 */
export async function uploadFiles(files: File[]): Promise<{ url: string; filename?: string }[]> {
  if (!files.length) return [];
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  // Single file → /upload/single (returns object), Multiple → /upload/multiple (returns array)
  if (files.length === 1) {
    const fd = new FormData();
    fd.append('file', files[0]!);
    const res = await fetch(`${CDN_URL}/upload/single`, { method: 'POST', body: fd, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Upload failed');
    }
    const data = await res.json();
    return [data];
  }

  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  const res = await fetch(`${CDN_URL}/upload/multiple`, { method: 'POST', body: fd, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }
  return res.json();
}

/** Single-file convenience wrapper for the CDN. */
export async function uploadFile(file: File): Promise<{ url: string; filename?: string }> {
  const [first] = await uploadFiles([file]);
  return first;
}

// --- Order types ---
export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantName?: string;
}

export interface OrderAddress {
  street?: string;
  area?: string;
  city?: string;
  phone?: string;
  notes?: string;
}

export interface OrderDeliveryLocation {
  lat: number;
  lng: number;
  label?: string;
}

export type OrderStatusValue =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'RIDER_ON_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderStatusEntry {
  status: OrderStatusValue;
  note?: string;
  at: string;
}

export interface OrderItemResponse {
  _id: string;
  guestId?: string;
  user?: UserItem | string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  itemsTotal?: number;
  deliveryFee?: number;
  totalAmount: number;
  status: OrderStatusValue;
  statusHistory?: OrderStatusEntry[];
  estimatedDeliveryAt?: string;
  estimatedDeliveryText?: string;
  riderNote?: string;
  shippingAddress?: OrderAddress;
  deliveryLocation?: OrderDeliveryLocation;
  paymentMethod: 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  voiceMessage?: {
    fileUrl: string;
    mimeType: string;
    durationSeconds: number;
    uploadedAt: string;
  };
  seenByAdmin?: boolean;
  seenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: OrderItemResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  delivered: number;
  revenue: number;
  recentOrders: OrderItemResponse[];
}

// --- Orders API ---
export interface CreateOrderPayload {
  guestId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  deliveryLocation?: { lat: number; lng: number; label?: string };
  shippingAddress?: {
    street?: string;
    area?: string;
    city: string;
    phone: string;
    notes?: string;
  };
  voiceMessage?: { data: string; mimeType: string; durationSeconds: number };
}

export async function createOrder(data: CreateOrderPayload): Promise<{ order: OrderItemResponse }> {
  return publicApiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function trackOrder(orderId: string, guestId: string): Promise<any> {
  return publicApiFetch(`/orders/track/${orderId}?guestId=${encodeURIComponent(guestId)}`);
}

export async function fetchGuestOrders(guestId: string): Promise<any[]> {
  return publicApiFetch(`/orders/by-guest/${encodeURIComponent(guestId)}`);
}

export async function fetchOrder(id: string): Promise<OrderItemResponse> {
  return apiFetch(`/orders/${id}`);
}

export async function fetchAllOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<OrdersResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.status) sp.set('status', params.status);
  const q = sp.toString();
  return apiFetch(`/orders${q ? `?${q}` : ''}`);
}

export async function updateOrderStatus(
  id: string,
  status: string,
  note?: string,
): Promise<OrderItemResponse> {
  return apiFetch(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });
}

export async function updateOrderEta(
  id: string,
  data: { estimatedDeliveryAt?: string; estimatedDeliveryText?: string; riderNote?: string },
): Promise<OrderItemResponse> {
  return apiFetch(`/orders/${id}/eta`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function fetchOrderStats(): Promise<OrderStats> {
  return apiFetch('/orders/stats');
}

/** Admin: recent unseen orders for the dashboard banner. */
export async function fetchUnseenOrders(limit = 10): Promise<OrderItemResponse[]> {
  return apiFetch(`/orders/unseen?limit=${limit}`);
}

export async function fetchUnseenOrdersCount(): Promise<{ count: number }> {
  return apiFetch('/orders/unseen/count');
}

export async function markOrderSeen(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/orders/${id}/seen`, { method: 'PUT' });
}

// --- Settings API ---
export interface PublicSettings {
  deliveryFee: { free: boolean; amount: number; freeAbove?: number };
  store: { name: string; phone?: string; whatsapp?: string };
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  return publicApiFetch('/settings');
}

export async function updateSettings(data: Partial<PublicSettings>): Promise<PublicSettings> {
  return apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// --- Review types ---
export interface ReviewItem {
  _id: string;
  rating: number;
  comment?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  reviewerPhone?: string;
  guestId?: string;
  photos?: string[];
  ownerReply?: string;
  isVerified?: boolean;
  user?: { _id: string; name: string; email: string };
  product: string | ProductItem;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  breakdown: Record<string, number>;
}

export interface ReviewsResponse {
  reviews: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Reviews API ---
export async function submitReview(data: {
  rating: number;
  comment?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  reviewerPhone?: string;
  product: string;
  guestId?: string;
  photos?: string[];
}): Promise<ReviewItem> {
  return publicApiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchProductReviews(productId: string): Promise<ReviewItem[]> {
  return publicApiFetch(`/reviews/product/${productId}`);
}

export async function fetchProductReviewStats(productId: string): Promise<ReviewStats> {
  return publicApiFetch(`/reviews/product/${productId}/stats`);
}

/** Reviews authored by this guest (uses guestId from localStorage). */
export async function fetchMyReviews(guestId: string): Promise<ReviewItem[]> {
  if (!guestId) return [];
  return publicApiFetch(`/reviews/by-guest/${encodeURIComponent(guestId)}`);
}

/** Check whether this guest can review a product (delivered order required, only once). */
export async function canReviewProduct(
  productId: string,
  guestId: string,
): Promise<{ canReview: boolean; reason: 'ok' | 'already' | 'no-order' | 'invalid'; orderId: string | null }> {
  return publicApiFetch(
    `/reviews/can-review/${encodeURIComponent(productId)}?guestId=${encodeURIComponent(guestId)}`,
  );
}

/**
 * Guest-friendly review photo upload — goes straight to the CDN
 * (`POST /upload/review`, no JWT, per-IP rate-limited).
 */
export async function uploadReviewPhoto(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${CDN_URL}/upload/review`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }
  return res.json();
}

export async function adminCreateReview(data: {
  product: string;
  rating: number;
  comment?: string;
  reviewerName?: string;
  photos?: string[];
  ownerReply?: string;
  isVerified?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}): Promise<ReviewItem> {
  return apiFetch('/reviews/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReview(
  id: string,
  data: Partial<ReviewItem>,
): Promise<ReviewItem> {
  return apiFetch(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function fetchAllReviews(params?: {
  page?: number;
  limit?: number;
  status?: string;
  productId?: string;
}): Promise<ReviewsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.productId) searchParams.set('productId', params.productId);

  const query = searchParams.toString();
  return apiFetch(`/reviews${query ? `?${query}` : ''}`);
}

export async function updateReviewStatus(id: string, status: string): Promise<ReviewItem> {
  return apiFetch(`/reviews/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteReview(id: string): Promise<{ message: string }> {
  return apiFetch(`/reviews/${id}`, {
    method: 'DELETE',
  });
}

