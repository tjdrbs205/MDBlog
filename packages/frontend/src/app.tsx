import { BrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import { SearchProvider } from "./context/SearchContext";
import AppRoutes from "./routes/AppRoutes";
import { MainProvider } from "./context/MainContext";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MainProvider>
        <SearchProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </SearchProvider>
      </MainProvider>
    </BrowserRouter>
  );
};

export default App;
