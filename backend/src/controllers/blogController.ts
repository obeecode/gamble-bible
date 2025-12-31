import { Response } from 'express';
import mongoose from 'mongoose';
import { Blog } from '../models/Blog';
import { BlogView } from '../models/BlogView';
import { asyncHandler } from '../utils';
import { AuthRequest } from '../middleware/auth';

export const createBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, category, tags, sections, coverImage, seoDescription, status, isFeatured } = req.body;

  if (!title || !category) {
    res.status(400).json({
      success: false,
      error: 'Title and category are required',
    });
    return;
  }

  const blog = await Blog.create({
    title,
    category,
    tags: tags || [],
    sections: sections || [],
    coverImage,
    seoDescription,
    status: status || 'draft',
    isFeatured: isFeatured || false,
    author: new mongoose.Types.ObjectId(req.user!.id),
  });

  await blog.populate('author', 'name email');

  res.status(201).json({
    success: true,
    data: { blog },
  });
});

export const getBlogs = asyncHandler(async (req: any, res: Response) => {
  const {
    status,
    category,
    search,
    isFeatured,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const query: any = {};

  if (!req.user) {
    query.status = 'published';
  } else if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === 'true' || isFeatured === true;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { title: { $regex: escapedSearch, $options: 'i' } },
      { seoDescription: { $regex: escapedSearch, $options: 'i' } },
      { category: { $regex: escapedSearch, $options: 'i' } },
      { tags: { $in: [new RegExp(escapedSearch, 'i')] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const blogs = await Blog.find(query)
    .select('-sections')
    .populate('author', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Blog.countDocuments(query);

  res.json({
    success: true,
    data: {
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getBlogBySlug = asyncHandler(async (req: any, res: Response) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug }).populate('author', 'name email');

  if (!blog) {
    res.status(404).json({
      success: false,
      error: 'Blog not found',
    });
    return;
  }

  const isAuthor = req.user && req.user.id === blog.author._id.toString();
  const isAdmin = req.user && req.user.role === 'admin';

  if (blog.status === 'published' || isAuthor || isAdmin) {
    if (blog.status === 'published' && !isAuthor && !isAdmin) {
      if (req.user && req.user.id) {
        try {
          const existingView = await BlogView.findOne({
            blog: blog._id,
            user: req.user.id,
          });

          if (!existingView) {
            await BlogView.create({
              blog: blog._id,
              user: req.user.id,
            });

            blog.views += 1;
            await blog.save();
          }
        } catch (error) {

          console.error('Error tracking blog view:', error);
        }
      } else {

      }
    }

    res.json({
      success: true,
      data: { blog },
    });
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }
});

export const getBlogById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const blog = await Blog.findById(id).populate('author', 'name email');

  if (!blog) {
    res.status(404).json({
      success: false,
      error: 'Blog not found',
    });
    return;
  }

  const isAuthor = req.user && req.user.id === blog.author._id.toString();
  const isAdmin = req.user && req.user.role === 'admin';

  if (blog.status === 'published' || isAuthor || isAdmin) {
    if (blog.status === 'published' && !isAuthor && !isAdmin) {
      if (req.user && req.user.id) {
        try {
          const existingView = await BlogView.findOne({
            blog: blog._id,
            user: req.user.id,
          });

          if (!existingView) {
            await BlogView.create({
              blog: blog._id,
              user: req.user.id,
            });
            blog.views += 1;
            await blog.save();
          }
        } catch (error) {
          console.error('Error tracking blog view:', error);
        }
      } else {
      }
    }

    res.json({
      success: true,
      data: { blog },
    });
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }
});

export const updateBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, category, tags, sections, coverImage, seoDescription, status, isFeatured } = req.body;

  const blog = await Blog.findById(id);

  if (!blog) {
    res.status(404).json({
      success: false,
      error: 'Blog not found',
    });
    return;
  }

  if (blog.author.toString() !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Not authorized to update this blog',
    });
    return;
  }

  if (title) blog.title = title;
  if (category) blog.category = category;
  if (tags !== undefined) blog.tags = tags;
  if (sections !== undefined) blog.sections = sections;
  if (coverImage !== undefined) blog.coverImage = coverImage;
  if (seoDescription !== undefined) blog.seoDescription = seoDescription;
  if (status) blog.status = status;
  if (isFeatured !== undefined) blog.isFeatured = isFeatured;

  await blog.save();
  await blog.populate('author', 'name email');

  res.json({
    success: true,
    data: { blog },
  });
});

export const deleteBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    res.status(404).json({
      success: false,
      error: 'Blog not found',
    });
    return;
  }

  if (blog.author.toString() !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Not authorized to delete this blog',
    });
    return;
  }

  await Blog.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Blog deleted successfully',
  });
});

export const publishBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    res.status(404).json({
      success: false,
      error: 'Blog not found',
    });
    return;
  }

  if (blog.author.toString() !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Not authorized to publish this blog',
    });
    return;
  }

  blog.status = 'published';
  await blog.save();
  await blog.populate('author', 'name email');

  res.json({
    success: true,
    data: { blog },
  });
});

export const unpublishBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    res.status(404).json({
      success: false,
      error: 'Blog not found',
    });
    return;
  }

  if (blog.author.toString() !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Not authorized to unpublish this blog',
    });
    return;
  }

  blog.status = 'draft';
  await blog.save();
  await blog.populate('author', 'name email');

  res.json({
    success: true,
    data: { blog },
  });
});

