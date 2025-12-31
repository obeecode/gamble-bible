import { useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryAPI } from '../../services/api';

interface Category {
    _id: string;
    name: string;
    description?: string;
    image?: string;
    slug: string;
}

const AdminCategories = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: ''
    });
    const queryClient = useQueryClient();

    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryAPI.getCategories();
            if (response.success) {
                return response.data.categories || [];
            }
            return [];
        },
    });

    const categories = categoriesData || [];

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                image: category.image || ''
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                image: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            image: ''
        });
    };

    const createMutation = useMutation({
        mutationFn: async (data: { name: string; description?: string; image?: string }) => {
            const response = await categoryAPI.createCategory(data);
            if (!response.success) {
                throw new Error(response.error || 'Failed to create category');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category created successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create category');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; image?: string } }) => {
            const response = await categoryAPI.updateCategory(id, data);
            if (!response.success) {
                throw new Error(response.error || 'Failed to update category');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category updated successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update category');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await categoryAPI.deleteCategory(id);
            if (!response.success) {
                throw new Error(response.error || 'Failed to delete category');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete category');
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory._id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return;
        }
        deleteMutation.mutate(id);
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="admin-categories">
            <div className="admin-blog-header">
                <div className="admin-blog-title-section">
                    <h1 className="admin-blog-title">Categories</h1>
                    <p className="admin-blog-subtitle">Manage blog categories</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="admin-create-btn"
                >
                    <Plus size={20} />
                    <span>Create Category</span>
                </button>
            </div>

            {/* Search */}
            <div className="admin-blog-filters">
                <div className="admin-search-container">
                    <Search className="admin-search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="admin-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories List */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading categories...</p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>No categories found. Create your first category!</p>
                </div>
            ) : (
                <div className="admin-blog-table-container">
                    <div className="admin-table-wrapper">
                        <table className="admin-blog-table">
                            <thead>
                                <tr className="admin-table-header">
                                    <th className="admin-table-th">Name</th>
                                    <th className="admin-table-th">Description</th>
                                    <th className="admin-table-th">Slug</th>
                                    <th className="admin-table-th admin-table-th-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="admin-table-body">
                                {filteredCategories.map((category) => (
                                    <tr key={category._id} className="admin-table-row">
                                        <td className="admin-table-td">
                                            <p className="admin-blog-title-cell">{category.name}</p>
                                        </td>
                                        <td className="admin-table-td">
                                            <p style={{ color: '#6b7280', fontSize: '14px' }}>
                                                {category.description || '-'}
                                            </p>
                                        </td>
                                        <td className="admin-table-td">
                                            <span className="admin-category-badge">
                                                {category.slug}
                                            </span>
                                        </td>
                                        <td className="admin-table-td admin-table-td-right">
                                            <div className="admin-table-actions">
                                                <button
                                                    className="admin-edit-btn"
                                                    onClick={() => handleOpenModal(category)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="admin-delete-btn"
                                                    onClick={() => handleDelete(category._id)}
                                                    title="Delete"
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={handleCloseModal}>
                    <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2 className="admin-modal-title">
                                {editingCategory ? 'Edit Category' : 'Create Category'}
                            </h2>
                            <button className="admin-modal-close" onClick={handleCloseModal}>
                                <span>×</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="admin-modal-body">
                            <div className="admin-form-group">
                                <label className="admin-form-label">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="admin-form-input"
                                    placeholder="Category name"
                                    required
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="admin-form-textarea"
                                    placeholder="Category description"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="admin-form-input"
                                    placeholder="Image URL (optional)"
                                />
                            </div>
                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="admin-save-draft-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="admin-publish-btn"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending
                                        ? 'Saving...'
                                        : editingCategory
                                        ? 'Update'
                                        : 'Create'} Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
