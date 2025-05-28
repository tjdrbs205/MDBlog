import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { MainProvider } from "./context/MainContext";

import "../src/styles/App.css";
import { AuthProvider } from "./context/AuthContext";

const App: React.FC = () => {
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

export default App;
