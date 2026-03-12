"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-bold tracking-wide">
          CardioInsight
        </h1>

        <div className="space-x-6 font-medium">
          <Link href="/" className="hover:text-gray-200">Home</Link>
          <Link href="/predict" className="hover:text-gray-200">Predict</Link>
          <Link href="/history" className="hover:text-gray-200">History</Link>
        </div>
      </div>
    </nav>
  );
}
