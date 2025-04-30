import { Request, Response } from "express";
import { CategoryService } from "./categories.service";

class CategoryController {
  private readonly categoryService: CategoryService;
  constructor() {
    this.categoryService = CategoryService.getInstance();
  }

  async list(req: Request, res: Response) {
    try {
      const categories = await this.categoryService.getHierarchyCategories();
      const allCategories = await this.categoryService.getAllCategories();
      return res.json({ categories, allCategories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, description, order, parentId } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "카테고리 이름은 필수입니다." });
      }
      if (!parentId || !parentId.trim()) {
        return res.status(400).json({ message: "부모 카테고리 ID는 필수입니다." });
      }

      //   await this.categoryService.create
    } catch (error) {
      console.error("Error creating category:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export { CategoryController };
