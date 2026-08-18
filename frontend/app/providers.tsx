"use client";

import { authClient } from "@/lib/auth-client";
import { createContext, useContext } from "react";

type UserT = { id: string; email: string; name?: string | null } | null;

// 1. Context Type Interface Define Karein
interface AuthContextType {
  user: UserT;
  loading: boolean;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
}

// 2. Default Values ke sath Context Create Karein
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  signup: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  // Signup Implementation via Better-Auth Client
  async function signup(email: string, password: string, name?: string) {
    const res = await authClient.signUp.email({
      email,
      password,
      name: name || "",
    });

    if (res.error) {
      throw new Error(res.error.message || "Signup failed.");
    }
  }

  async function logout() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  const user = session?.user
    ? { id: session.user.id, email: session.user.email, name: session.user.name }
    : null;

  return (
    // 3. Signup function ko Value Prop mein pass karein
    <AuthContext.Provider value={{ user, loading: isPending, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);