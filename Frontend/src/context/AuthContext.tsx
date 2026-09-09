import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ApiError,
  deleteAccountRequest,
  getCurrentUserRequest,
  requestAccessRequest,
  signInRequest,
  signOutRequest,
  updateProfileRequest,
  type AuthUser,
  type RequestAccessPayload,
  type UpdateProfilePayload,
} from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  requestAccess: (payload: RequestAccessPayload) => Promise<string>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrentUserRequest()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error(error);
        }
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await signInRequest(email, password);
    setUser(data.user);
  }, []);

  const requestAccess = useCallback(async (payload: RequestAccessPayload) => {
    const data = await requestAccessRequest(payload);
    return data.message;
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const data = await updateProfileRequest(payload);
    setUser(data.user);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    await deleteAccountRequest(password);
    setUser(null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      requestAccess,
      updateProfile,
      deleteAccount,
      signOut,
    }),
    [user, loading, signIn, requestAccess, updateProfile, deleteAccount, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Context consumers are the standard pairing for a provider module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
