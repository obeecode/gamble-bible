import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Share2, MessageCircle, Heart, Send, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { blogAPI, commentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CommentsSection from '../components/CommentsSection';
import authorImg from '../assets/author_louis.png';
import kayakImg from '../assets/kayak_lake.png';

interface Blog {
    _id: string;
    title: string;
    slug: string;
    category: string;
    tags: string[];
    sections: Array<{
        id: string;
        type: 'text' | 'heading' | 'image';
        content: string;
        imageUrl?: string;
        imageAlt?: string;
    }>;
    coverImage?: string;
    seoDescription?: string;
    author: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
    views: number;
}

interface Comment {
    _id: string;
    content: string;
    author: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    replies?: Comment[];
}

const BlogPost = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentContent, setCommentContent] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchBlog();
        }
    }, [slug]);

    useEffect(() => {
        if (blog?._id) {
            fetchComments();
        }
    }, [blog?._id]);

    const fetchBlog = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getBlogBySlug(slug!);
            if (response.success) {
                setBlog(response.data.blog);
                // Update document title and meta tags for SEO
                document.title = `${response.data.blog.title} | Gamble Bible`;
                updateMetaTags(response.data.blog);
            } else {
                setError('Blog not found');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load blog');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        if (!blog?._id) return;
        try {
            const response = await commentAPI.getCommentsByBlog(blog._id);
            if (response.success) {
                setComments(response.data.comments);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const updateMetaTags = (blogData: Blog) => {
        // Update or create meta tags for SEO
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', blogData.seoDescription || blogData.title);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = blogData.seoDescription || blogData.title;
            document.head.appendChild(meta);
        }

        // Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute('content', blogData.title);
        } else {
            const meta = document.createElement('meta');
            meta.setAttribute('property', 'og:title');
            meta.content = blogData.title;
            document.head.appendChild(meta);
        }

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            ogDescription.setAttribute('content', blogData.seoDescription || blogData.title);
        } else {
            const meta = document.createElement('meta');
            meta.setAttribute('property', 'og:description');
            meta.content = blogData.seoDescription || blogData.title;
            document.head.appendChild(meta);
        }

        if (blogData.coverImage) {
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage) {
                ogImage.setAttribute('content', blogData.coverImage);
            } else {
                const meta = document.createElement('meta');
                meta.setAttribute('property', 'og:image');
                meta.content = blogData.coverImage;
                document.head.appendChild(meta);
            }
        }

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) {
            ogUrl.setAttribute('content', window.location.href);
        } else {
            const meta = document.createElement('meta');
            meta.setAttribute('property', 'og:url');
            meta.content = window.location.href;
            document.head.appendChild(meta);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        if (!blog || !commentContent.trim()) return;

        try {
            setSubmittingComment(true);
            const response = await commentAPI.createComment(blog._id, {
                content: commentContent,
            });
            if (response.success) {
                setCommentContent('');
                fetchComments();
            }
        } catch (err: any) {
            console.error('Error submitting comment:', err);
            toast.error('Failed to submit comment. Please try again.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderContent = () => {
        if (!blog || !blog.sections || blog.sections.length === 0) {
            return (
                <div className="blog-post-content">
                    <p className="blog-post-paragraph">
                        No content available for this blog post.
                    </p>
                </div>
            );
        }

        return (
            <div className="blog-post-content">
                {blog.sections.map((section, index) => {
                    if (section.type === 'heading') {
                        return (
                            <div
                                key={section.id || index}
                                className="blog-post-subtitle"
                                dangerouslySetInnerHTML={{ __html: section.content || '' }}
                            />
                        );
                    } else if (section.type === 'image') {
                        return (
                            <div key={section.id || index} className="blog-post-secondary-image">
                                <img
                                    src={section.imageUrl || kayakImg}
                                    alt={section.imageAlt || blog.title}
                                    className="blog-post-image"
                                />
                            </div>
                        );
                    } else {
                        return (
                            <div
                                key={section.id || index}
                                className="blog-post-paragraph"
                                dangerouslySetInnerHTML={{ __html: section.content || '' }}
                            />
                        );
                    }
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="blog-post">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="blog-post">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>{error || 'Blog not found'}</p>
                    <Link to="/reviews" style={{ marginTop: '1rem', display: 'inline-block' }}>
                        Back to Reviews
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="blog-post">
            <div className="blog-post-grid">
                {/* Main Content Column */}
                <div className="blog-post-main">
                    {/* Header Section */}
                    <div className="blog-post-header">
                        <span className="blog-post-category">
                            📁 Category : {blog.category}
                        </span>
                        <h1 className="blog-post-title">
                            {blog.title}
                        </h1>

                        <div className="blog-post-meta">
                            <div className="blog-post-meta-left">
                                <div className="blog-post-meta-item">
                                    <Calendar size={16} />
                                    <span>{formatDate(blog.createdAt)}</span>
                                </div>
                                <div className="blog-post-meta-item">
                                    <MessageCircle size={16} />
                                    <span>Comments : {comments.length}</span>
                                </div>
                                <div className="blog-post-meta-item">
                                    <span>Views : {blog.views}</span>
                                </div>
                            </div>

                            <div className="blog-post-actions">
                                <button className="blog-post-share-btn">
                                    <Share2 size={16} />
                                    Share
                                </button>
                                <button className="blog-post-comment-btn">
                                    <MessageCircle size={16} />
                                    Comment
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Featured Image */}
                    {blog.coverImage && (
                        <div className="blog-post-featured-image">
                            <div className="blog-post-image-overlay"></div>
                            <img src={blog.coverImage} alt={blog.title} className="blog-post-image" />
                        </div>
                    )}

                    {/* Content */}
                    {renderContent()}

                    {/* Comments Section */}
                    <CommentsSection
                        blogId={blog._id}
                        comments={comments}
                        onCommentSubmit={handleSubmitComment}
                        commentContent={commentContent}
                        setCommentContent={setCommentContent}
                        submittingComment={submittingComment}
                        user={user}
                    />
                </div>

                {/* Sidebar Column */}
                <div className="blog-post-sidebar">
                    {/* Author Card */}
                    <div className="blog-author-card">
                        <div className="blog-author-info">
                            <div className="blog-author-avatar">
                                <img src={authorImg} alt={blog.author.name} className="blog-author-image" />
                            </div>
                            <div className="blog-author-details">
                                <div className="blog-author-header">
                                    <h3 className="blog-author-name">{blog.author.name}</h3>
                                    <span className="blog-author-posts">Author</span>
                                </div>
                                <button className="blog-author-follow">
                                    <span className="blog-author-plus">+</span> Follow
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                        <div className="blog-tags-card">
                            <div className="blog-card-header">
                                <div className="blog-card-indicator blog-card-indicator-red"></div>
                                <h3 className="blog-card-title">Tags</h3>
                            </div>
                            <div className="blog-tags-list">
                                {blog.tags.map((tag) => (
                                    <span key={tag} className="blog-tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
