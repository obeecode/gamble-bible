import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogAPI } from '../../services/api';

interface Blog {
    _id: string;
    title: string;
    category: string;
    author: {
        name: string;
        email: string;
    };
    status: string;
    createdAt: string;
    views: number;
    isFeatured: boolean;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const AdminBlogList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to first page when search changes
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset to first page when status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-blogs', statusFilter, debouncedSearchTerm, currentPage, limit],
        queryFn: async () => {
            const params: any = {
                page: currentPage,
                limit: limit,
            };
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            if (debouncedSearchTerm.trim()) {
                params.search = debouncedSearchTerm.trim();
            }
            const response = await blogAPI.getBlogs(params);
            if (response.success) {
                return {
                    blogs: response.data.blogs || [],
                    pagination: response.data.pagination || {
                        page: 1,
                        limit: limit,
                        total: 0,
                        pages: 0,
                    },
                };
            }
            return {
                blogs: [],
                pagination: {
                    page: 1,
                    limit: limit,
                    total: 0,
                    pages: 0,
                },
            };
        },
    });

    const blogs = data?.blogs || [];
    const pagination: PaginationData = data?.pagination || {
        page: 1,
        limit: limit,
        total: 0,
        pages: 0,
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await blogAPI.deleteBlog(id);
            if (!response.success) {
                throw new Error(response.error || 'Failed to delete blog');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
            toast.success('Blog deleted successfully');
            // If we're on the last page and it becomes empty, go to previous page
            if (blogs.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete blog post');
        },
    });

    const toggleFeaturedMutation = useMutation({
        mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
            const response = await blogAPI.updateBlog(id, { isFeatured });
            if (!response.success) {
                throw new Error(response.error || 'Failed to update blog');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
            toast.success('Featured status updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update featured status');
        },
    });

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this blog post?')) {
            return;
        }
        deleteMutation.mutate(id);
    };

    const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
        toggleFeaturedMutation.mutate({ id, isFeatured: !currentFeatured });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatViews = (views: number) => {
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}k`;
        }
        return views.toString();
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        // Scroll to top of table
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPagination = () => {
        if (pagination.pages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="admin-pagination">
                <button
                    className="admin-pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    title="Previous page"
                >
                    <ChevronLeft size={18} />
                </button>
                {startPage > 1 && (
                    <>
                        <button
                            className="admin-pagination-btn"
                            onClick={() => handlePageChange(1)}
                            disabled={isLoading}
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="admin-pagination-ellipsis">...</span>}
                    </>
                )}
                {pages.map((page) => (
                    <button
                        key={page}
                        className={`admin-pagination-btn ${currentPage === page ? 'admin-pagination-active' : ''}`}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                    >
                        {page}
                    </button>
                ))}
                {endPage < pagination.pages && (
                    <>
                        {endPage < pagination.pages - 1 && <span className="admin-pagination-ellipsis">...</span>}
                        <button
                            className="admin-pagination-btn"
                            onClick={() => handlePageChange(pagination.pages)}
                            disabled={isLoading}
                        >
                            {pagination.pages}
                        </button>
                    </>
                )}
                <button
                    className="admin-pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages || isLoading}
                    title="Next page"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        );
    };

    return (
        <div className="admin-blog-list">
            <div className="admin-blog-header">
                <div className="admin-blog-title-section">
                    <h1 className="admin-blog-title">Blog Posts</h1>
                    <p className="admin-blog-subtitle">Manage all your blog content here</p>
                </div>
                <Link
                    to="/admin/blogs/new"
                    className="admin-create-btn"
                >
                    <Plus size={20} />
                    <span>Create New Post</span>
                </Link>
            </div>

            {/* Filters and Search */}
            <div className="admin-blog-filters">
                <div className="admin-search-container">
                    <Search className="admin-search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        className="admin-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="admin-filter-btn"
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
            </div>

            {/* Blog Table */}
            <div className="admin-blog-table-container">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading blogs...</p>
                    </div>
                ) : blogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>No blogs found. Create your first blog post!</p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-blog-table">
                            <thead>
                                <tr className="admin-table-header">
                                    <th className="admin-table-th">Title</th>
                                    <th className="admin-table-th">Category</th>
                                    <th className="admin-table-th">Status</th>
                                    <th className="admin-table-th">Date</th>
                                    <th className="admin-table-th">Views</th>
                                    <th className="admin-table-th">Featured</th>
                                    <th className="admin-table-th admin-table-th-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="admin-table-body">
                                {blogs.map((blog) => (
                                    <tr key={blog._id} className="admin-table-row">
                                        <td className="admin-table-td">
                                            <p className="admin-blog-title-cell">{blog.title}</p>
                                            <p className="admin-blog-author">by {blog.author?.name || 'Unknown'}</p>
                                        </td>
                                        <td className="admin-table-td">
                                            <span className="admin-category-badge">
                                                {blog.category}
                                            </span>
                                        </td>
                                        <td className="admin-table-td">
                                            <span className={`admin-status-badge ${blog.status === 'published' ? 'admin-status-published' : 'admin-status-draft'}`}>
                                                {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="admin-table-td admin-table-date">{formatDate(blog.createdAt)}</td>
                                        <td className="admin-table-td admin-table-views">{formatViews(blog.views || 0)}</td>
                                        <td className="admin-table-td">
                                            <button
                                                onClick={() => handleToggleFeatured(blog._id, blog.isFeatured || false)}
                                                className={`admin-featured-btn ${blog.isFeatured ? 'admin-featured-active' : ''}`}
                                                title={blog.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                                                disabled={toggleFeaturedMutation.isPending}
                                            >
                                                <Star size={18} fill={blog.isFeatured ? 'currentColor' : 'none'} />
                                            </button>
                                        </td>
                                        <td className="admin-table-td admin-table-td-right">
                                            <div className="admin-table-actions">
                                                <button
                                                    className="admin-edit-btn"
                                                    onClick={() => navigate(`/admin/blogs/${blog._id}`)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="admin-delete-btn"
                                                    onClick={() => handleDelete(blog._id)}
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
                )}
            </div>

            {/* Pagination */}
            {!isLoading && blogs.length > 0 && (
                <div className="admin-pagination-container">
                    <div className="admin-pagination-info">
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.total)} of {pagination.total} blogs
                    </div>
                    {renderPagination()}
                </div>
            )}
        </div>
    );
};

export default AdminBlogList;
