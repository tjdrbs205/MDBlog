import React, { createContext, ReactNode, useEffect } from "react";
import useRequest from "../hooks/useRequest.hook";
import { ICategory, ICategoryWithChildren } from "@mdblog/shared/src/types/categories.interface";
import { ITag } from "@mdblog/shared/src/types/tag.interface";
import { IPost } from "@mdblog/shared/src/types/post.interface";

interface MainContextType {
  siteDescription: string;
  aboutBlog: string;
  contactGithub: string;
  profileImage: string;
  aboutBlogHtml: string;
  categories: ICategory[];
  categoriesHierarchical: ICategoryWithChildren[];
  tags: ITag[];
  recentPosts: IPost[];
  categoryMap: Record<string, number>;
  postStats: number;
  stats: {
    posts: {
      total: number;
    };
    visits: {
      today: number;
      total: number;
      totalPageViews: number;
      totalUniqueVisitors: number;
      active: number;
    };
  };

  refreshData: () => Promise<void>;
}

interface MainContextRequest extends Omit<MainContextType, "refreshData"> {}

interface MainProviderProps {
  children: ReactNode;
}

const MainContext = createContext<MainContextType>({
  siteDescription: "",
  aboutBlog: "",
  contactGithub: "",
  profileImage: "",
  aboutBlogHtml: "",
  categories: [],
  categoriesHierarchical: [],
  tags: [],
  recentPosts: [],
  categoryMap: {},
  postStats: 0,
  stats: {
    posts: {
      total: 0,
    },
    visits: {
      today: 0,
      total: 0,
      totalPageViews: 0,
      totalUniqueVisitors: 0,
      active: 0,
    },
  },
  refreshData: async () => {},
});

export const MainProvider: React.FC<MainProviderProps> = ({ children }) => {
  const { data, error, loading, execute } = useRequest<MainContextRequest>("/init", {
    manual: true,
  });

  const refreshData = async () => {
    await execute();
  };

  if (error) {
    console.error("Error loading initial data:", error);
    refreshData();
  }

  const value: MainContextType = {
    siteDescription: data?.siteDescription || "This is a sample site description.",
    aboutBlog: data?.aboutBlog || "This is a sample about section.",
    aboutBlogHtml: data?.aboutBlogHtml || "<p>This is a sample about section.</p>",
    contactGithub: data?.contactGithub || "",
    profileImage: data?.profileImage || "",
    categories: data?.categories || [],
    categoriesHierarchical: data?.categoriesHierarchical || [],
    tags: data?.tags || [],
    recentPosts: data?.recentPosts || [],
    categoryMap: data?.categoryMap || {},
    postStats: data?.postStats || 0,
    stats: data?.stats || {
      posts: {
        total: 0,
      },
      visits: {
        today: 0,
        total: 0,
        totalPageViews: 0,
        totalUniqueVisitors: 0,
        active: 0,
      },
    },
    refreshData,
  };

  useEffect(() => {
    execute();
  }, []);

  return (
    <MainContext.Provider value={value}>
      {loading ? <div>loading...</div> : children}
    </MainContext.Provider>
  );
};

export const useMainContext = (): MainContextType => {
  const context = React.useContext(MainContext);

  if (context === undefined) {
    throw new Error("useMainContext must be used within a MainProvider");
  }

  return context;
};
