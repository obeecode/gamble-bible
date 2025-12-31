import { Reply, Calendar, MessageCircle } from 'lucide-react';
import authorImg from '../assets/author_louis.png';

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

interface CommentsSectionProps {
    blogId: string;
    comments: Comment[];
    onCommentSubmit: (e: React.FormEvent) => void;
    commentContent: string;
    setCommentContent: (content: string) => void;
    submittingComment: boolean;
    user: any;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
    comments,
    onCommentSubmit,
    commentContent,
    setCommentContent,
    submittingComment,
    user,
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderComment = (comment: Comment, isNested: boolean = false) => {
        if (isNested) {
            return (
                <div key={comment._id} className="comment-nested">
                    <div className="comment-nested-header">
                        <div className="comment-nested-author">
                            <div className="comment-nested-avatar">
                                <img
                                    src={authorImg}
                                    alt={comment.author.name}
                                    className="comment-nested-avatar-image"
                                />
                            </div>
                            <div className="comment-nested-author-info">
                                <h4 className="comment-nested-author-name">{comment.author.name}</h4>
                                <div className="comment-nested-date">
                                    <Calendar size={10} />
                                    <span>{formatDate(comment.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="comment-nested-text">{comment.content}</p>
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="comments-nested">
                            {comment.replies.map((reply) => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div key={comment._id} className="comment-main">
                <div className="comment-main-header">
                    <div className="comment-author">
                        <div className="comment-avatar">
                            <img
                                src={authorImg}
                                alt={comment.author.name}
                                className="comment-avatar-image"
                            />
                        </div>
                        <div className="comment-author-info">
                            <h4 className="comment-author-name">{comment.author.name}</h4>
                            <div className="comment-date">
                                <Calendar size={12} />
                                <span>{formatDate(comment.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <button className="comment-reply-btn">
                        <Reply size={14} />
                        Reply
                    </button>
                </div>
                <p className="comment-text">{comment.content}</p>
                {comment.replies && comment.replies.length > 0 && (
                    <div className="comments-nested">
                        {comment.replies.map((reply) => renderComment(reply, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="comments-section">
            {/* Comments Header */}
            <div className="comments-header">
                <div className="comments-indicator"></div>
                <h3 className="comments-title">Comments ({comments.length})</h3>
            </div>

            {/* Comments List */}
            {comments.length > 0 ? (
                <div>
                    {comments.map((comment) => renderComment(comment))}
                </div>
            ) : (
                <p style={{ padding: '1rem', color: '#666' }}>No comments yet. Be the first to comment!</p>
            )}

            {/* Add Comment Section */}
            <div className="comment-add">
                <div className="comment-add-header">
                    <div className="comments-indicator"></div>
                    <h3 className="comment-add-title">Add A Comment</h3>
                </div>

                {user ? (
                    <form onSubmit={onCommentSubmit} className="comment-add-form">
                        <div className="comment-add-input-container">
                            <textarea
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder="Write your comment here..."
                                className="comment-add-input"
                                rows={4}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="comment-add-btn"
                            disabled={submittingComment || !commentContent.trim()}
                        >
                            <MessageCircle size={16} />
                            {submittingComment ? 'Sending...' : 'Send Comment'}
                        </button>
                    </form>
                ) : (
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                        <p>Please <a href="/login" style={{ color: '#007bff' }}>login</a> to comment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentsSection;
