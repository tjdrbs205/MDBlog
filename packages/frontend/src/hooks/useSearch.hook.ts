import { IPost } from "@mdblog/shared/src/types/post.interface";
import useRequest from "./useRequest.hook";

function useSearch(params: SearchParams) {
  const { page, category, sort, q, tag } = params;

  const searchParams = new URLSearchParams();

  if (page) searchParams.set("page", String(page));
  if (category) searchParams.set("category", category);
  if (sort) searchParams.set("sort", sort);
  if (q) searchParams.set("q", q);
  if (tag) searchParams.set("tag", tag);

  const { data, error } = useRequest<IPost[]>(searchParams.toString());

  if (error) {
    console.error("Error fetching posts:", error);
    return null;
  }

  return data;
}

export default useSearch;
