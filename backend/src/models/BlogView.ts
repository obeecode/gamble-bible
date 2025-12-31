import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogView extends Document {
  blog: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  viewedAt: Date;
}

const BlogViewSchema = new Schema<IBlogView>(
  {
    blog: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure one view per user per blog
BlogViewSchema.index({ blog: 1, user: 1 }, { unique: true });

export const BlogView = mongoose.model<IBlogView>('BlogView', BlogViewSchema);
