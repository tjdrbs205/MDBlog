import {
  ICreatePostDto,
  IGetPostsResponse,
  IGetPostsResponseWithCategory,
  IPost,
} from "@mdblog/shared/src/types/post.interface";

import { TagModel } from "../../tag/model/tag.model";
import { PostModel } from "../model/post.model";
import { CategoryModel } from "../../category/model/categories.model";

import CategoryService from "../../category/v1/categories.service";
import {
  deleteImageFromCloudinary,
  deleteImagesFromContent,
  extractCloudinaryImagesFromContent,
  extractPublicIdFromUrl,
} from "../../../common/utils/cloudinary.util";

class PostService {
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

  // 게시물 전체 조회
  async getPosts(
    filter: Record<string, any>,
    options: Record<string, any>
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
        .populate("tags", "name"),

      PostModel.countDocuments(filter),
    ]);

    if (!posts) {
      throw new Error("게시물을 찾을 수 없습니다.");
    }

    const plainPosts: IPost[] = posts.map((post) => {
      return post.plainPost;
    });

    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: plainPosts,
      totalPages,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getPostById(postId: string) {
    const post = await PostModel.findById(postId)
      .populate("author", "username")
      .populate("category", "name")
      .populate("tags", "name")
      .populate({
        path: "comments.author",
        select: "username profileImage",
      });

    if (!post) {
      const error = new Error("게시물을 찾을 수 없습니다.");
      throw error;
    }

    return post;
  }

  async getRelatedPosts(tagIds: string[], postId: string, limit: number = 3) {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }

    const posts = await PostModel.find({
      tags: { $in: tagIds },
      _id: { $ne: postId },
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("author", "username")
      .populate("category", "name");

    const list = posts.map((post) => {
      return {
        id: post._id?.toString(),
        title: post.title,
        publishedAt: post.createdAt?.toString(),
      };
    });

    return list;
  }

  async getSidebarData() {
    const [categories, tags, recentPosts] = await Promise.all([
      CategoryModel.find().sort({ order: 1 }),
      TagModel.find().sort({ name: 1 }),
      PostModel.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title createdAt featuredImage"),
    ]);

    const categoryPostCounts = await PostModel.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const categoryMap: any = {};
    categoryPostCounts.forEach((cat) => {
      if (cat._id) {
        categoryMap[cat._id] = cat.count;
      }
    });

    return {
      categories,
      tags,
      recentPosts,
      categoryMap,
    };
  }

  async createPost(postData: ICreatePostDto): Promise<IPost> {
    const { title, content, author, category, tags, isPublic, status } = postData;
    const tagIds = await this.processTagsInput(tags);

    const newPost = await PostModel.create({
      title,
      content,
      author,
      category: category || null,
      tags: tagIds,
      isPublic: isPublic === true,
      status: status || "published",
    });

    return newPost.plainPost;
  }

  async updatepost(postId: string, updateData: Record<string, any>) {
    const { title, content, category, tags, isPublic, status } = updateData;

    const post = await PostModel.findById(postId);

    if (!post) {
      const error = new Error("게시물을 찾을 수 없습니다.");
      throw error;
    }

    if (post.content && content && post.content !== content) {
      try {
        const oldImageUrls = extractCloudinaryImagesFromContent(post.content);
        const newImageUrls = extractCloudinaryImagesFromContent(content);

        const deletedImageUrls = oldImageUrls.filter((url) => !newImageUrls.includes(url));

        if (deletedImageUrls.length > 0) {
          console.log(`게시물 ID ${postId} 수정 - 삭제된 이미지 ${deletedImageUrls.length}개 발견`);

          for (const url of deletedImageUrls) {
            const publicId = await extractPublicIdFromUrl(url, "blog/content");
            if (publicId) {
              try {
                await deleteImageFromCloudinary(publicId);
                console.log("게시물 수정 중 사용하지 않는 이미지 삭제 성공:", publicId);
              } catch (error) {
                console.error("게시물 수정 중 이미지 삭제 실패:", publicId, error);
              }
            }
          }
        }
      } catch (error) {
        console.error("게시물 수정 중 이미지 처리 오류:", error);
      }
    }

    const tagIds = await this.processTagsInput(tags);

    post.title = title;
    post.content = content;
    post.category = category || null;
    post.tags = tagIds;
    post.isPublic = isPublic === "true" || isPublic === true;
    post.status = status || "published";
    post.updatedAt = new Date();

    await post.save();
    return post.plainPost;
  }

  async deletePost(postId: string) {
    const post = await PostModel.findById(postId);
    if (!post) {
      const error = new Error("게시물을 찾을 수 없습니다.");
      throw error;
    }

    if (post.content) {
      try {
        console.log(`게시물 ID $${postId} 삭제 - 이미지 삭제 시작`);
        const deleteResult = await deleteImagesFromContent(post.content, "blog/content");
        console.log(`게시물 삭제 - 총 ${deleteResult.length}개 이미지 처리 완료`);
      } catch (error) {
        console.error("게시물 삭제 중 오류:", error);
      }
    }
    const result = await PostModel.findByIdAndDelete(postId);
    return result?.plainPost;
  }

  async incrementView(postId: string) {
    await PostModel.findByIdAndUpdate(postId, { $inc: { view: 1 } });
  }

  async addComment(postId: string, userId: string, content: string) {
    const post = await PostModel.findById(postId);

    if (!post) {
      const error = new Error("게시물을 찾을 수 없습니다.");
      throw error;
    }

    post.comments.push({
      author: userId,
      content,
      createdAt: new Date(),
    });

    await post.save();
    return post.plainPost;
  }

  async deleteComment(postId: string, commentId: string) {
    const post = await PostModel.findById(postId);

    if (!post) {
      const error = new Error("게시물을 찾을 수 없습니다.");
      throw error;
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      const error = new Error("댓글을 찾을 수 없습니다.");
      throw error;
    }

    post.comments.pull(commentId);
    await post.save();

    return post.plainPost;
  }

  async getPopularPosts(filter: Record<string, any>, options: Record<string, any>) {
    options.sort = { view: -1 };
    return await this.getPosts(filter, options);
  }

  async getArchiveData() {
    const archiveData = await PostModel.aggregate([
      { $match: { isPublic: true } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          posts: { $push: { _id: "$_id", title: "title", createdAt: "$createdAt" } },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    const archiveByYear: any = {};
    archiveData.forEach((item) => {
      const year = item._id.year;
      const month = item._id.month;

      if (!archiveByYear[year]) {
        archiveByYear[year] = {};
      }

      archiveByYear[year].push({
        month,
        count: item.count,
        posts: item.posts.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      });
    });
    return { archiveByYear };
  }

  async getPostsByYearMonth(year: string, month: string | null = null) {
    const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1);
    const endDate = new Date(parseInt(year), month ? parseInt(month) : 12, 0);

    const posts = await PostModel.find({
      isPublic: true,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .populate("author", "username")
      .populate("category", "name")
      .populate("tags", "name");

    const plainPosts = posts.map((post) => {
      return post.plainPost;
    });

    return plainPosts;
  }

  async getUserPostCount(userId: string) {
    if (!userId) {
      return 0;
    }
    return await PostModel.countDocuments({ author: userId });
  }

  private async processTagsInput(tags: string | string[] | undefined) {
    let tagIds: string[] = [];
    if (!tags) {
      return tagIds;
    }

    if (Array.isArray(tags)) {
      tagIds = tags;
    } else if (typeof tags === "string" && tags.includes(",")) {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      for (const tagName of tagArray) {
        let tag = await TagModel.findOne({ name: tagName.toLowerCase() });
        if (!tag) {
          tag = await TagModel.create({ name: tagName.toLowerCase() });
        }
        tagIds.push(tag.plainTag.id);
      }
    } else {
      tagIds = [tags];
    }

    return tagIds;
  }

  async getPostsByTag(tagId: string, options: Record<string, any>): Promise<IGetPostsResponse> {
    const tag = await TagModel.findById(tagId);
    if (!tag) {
      const error = new Error("태그를 찾을 수 없습니다.");
      throw error;
    }

    const filter = { tags: tagId, isPublic: true };

    return await this.getPosts(filter, options);
  }

  async getPostsWithCategory(
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
      const descendantIds = await this.categoryService.getDescendantCategoryIds(categoryId);

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
      totalPosts,
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

export default PostService;
