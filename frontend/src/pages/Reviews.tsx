import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { blogAPI, categoryAPI } from '../services/api';
import authorImg from '../assets/author_louis.png';

interface Blog {
    _id: string;
    title: string;
    slug: string;
    category: string;
    coverImage?: string;
    seoDescription?: string;
    isFeatured?: boolean;
    author: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    views: number;
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    image?: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
    'technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80',
    'lifestyle': 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80',
    'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80',
    'food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80',
    'business': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80',
    'health': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80',
    'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80',
    'entertainment': 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&q=80',
    'art': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80',
    'music': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80',
    'fashion': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80',
    'science': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80',
    'education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80',
    'all': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80',
    'casino': 'https://images.unsplash.com/photo-1518893063132-36e465be77b8?auto=format&fit=crop&q=80',
    'nsfw': 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80';

const getCategoryImageUrl = (categoryName: string, width: number = 320, height: number = 180): string => {
    const normalizedCategory = categoryName.toLowerCase();
    const imageUrl = CATEGORY_IMAGES[normalizedCategory] || DEFAULT_IMAGE;
    return `${imageUrl}&w=${width}&h=${height}`;
};

const Reviews = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryAPI.getCategories();
            if (response.success) {
                return response.data.categories as Category[];
            }
            throw new Error('Failed to fetch categories');
        },
    });

    const { data: blogsData, isLoading: blogsLoading } = useQuery({
        queryKey: ['blogs', selectedCategory],
        queryFn: async () => {
            const response = await blogAPI.getBlogs({
                status: 'published',
                category: selectedCategory || undefined,
                limit: 20,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            if (response.success) {
                return response.data.blogs as Blog[];
            }
            throw new Error('Failed to fetch blogs');
        },
    });

    const { data: featuredBlogsData, isLoading: featuredLoading } = useQuery({
        queryKey: ['featured-blogs', selectedCategory],
        queryFn: async () => {
            const response = await blogAPI.getBlogs({
                status: 'published',
                category: selectedCategory || undefined,
                isFeatured: true,
                limit: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            if (response.success) {
                return response.data.blogs as Blog[];
            }
            throw new Error('Failed to fetch featured blogs');
        },
    });

    const { data: latestBlogsData, isLoading: latestLoading } = useQuery({
        queryKey: ['latest-blogs', selectedCategory],
        queryFn: async () => {
            const response = await blogAPI.getBlogs({
                status: 'published',
                category: selectedCategory || undefined,
                limit: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            if (response.success) {
                return response.data.blogs as Blog[];
            }
            throw new Error('Failed to fetch latest blogs');
        },
    });

    const blogs = blogsData || [];
    const featuredBlogs = featuredBlogsData || [];
    const latestBlogs = latestBlogsData || [];
    const categories = categoriesData || [];
    const loading = categoriesLoading || blogsLoading || featuredLoading || latestLoading;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDescription = (blog: Blog) => {
        if (blog.seoDescription) return blog.seoDescription;
        return blog.seoDescription || 'Read more...';
    };

    const featuredSectionBlogs = blogs.slice(0, 2);
    const carouselBlogs = blogs.slice(2, 6).length > 0 ? blogs.slice(2, 6) : blogs.slice(2, 2 + Math.min(4, blogs.length - 2));
    const allPopularPosts = blogs.slice(6);
    const horizontalPosts = latestBlogs.slice(0, 4);
    const bottomFeaturedBlogs = featuredBlogs.slice(0, 4).length > 0 ? featuredBlogs.slice(0, 4) : featuredBlogs.slice(0, Math.min(4, featuredBlogs.length));

    const [carouselCardIndex, setCarouselCardIndex] = useState(0);
    const [bottomFeaturedIndex, setBottomFeaturedIndex] = useState(0);

    const [popularPostsPage, setPopularPostsPage] = useState(0);
    const postsPerPage = 8;
    const totalPages = Math.ceil(allPopularPosts.length / postsPerPage);
    const startIndex = popularPostsPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const popularPosts = allPopularPosts.slice(startIndex, endIndex);

    useEffect(() => {
        setPopularPostsPage(0);
        setBottomFeaturedIndex(0);
    }, [selectedCategory]);

    const handlePopularPostsPrev = () => {
        setPopularPostsPage((prev) => Math.max(0, prev - 1));
    };

    const handlePopularPostsNext = () => {
        setPopularPostsPage((prev) => Math.min(totalPages - 1, prev + 1));
    };

    useEffect(() => {
        if (carouselBlogs.length <= 1) return;
        const interval = setInterval(() => {
            setCarouselCardIndex((prev) => (prev + 1) % carouselBlogs.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [carouselBlogs.length]);

    useEffect(() => {
        if (bottomFeaturedBlogs.length <= 1) return;
        const interval = setInterval(() => {
            setBottomFeaturedIndex((prev) => (prev + 1) % bottomFeaturedBlogs.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [bottomFeaturedBlogs.length]);

    const handleBottomFeaturedPrev = () => {
        setBottomFeaturedIndex((prev) => (prev - 1 + bottomFeaturedBlogs.length) % bottomFeaturedBlogs.length);
    };

    const handleBottomFeaturedNext = () => {
        setBottomFeaturedIndex((prev) => (prev + 1) % bottomFeaturedBlogs.length);
    };

    if (loading) {
        return (
            <div className="reviews-page">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reviews-page">
            <h1 className="reviews-title">Reviews</h1>

            {/* Categories Scroll */}
            <div className="reviews-categories">
                <div
                    className={`reviews-category-item ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(null)}
                    style={{
                        cursor: 'pointer',
                        backgroundImage: `url(${getCategoryImageUrl('all', 320, 180)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <div className="reviews-category-overlay"></div>
                    <span className="reviews-category-name" style={{ color: 'white' }}>#All</span>
                </div>
                {categories.map((cat) => (
                    <div
                        key={cat._id}
                        className={`reviews-category-item ${selectedCategory === cat.name ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.name)}
                        style={{
                            cursor: 'pointer',
                            backgroundImage: `url(${cat.image || getCategoryImageUrl(cat.name, 320, 180)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        <div className="reviews-category-overlay"></div>
                        <span className="reviews-category-name" style={{ color: 'white' }}>
                            #{cat.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Featured Blog Posts Section */}
            {featuredSectionBlogs.length > 0 && (
                <div className="reviews-blog-posts-section">
                    {featuredSectionBlogs.slice(0, 2).map((blog) => (
                        <Link
                            key={blog._id}
                            to={`/blog/${blog.slug}`}
                            className="reviews-blog-post-card"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div
                                className="reviews-blog-post-image"
                                style={{
                                    backgroundImage: `url(${blog.coverImage || 'https://images.unsplash.com/photo-1764418659027-b1da026826ec?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw3fHx8ZW58MHx8fHx8'})`
                                }}
                            >
                                <div className="reviews-blog-post-overlay">
                                    <h3 className="reviews-blog-post-title">{blog.title}</h3>
                                    <p className="reviews-blog-post-description">
                                        {getDescription(blog).substring(0, 120)}...
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Third blog post with carousel */}
                    {carouselBlogs.length > 0 && (
                        <Link
                            to={`/blog/${carouselBlogs[carouselCardIndex]?.slug || ''}`}
                            className="reviews-blog-post-card reviews-blog-post-carousel"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div
                                className="reviews-blog-post-image"
                                style={{
                                    backgroundImage: `url(${carouselBlogs[carouselCardIndex]?.coverImage || 'https://images.unsplash.com/photo-1764418659027-b1da026826ec?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw3fHx8ZW58MHx8fHx8'})`
                                }}
                            >
                                <div className="reviews-blog-post-overlay">
                                    <h3 className="reviews-blog-post-title">
                                        {carouselBlogs[carouselCardIndex]?.title || ''}
                                    </h3>
                                    <p className="reviews-blog-post-description">
                                        {getDescription(carouselBlogs[carouselCardIndex] || blogs[0]).substring(0, 150)}...
                                    </p>
                                    {carouselBlogs.length > 1 && (
                                        <div className="reviews-blog-post-carousel-dots">
                                            {carouselBlogs.slice(0, 4).map((_, index) => (
                                                <div
                                                    key={index}
                                                    className={`reviews-blog-post-dot ${index === carouselCardIndex ? 'active' : ''}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            )}

            {/* Popular Posts Header */}
            {popularPosts.length > 0 && (
                <>
                    <div className="reviews-section-header">
                        <div className="reviews-section-title-group">
                            <div className="reviews-section-accent"></div>
                            <h2 className="reviews-section-title">Popular Posts</h2>
                        </div>
                        <div className="reviews-nav-buttons">
                            <button
                                className="reviews-nav-btn"
                                onClick={handlePopularPostsPrev}
                                disabled={popularPostsPage === 0}
                                style={{
                                    opacity: popularPostsPage === 0 ? 0.5 : 1,
                                    cursor: popularPostsPage === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                className="reviews-nav-btn"
                                onClick={handlePopularPostsNext}
                                disabled={popularPostsPage >= totalPages - 1}
                                style={{
                                    opacity: popularPostsPage >= totalPages - 1 ? 0.5 : 1,
                                    cursor: popularPostsPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="reviews-popular-grid">
                        {popularPosts.map((post) => (
                            <Link
                                key={post._id}
                                to={`/blog/${post.slug}`}
                                className="reviews-popular-card"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                {/* Image */}
                                <div className="reviews-popular-image-container">
                                    <img
                                        src={"https://images.unsplash.com/photo-1764767168158-9f05d34e3881?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxN3x8fGVufDB8fHx8fA%3D%3D"}
                                        alt={post.title}
                                        className="reviews-popular-image"
                                    />
                                </div>

                                {/* Content */}
                                <div className="reviews-popular-content">
                                    <span className="reviews-popular-category">
                                        {post.category}
                                    </span>
                                    <h3 className="reviews-popular-title">
                                        {post.title}
                                    </h3>
                                </div>

                                {/* Author Box */}
                                <div className="reviews-popular-author">
                                    <div className="reviews-author-info">
                                        <div className="reviews-author-avatar">
                                            <img src={authorImg} alt={post.author.name} className="reviews-author-img" />
                                        </div>
                                        <div className="reviews-author-details">
                                            <p className="reviews-author-name">{post.author.name}</p>
                                            <p className="reviews-author-date">{formatDate(post.createdAt)}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="reviews-bookmark-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Handle bookmark
                                        }}
                                    >
                                        <Bookmark size={18} />
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {horizontalPosts.length > 0 && (
                <div className="reviews-horizontal-section">
                    <div className="reviews-section-header">
                        <div className="reviews-section-title-group">
                            <div className="reviews-section-accent"></div>
                            <h2 className="reviews-section-title">Latest Posts</h2>
                        </div>
                        <button className="reviews-show-all-btn">
                            Show All <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="reviews-horizontal-grid">
                        {horizontalPosts.map((post) => (
                            <Link
                                key={post._id}
                                to={`/blog/${post.slug}`}
                                className="reviews-horizontal-card"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="reviews-horizontal-image">
                                    <img
                                        src={post.coverImage || 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=400'}
                                        alt={post.title}
                                        className="reviews-horizontal-img"
                                    />
                                </div>
                                <div className="reviews-horizontal-content">
                                    <div className="reviews-horizontal-text">
                                        <h3 className="reviews-horizontal-title">
                                            {post.title}
                                        </h3>
                                        <p className="reviews-horizontal-description">
                                            {getDescription(post).substring(0, 150)}...
                                        </p>
                                    </div>

                                    <div className="reviews-horizontal-author">
                                        <div className="reviews-horizontal-author-info">
                                            <div className="reviews-horizontal-author-avatar">
                                                <img src={authorImg} alt={post.author.name} className="reviews-horizontal-author-img" />
                                            </div>
                                            <div>
                                                <p className="reviews-horizontal-author-name">{post.author.name}</p>
                                                <p className="reviews-horizontal-author-date">{formatDate(post.createdAt)}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="reviews-horizontal-bookmark"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Handle bookmark
                                            }}
                                        >
                                            <Bookmark size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {bottomFeaturedBlogs.length > 0 && (
                <div className="reviews-featured-list-section">
                    <div className="reviews-section-header">
                        <div className="reviews-section-title-group">
                            <div className="reviews-section-accent"></div>
                            <h2 className="reviews-section-title">Featured</h2>
                        </div>
                        <button className="reviews-show-all-btn">
                            Show All <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="reviews-featured-list-grid">
                        <Link
                            to={`/blog/${bottomFeaturedBlogs[bottomFeaturedIndex]?.slug || ''}`}
                            className="reviews-large-featured"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <img
                                src={bottomFeaturedBlogs[bottomFeaturedIndex]?.coverImage || 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=800'}
                                alt={bottomFeaturedBlogs[bottomFeaturedIndex]?.title || ''}
                                className="reviews-large-featured-image"
                            />
                            {bottomFeaturedBlogs.length > 1 && (
                                <>
                                    <button
                                        className="reviews-large-nav-btn reviews-large-nav-left"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleBottomFeaturedPrev();
                                        }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        className="reviews-large-nav-btn reviews-large-nav-right"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleBottomFeaturedNext();
                                        }}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            {/* Content Overlay */}
                            <div className="reviews-large-featured-content">
                                <h2 className="reviews-large-featured-title">
                                    {bottomFeaturedBlogs[bottomFeaturedIndex]?.title || ''}
                                </h2>
                                <p className="reviews-large-featured-description">
                                    {getDescription(bottomFeaturedBlogs[bottomFeaturedIndex] || blogs[0]).substring(0, 200)}...
                                </p>
                                {bottomFeaturedBlogs.length > 1 && (
                                    <div className="reviews-large-featured-dots">
                                        {bottomFeaturedBlogs.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`reviews-large-dot ${index === bottomFeaturedIndex ? 'reviews-large-dot-active' : ''}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Link>

                        <div className="reviews-vertical-list">
                            {featuredBlogs.slice(1, 3).map((post) => (
                                <Link
                                    key={post._id}
                                    to={`/blog/${post.slug}`}
                                    className="reviews-vertical-card"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div className="reviews-vertical-image">
                                        <img
                                            src={post.coverImage || 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=400'}
                                            alt={post.title}
                                            className="reviews-vertical-img"
                                        />
                                    </div>
                                    <div className="reviews-vertical-content">
                                        <div className="reviews-vertical-text">
                                            <h3 className="reviews-vertical-title">
                                                {post.title}
                                            </h3>
                                            <p className="reviews-vertical-description">
                                                {getDescription(post).substring(0, 100)}...
                                            </p>
                                        </div>

                                        <div className="reviews-vertical-author">
                                            <div className="reviews-vertical-author-info">
                                                <div className="reviews-vertical-author-avatar">
                                                    <img src={authorImg} alt={post.author.name} className="reviews-vertical-author-img" />
                                                </div>
                                                <div>
                                                    <p className="reviews-vertical-author-name">{post.author.name}</p>
                                                    <p className="reviews-vertical-author-date">{formatDate(post.createdAt)}</p>
                                                </div>
                                            </div>
                                            <button
                                                className="reviews-vertical-bookmark"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // Handle bookmark
                                                }}
                                            >
                                                <Bookmark size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {blogs.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No blogs found. Check back later!</p>
                </div>
            )}
        </div>
    );
};

export default Reviews;
