import { IComment, IPost, IPostPlain } from "./post.interface";
import { IReadOnlyUser, IUser } from "./user.interface";

interface IDashboardData {
  users: {
    total: number;
    recent: IReadOnlyUser[];
  };
  posts: {
    total: number;
    recent: IPostPlain[];
    mostVisited: IPostPlain[];
  };
  categories: {
    total: number;
  };
  tags: {
    total: number;
  };
  comments: {
    recent: IComment[];
  };
  visits: {
    today: number;
    total: number;
    totalPageViews: number;
    totalUniqueVisitors: number;
    active: number;
  };
  counts: {
    posts: number;
    users: number;
    categories: number;
    tags: number;
  };
}

export { IDashboardData };
