"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HistoryItem {
  _id: string;
  userId: string;
  inputData: {
    age?: number;
    [key: string]: any;
  };
  riskPercentage: number;
  result: string | number;
  createdAt: string;
  source?: "manual" | "csv";
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return [];
        }
        const body = await res.json();
        return body;
      })
      .then((result) => {
        const formatted = result.map((item: any) => ({
          ...item,
          source: item.source || "manual",
        }));
        setData(formatted || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen pt-32 pb-24 overflow-hidden">

      {/* Background Glow Orbs */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/30 blur-3xl rounded-full -top-32 -left-32 animate-pulse"></div>
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/30 blur-3xl rounded-full bottom-0 right-0 animate-pulse"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-extrabold mb-6">
            Prediction{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              History
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Review previous AI-generated cardiovascular risk assessments.
          </p>
        </motion.div>

        {/* Glass Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {loading ? (
            <p className="text-center text-gray-400 text-lg animate-pulse">
              Loading history...
            </p>
          ) : data.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">
              No predictions available yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center">

                {/* Table Head */}
                <thead>
                  <tr className="border-b border-white/10 text-gray-300 text-lg">
                    <th className="p-4">ID</th>
                    <th>Age</th>
                    <th>Risk Level</th>
                    <th>Risk %</th>
                    <th>Date</th>
                    <th>Source</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="text-gray-300">
                  {data.map((row, index) => {
                    const isHighRisk = row.result === "High Cardiovascular Risk" || row.result === 1;
                    return (
                      <tr
                        key={row._id}
                        className="border-b border-white/5 hover:bg-white/5 transition duration-300"
                      >
                        <td className="p-4">{index + 1}</td>
                        <td>{row.inputData.age ?? "N/A"}</td>

                        <td>
                          <span className={`px-4 py-1 rounded-full text-sm font-semibold ${isHighRisk ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                            {isHighRisk ? "High Risk" : "Low Risk"}
                          </span>
                        </td>

                        <td className={`font-bold ${isHighRisk ? "text-red-400" : "text-emerald-400"}`}>
                          {row.riskPercentage}%
                        </td>

                        <td className="text-gray-400">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>

                        <td>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            row.source === "csv"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}>
                            {row.source === "csv" ? "📊 CSV" : "✍️ Manual"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}