 import { getAccessToken, getRefreshToken, refreshTokens, clearTokens, setTokens } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

export function getImageUrl(path: string | null | undefined) {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (path === '/placeholder.jpg') return path;
  if ((path.startsWith('/api/') || path.startsWith('/uploads/')) && BASE_URL) {
    return `${BASE_URL}${path}`;
  }
  return path.startsWith('/') ? path : `/${path}`;
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
  createdAt: string;
  updatedAt: string;
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

export async function uploadFiles(files: File[]): Promise<{ url: string }[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await fetch(`${API_URL}/uploads/multiple`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }

  return res.json();
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
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface OrderItemResponse {
  _id: string;
  user: UserItem | string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: OrderAddress;
  paymentMethod: 'COD' | 'STRIPE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
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
// Uses publicApiFetch so no auth token is sent — guest checkout works without login
export async function createOrder(data: {
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  paymentMethod?: 'COD' | 'STRIPE';
  password?: string;
}): Promise<{ order: OrderItemResponse; auth?: { access_token: string; refresh_token: string; isNew?: boolean; email?: string; tempPassword?: string } }> {
  return publicApiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchMyOrders(): Promise<OrderItemResponse[]> {
  return apiFetch('/orders/my-orders');
}

export async function fetchOrder(id: string): Promise<OrderItemResponse> {
  return apiFetch(`/orders/${id}`);
}

export async function fetchAllOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  user?: string;
}): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.user) searchParams.set('user', params.user);

  const query = searchParams.toString();
  return apiFetch(`/orders${query ? `?${query}` : ''}`);
}

export async function updateOrderStatus(id: string, status: string): Promise<OrderItemResponse> {
  return apiFetch(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function fetchOrderStats(): Promise<OrderStats> {
  return apiFetch('/orders/stats');
}

// --- Review types ---
export interface ReviewItem {
  _id: string;
  rating: number;
  comment?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  product: string | ProductItem;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
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
  product: string;
}): Promise<ReviewItem> {
  return apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchProductReviews(productId: string): Promise<ReviewItem[]> {
  return apiFetch(`/reviews/product/${productId}`);
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