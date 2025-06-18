import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ServerContextType {
  isServerReady: boolean;
  isLoading: boolean;
  error: string | null;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

interface ServerProviderProps {
  children: ReactNode;
}

export const ServerProvider: React.FC<ServerProviderProps> = ({ children }) => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkServerHealth = async () => {
    const url = import.meta.env.VITE_API_URL;
    try {
      const response = await fetch(`${url}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        setIsServerReady(true);
        setError(null);
      } else {
        throw new Error("Server not ready");
      }
    } catch (err) {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도합니다...");
      setIsServerReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(() => {
      if (!isServerReady) {
        checkServerHealth();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isServerReady]);

  return (
    <ServerContext.Provider value={{ isServerReady, isLoading, error }}>
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error("useServer must be used within a ServerProvider");
  }
  return context;
};
