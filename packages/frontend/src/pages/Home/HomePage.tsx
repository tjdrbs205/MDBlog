import { IGetPostsResponse, IPost } from "@mdblog/shared/src/types/post.interface";
import { Link, useNavigate } from "react-router-dom";
import { useMainContext } from "../../context/MainContext";
import useRequest from "../../hooks/useRequest.hook";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { recentPosts } = useMainContext();
  const { data, loading, error } = useRequest<IGetPostsResponse>("/posts/popular");

  const handleButtonClick = (url: string) => {
    navigate(url);
  };

  if (loading) return <div>loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <>
      {/* 화면 배너 */}
      <div className="jumbotron bg-light p-4 mb-4 rounded">
        <h1 className="display-4">환영합니다!</h1>
        <p className="lead">개발 관련 지식과 경험을 공유하는 블로그입니다.</p>
        <hr className="my-4" />
        <p>최신 개발 트렌드, 프로그래밍 팁, 프로젝트 경험 등을 나누고 있습니다.</p>
        <a
          className="btn btn-primary btn-lg"
          href="/about"
          role="button"
          onClick={(e) => {
            e.preventDefault();
            handleButtonClick("/about");
          }}
        >
          더 알아보기
        </a>
      </div>

      {/* 인기 게시물 */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>
            <i className="bi bi-star-fill text-warning me-2"></i>
            인기 게시물
          </h2>
          <Link to="/posts/popular" className="btn btn-outline-primary">
            전체 보기
          </Link>
        </div>
        <div className="row">
          {data?.posts.slice(0, 4).map((popularPost) => (
            <div key={popularPost.id} className="col-md-3 mb-4">
              <div className="card h-100 shadow-sm">
                {popularPost.featuredImage ? (
                  <img
                    src={popularPost.featuredImage}
                    className="card-img-top"
                    alt={popularPost.title}
                    style={{ height: "160px", objectFit: "cover" }}
                  />
                ) : (
                  <div className="bg-light text-center py-5">
                    <i className="bi bi-file-text display-4"></i>
                  </div>
                )}
                <div className="card-body">
                  <h5 className="card-title" style={{ height: "50px", overflow: "hidden" }}>
                    {popularPost.title}
                  </h5>
                  <p className="card-text text-muted small">
                    <i className="bi bi-person"></i>
                    {(popularPost.author as any).username || "익명"} | <i className="bi bi-eye"></i>
                    {popularPost.view} | <i className="bi bi-folder"></i>{" "}
                    {(popularPost.category as any).name || "미분류"}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      {new Date(popularPost.createdAt).toLocaleDateString()}
                    </small>
                    <Link
                      to={`/posts/${popularPost.id}`}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      읽기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>
            <i className="bi bi-clock-history text-secondary me-2"></i>
            최신 게시물
          </h2>
          <Link to="/posts" className="btn btn-outline-primary">
            전체 보기
          </Link>
        </div>
        <div className="row">
          {recentPosts.map((post: IPost) => (
            <div key={post.id} className="col-md-3 mb-4">
              <div className="card h-100 shadow-sm">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    className="card-img-top"
                    alt={post.title}
                    style={{ height: "160px", objectFit: "cover" }}
                  />
                ) : (
                  <div className="bg-light text-center py-5">
                    <i className="bi bi-file-text display-4"></i>
                  </div>
                )}
                <div className="card-body">
                  <h5 className="card-title" style={{ height: "50px", overflow: "hidden" }}>
                    {post.title}
                  </h5>
                  <p className="card-text text-muted small">
                    <i className="bi bi-person"></i>
                    {(post.author as any).username || "익명"} | <i className="bi bi-eye"></i>
                    {post.view} | <i className="bi bi-folder"></i>{" "}
                    {(post.category as any).name || "미분류"}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </small>
                    <Link to={`/posts/${post.id}`} className="btn btn-sm btn-outline-secondary">
                      읽기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
