import { IPostDetail } from "@mdblog/shared/src/types/post.interface";
import { Link, useNavigate, useParams } from "react-router-dom";
import useRequest from "../../hooks/useRequest.hook";
import { useAuthContext } from "../../context/AuthContext";
import parse from "html-react-parser";

const PostDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { user, accessToken } = useAuthContext();
  const { data, loading } = useRequest<IPostDetail>("/posts/" + id);
  const { execute: deletePost } = useRequest<IMessage>(`/posts/${id}`, {
    method: "DELETE",
    manual: true,
    accessToken,
  });
  const { execute: createComment } = useRequest<IMessage>(`/posts/${id}/comment`, {
    method: "POST",
    manual: true,
    accessToken,
  });
  const { execute: deleteComment } = useRequest<IMessage>(`/posts/${id}/comment`, {
    method: "DELETE",
    manual: true,
    accessToken,
  });

  const handlePostDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirm("정말로 이 게시물을 삭제하시겠습니까?")) {
      return;
    }
    const { data, error } = await deletePost();
    if (error) {
      alert("게시물 삭제에 실패했습니다: " + error);
      return;
    }
    alert("게시물이 성공적으로 삭제되었습니다.");
    navigate("/posts");
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    const { data, error } = await deleteComment({ commentId });
    if (error) {
      alert("댓글 삭제에 실패했습니다: " + error);
      return;
    }
    alert("댓글이 성공적으로 삭제되었습니다.");
    // 페이지를 새로고침하여 댓글 목록을 갱신
    navigate(0);
  };

  const handleCommentCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content");

    const comment = {
      content,
    };
    createComment(comment).then((result) => {
      if (result.error) {
        alert("댓글 작성에 실패했습니다: " + result.error);
        return;
      }
      alert("댓글이 성공적으로 작성되었습니다.");
      navigate(0);
    });
  };

  if (loading) return <p>로딩 중...</p>;
  if (!data) return <p>게시물을 찾을 수 없습니다.</p>;

  return (
    <>
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">{data.post.title}</h2>
          {user && user.id === data.post.author.id && (
            <div className="btn-group">
              <Link to={`/posts/${data.post.id}/edit`} className="btn btn-sm btn-outline-primary">
                수정
              </Link>
              <form onSubmit={handlePostDelete}>
                <button type="submit" className="btn btn-sm btn-outline-danger delete-button">
                  삭제
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="card-body">
          <div className="post-meta mb-3">
            <span className="me-3">작성자: {data.post.author.username}</span>
            <span className="me-3">
              카테고리:{" "}
              <Link
                to={`/posts?category=${data.post.category?.id}`}
                className="text-decoration-none"
              >
                {data.post.category?.name}
              </Link>
            </span>
            <span className="me-3">조회수: {data.post.view || 0}</span>
            <span>작성일: {new Date(data.post.createdAt).toLocaleDateString()}</span>
            {data.post.updatedAt && data.post.createdAt !== data.post.updatedAt && (
              <span className="ms-3">
                (수정일: {new Date(data.post.updatedAt).toLocaleDateString()} )
              </span>
            )}

            {data.post.tags && data.post.tags.length > 0 && (
              <div className="post-tags mb-3">
                {data.post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/posts?tag=${tag.id}`}
                    className="badge bg-secondary text-decoration-none"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="post-content ck-content mb-4">{parse(data.post.content)}</div>
        </div>
      </div>

      {data.relatedPosts && data.relatedPosts.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">관련 게시글</h5>
          </div>
          <div className="card-body">
            <ul className="list-group list-group-flush">
              {data.relatedPosts.map((post) => (
                <li key={post.id} className="list-group-item">
                  <Link to={`/posts/${post.id}`} className="text-decoration-none">
                    {post.title}
                  </Link>
                  <small className="text-muted ms-2">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card mb-4" id="comments">
        <div className="card-header">
          <h5 className="mb-0">댓글 ({data.post.comments ? data.post.comments.length : 0})</h5>
        </div>

        <div className="card-body">
          {data.post.comments && data.post.comments.length > 0 ? (
            <div className="comments-list mb-4">
              {data.post.comments.map((comment) => (
                <div key={comment.id} className="comment mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{comment.author && comment.author.username}</strong>
                      <small className="text-muted ms-2">
                        {new Date(comment.createdAt).toLocaleString()}
                      </small>
                    </div>

                    {user && user.id === comment.author.id && (
                      <button
                        className="btn btn-sm text-danger"
                        title="삭제"
                        onClick={() => {
                          console.log("Delete comment:", comment.id);
                          handleCommentDelete(comment.id);
                        }}
                      >
                        <i className="bi bi-x-circle"></i>
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="comment-content mt-2">{parse(comment.content)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">아직 댓글이 없습니다.</p>
          )}

          {user ? (
            <form onSubmit={handleCommentCreate}>
              <div className="mb-3">
                <label htmlFor="content" className="form-label">
                  댓글 작성
                </label>
                <textarea
                  name="content"
                  id="content"
                  rows={3}
                  className="form-control"
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">
                댓글 작성
              </button>
            </form>
          ) : (
            <div className="alert alert-info">
              댓글을 작성하려면{" "}
              <Link className="alert-link" to="/auth/login">
                로그인
              </Link>{" "}
              이 필요합니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PostDetailPage;
