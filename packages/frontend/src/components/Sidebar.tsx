import { Link, useSearchParams } from "react-router-dom";
import { useMainContext } from "../context/MainContext";
import "../styles/Sidebar.css";
import CategoryTree from "./CategoryTree";
import { useAuthContext } from "../context/AuthContext";

const Sidebar: React.FC = () => {
  const { user } = useAuthContext();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const {
    categories,
    profileImage,
    categoriesHierarchical,
    categoryMap,
    tags,
    recentPosts,
    stats,
  } = useMainContext();

  return (
    <div className="col-md-3">
      <div className="card mb-4">
        <div className="card-body text-center">
          <img
            src={profileImage}
            alt="Profile"
            className="rounded-circle mb-3"
            style={{ width: "100px", height: "100px", objectFit: "cover" }}
          />
          <h5 className="card-title">블로그 소개</h5>
          <p className="card-text text-muted">개발 관련 정보와 팁을 공유하는 블로그입니다.</p>
          {user ? (
            <p className="card-text">
              <strong>{user.username}</strong>남 환영합니다!
            </p>
          ) : (
            <Link to="/auth/login" className="btn btn-primary btn-me">
              로그인
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-folder me-2"></i>
            카테고리
          </h5>
        </div>
        <div className="card-body p-2">
          <ul className="category-tree">
            {categoriesHierarchical.length > 0 ? (
              <>
                <li className="category-item level-0">
                  <div className="category-header">
                    <span className="toggle-placeholder"></span>
                    <Link
                      to="/posts"
                      className={`category-link ${!selectedCategory ? "active" : ""}`}
                    >
                      <i className="bi bi-journals category-icon"></i>
                      전체 글<span className="count">({stats.posts.total})</span>
                    </Link>
                  </div>
                </li>
                <CategoryTree
                  categories={categoriesHierarchical}
                  categoryMap={categoryMap}
                  selectedCategory={selectedCategory}
                />
              </>
            ) : (
              <>
                <li className="category-item">
                  <div className="category-header">
                    <span className="toggle-placeholder"></span>
                    <a href="/posts" className="category-link active">
                      <i className="bi bi-journals category-icon"></i>
                      전체 글
                    </a>
                  </div>
                </li>
                {categories.map((cat) => {
                  const postCount = categoryMap[cat.id] || 0;
                  const isActive =
                    selectedCategory && selectedCategory.toString() === cat.id.toString();
                  return (
                    <li className="category-item" key={cat.id}>
                      <div className="category-header">
                        <span className="toggle-placeholder"></span>
                        <a
                          href={`/categories/${cat.id}`}
                          className={`category-link${isActive ? " active" : ""}`}
                        >
                          <i className="bi bi-folder category-icon"></i>
                          {cat.name}
                          {postCount > 0 && <span className="count">({postCount})</span>}
                        </a>
                      </div>
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-tags me-2"></i>
            태그 클라우드
          </h5>
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Link to={`/posts?tag=${tag.id}`} className="text-decoration-none" key={tag.id}>
                  <span className="badge bg-secondary fs-6">#{tag.name}</span>
                </Link>
              ))
            ) : (
              <p className="text-muted mb-0">등옥된 태그가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>
            최근 게시물
          </h5>
        </div>
        <div className="card-body p-0">
          <ul className="list-group list-group-flush">
            {recentPosts && recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <li className="list-group-item" key={post.id}>
                  <Link to={`/posts/${post.id}`} className="text-decoration-none">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            className="me-2"
                            alt="thumbnail"
                            style={{ width: "40px", height: "40px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="bg-light me-2 d-flex align-items-center justify-content-center"
                            style={{ width: "40px", height: "40px" }}
                          >
                            <i className="bi bi-file-text"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1 ms-2" style={{ minWidth: "0" }}>
                        <p className="mb-0 text-truncate">{post.title}</p>
                        <small className="text-muted">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="list-group-item">최근 게시물이 없습니다.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-graph-up me-2"></i>
            통계
          </h5>
        </div>
        <div className="card-body p-0">
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between">
              <span>오늘 방문자</span>
              <strong>{stats.visits.today.toString()}</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>총 방문자</span>
              <strong>{stats.visits.total.toString()}</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>총 게시물</span>
              <strong>{stats.posts.total}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
