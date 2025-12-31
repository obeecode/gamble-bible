import mongoose, { Schema, Document } from 'mongoose';

export interface IContentSection {
  id: string;
  type: 'text' | 'heading' | 'image';
  content: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  sections: IContentSection[];
  coverImage?: string;
  seoDescription?: string;
  status: 'draft' | 'published';
  isFeatured: boolean;
  author: mongoose.Types.ObjectId;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSectionSchema = new Schema<IContentSection>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'heading', 'image'],
      required: true,
    },
    content: { type: String, default: '' },
    imageUrl: { type: String },
    imageAlt: { type: String },
  },
  { _id: false }
);

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    sections: {
      type: [ContentSectionSchema],
      default: [],
    },
    coverImage: {
      type: String,
    },
    seoDescription: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

BlogSchema.pre<IBlog>('save', async function () {
  if (this.isModified('title') || !this.slug) {
    let baseSlug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    const BlogModel = this.constructor as mongoose.Model<IBlog>;
    while (await BlogModel.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
});

BlogSchema.index({ title: 'text', seoDescription: 'text' });
BlogSchema.index({ status: 1, createdAt: -1 });
BlogSchema.index({ category: 1, status: 1 });

export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);

