import React, { useEffect, useState } from "react";
import { IPost, PagenationInfo } from "@mdblog/shared/src/types/post.interface";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchComponent from "../../components/SearchComponent";
import { useSearchContext } from "../../context/SearchContext";

const PostListPage: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 상태
  const { searchTerm } = useSearchContext();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState<PagenationInfo>({
    page: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // 검색/필터 파라미터
  const page = Number(searchParams.get("page") || 1);
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${apiUrl}/posts?page=${page}&category=${category}&sort=${sort}&q=${q}&tag=${tag}`
        );
        const data = await res.json();
        if (data.success) {
          setPosts(data.body.posts);
          setPagination(data.body.pagination);
          setCategories(data.body.categories || []);
          setTags(data.body.tags || []);
        }
      } catch (error) {
        console.error("게시물 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, category, sort, q, tag]);

  return (
    <div>
      <h2>게시글 목록</h2>

      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div className="mb-4">
          <h5>태그</h5>
          <div className="d-flex flex-wrap gap-2">
            {tags.map((t: any) => (
              <button
                key={t.id}
                className={`badge btn ${tag === t.id ? "bg-primary" : "bg-secondary"}`}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), tag: t.id })}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 게시글 목록 */}
      {loading ? (
        <p>로딩 중...</p>
      ) : posts.length > 0 ? (
        <div className="post-list">
          {posts.map((post) => (
            <div key={post.id} className="card mb-3 post-card">
              <div className="card-body">
                <h5 className="card-title">
                  <a
                    href={`/posts/${post.id}`}
                    className="text-decoration-none"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/posts/${post.id}`);
                    }}
                  >
                    {post.title}
                  </a>
                </h5>
                <p className="post-meta">
                  {post.author && (
                    <span className="me-2">작성자: {(post.author as any).username}</span>
                  )}
                  {post.category && (
                    <span className="me-2">카테고리: {(post.category as any).name}</span>
                  )}
                  <span className="me-2">
                    작성일: {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <span>조회수: {post.view || 0}</span>
                </p>
                {post.excerpt && <p>{post.excerpt}</p>}
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag) => (
                      <a
                        key={(tag as any).id}
                        href={`?tag=${(tag as any).id}`}
                        className="badge bg-secondary text-decoration-none me-1"
                      >
                        #{(tag as any).name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">게시글이 없습니다.</div>
      )}

      <SearchComponent className="inner" />
      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination">
            <li className={`page-item ${!pagination.hasPrev && "disabled"}`}>
              <button
                className="page-link"
                onClick={() =>
                  setSearchParams({
                    ...Object.fromEntries(searchParams),
                    page: `${pagination.page - 1}`,
                  })
                }
                disabled={!pagination.hasPrev}
              >
                이전
              </button>
            </li>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((i) => (
              <li key={i} className={`page-item ${pagination.page === i ? "active" : ""}`}>
                <button
                  className="page-link"
                  onClick={() =>
                    setSearchParams({ ...Object.fromEntries(searchParams), page: `${i}` })
                  }
                >
                  {i}
                </button>
              </li>
            ))}
            <li className={`page-item ${!pagination.hasNext && "disabled"}`}>
              <button
                className="page-link"
                onClick={() =>
                  setSearchParams({
                    ...Object.fromEntries(searchParams),
                    page: `${pagination.page + 1}`,
                  })
                }
                disabled={!pagination.hasNext}
              >
                다음
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default PostListPage;
