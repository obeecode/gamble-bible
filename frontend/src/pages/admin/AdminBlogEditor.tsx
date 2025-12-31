import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Image as ImageIcon, X, Eye, GripVertical, Trash2, Type, Image as ImageIconType, AlignLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogAPI, categoryAPI, uploadAPI } from '../../services/api';

type ContentSectionType = 'text' | 'heading' | 'image';

interface ContentSection {
    id: string;
    type: ContentSectionType;
    content: string;
    imageUrl?: string;
    imageAlt?: string;
}

const AdminBlogEditor = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [sections, setSections] = useState<ContentSection[]>([]);
    const [coverImage, setCoverImage] = useState<string>('');
    const [seoDescription, setSeoDescription] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [isFeatured, setIsFeatured] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [uploadingSectionIds, setUploadingSectionIds] = useState<Set<string>>(new Set());

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryAPI.getCategories();
            if (response.success && response.data.categories) {
                return response.data.categories;
            }
            return [];
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const categories = categoriesData || [];

    const { data: blogData, isLoading: isLoadingBlog } = useQuery({
        queryKey: ['blog', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await blogAPI.getBlogById(id);
            if (response.success && response.data.blog) {
                return response.data.blog;
            }
            throw new Error('Failed to load blog');
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    });

    useEffect(() => {
        if (blogData) {
            setTitle(blogData.title || '');
            setCategory(blogData.category || '');
            setTags(blogData.tags || []);
            setSections(blogData.sections || []);
            setCoverImage(blogData.coverImage || '');
            setSeoDescription(blogData.seoDescription || '');
            setStatus(blogData.status || 'draft');
            setIsFeatured(blogData.isFeatured || false);
        }
    }, [blogData]);

    useEffect(() => {
        if (categories.length > 0 && !category && !isEditing) {
            setCategory(categories[0].name);
        }
    }, [categories, category, isEditing]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!title.trim()) {
                throw new Error('Please enter a title');
            }
            if (!category) {
                throw new Error('Please select a category');
            }

            const postData = {
                title,
                category,
                tags,
                sections,
                coverImage,
                seoDescription,
                status,
                isFeatured,
            };

            if (isEditing && id) {
                const response = await blogAPI.updateBlog(id, postData);
                if (!response.success) {
                    throw new Error(response.error || 'Failed to save blog');
                }
                return response;
            } else {
                const response = await blogAPI.createBlog(postData);
                if (!response.success) {
                    throw new Error(response.error || 'Failed to save blog');
                }
                return response;
            }
        },
        onSuccess: () => {
            const statusMessage = status === 'published'
                ? 'Blog published successfully!'
                : 'Blog saved as draft!';
            toast.success(statusMessage);
            queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
            queryClient.invalidateQueries({ queryKey: ['blog', id] });
            navigate('/admin/blogs');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to save blog');
        },
    });

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            if (!tags.includes(currentTag.trim())) {
                setTags([...tags, currentTag.trim()]);
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const addSection = (type: ContentSectionType) => {
        const newSection: ContentSection = {
            id: Date.now().toString(),
            type,
            content: '',
            ...(type === 'image' && { imageUrl: '', imageAlt: '' })
        };
        setSections([...sections, newSection]);
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(section => section.id !== id));
    };

    const updateSection = (id: string, updates: Partial<ContentSection>) => {
        setSections(sections.map(section =>
            section.id === id ? { ...section, ...updates } : section
        ));
    };

    const moveSection = (id: string, direction: 'up' | 'down') => {
        const index = sections.findIndex(s => s.id === id);
        if (index === -1) return;

        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= sections.length) return;

        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setSections(newSections);
    };

    const handleDragStart = (id: string) => {
        setDraggedSectionId(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedSectionId || draggedSectionId === targetId) return;

        const draggedIndex = sections.findIndex(s => s.id === draggedSectionId);
        const targetIndex = sections.findIndex(s => s.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newSections = [...sections];
        const [dragged] = newSections.splice(draggedIndex, 1);
        newSections.splice(targetIndex, 0, dragged);

        setSections(newSections);
    };

    const handleDragEnd = () => {
        setDraggedSectionId(null);
    };

    const toggleSectionCollapse = (sectionId: string) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const handleImageUpload = async (sectionId: string, file: File) => {
        setUploadingSectionIds(prev => new Set(prev).add(sectionId));
        try {
            const response = await uploadAPI.uploadImage(file);
            if (response.success) {
                updateSection(sectionId, { imageUrl: response.data.imageUrl });
            } else {
                toast.error('Failed to upload image');
            }
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploadingSectionIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(sectionId);
                return newSet;
            });
        }
    };

    const handleCoverImageUpload = async (file: File) => {
        setIsUploadingCover(true);
        try {
            const response = await uploadAPI.uploadImage(file);
            if (response.success) {
                setCoverImage(response.data.imageUrl);
            } else {
                toast.error('Failed to upload cover image');
            }
        } catch (error) {
            toast.error('Failed to upload cover image');
        } finally {
            setIsUploadingCover(false);
        }
    };

    const handleSave = () => {
        saveMutation.mutate();
    };

    const handleToggleStatus = () => {
        setStatus(status === 'published' ? 'draft' : 'published');
    };

    const renderPreview = () => {
        return (
            <div className="admin-preview-container">
                <div className="blog-post-header">
                    <span className="blog-post-category">
                        📁 Category : {category}
                    </span>
                    <h1 className="blog-post-title">{title || 'Untitled Post'}</h1>
                    <div className="blog-post-meta">
                        <div className="blog-post-meta-left">
                            <div className="blog-post-meta-item">
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {coverImage && (
                    <div className="blog-post-featured-image">
                        <div className="blog-post-image-overlay"></div>
                        <img src={coverImage} alt="Cover" className="blog-post-image" />
                    </div>
                )}

                <div className="blog-post-content">
                    {sections.map((section) => {
                        if (section.type === 'heading') {
                            return (
                                <div
                                    key={section.id}
                                    className="blog-post-subtitle"
                                    dangerouslySetInnerHTML={{ __html: section.content || '<h2>Heading</h2>' }}
                                />
                            );
                        }
                        if (section.type === 'image') {
                            return section.imageUrl ? (
                                <div key={section.id} className="blog-post-secondary-image">
                                    <img src={section.imageUrl} alt={section.imageAlt || ''} className="blog-post-image" />
                                </div>
                            ) : null;
                        }
                        return (
                            <div
                                key={section.id}
                                className="blog-post-paragraph"
                                dangerouslySetInnerHTML={{ __html: section.content || '<p>Empty paragraph</p>' }}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderEditor = () => {
        return (
            <div className="admin-editor-main">
                <div className="admin-editor-content">
                    <input
                        type="text"
                        placeholder="Post Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="admin-title-input"
                    />

                    <div className="admin-section-controls">
                        <button
                            onClick={() => addSection('heading')}
                            className="admin-add-section-btn"
                            title="Add Heading"
                        >
                            <Type size={18} />
                            <span>Heading</span>
                        </button>
                        <button
                            onClick={() => addSection('text')}
                            className="admin-add-section-btn"
                            title="Add Text"
                        >
                            <AlignLeft size={18} />
                            <span>Text</span>
                        </button>
                        <button
                            onClick={() => addSection('image')}
                            className="admin-add-section-btn"
                            title="Add Image"
                        >
                            <ImageIconType size={18} />
                            <span>Image</span>
                        </button>
                    </div>

                    {sections.length === 0 && (
                        <div className="admin-empty-sections">
                            <p>No sections yet. Add a section to start writing.</p>
                        </div>
                    )}

                    <div className="admin-sections-list">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                className={`admin-section-item ${collapsedSections.has(section.id) ? 'collapsed' : ''}`}
                                draggable
                                onDragStart={() => handleDragStart(section.id)}
                                onDragOver={(e) => handleDragOver(e, section.id)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="admin-section-header">
                                    <button
                                        onClick={() => toggleSectionCollapse(section.id)}
                                        className="admin-section-collapse-btn"
                                        title={collapsedSections.has(section.id) ? 'Expand' : 'Collapse'}
                                    >
                                        {collapsedSections.has(section.id) ? (
                                            <ChevronDown size={18} />
                                        ) : (
                                            <ChevronUp size={18} />
                                        )}
                                    </button>
                                    <div className="admin-section-drag">
                                        <GripVertical size={18} />
                                    </div>
                                    <span className="admin-section-type">
                                        {section.type === 'heading' && 'Heading'}
                                        {section.type === 'text' && 'Text'}
                                        {section.type === 'image' && 'Image'}
                                    </span>
                                    <div className="admin-section-actions">
                                        {index > 0 && (
                                            <button
                                                onClick={() => moveSection(section.id, 'up')}
                                                className="admin-section-move-btn"
                                                title="Move Up"
                                            >
                                                ↑
                                            </button>
                                        )}
                                        {index < sections.length - 1 && (
                                            <button
                                                onClick={() => moveSection(section.id, 'down')}
                                                className="admin-section-move-btn"
                                                title="Move Down"
                                            >
                                                ↓
                                            </button>
                                        )}
                                        <button
                                            onClick={() => removeSection(section.id)}
                                            className="admin-section-delete-btn"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className={`admin-section-content ${collapsedSections.has(section.id) ? 'collapsed' : ''}`}>
                                    {section.type === 'heading' && (
                                        <RichTextEditor
                                            key={section.id}
                                            content={section.content}
                                            placeholder="Enter heading..."
                                            onChange={(content) => updateSection(section.id, { content })}
                                            isHeading={true}
                                        />
                                    )}
                                    {section.type === 'text' && (
                                        <RichTextEditor
                                            key={section.id}
                                            content={section.content}
                                            placeholder="Write your content here..."
                                            onChange={(content) => updateSection(section.id, { content })}
                                            isHeading={false}
                                        />
                                    )}
                                    {section.type === 'image' && (
                                        <div className="admin-image-section">
                                            {section.imageUrl ? (
                                                <div className="admin-image-preview-wrapper">
                                                    <img src={section.imageUrl} alt={section.imageAlt} className="admin-image-preview" />
                                                    <button
                                                        onClick={() => updateSection(section.id, { imageUrl: '', imageAlt: '' })}
                                                        className="admin-image-remove-btn"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : uploadingSectionIds.has(section.id) ? (
                                                <div className="admin-image-upload-section" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                                                    <div className="admin-image-upload-label" style={{ cursor: 'wait' }}>
                                                        <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                        <span>Uploading...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="admin-image-upload-section">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        id={`image-upload-${section.id}`}
                                                        className="admin-image-file-input"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleImageUpload(section.id, file);
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`image-upload-${section.id}`} className="admin-image-upload-label">
                                                        <ImageIcon size={24} />
                                                        <span>Click to upload image</span>
                                                    </label>
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                placeholder="Image alt text..."
                                                value={section.imageAlt || ''}
                                                onChange={(e) => updateSection(section.id, { imageAlt: e.target.value })}
                                                className="admin-image-alt-input"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoadingBlog) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                gap: '1rem',
                color: '#9ca3af'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTopColor: '#9333ea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>Loading blog post...</p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-blog-editor">
            <div className="admin-editor-header">
                <Link to="/admin/blogs" className="admin-back-link">
                    <ArrowLeft size={20} />
                    <span>Back to Posts</span>
                </Link>
                <div className="admin-editor-actions">
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`admin-preview-btn ${isPreview ? 'active' : ''}`}
                    >
                        <Eye size={18} />
                        <span>{isPreview ? 'Edit' : 'Preview'}</span>
                    </button>
                    {isEditing && (
                        <button
                            onClick={handleToggleStatus}
                            className={`admin-status-toggle-btn ${status === 'published' ? 'published' : 'draft'}`}
                            disabled={saveMutation.isPending}
                            title={status === 'published' ? 'Change to Draft' : 'Publish'}
                        >
                            <span>{status === 'published' ? '📝 Unpublish' : '🚀 Publish'}</span>
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        className={`admin-save-btn ${status === 'published' ? 'admin-save-published' : 'admin-save-draft'}`}
                        disabled={saveMutation.isPending}
                    >
                        <Save size={18} />
                        <span>
                            {saveMutation.isPending
                                ? (status === 'published' ? 'Publishing...' : 'Saving...')
                                : (status === 'published' ? 'Save & Publish' : 'Save Draft')
                            }
                        </span>
                    </button>
                </div>
            </div>

            <div className="admin-editor-grid">
                {isPreview ? renderPreview() : renderEditor()}

                <div className="admin-editor-sidebar">
                    <div className="admin-sidebar-section">
                        <h3 className="admin-sidebar-title">Cover Image</h3>
                        {coverImage ? (
                            <div className="admin-cover-image-preview">
                                <img src={coverImage} alt="Cover" className="admin-cover-image" />
                                <button
                                    onClick={() => setCoverImage('')}
                                    className="admin-cover-image-remove"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : isUploadingCover ? (
                            <div className="admin-image-upload" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                                <div className="admin-image-upload-label-full" style={{ cursor: 'wait' }}>
                                    <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    <p className="admin-upload-text">Uploading...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="admin-image-upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="cover-image-upload"
                                    className="admin-image-file-input"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleCoverImageUpload(file);
                                        }
                                    }}
                                />
                                <label htmlFor="cover-image-upload" className="admin-image-upload-label-full">
                                    <ImageIcon className="admin-upload-icon-svg" size={24} />
                                    <p className="admin-upload-text">Click to upload or drag and drop</p>
                                    <p className="admin-upload-subtext">SVG, PNG, JPG or GIF (max. 3MB)</p>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="admin-sidebar-section admin-post-settings">
                        <div className="admin-form-group">
                            <label className="admin-form-label">
                                Status
                                <span className={`admin-status-indicator ${status === 'published' ? 'published' : 'draft'}`}>
                                    {status === 'published' ? '● Published' : '○ Draft'}
                                </span>
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                                className={`admin-form-select admin-status-select ${status === 'published' ? 'status-published' : 'status-draft'}`}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                            <p className="admin-form-help-text">
                                {status === 'published'
                                    ? 'This post is live and visible to readers'
                                    : 'This post is saved but not visible to readers'}
                            </p>
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="admin-form-select"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat: any) => (
                                    <option key={cat._id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">Tags</label>
                            <div className="admin-tags-list">
                                {tags.map((tag) => (
                                    <span key={tag} className="admin-tag">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="admin-tag-remove">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Add tags..."
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="admin-form-input"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">SEO Description</label>
                            <textarea
                                rows={4}
                                placeholder="Meta description for search engines..."
                                value={seoDescription}
                                onChange={(e) => setSeoDescription(e.target.value)}
                                className="admin-form-textarea"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="admin-checkbox"
                                />
                                <span className="admin-checkbox-text">Featured Blog</span>
                            </label>
                            <p className="admin-form-help-text">
                                Featured blogs will be highlighted on the homepage
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface RichTextEditorProps {
    content: string;
    placeholder: string;
    onChange: (content: string) => void;
    isHeading?: boolean;
}

const RichTextEditor = ({ content, placeholder, onChange, isHeading = false }: RichTextEditorProps) => {
    const contentRef = useRef<string>(content);
    const isUpdatingRef = useRef<boolean>(false);

    // Initialize contentRef with the initial content
    useEffect(() => {
        contentRef.current = content;
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: isHeading ? [2] : [1, 2, 3],
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            if (!isUpdatingRef.current) {
                const newContent = editor.getHTML();
                contentRef.current = newContent;
                onChange(newContent);
            }
        },
        editorProps: {
            attributes: {
                class: isHeading
                    ? 'admin-rich-editor admin-rich-editor-heading'
                    : 'admin-rich-editor admin-rich-editor-text',
            },
        },
    });

    useEffect(() => {
        if (editor && content !== contentRef.current && !isUpdatingRef.current) {
            isUpdatingRef.current = true;
            editor.commands.setContent(content);
            contentRef.current = content;
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 0);
        }
    }, [editor, content]);

    if (!editor) {
        return null;
    }

    return (
        <div className="admin-rich-editor-wrapper">
            {!isHeading && (
                <div className="admin-rich-editor-toolbar">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`admin-toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                        title="Bold"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`admin-toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
                        title="Italic"
                    >
                        <em>I</em>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`admin-toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`admin-toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                        title="Bullet List"
                    >
                        •
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`admin-toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                        title="Numbered List"
                    >
                        1.
                    </button>
                </div>
            )}
            <EditorContent editor={editor} />
        </div>
    );
};

export default AdminBlogEditor;