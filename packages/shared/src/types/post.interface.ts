interface IComment {
  author: string;
  content: string;
  createdAt: Date;
}

interface IPost {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage: string;
  view: number;
  status: string;
  isPublic: boolean;
  publishedAt: Date;
  comments: IComment[];
  likes: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
interface IPostResponseDto extends IPost {}

export { IComment, IPost, ICreatePostDto, IUpdatePostDto, IPostResponseDto };
