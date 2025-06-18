import { ServerProvider } from "./context/ServerContext";
import AppContent from "./components/Layout.AppContent";

const App: React.FC = () => {
  return (
    <ServerProvider>
      <AppContent />
    </ServerProvider>
  );
};

export default App;
