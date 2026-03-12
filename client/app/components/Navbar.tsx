"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);

    // ✅ Check if user is logged in
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/check-auth", {
          method: "GET",
          credentials: "include",
        });
        setLoggedIn(res.ok && res.status === 200);
      } catch (error) {
        console.error("Auth check failed:", error);
        setLoggedIn(false);
      }
    };

    checkAuth();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const checkAuth = async () => {
          try {
            const res = await fetch("/api/check-auth", {
              method: "GET",
              credentials: "include",
            });
            setLoggedIn(res.ok && res.status === 200);
          } catch (error) {
            setLoggedIn(false);
          }
        };
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setLoggedIn(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Predict", href: "/predict" },
    { name: "History", href: "/history" },
  ];

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/10 backdrop-blur-2xl border-b border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

        {/* Logo */}
        <Link href="/">
          <motion.h1
            whileHover={{ scale: 1.05 }}
            className="text-xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent cursor-pointer"
          >
            CardioInsight AI
          </motion.h1>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-10 items-center text-sm font-medium">
          {navLinks.map((link, i) => (
            <Link key={i} href={link.href} className="relative group">
              <span className="text-gray-300 group-hover:text-white transition">
                {link.name}
              </span>
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}

          {loggedIn ? (
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              className="ml-6 px-6 py-2 rounded-full bg-red-500 text-white font-semibold shadow-lg hover:bg-red-600 transition"
            >
              Logout
            </motion.button>
          ) : (
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="ml-6 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-cyan-500/40 transition"
              >
                Login
              </motion.button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="text-white focus:outline-none"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/10 px-6 pb-6 space-y-4">
          {navLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className="block text-gray-300 hover:text-white transition"
              onClick={() => setOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="w-full mt-4 px-6 py-2 rounded-full bg-red-500 text-white font-semibold"
            >
              Logout
            </button>
          ) : (
            <Link href="/login">
              <button
                onClick={() => setOpen(false)}
                className="w-full mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold"
              >
                Login
              </button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}