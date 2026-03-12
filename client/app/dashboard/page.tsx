"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Protect dashboard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">
        Welcome to Dashboard 🚀
      </h1>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
