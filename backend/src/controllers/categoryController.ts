import { Response } from 'express';
import { Category } from '../models/Category';
import { asyncHandler } from '../utils';
import { AuthRequest } from '../middleware/auth';

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, image } = req.body;

  if (!name) {
    res.status(400).json({
      success: false,
      error: 'Category name is required',
    });
    return;
  }

  const category = await Category.create({
    name,
    description,
    image,
  });

  res.status(201).json({
    success: true,
    data: { category },
  });
});

export const getCategories = asyncHandler(async (req: any, res: Response) => {
  const categories = await Category.find().sort({ name: 1 });

  res.json({
    success: true,
    data: { categories },
  });
});

export const getCategoryBySlug = asyncHandler(async (req: any, res: Response) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug });

  if (!category) {
    res.status(404).json({
      success: false,
      error: 'Category not found',
    });
    return;
  }

  res.json({
    success: true,
    data: { category },
  });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, image } = req.body;

  const category = await Category.findById(id);

  if (!category) {
    res.status(404).json({
      success: false,
      error: 'Category not found',
    });
    return;
  }

  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;

  await category.save();

  res.json({
    success: true,
    data: { category },
  });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    res.status(404).json({
      success: false,
      error: 'Category not found',
    });
    return;
  }

  await Category.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});
