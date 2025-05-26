import { BrowserRouter } from "react-router-dom";
import Layout from "./components/Layout.Main";
import AppRoutes from "./routes/AppRoutes";
import { MainProvider } from "./context/MainContext";

import "../src/styles/App.css";

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
