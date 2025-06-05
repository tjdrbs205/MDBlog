import { Request, Response } from "express";
import PostService from "./post.service";
import { SortOrder } from "mongoose";
import {
  moveImagesToPostFolder,
  uploadImageToCloudinary,
} from "../../../common/utils/cloudinary.util";
import { IPost } from "@mdblog/shared/src/types/post.interface";

class PostController {
  private readonly postService: PostService;
  constructor() {
    this.postService = PostService.getInstance();
  }

  listPosts = async (req: Request, res: Response) => {
    try {
      const { tag, category, q, sort = "newest" } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const filter: Record<string, any> = { isPublic: true };

      if (category) {
        filter.category = category;
      }

      if (tag) {
        filter.tags = {
          $in: [tag],
        };
      }

      if (q) {
        filter.$or = [
          { title: new RegExp(q as string, "i") },
          { content: new RegExp(q as string, "i") },
        ];
      }

      let sortOptions: Record<string, SortOrder> = { createdAt: -1 };

      if (sort === "oldest") {
        sortOptions = { createdAt: 1 };
      } else if (sort === "title") {
        sortOptions = { title: -1 };
      } else if (sort === "views") {
        sortOptions = { view: -1 };
      }

      const { posts, totalPosts, pagination } = category
        ? await this.postService.getPostsByCategory(filter, {
            sort: sortOptions,
            page,
            limit,
            includeSubcategories: true,
          })
        : await this.postService.getPosts(filter, {
            sort: sortOptions,
            page,
            limit,
          });

      res.status(200).json({
        posts,
        totalPosts,
        pagination,
      });
    } catch (error) {
      console.error("[PostController] 게시물 조회 중 오류:", error);
      res.status(500).json({
        message: "게시물 조회 중 오류가 발생했습니다.",
      });
    }
  };

  listPopularPosts = async (req: Request, res: Response) => {
    try {
      const { category, tag, q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;

      const filter: Record<string, any> = { isPublic: true };

      if (category) {
        filter.category = category;
      }

      if (tag) {
        filter.tags = {
          $in: [tag],
        };
      }

      if (q) {
        filter.$or = [
          { title: new RegExp(q as string, "i") },
          { content: new RegExp(q as string, "i") },
        ];
      }

      const { posts, totalPosts, pagination } = await this.postService.getPopularPosts(filter, {
        page,
        limit,
      });

      res.status(200).json({
        posts,
        totalPosts,
        pagination,
      });
    } catch (error) {
      console.error("[PostController] 인기 게시물 조회 중 오류:", error);
      res.status(500).json({
        message: "인기 게시물 조회 중 오류가 발생했습니다.",
      });
    }
  };

  listPostsByTag = async (req: Request, res: Response) => {
    try {
      const tagId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;

      const { posts, totalPosts, pagination } = await this.postService.getPostsByTag(tagId, {
        page,
        limit,
      });

      res.status(200).json({
        posts,
        totalPosts,
        pagination,
      });
    } catch (error) {
      console.error("[PostController] 태그별 게시물 조회 중 오류:", error);
      res.status(500).json({
        message: "태그별 게시물 조회 중 오류가 발생했습니다.",
      });
    }
  };

  listPostsCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;

      const filter: Record<string, any> = { isPublic: true };
      if (categoryId) {
        filter.category = categoryId;
      }

      const { posts, totalPosts, pagination } = await this.postService.getPostsByCategory(filter, {
        page,
        limit,
      });

      res.status(200).json({
        posts,
        totalPosts,
        pagination,
      });
    } catch (error) {
      console.error("[PostController] 카테고리별 게시물 조회 중 오류:", error);
      res.status(500).json({
        message: "카테고리별 게시물 조회 중 오류가 발생했습니다.",
      });
    }
  };

  listPostsByAuthor = async (req: Request, res: Response) => {
    try {
      const fileter = { author: req.user?.id };

      const { posts, totalPosts, pagination } = await this.postService.getPosts(fileter, {
        sort: { createdAt: -1 },
      });

      res.status(200).json({
        posts,
        totalPosts,
        pagination,
      });
    } catch (error) {
      console.error("[PostController] 작성자별 게시물 조회 중 오류:", error);
      res.status(500).json({
        message: "작성자별 게시물 조회 중 오류가 발생했습니다.",
      });
    }
  };

  createPost = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "로그인 후 사용 가능합니다.",
        });
      }

      const { title, content, category, tags, isPublic, status } = req.body;

      const post = await this.postService.createPost({
        title,
        content,
        author: req.user.id,
        category,
        tags,
        isPublic,
        status,
      });

      const updatedContent = await moveImagesToPostFolder(post.content, post.id);

      if (updatedContent === content) {
        return res.status(201).json({
          post,
        });
      }
      post.content = updatedContent;
      const newPost = await this.postService.updatepost(post.id, post);

      res.status(201).json({
        post: newPost,
      });
    } catch (error) {
      console.error("[PostController] 게시물 생성 중 오류:", error);
      res.status(500).json({
        message: "게시물 생성 중 오류가 발생했습니다.",
      });
    }
  };

  detailPost = async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;

      const post = await this.postService.getPostById(postId);

      const postView = req.cookies[`post_${postId}`];
      if (!postView) {
        res.cookie(`post_${postId}`, "1", {
          maxAge: 1000 * 60 * 60 * 24, // 1일
          httpOnly: true,
        });
        await this.postService.incrementView(postId);
      }

      let relatedPosts: {
        id: string | undefined;
        title: string;
        publishedAt: string | undefined;
      }[] = [];
      if (post.tags && post.tags.length > 0) {
        relatedPosts = await this.postService.getRelatedPosts(post.tags, postId);
      }

      res.status(200).json({
        post,
        relatedPosts,
      });
    } catch (error) {
      console.error("[PostController] 게시물 상세 조회 중 오류:", error);
      res.status(500).json({
        message: "게시물 상세 조회 중 오류가 발생했습니다.",
      });
    }
  };

  updatePost = async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const body = req.body;

      const post = await this.postService.getPostById(postId);

      if (!post) {
        return res.status(404).json({ message: "게시물이 존재하지 않습니다." });
      }

      const updatedContent = await moveImagesToPostFolder(body.content, post.id);

      if (updatedContent !== body.content) {
        body.content = updatedContent;
      }

      const newPost = await this.postService.updatepost(postId, req.body);

      res.status(200).json({
        newPost,
      });
    } catch (error) {
      console.error("[PostController] 게시물 수정 중 오류:", error);
      res.status(500).json({
        message: "게시물 수정 중 오류가 발생했습니다.",
      });
    }
  };

  deletePost = async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;

      const post = await this.postService.getPostById(postId);

      if (!post) {
        return res.status(404).json({ message: "게시물이 존재하지 않습니다." });
      }

      await this.postService.deletePost(postId);

      res.status(200).json({
        message: "게시물이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("[PostController] 게시물 삭제 중 오류:", error);
      res.status(500).json({
        message: "게시물 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  addComment = async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      const postId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "로그인 후 사용 가능합니다.",
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          message: "댓글 내용을 입력해주세요.",
        });
      }

      await this.postService.addComment(postId, userId, content);
      res.status(201).json({
        message: "댓글이 등록되었습니다.",
      });
    } catch (error) {
      console.error("[PostController] 댓글 등록 중 오류:", error);
      res.status(500).json({
        message: "댓글 등록 중 오류가 발생했습니다.",
      });
    }
  };

  deleteComment = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { commentId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "로그인 후 사용 가능합니다.",
        });
      }

      const post = await this.postService.getPostById(postId);

      const comment = post.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({
          message: "댓글이 존재하지 않습니다.",
        });
      }

      await this.postService.deleteComment(postId, commentId);

      res.status(200).json({
        message: "댓글이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("[PostController] 댓글 삭제 중 오류:", error);
      res.status(500).json({
        message: "댓글 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  getArchive = async (req: Request, res: Response) => {
    try {
      // const { year, month } = req.query;
      const year = typeof req.query.year === "string" ? req.query.year : null;
      const month = typeof req.query.month === "string" ? req.query.month : null;

      const { archiveByYear } = await this.postService.getArchiveData();

      let filteredPosts: IPost[] = [];
      if (year) {
        filteredPosts = await this.postService.getPostsByYearMonth(year, month);
      }

      return res.status(200).json({
        archiveByYear,
        filteredPosts,
      });
    } catch (error) {
      console.error("[PostController] 아카이브 조회 중 오류:", error);
      res.status(500).json({
        message: "아카이브 조회 중 오류가 발생했습니다.",
      });
    }
  };

  uploadPostImage = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "이미지 파일이 필요합니다.",
        });
      }

      const result = await uploadImageToCloudinary(req.file.buffer, "blog/content/temp");

      res.json({
        url: result.secure_url,
      });
    } catch (error) {
      console.error("[PostController][CKEdutor]이미지 업로드 중 오류:", error);
      res.status(500).json({
        message: "이미지 업로드 중 오류가 발생했습니다.",
      });
    }
  };
}

export default PostController;
