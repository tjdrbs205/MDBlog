import { ICategory } from "./categories.interface";
import { IReadOnlyUser } from "./user.interface";

interface IComment {
  author: string;
  content: string;
  createdAt: Date | string;
}

interface ICommentPlain extends Omit<IComment, "author"> {
  id: string;
  author: {
    id: string;
    username: string;
  };
}

interface IPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  category?: string;
  tags?: string[];
  featuredImage: string;
  view: number;
  status: string;
  isPublic: boolean;
  publishedAt: Date;
  comments: ICommentPlain[];
  likes: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface IPostPlain extends Omit<IPost, "author" | "category" | "tags"> {
  author: {
    id: string;
    username: string;
  };
  category?: {
    id: string;
    name: string;
  };
  tags?: {
    id: string;
    name: string;
  }[];
}

interface IPostDetail {
  post: IPostPlain;
  relatedPosts: {
    id: string;
    title: string;
    publishedAt: Date | string;
  }[];
}

interface ICreatePostDto {
  title: string;
  content: string;
  author: string;
  category?: string;
  tags?: string[];
  isPublic: boolean;
  status: string;
}

interface IUpdatePostDto {
  title: string;
  content: string;
  author: string;
  category?: string;
  tags?: string[];
  isPublic: boolean;
  status: string;
}

interface PagenationInfo {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface IGetPostsResponse {
  posts: IPost[];
  totalPosts: number;
  pagination: PagenationInfo;
}

interface IGetPostsResponseWithPagination {
  users: IReadOnlyUser[];
  totalUsers: number;
  pagination: PagenationInfo;
}

interface IGetPostsResponseWithCategory extends Omit<IGetPostsResponse, "totalPosts"> {
  totalPosts: number;
  category: ICategory;
}

export {
  IComment,
  IPost,
  IPostPlain,
  IPostDetail,
  ICreatePostDto,
  IUpdatePostDto,
  PagenationInfo,
  IGetPostsResponse,
  IGetPostsResponseWithPagination,
  IGetPostsResponseWithCategory,
};
