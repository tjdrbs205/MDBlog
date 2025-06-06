import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMainContext } from "../../context/MainContext";
import CKEditorComponent from "../../components/CKEditorComponent";
import useRequest from "../../hooks/useRequest.hook";
import { useAuthContext } from "../../context/AuthContext";
import { IPostDetail } from "@mdblog/shared/src/types/post.interface";

const PostEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();

  const navigate = useNavigate();
  const { categories, tags } = useMainContext();
  const { accessToken, refreshToken } = useAuthContext();

  const { execute: getPost } = useRequest<IPostDetail>(`/posts/${id}`, {
    method: "GET",
    accessToken,
    manual: true,
    onTokenRefresh: refreshToken,
  });

  const { execute: createPost } = useRequest<IPostDetail>("/posts", {
    method: "POST",
    accessToken,
    manual: true,
    onTokenRefresh: refreshToken,
  });
  const { execute: updatePost } = useRequest<IPostDetail>(`/posts/${id}`, {
    method: "PUT",
    accessToken,
    manual: true,
    onTokenRefresh: refreshToken,
  });

  useEffect(() => {
    if (id) {
      getPost()
        .then((res) => {
          if (res.data) {
            setTitle(res.data.post.title);
            setContent(res.data.post.content);
            setSelectedCategory(res.data.post.category?.id || "");
            setTagInput(res.data.post.tags?.join(", ") || "");
            setIsPublic(res.data.post.isPublic);
            setStatus(res.data.post.status);
          }
        })
        .catch((error) => {
          alert("게시물을 불러오는 데 실패했습니다. 다시 시도해주세요.");
        });
    }
  }, []);

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [status, setStatus] = useState<string>("published");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleContentChange = (data: string) => {
    setContent(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    e.preventDefault();

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    const postData = {
      title: title,
      category: selectedCategory,
      tags: tagInput,
      isPublic: isPublic,
      status: status,
      content: content,
    };

    if (id) {
      updatePost(postData)
        .then((res) => {
          navigate(`/posts/${id}`);
        })
        .catch((res) => {
          alert("게시물 작성에 실패했습니다. 다시 시도해주세요.");
          setIsLoading(false);
        });
      return;
    }

    createPost(postData)
      .then((res) => {
        navigate(`/posts/${res.data?.post.id}`);
      })
      .catch((res) => {
        alert("게시물 작성에 실패했습니다. 다시 시도해주세요.");
        setIsLoading(false);
      });
    setIsLoading(false);
  };

  const handleTagClick = (tagName: string) => {
    const currentTags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    if (!currentTags.includes(tagName)) {
      const updatedTags = [...currentTags, tagName].join(", ");
      setTagInput(updatedTags);
    }
  };

  if (!categories || !tags) return <div>로딩 중...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="mb-0">{"새 글 작성"}</h2>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">
              제목
            </label>
            <input
              type="text"
              className="form-control"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="category" className="form-label">
              카테고리
            </label>
            <select
              className="form-select"
              id="category"
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">카테고리 선택</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="tags" className="form-label">
              태그
            </label>

            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="tags"
                name="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="태그를 입력하세요 (예: Node.js, MongoDB, Express)"
              />
              {tags && tags.length > 0 && (
                <>
                  <button
                    className="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    태그 선택
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end">
                    {tags.map((tag) => (
                      <li key={tag.id}>
                        <button
                          type="button"
                          className="dropdown-item tag-item"
                          onClick={() => handleTagClick(tag.name)}
                        >
                          {tag.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="form-text">쉼표로 구분하여 여러 태그를 입력할 수 있습니다.</div>
          </div>

          <div className="mb-3">
            <label className="form-label">공개 여부</label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="isPublic"
                id="isPublicYes"
                value="true"
                checked={isPublic === true}
                onChange={() => setIsPublic(true)}
              />
              <label className="form-check-label" htmlFor="isPublicYes">
                공개
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="isPublic"
                id="isPublicNo"
                value="false"
                checked={isPublic === false}
                onChange={() => setIsPublic(false)}
              />
              <label className="form-check-label" htmlFor="isPublicNo">
                비공개
              </label>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="status" className="form-label">
              상태
            </label>
            <select
              className="form-select"
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="published">게시</option>
              <option value="draft">임시저장</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="content" className="form-label">
              내용
            </label>
            <CKEditorComponent
              value={content}
              onChange={handleContentChange}
              placeholder="내용을 입력하세요"
            />
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              저장
            </button>
            <Link to="/posts" className="btn btn-secondary">
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default PostEditPage;
