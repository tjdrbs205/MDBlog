import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/Home/HomePage";
import PostListPage from "../pages/posts/PostListPage";
import PostDetailPage from "../pages/posts/postDetailPage";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/posts" element={<PostListPage />} />
      <Route path="/posts/:id" element={<PostDetailPage />} />
    </Routes>
  );
};

export default AppRoutes;
