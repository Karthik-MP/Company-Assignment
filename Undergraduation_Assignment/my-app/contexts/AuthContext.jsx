"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";

const AuthContext = createContext({ user: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let didUnmount = false;

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (didUnmount) return;
        setUser(firebaseUser);
        setLoading(false);
      },
      (error) => {
        console.error("[AuthProvider] onAuthStateChanged error:", error);
        if (didUnmount) return;
        setUser(null);
        setLoading(false);
      }
    );

    return () => {
      didUnmount = true;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
