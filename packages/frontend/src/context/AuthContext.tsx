import {
  ILoginUser,
  IRegisterUser,
  IUserContextData,
} from "@mdblog/shared/src/types/user.interface";
import React, { createContext, useEffect, useState } from "react";
import useRequest from "../hooks/useRequest.hook";

interface IUserContextData {
  id: string;
  username: string;
  email: string;
}

interface IResponseToken {
  accessToken: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: IUserContextData | null;
  accessToken: string | null;
  login: (loginData: ILoginUser) => Promise<string | Record<string, string> | null>;
  logout: () => Promise<string | null>;
  register: (registerData: IRegisterUser) => Promise<string | Record<string, string> | null>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  login: async () => {
    throw new Error("login function not implemented");
  },
  logout: async () => {
    throw new Error("logout function not implemented");
  },
  register: async () => {
    throw new Error("register function not implemented");
  },
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<IUserContextData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const { execute: requestRefresh } = useRequest<IResponseToken>("/users/refresh", {
    manual: true,
  });

  const { execute: requestLogin } = useRequest<IResponseToken>("/users/login", {
    method: "POST",
    manual: true,
  });

  const { execute: requestLogout } = useRequest<IMessage>("/users/logout", {
    method: "POST",
    manual: true,
  });

  const { execute: requestRegister } = useRequest<IMessage>("/users/register", {
    method: "POST",
    manual: true,
  });

  useEffect(() => {
    if (!accessToken) {
      requestRefresh().then(({ data, error }) => {
        if (data && data.accessToken) {
          setAccessToken(data.accessToken);
          setUser(parserUserToken(data.accessToken));
          setIsAuthenticated(true);
        } else {
          setAccessToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      });
    }
  }, []);

  const login = async (loginData: ILoginUser) => {
    const { data, error } = await requestLogin(loginData);
    if (data && data?.accessToken) {
      setAccessToken(data.accessToken);
      setUser(parserUserToken(data.accessToken));
      setIsAuthenticated(true);

      return null;
    }
    if (error) {
      const parserError = JSON.parse(error);
      if (typeof parserError === "string") {
        return error;
      } else {
        return parserError;
      }
    }
  };

  const logout = async () => {
    const { data, error } = await requestLogout();
    if (data && data.message) {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } else {
      return "로그아웃 실패";
    }
  };

  const register = async (registerData: IRegisterUser) => {
    const { data, error } = await requestRegister(registerData);

    if (data && data.message) {
      return null;
    }
    if (error) {
      const parserError = JSON.parse(error);
      if (typeof parserError === "string") {
        return error;
      } else {
        return parserError;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, accessToken, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = React.useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};

function parserUserToken(token: string): IUserContextData {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      username: payload.username,
      email: payload.email,
    };
  } catch (error) {
    throw new Error("Invalid token format");
  }
}
