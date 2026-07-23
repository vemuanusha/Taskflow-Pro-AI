import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import toast from "react-hot-toast";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get("/api/users/me");
      setUser(res.data);
    } catch (err) {
      console.error(err);
      localStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = async (username, password) => {
    const res = await api.post("/api/auth/login", {
      username,
      password,
    });

    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);

    setUser(res.data.user);

    toast.success("Welcome back! 👋");
  };

  const register = async (data) => {
    const res = await api.post("/api/auth/register", data);

    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);

    setUser(res.data.user);

    toast.success("Account created! 🎉");
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {
        refresh: localStorage.getItem("refresh_token"),
      });
    } catch (err) {}

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setUser(null);

    toast.success("Signed out successfully.");
  };

  const updateProfile = async (data) => {
    const res = await api.patch("/api/users/me/", data);

    setUser(res.data);

    toast.success("Profile updated!");

    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);