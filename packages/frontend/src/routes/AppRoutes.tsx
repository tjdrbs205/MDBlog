import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/Home/HomePage";
import PostListPage from "../pages/posts/PostListPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import MainLayout from "../components/Layout.Main";
import AuthLayout from "../components/Layout.Auth";
import ProfilePage from "../pages/user/ProfilePage";
import PostEditPage from "../pages/posts/PostEditPage";
import PostDetailPage from "../pages/posts/PostDetailPage";
import DashboardPage from "../pages/admin/DashboardPage";
import UserManagementPage from "../pages/admin/UserManagementPage";
import SettingPage from "../pages/admin/SettingPage";
import ArchivePage from "../pages/posts/ArchivePage";
import AboutPage from "../pages/Home/AboutPage";
import ContentsPage from "../pages/admin/ContentsPage";
import ProtectLayout from "../components/Layout.Protect";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="posts">
          <Route index element={<PostListPage />} />
          <Route path="popular" element={<PostListPage selectSort="view" />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path=":id" element={<PostDetailPage />} />
          <Route element={<ProtectLayout />}>
            <Route path="new" element={<PostEditPage />} />
            <Route path=":id/edit" element={<PostEditPage />} />
          </Route>
        </Route>
        <Route element={<ProtectLayout />}>
          <Route path="my">
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="admin" element={<ProtectLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="settings" element={<SettingPage />} />
          <Route path="contents" element={<ContentsPage />} />
          <Route path="comments" element={<div>Comment Management</div>} />
        </Route>
        <Route path="about" element={<AboutPage />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
