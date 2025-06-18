import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { MainProvider } from "../context/MainContext";
import { useServer } from "../context/ServerContext";
import AppRoutes from "../routes/AppRoutes";
import ServerLoadingPage from "../pages/ServerLoadingPage";

const AppContent: React.FC = () => {
  const { isServerReady, isLoading, error } = useServer();

  if (isLoading || !isServerReady) {
    return <ServerLoadingPage error={error} />;
  }

  return (
    <AuthProvider>
      <MainProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </MainProvider>
    </AuthProvider>
  );
};

export default AppContent;
