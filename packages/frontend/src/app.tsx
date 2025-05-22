import { BrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import AppRoutes from "./routes/AppRoutes";
import { MainProvider } from "./context/MainContext";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MainProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </MainProvider>
    </BrowserRouter>
  );
};

export default App;
