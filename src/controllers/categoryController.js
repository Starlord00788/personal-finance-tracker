const CategoryService = require('../services/categoryService');
const { validationResult } = require('express-validator');

const categoryService = new CategoryService();

class CategoryController {
  async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const category = await categoryService.createCategory(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getCategories(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { type } = req.query;
      const categories = await categoryService.getUserCategories(req.user.id, type);
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getCategoryById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const category = await categoryService.getCategoryById(req.params.id, req.user.id);
      
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      const statusCode = error.message === 'Category not found' ? 404 : 
                        error.message === 'Access denied' ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const category = await categoryService.updateCategory(
        req.params.id,
        req.user.id,
        req.body
      );
      
      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      const statusCode = error.message === 'Category not found' ? 404 : 
                        error.message === 'Access denied' ? 403 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      await categoryService.deleteCategory(req.params.id, req.user.id);
      
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      const statusCode = error.message === 'Category not found' ? 404 : 
                        error.message === 'Access denied' ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async initializeDefaults(req, res) {
    try {
      const categories = await categoryService.initializeDefaultCategories(req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Default categories initialized successfully',
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new CategoryController();