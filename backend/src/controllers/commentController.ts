import { Response } from 'express';
import mongoose from 'mongoose';
import { Comment } from '../models/Comment';
import { Blog } from '../models/Blog';
import { asyncHandler } from '../utils';
import { AuthRequest } from '../middleware/auth';

export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { blogId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content || !content.trim()) {
        res.status(400).json({
            success: false,
            error: 'Comment content is required',
        });
        return;
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
        res.status(404).json({
            success: false,
            error: 'Blog not found',
        });
        return;
    }

    if (blog.status !== 'published') {
        res.status(403).json({
            success: false,
            error: 'Cannot comment on unpublished blog',
        });
        return;
    }

    const commentData: any = {
        content: content.trim(),
        blog: new mongoose.Types.ObjectId(blogId),
        author: new mongoose.Types.ObjectId(req.user!.id),
        replies: [],
    };

    if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
            res.status(404).json({
                success: false,
                error: 'Parent comment not found',
            });
            return;
        }

        if (parentComment.blog.toString() !== blogId) {
            res.status(400).json({
                success: false,
                error: 'Parent comment does not belong to this blog',
            });
            return;
        }

        commentData.parentComment = new mongoose.Types.ObjectId(parentCommentId);
    }

    const comment = await Comment.create(commentData) as any;

    if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
            $push: { replies: comment._id },
        });
    }

    const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'name email')
        .populate('parentComment', 'content author');

    res.status(201).json({
        success: true,
        data: { comment: populatedComment },
    });
});

export const getCommentsByBlog = asyncHandler(async (req: any, res: Response) => {
    const { blogId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const blog = await Blog.findById(blogId);
    if (!blog) {
        res.status(404).json({
            success: false,
            error: 'Blog not found',
        });
        return;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const topLevelComments = await Comment.find({
        blog: blogId,
        parentComment: null,
    })
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const commentsWithReplies = await Promise.all(
        topLevelComments.map(async (comment) => {
            const replies = await Comment.find({
                parentComment: comment._id,
            })
                .populate('author', 'name email')
                .sort({ createdAt: 1 })
                .limit(50);

            return {
                ...comment.toObject(),
                replies,
            };
        })
    );

    const total = await Comment.countDocuments({
        blog: blogId,
        parentComment: null,
    });

    res.json({
        success: true,
        data: {
            comments: commentsWithReplies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        },
    });
});

export const getCommentById = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    const comment = await Comment.findById(id)
        .populate('author', 'name email')
        .populate('parentComment', 'content author');

    if (!comment) {
        res.status(404).json({
            success: false,
            error: 'Comment not found',
        });
        return;
    }

    const replies = await Comment.find({
        parentComment: comment._id,
    })
        .populate('author', 'name email')
        .sort({ createdAt: 1 })
        .exec();

    res.json({
        success: true,
        data: {
            comment: {
                ...comment.toObject(),
                replies,
            },
        },
    });
});

export const updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        res.status(400).json({
            success: false,
            error: 'Comment content is required',
        });
        return;
    }

    const comment = await Comment.findById(id);

    if (!comment) {
        res.status(404).json({
            success: false,
            error: 'Comment not found',
        });
        return;
    }

    if (comment.author.toString() !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Not authorized to update this comment',
        });
        return;
    }

    comment.content = content.trim();
    await comment.save();
    await comment.populate('author', 'name email');

    res.json({
        success: true,
        data: { comment },
    });
});

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
        res.status(404).json({
            success: false,
            error: 'Comment not found',
        });
        return;
    }

    if (comment.author.toString() !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Not authorized to delete this comment',
        });
        return;
    }

    if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, {
            $pull: { replies: comment._id },
        });
    }

    await Comment.deleteMany({ parentComment: comment._id });
    await Comment.findByIdAndDelete(id);

    res.json({
        success: true,
        message: 'Comment deleted successfully',
    });
});

export const getReplies = asyncHandler(async (req: any, res: Response) => {
    const { commentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        res.status(404).json({
            success: false,
            error: 'Comment not found',
        });
        return;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const replies = await Comment.find({
        parentComment: commentId,
    })
        .populate('author', 'name email')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Comment.countDocuments({
        parentComment: commentId,
    });

    res.json({
        success: true,
        data: {
            replies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        },
    });
});

