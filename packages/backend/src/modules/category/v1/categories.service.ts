import { ICategory, ICategoryWithChildren } from "@mdblog/shared/src/types/categories.interface";
import { CategoryModel, ICategoryDocument } from "../model/categories.model";
import { PostModel } from "../../post/model/post.model";

class CategoryService {
  private static instance: CategoryService;
  constructor() {}

  // 싱글톤 패턴
  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // 모든 카테고리
  async getAllCategories(options: Record<string, any> = {}): Promise<ICategory[]> {
    const { sort = { order: 1, name: 1 } } = options;
    return (await CategoryModel.find().sort(sort)).map((cat) => {
      return cat.plainCategory;
    });
  }

  // 카테고리 계층
  async getHierarchyCategories(): Promise<ICategoryWithChildren[]> {
    return await CategoryModel.getCategoryHierarchy();
  }

  // 카테고리별 게시물 수
  async getCategoryPostCounts(): Promise<Record<string, number>> {
    const categoryPostCounts = await PostModel.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const categoryMap: Record<string, number> = {};
    categoryPostCounts.forEach((cat) => {
      if (cat._id) {
        categoryMap[cat._id.toString()] = cat.count;
      }
    });

    return categoryMap;
  }

  // 특정 카테고리 조회 서비스
  async getCategoryById(categoryId: string): Promise<ICategory> {
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      const error = new Error("카테고리를 찾을 수 없습니다.");
      throw error;
    }
    return category.plainCategory;
  }

  //하위 카테고리 ID 목록 조회 서비스
  async getDescendantCategoryIds(categoryId: string): Promise<string[]> {
    // 모든 카테고리 조회
    const allCategories = (await CategoryModel.find()).map((cat) => {
      return cat.plainCategory;
    });

    // 재귀적으로 하위 카테고리 찾기
    const findDescendants = (parentId: string): string[] => {
      // any 타입을 사용하여 타입 오류를 해결
      const directChildren: ICategory[] = allCategories.filter(
        (cat) => cat.parent && cat.parent.toString() === parentId
      );

      // 직접 any 타입으로 처리하여 _id에 접근
      let descendants = directChildren.map((child) => child.id.toString());

      // 각 직계 자식의 자손들도 추가
      directChildren.forEach((child: any) => {
        const childDescendants = findDescendants(child._id.toString());
        descendants = [...descendants, ...childDescendants];
      });

      return descendants;
    };

    return findDescendants(categoryId);
  }

  // 카테고리 생성
  async createCategory(categoryData: {
    name: string;
    description?: string | "";
    order: number;
    parent: string | null;
  }): Promise<ICategory> {
    const { name, description, order, parent } = categoryData;

    const existingCategory = await CategoryModel.findOne({ name });
    if (existingCategory) {
      const error = new Error("이미 존재하는 카테고리 입니다.");
      throw error;
    }

    const newCategory = await CategoryModel.create({
      name,
      description: description || "",
      order,
      parent: parent || null,
    });

    return newCategory.plainCategory;
  }

  async updateCategory(updateData: {
    catagoryId: string;
    name: string;
    description?: string | "";
    order: number;
    parent: string | null;
  }): Promise<ICategory> {
    const { catagoryId, name, description, order, parent } = updateData;

    const category = await CategoryModel.findById(catagoryId).lean<ICategory>();
    if (!category) {
      const error = new Error("카테고리를 찾을 수 없습니다.");
      throw error;
    }

    if (parent) {
      if (parent.toString() === catagoryId) {
        const error = new Error("부모 카테고리는 자기 자신이 될 수 없습니다.");
        throw error;
      }

      const descendants = await this.getDescendantCategoryIds(catagoryId);
      if (descendants.some((id) => id.toString() === parent.toString())) {
        const error = new Error("부모 카테고리는 자식 카테고리가 될 수 없습니다.");
        throw error;
      }
    }

    if (name && name !== category.name) {
      const existingCategory = await CategoryModel.findOne({ name }).lean();
      if (existingCategory && existingCategory._id.toString() !== catagoryId) {
        const error = new Error("이미 존재하는 카테고리 입니다.");
        throw error;
      }
    }

    category.name = name;
    category.description = description || "";
    category.order = order;
    category.parent = parent ? category.parent : null;

    const updateCategory = await CategoryModel.findByIdAndUpdate(catagoryId, category, { new: true });

    if (!updateCategory) {
      const error = new Error("카테고리 업데이트에 실패했습니다.");
      throw error;
    }

    return updateCategory.plainCategory;
  }

  async checkCategoryDeletable(categoryId: string) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      const error = new Error("카테고리를 찾을 수 없습니다.");
      throw error;
    }

    const hasChildren = await CategoryModel.exists({ parent: categoryId });

    const hasRelatePosts = await PostModel.exists({ category: categoryId });

    return {
      isDeletable: !hasChildren && !hasRelatePosts,
      hasChildren,
      hasRelatePosts,
      category,
    };
  }

  async deleteCategory(categoryId: string) {
    const { isDeletable, hasChildren, hasRelatePosts, category } = await this.checkCategoryDeletable(categoryId);
    if (!isDeletable) {
      const error = new Error(
        hasChildren
          ? "하위 카테고리 있어 삭제할 수 없습니다."
          : "이 카테고리를 사용하는 게시물이 있어 삭제할 수 없습니다"
      );
      throw error;
    }

    const deletedCategory = await CategoryModel.findByIdAndDelete(categoryId);
    if (!deletedCategory) {
      const error = new Error("카테고리 삭제에 실패했습니다.");
      throw error;
    }
    return deletedCategory.plainCategory;
  }
}

export { CategoryService };
