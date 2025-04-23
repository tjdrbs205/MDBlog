import { SortOrder } from "mongoose";
import { IPostDocument, PostModel } from "../model/post.model";
import { IGetPostsResponse, IPost } from "@mdblog/shared/src/types/post.interface";

export class PostService {
  /**
   * 게시물 목록 조회
   * @param {Object} filter - 필터 조건
   * @param {Object} options - 페이지네이션, 정렬 등 옵션
   * @returns {Promise<{IGetPostsResponse}>} 게시물 목록 및 페이지네이션 정보
   */
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
        .lean(),
      PostModel.countDocuments(filter),
    ]);

    if (!posts) {
      throw new Error("게시물을 찾을 수 없습니다.");
    }

    const plainPosts: IPost[] = posts.map((post: any) => {
      return {
        ...post,
        id: post._id?.toString() || "",
        author: post.author ? post.author.toString() : "",
        category: post.category ? post.category.toString() : "",
        tags: Array.isArray(post.tags) ? post.tags.map((tag: any) => (tag ? tag.toString() : "")) : [],
      };
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

  async createPost(postData: Partial<IPostDocument>): Promise<IPostDocument> {
    const post = new PostModel(postData);
    return await post.save();
  }
}
