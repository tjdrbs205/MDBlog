import { ILoginUser, IReadOnlyUser, IRegisterUser } from "@mdblog/shared/src/types/user.interface";
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
  isAdmin: boolean;
  user: IUserContextData | null;
  accessToken: string | null;
  userData: IReadOnlyUser | null;
  login: (loginData: ILoginUser) => Promise<string | Record<string, string> | null>;
  logout: () => Promise<string | null>;
  register: (registerData: IRegisterUser) => Promise<string | Record<string, string> | null>;
  profile: () => Promise<IReadOnlyUser | string | null>;
  reload: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  accessToken: null,
  userData: null,
  login: async () => {
    throw new Error("login function not implemented");
  },
  logout: async () => {
    throw new Error("logout function not implemented");
  },
  register: async () => {
    throw new Error("register function not implemented");
  },
  profile: async () => {
    throw new Error("profile function not implemented");
  },
  reload: async () => {
    throw new Error("reload function not implemented");
  },
  refreshToken: async () => {
    throw new Error("refreshToken function not implemented");
  },
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const defaultProfileImage =
    "https://github.com/tjdrbs205/MDBlog/blob/main-backup/public/images/default-profile.png?raw=true";
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<IReadOnlyUser | null>(null);
  const [user, setUser] = useState<IUserContextData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const handleTokenRefresh = async () => {
    try {
      const { data, error } = await requestRefresh();
      if (data && data.accessToken) {
        setAccessToken(data.accessToken);
        setUser(parserUserToken(data.accessToken));
        setIsAuthenticated(true);
        return data.accessToken;
      }
      return null;
    } catch (error) {
      console.error("Token refresh failed:", error);
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setUserData(null);
      return null;
    }
  };

  const { execute: requestProfile } = useRequest<IReadOnlyUser>("/users/profile", {
    accessToken,
    manual: true,
    onTokenRefresh: handleTokenRefresh,
  });

  const { execute: requestRefresh } = useRequest<IResponseToken>("/users/refresh", {
    manual: true,
  });

  const { execute: requestLogin } = useRequest<IResponseToken>("/users/login", {
    method: "POST",
    manual: true,
  });

  const { execute: requestLogout } = useRequest<IMessage>("/users/logout", {
    manual: true,
  });

  const { execute: requestRegister } = useRequest<IMessage>("/users/register", {
    method: "POST",
    manual: true,
  });

  useEffect(() => {
    if (!accessToken) {
      reload();
    }
  }, [accessToken]);

  const reload = async () => {
    const { data, error } = await requestRefresh();
    if (data && data.accessToken) {
      setAccessToken(data?.accessToken);
      setUser(parserUserToken(data?.accessToken));
      setIsAuthenticated(true);
    } else {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setUserData(null);
    }
  };

  const login = async (loginData: ILoginUser) => {
    const { data, error } = await requestLogin(loginData);
    if (data && data?.accessToken) {
      setAccessToken(data.accessToken);
      setUser(parserUserToken(data.accessToken));
      setIsAuthenticated(true);
      profile().then((userData) => {
        if (typeof userData === "string") {
          setUserData(null);
        } else {
          setUserData(userData);
        }
      });
      return null;
    }
    if (error) {
      try {
        return JSON.parse(error);
      } catch (e) {
        return error;
      }
    }
  };

  const logout = async () => {
    const { data, error } = await requestLogout();
    if (error) {
      throw new Error(error);
    }
    if (data && data.message) {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setUserData(null);
    }
    return null;
  };

  const register = async (registerData: IRegisterUser) => {
    const { data, error } = await requestRegister(registerData);

    if (data && data.message) {
      return null;
    }
    if (error) {
      try {
        return JSON.parse(error);
      } catch (e) {
        return error;
      }
    }
  };

  const profile = async () => {
    const { data, error } = await requestProfile();
    if (error) {
      return error;
    }
    if (data && !data.profileImage) {
      data.profileImage = defaultProfileImage;
    }
    setUserData(data);
    setIsAdmin(data?.role === "admin");
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        user,
        accessToken,
        userData,
        login,
        logout,
        register,
        profile,
        reload,
        refreshToken: handleTokenRefresh,
      }}
    >
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
    const base64Payload = token.split(".")[1];

    const binaryString = atob(base64Payload);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decoder = new TextDecoder("utf-8");
    const jsonPayload = decoder.decode(bytes);
    const payload = JSON.parse(jsonPayload);

    return {
      id: payload.id,
      username: payload.username,
      email: payload.email,
    };
  } catch (error) {
    throw new Error("Invalid token format");
  }
}
