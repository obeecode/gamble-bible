import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
    content: string;
    blog: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    parentComment?: mongoose.Types.ObjectId;
    replies: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
    {
        content: {
            type: String,
            required: true,
            trim: true,
        },
        blog: {
            type: Schema.Types.ObjectId,
            ref: 'Blog',
            required: true,
            index: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
        replies: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Comment',
            },
        ],
    },
    {
        timestamps: true,
    }
);

CommentSchema.index({ blog: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);

