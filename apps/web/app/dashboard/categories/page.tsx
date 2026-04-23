'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryItem,
} from '../../lib/api';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Check,
  FolderTree,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import RichEditor from '../../components/RichEditor';

type ModalMode = 'create' | 'edit' | null;

interface FormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  slug: '',
  description: '',
  image: '',
  isActive: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Success toast
  const [toast, setToast] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setFormData(initialFormData);
    setFormError('');
    setEditingCategory(null);
    setModalMode('create');
  };

  const openEditModal = (category: CategoryItem) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive,
    });
    setFormError('');
    setEditingCategory(category);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingCategory(null);
    setFormData(initialFormData);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (modalMode === 'create') {
        await createCategory(formData);
        setToast('Category created successfully');
      } else if (modalMode === 'edit' && editingCategory) {
        await updateCategory(editingCategory._id, formData);
        setToast('Category updated successfully');
      }

      closeModal();
      loadCategories();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      await deleteCategory(deleteTarget._id);
      setDeleteTarget(null);
      setToast('Category deleted successfully');
      loadCategories();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 animate-fadeIn flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium ${toast.startsWith('Error') ? 'bg-red-600 text-white shadow-red-200' : 'bg-gray-900 text-white shadow-gray-300'
          }`}>
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Header - Simplified */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Add categories - they'll appear in the teal bar automatically</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 divide-gray-50">
            {filteredCategories.map((category) => (
              <div key={category._id} className="p-5 hover:bg-gray-50 transition-all group border-b sm:border-r border-gray-50 last:border-0 sm:even:border-r-0 lg:border-r lg:nth-[3n]:border-r-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                    ) : (
                      <FolderTree className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 rounded-lg text-gray-400 hover:text-teal-500 hover:bg-teal-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(category)}
                      className="p-2 rounded-lg text-gray-400 hover:text-teal-500 hover:bg-teal-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-teal-500 transition-colors">{category.name}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">/{category.slug}</p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[2.5rem]">
                    {category.description || 'No description provided'}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${category.isActive ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center text-xs text-gray-400 font-medium italic">
                    {category.updatedAt ? `Updated ${new Date(category.updatedAt).toLocaleDateString()}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <FolderTree className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400">No categories found</h3>
            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-200 hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                Create First Category
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500`}>
                  <FolderTree className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {modalMode === 'create' ? 'Create Category' : 'Edit Category'}
                  </h2>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Category Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    setFormData({ ...formData, name, slug })
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                  placeholder="e.g. PICKLES, CHUTNEYS, MURABBAS"
                />
                {formData.slug && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Slug: <span className="font-mono text-teal-600">{formData.slug}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all resize-none"
                  placeholder="Brief description of this category"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isActive ? 'bg-teal-500' : 'bg-gray-200'
                    }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
                <span className="text-sm font-medium text-gray-700">Active</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-500 shadow-lg shadow-teal-200 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {modalMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fadeIn text-center">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-teal-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Delete Category</h3>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{deleteTarget.name}</span>?
              All products in this category will become uncategorized.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {deleteLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
