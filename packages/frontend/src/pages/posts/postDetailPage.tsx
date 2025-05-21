import { IPostDetail } from "@mdblog/shared/src/types/post.interface";
import { useParams } from "react-router-dom";
import useRequest from "../../hooks/useRequest.hook";

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, loading } = useRequest<IPostDetail>("/posts/" + id);

  if (loading) return <p>로딩 중...</p>;
  if (!data) return <p>게시물을 찾을 수 없습니다.</p>;

  return (
    <div className="post-detail">
      <h1>{data.post.title}</h1>
      <p>{new Date(data.post.createdAt).toLocaleDateString()}</p>
      <div dangerouslySetInnerHTML={{ __html: data.post.content }}></div>
    </div>
  );
};

export default PostDetailPage;
