const CategoryRepository = require('../repositories/categoryRepository');
const { v4: uuidv4 } = require('uuid');

class CategoryService {
  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async createCategory(userId, categoryData) {
    const { name, type, color, icon } = categoryData;

    const exists = await this.categoryRepository.nameExists(userId, name.trim());
    if (exists) {
      throw new Error('Category with this name already exists');
    }

    const category = await this.categoryRepository.create({
      id: uuidv4(),
      user_id: userId,
      name: name.trim(),
      type,
      color: color || '#6366f1',
      icon: icon || 'folder'
    });

    return category;
  }

  async getUserCategories(userId, type = null) {
    return await this.categoryRepository.findByUser(userId, type);
  }

  async getCategoryById(id, userId) {
    const category = await this.categoryRepository.findById(id);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    if (category.user_id !== userId) {
      throw new Error('Access denied');
    }
    
    return category;
  }

  async updateCategory(id, userId, updateData) {
    const category = await this.getCategoryById(id, userId);
    
    if (updateData.name) {
      const exists = await this.categoryRepository.nameExists(
        userId, 
        updateData.name.trim(), 
        id
      );
      if (exists) {
        throw new Error('Category with this name already exists');
      }
    }

    const updated = await this.categoryRepository.updateById(id, {
      ...updateData,
      name: updateData.name ? updateData.name.trim() : undefined
    });

    return updated;
  }

  async deleteCategory(id, userId) {
    const category = await this.getCategoryById(id, userId);
    return await this.categoryRepository.deleteById(id);
  }

  async initializeDefaultCategories(userId) {
    const incomeCategories = this.categoryRepository.getDefaultCategories('income');
    const expenseCategories = this.categoryRepository.getDefaultCategories('expense');
    
    const created = [];
    
    for (const cat of incomeCategories) {
      try {
        const category = await this.createCategory(userId, {
          name: cat.name,
          type: 'income',
          color: cat.color,
          icon: cat.icon
        });
        created.push(category);
      } catch (error) {
        continue;
      }
    }
    
    for (const cat of expenseCategories) {
      try {
        const category = await this.createCategory(userId, {
          name: cat.name,
          type: 'expense',
          color: cat.color,
          icon: cat.icon
        });
        created.push(category);
      } catch (error) {
        continue;
      }
    }
    
    return created;
  }
}

module.exports = CategoryService;