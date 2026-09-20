import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
} from "@/services/auth.service";
import { clearTokens, getAccessToken } from "@/storage/token.storage";
import { AuthUser, LoginRequest } from "@/types/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (request: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await getAccessToken();

      if (!token) {
        setUser(null);
        return;
      }

      const currentUser = await getMe();
      setUser(currentUser);
    } catch {
      await clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (request: LoginRequest) => {
    const response = await loginRequest(request);
    setUser(response.user);
  };
  const signOut = async () => {
    try {
      await logoutRequest();
    } finally {
      await clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider.");
  }

  return context;
}
