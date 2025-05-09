import { SortOrder } from "mongoose";

import { IPostDocument, PostModel } from "../model/post.model";
import {
  IGetPostsResponse,
  IGetPostsResponseWithCategory,
  IPost,
} from "@mdblog/shared/src/types/post.interface";
import { TagModel } from "../../tag/model/tag.model";

import "../../user/model/user.model";
import { CategoryModel } from "../../category/model/categories.model";
import CategoryService from "../../category/v1/categories.service";

export class PostService {
  private static instance: PostService;

  private readonly categoryService: CategoryService;

  private constructor() {
    this.categoryService = CategoryService.getInstance();
  }

  // 싱글톤 패턴
  public static getInstance(): PostService {
    if (!PostService.instance) {
      PostService.instance = new PostService();
    }
    return PostService.instance;
  }

  async getTest(): Promise<IPostDocument[]> {
    const posts = await PostModel.find().lean();
    return posts;
  }

  // 게시물 생성
  async createPost(postData: Partial<IPostDocument>): Promise<IPostDocument> {
    const post = new PostModel(postData);
    return await post.save();
  }

  // 게시물 전체 조회
  async getPosts(
    filter: { isPublic: boolean },
    options: {
      sort: Record<string, SortOrder>;
      page: number;
      limit: number;
    }
  ): Promise<IGetPostsResponse> {
    const { sort = { createdAt: -1 }, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([
      PostModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("author", "username")
        .populate("category", "name")
        .populate("tags", "name")
        .lean(false),
      PostModel.countDocuments(filter),
    ]);

    if (!posts) {
      throw new Error("게시물을 찾을 수 없습니다.");
    }

    const plainPosts: IPost[] = posts.map((post: IPostDocument) => {
      return post.toJSON() as IPost;
    });

    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: plainPosts,
      totalPosts,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getTagPosts(
    tagId: string,
    options: {
      sort: Record<string, SortOrder>;
      page: number;
      limit: number;
    }
  ): Promise<IGetPostsResponse> {
    // 태그 존재 확인
    const tag = await TagModel.findById(tagId);
    if (!tag) {
      const error = new Error("태그를 찾을 수 없습니다.");
      throw error;
    }

    // 필터 설정
    const filter = { tags: tagId, isPublic: true };

    return await this.getPosts(filter, options);
  }

  async getCategoryPosts(
    categoryId: string,
    options: Record<string, any>
  ): Promise<IGetPostsResponseWithCategory> {
    const { sort = { createdAt: -1 }, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      const error = new Error("카테고리를 찾을 수 없습니다.");
      throw error;
    }

    let filter: Record<string, any> = {
      category: categoryId,
      isPublic: true,
    };

    if (options.includeSubcategories) {
      const descendantIds = await this.categoryService.getDescendantCategoryIds(
        categoryId
      );

      filter = {
        category: { $in: [categoryId, ...descendantIds] },
        isPublic: true,
      };
    }
    const [posts, totalPosts] = await Promise.all([
      PostModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("author", "username")
        .populate("category", "name")
        .populate("tags", "name"),
      PostModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: posts.map((post) => post.plainPost),
      totalPages,
      category: category.plainCategory,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}
