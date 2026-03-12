"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function Counter({ end }: { end: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);

    const counter = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(counter);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(counter);
  }, [end]);

  return <span>{count}</span>;
}

export default function Home() {
  return (
    <div className="relative font-sans text-gray-200 bg-[#0b0f19] overflow-hidden min-h-screen flex flex-col">

      {/* Background Glow Orbs */}
      <div className="absolute w-[600px] h-[600px] bg-purple-600/30 blur-3xl rounded-full -top-40 -left-40 animate-pulse"></div>
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/30 blur-3xl rounded-full bottom-0 right-0 animate-pulse"></div>

      <div className="flex-grow">

        {/* HERO */}
        <section className="pt-24 pb-20 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-5xl mx-auto px-6"
          >

            {/* Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                "AI Powered",
                "Clinical Dataset",
                "Real-Time Risk ",
                "Secure Storage",
                "Preventive Care"
              ].map((item, i) => (
                <span
                  key={i}
                  className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm hover:scale-105 transition"
                >
                  {item}
                </span>
              ))}
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Intelligent{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Heart Disease
              </span>
              <br /> Risk Prediction
            </h1>

            <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">
              AI-driven cardiovascular risk assessment platform delivering real-time
              predictive analytics for early detection and preventive healthcare decisions.
            </p>

            {/* UPDATED BUTTONS */}
            <div className="flex justify-center gap-6 flex-wrap">
              <Link href="/login">
                <button className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold shadow-xl hover:scale-105 transition">
                  Login to Continue
                </button>
              </Link>

              <Link href="/register">
                <button className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/10 transition">
                  Create Account
                </button>
              </Link>
            </div>

          </motion.div>
        </section>

        {/* STATS */}
        <section className="py-16 border-t border-white/10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center px-6">

            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:scale-105 transition">
              <h3 className="text-4xl font-bold text-cyan-400">
                <Counter end={10000} />+
              </h3>
              <p className="text-gray-400 mt-2">Predictions Processed</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:scale-105 transition">
              <h3 className="text-4xl font-bold text-purple-400">
                <Counter end={95} />%
              </h3>
              <p className="text-gray-400 mt-2">Model Accuracy</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:scale-105 transition">
              <h3 className="text-4xl font-bold text-emerald-400">
                24/7
              </h3>
              <p className="text-gray-400 mt-2">AI Monitoring</p>
            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">
              Built for Modern Preventive Healthcare
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Combining machine learning, medical datasets, and predictive intelligence.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Evidence-Based ML Model",
                desc: "Random Forest algorithm trained on validated heart disease datasets."
              },
              {
                title: "Precise Risk Probability",
                desc: "Generates accurate cardiovascular risk percentage score."
              },
              {
                title: "Decision Support Tool",
                desc: "Designed for students, clinicians, and researchers."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <h3 className="text-xl font-semibold mb-4 text-white">
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* UPDATED CTA */}
        <section className="py-20 text-center bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Take Control of Your Heart Health Today
          </h2>

          <Link href="/login">
            <button className="bg-black text-white px-10 py-4 rounded-full font-semibold hover:scale-105 transition shadow-xl">
              Login to Start Assessment
            </button>
          </Link>
        </section>

      </div>
    </div>
  );
}