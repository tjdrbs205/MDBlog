import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./Sidebar";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <Header />
      <div className="container mt-4">
        <div className="row">
          <Sidebar />
          <div className="col-md-9">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
