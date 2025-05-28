import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Mainlayout: React.FC = () => {
  return (
    <div>
      <Header />
      <div className="container mt-4">
        <div className="row">
          <Sidebar />
          <div className="col-md-9">
            <Outlet />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Mainlayout;
