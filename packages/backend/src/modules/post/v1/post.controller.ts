import { Request, Response } from "express";
import PostService from "./post.service";
import { SortOrder } from "mongoose";

class PostController {
  private postService: PostService;

  constructor() {
    this.postService = PostService.getInstance();
  }

  getPosts = async (req: Request, res: Response) => {
    const filter = { isPublic: true };

    let sortOptions: Record<string, SortOrder> = { createdAt: -1 };

    const { posts, totalPosts, pagination } = await this.postService.getPosts(filter, {
      sort: sortOptions,
      page: 1,
      limit: 10,
    });

    res.status(200).json({
      data: {
        posts,
        totalPosts,
        pagination,
      },
    });
  };
}

export default PostController;
