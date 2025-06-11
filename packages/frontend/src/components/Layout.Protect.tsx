import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const ProtectLayout: React.FC = () => {
  const { isAuthenticated, accessToken } = useAuthContext();
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/auth/login" replace />;
  }
  return <Outlet />;
};

export default ProtectLayout;
