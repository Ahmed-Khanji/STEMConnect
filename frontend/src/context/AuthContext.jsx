import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null means not logged in
  const [loading, setLoading] = useState(true); // app boot auth check

  // runs once on app load
  useEffect(() => {
    async function boot() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
        
      }

      try {
        const data = await getMe(); // returns user: { name, email,.. }
        const fetchedUser = data?.user ?? data;
        setUser(fetchedUser);
      } catch (err) {
        // token invalid/expired -> wipe it
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  const loginWithTokens = useCallback(({ accessToken, refreshToken }, fetchedUser = null) => {
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    // if you already know user (optional), set it instantly
    if (fetchedUser) setUser(fetchedUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await getMe();
    const fetchedUser = data?.user ?? data;
    setUser(fetchedUser);
    return fetchedUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      loginWithTokens,
      refreshUser,
      logout,
    }),
    [user, loading, loginWithTokens, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
