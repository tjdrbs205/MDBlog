import { ICategory } from "./categories.interface";

interface IComment {
  author: string;
  content: string;
  createdAt: Date | string;
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
  comments: IComment[];
  likes: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface IPostDetail {
  post: IPost;
  relatedPosts: {
    id: string;
    title: string;
    publishedAt: Date | string;
  };
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

interface IGetPostsResponseWithCategory extends Omit<IGetPostsResponse, "totalPosts"> {
  totalPosts: number;
  category: ICategory;
}

export {
  IComment,
  IPost,
  IPostDetail,
  ICreatePostDto,
  IUpdatePostDto,
  PagenationInfo,
  IGetPostsResponse,
  IGetPostsResponseWithCategory,
};
