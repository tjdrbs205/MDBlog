import { Request, Response } from "express";
import CategoryService from "./categories.service";

class CategoryController {
  private readonly categoryService: CategoryService;
  constructor() {
    this.categoryService = CategoryService.getInstance();
  }

  list = async (req: Request, res: Response) => {
    try {
      const categories = await this.categoryService.getHierarchyCategories();
      const allCategories = await this.categoryService.getAllCategories();
      res.json({ categories, allCategories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name, parent } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "카테고리 이름은 필수입니다." });
      }

      await this.categoryService.createCategory(req.body);
      res.status(201).json({ message: "카테고리 생성 성공" });
    } catch (error) {
      console.error("Error creating category:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { name, description, order, parent } = req.body;

      if (!id) {
        return res.status(400).json({
          message: "카테고리 ID는 필수입니다.",
        });
      }

      if (!name || !name.trim()) {
        res.status(400).json({
          message: "카테고리 이름은 필수입니다.",
        });
      }

      await this.categoryService.updateCategory({
        catagoryId: id,
        name,
        description,
        order,
        parent,
      });

      res.status(200).json({
        message: "카테고리 업데이트 성공",
      });
    } catch (error) {
      console.error("카테고리 업데이트 중 오류", error);
      return res.status(500).json({ message: "카테고리 업데이트 중 오류가 발생했습니다." });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.id;

      const { isDeletable, hasChildren, hasRelatePosts } =
        await this.categoryService.checkCategoryDeletable(categoryId);

      if (!isDeletable) {
        const errorMessage = hasChildren
          ? "하위 카테고리가 있어 삭제할 수 없습니다."
          : "게시물과 연관된 카테고리는 삭제할 수 없습니다.";

        return res.status(400).json({
          message: errorMessage,
        });
      }
      await this.categoryService.deleteCategory(categoryId);

      res.status(200).json({
        message: "카테고리 삭제 성공",
      });
    } catch (error) {
      console.error("카테고리 삭제 중 오류", error);
      return res.status(500).json({ message: "카테고리 삭제 중 오류가 발생했습니다." });
    }
  };
}

export { CategoryController };
