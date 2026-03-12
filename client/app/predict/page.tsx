"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PredictPage() {
  // Manual form state
  const [formData, setFormData] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResults, setCsvResults] = useState<any>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // UI state
  const [mode, setMode] = useState<"manual" | "csv">("manual");

  const handleChange = (e: any) => {
    const value = e.target.value;
    const numValue = value === "" ? "" : Number(value);
    setFormData({
      ...formData,
      [e.target.name]: numValue,
    });
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  const validateForm = () => {
    const errs: any = {};

    const { age, trestbps, chol, thalach, oldpeak, ca, sex, cp, fbs, restecg, exang, slope, thal } = formData;

    // Numeric field validation
    if (age === undefined || age === "" || isNaN(age) || age < 20 || age > 100) {
      errs.age = "Age must be between 20 and 100";
    }
    if (trestbps === undefined || trestbps === "" || isNaN(trestbps) || trestbps < 80 || trestbps > 250) {
      errs.trestbps = "Resting BP must be 80–250";
    }
    if (chol === undefined || chol === "" || isNaN(chol) || chol < 100 || chol > 600) {
      errs.chol = "Cholesterol must be 100–600";
    }
    if (thalach === undefined || thalach === "" || isNaN(thalach) || thalach < 60 || thalach > 220) {
      errs.thalach = "Maximum Heart Rate must be 60–220";
    }
    if (oldpeak === undefined || oldpeak === "" || isNaN(oldpeak) || oldpeak < 0 || oldpeak > 6) {
      errs.oldpeak = "ST Depression (Oldpeak) must be 0–6";
    }
    if (ca === undefined || ca === "" || isNaN(ca) || ca < 0 || ca > 3) {
      errs.ca = "Number of Major Vessels must be 0–3";
    }

    // Categorical field validation
    if (sex === undefined || sex === "" || ![0, 1].includes(sex)) {
      errs.sex = "Gender is required";
    }
    if (cp === undefined || cp === "" || ![0, 1, 2, 3].includes(cp)) {
      errs.cp = "Chest Pain Type is required";
    }
    if (fbs === undefined || fbs === "" || ![0, 1].includes(fbs)) {
      errs.fbs = "Fasting Blood Sugar is required";
    }
    if (restecg === undefined || restecg === "" || ![0, 1, 2].includes(restecg)) {
      errs.restecg = "Resting ECG is required";
    }
    if (exang === undefined || exang === "" || ![0, 1].includes(exang)) {
      errs.exang = "Exercise Induced Angina is required";
    }
    if (slope === undefined || slope === "" || ![0, 1, 2].includes(slope)) {
      errs.slope = "ST Slope is required";
    }
    if (thal === undefined || thal === "" || ![1, 2, 3].includes(thal)) {
      errs.thal = "Thalassemia is required";
    }

    return errs;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      const errorMessages = Object.values(clientErrors).join("\n");
      alert(`Please fix the following errors:\n\n${errorMessages}`);
      return;
    }

    setLoading(true);

    try {
      // 🔥 1️⃣ Call Python ML backend for prediction
      const mlUrl = `${BACKEND_URL}/predict`;
      console.log(`📡 Calling ML backend: ${mlUrl}`);
      
      const mlRes = await fetch(mlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }).catch((err) => {
        throw new Error(`Failed to connect to backend (${BACKEND_URL}): ${err.message}`);
      });

      const mlData = await mlRes.json().catch(() => ({}));
      if (!mlRes.ok) {
        const msg = mlData.error || mlData.message || `HTTP ${mlRes.status}`;
        throw new Error(`ML Server Error: ${msg}`);
      }

      const prediction = mlData.prediction;
      const riskPercentage = mlData.risk_percentage;

      const manualPayload = {
        inputData: formData,
        riskPercentage,
        result: prediction,
        source: "manual",
      };
      console.log("📤 Saving MANUAL prediction:", manualPayload);

      const saveRes = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(manualPayload),
      }).catch((err) => {
        console.warn(`Failed to save prediction: ${err.message}`);
        return null;
      });

      if (saveRes?.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (saveRes && !saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        console.error("Failed to store prediction", err);
        console.warn(`⚠️ Prediction generated but failed to save to history: ${err.message || "Unknown error"}`);
      } else if (saveRes?.ok) {
        const savedData = await saveRes.json();
        console.log("✅ Manual prediction saved successfully:", savedData);
      }

      // 🔥 3️⃣ Display result
      setResult({
        prediction,
        risk_percentage: riskPercentage,
      });

    } catch (error: any) {
      console.error("Prediction error:", error);
      alert(`Prediction failed: ${error.message || "Unknown error"}`);
    }

    setLoading(false);
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }

    setCsvLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await fetch(`${BACKEND_URL}/predict-csv`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "CSV processing failed");
      }

      let successCount = 0;
      let failureCount = 0;

      for (const pred of data.predictions) {
        if (pred.error) {
          failureCount++;
          continue; 
        }

        try {
          const csvPayload = {
            inputData: pred.input_data,
            riskPercentage: pred.risk_percentage,
            result: pred.prediction,
            source: "csv",
          };
          console.log(`📤 Saving CSV prediction (Row ${pred.row_index}):`, csvPayload);

          const saveRes = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(csvPayload),
          });

          if (saveRes.ok) {
            const savedData = await saveRes.json();
            console.log(`✅ CSV row ${pred.row_index} saved with source: ${savedData.source}`);
            successCount++;
          } else {
            failureCount++;
            const err = await saveRes.json().catch(() => ({}));
            console.warn(`Failed to save row ${pred.row_index}:`, err);
          }
        } catch (error) {
          failureCount++;
          console.error(`Error saving row ${pred.row_index}:`, error);
        }
      }

      setCsvResults(data);

      const totalSaved = successCount;
      const totalErrors = data.predictions.filter((p: any) => p.error).length;
      const saveFailures = failureCount;

      if (totalSaved > 0) {
        alert(`✅ CSV processed successfully!\n📊 ${totalSaved} predictions saved to history\n⚠️ ${saveFailures} failed to save\n❌ ${totalErrors} rows had errors`);
      } else if (totalErrors > 0) {
        alert(`⚠️ CSV processed but ${totalErrors} rows had validation errors. No predictions saved.`);
      }
    } catch (error: any) {
      alert(`CSV processing failed: ${error.message}`);
    }

    setCsvLoading(false);
  };

  const downloadPdfReport = async () => {
    if (!csvResults?.predictions) {
      alert("No predictions to generate report from");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(csvResults),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get PDF blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`PDF download failed: ${error.message}`);
    }
  };

  const downloadManualPdfReport = async () => {
    if (!result) {
      alert("No prediction to generate report from");
      return;
    }

    try {
      const predictionForReport = {
        total_rows: 1,
        predictions: [
          {
            row_index: 1,
            input_data: formData,
            prediction: result.prediction,
            risk_percentage: result.risk_percentage,
          },
        ],
      };

      const res = await fetch(`${BACKEND_URL}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictionForReport),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `manual_report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`PDF download failed: ${error.message}`);
    }
  };

  return (
    <div className="relative min-h-screen pt-32 pb-24 overflow-hidden">

      {/* Background Glow */}
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
            AI Powered{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Risk Assessment
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {mode === "manual" 
              ? "Enter clinical parameters below to generate real-time cardiovascular risk prediction."
              : "Upload a CSV file with patient data to process batch predictions and generate a report."}
          </p>

          {/* Mode Selector */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {["manual", "csv"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m as "manual" | "csv");
                  setResult(null);
                  setCsvResults(null);
                }}
                className={`px-6 py-3 rounded-full font-semibold transition ${
                  mode === m
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                    : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
                }`}
              >
                {m === "manual" ? "📝 Manual Entry" : "📊 CSV Upload"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Manual Entry Form */}
        {mode === "manual" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">

            <>
                {/* Numeric Fields */}
                {[
                  { label: "Age", name: "age", type: "number", placeholder: "52", min:20, max:100 },
                  { label: "Resting Blood Pressure", name: "trestbps", type: "number", placeholder: "120", min:80, max:250 },
                  { label: "Cholesterol", name: "chol", type: "number", placeholder: "240", min:100, max:600 },
                  { label: "Maximum Heart Rate", name: "thalach", type: "number", placeholder: "150", min:60, max:220 },
                  { label: "ST Depression (Oldpeak)", name: "oldpeak", type: "number", placeholder: "1.4", step: "0.1", min:0, max:6 },
                  { label: "Number of Major Vessels (0–3)", name: "ca", type: "number", placeholder: "0", min:0, max:3 },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block mb-3 text-gray-300 font-medium">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      step={field.step}
                      placeholder={field.placeholder}
                      required
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    />
                  </div>
                ))}

                {/* Additional selects for remaining features */}
                <div>
                  <label className="block mb-3 text-gray-300 font-medium">
                    Resting ECG
                  </label>
                  <select
                    name="restecg"
                    required
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  >
                    <option value="">Select</option>
                    <option value="0" className="text-black">
                      Normal
                    </option>
                    <option value="1" className="text-black">
                      Having ST-T wave abnormality
                    </option>
                    <option value="2" className="text-black">
                      Showing probable or definite left ventricular hypertrophy
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block mb-3 text-gray-300 font-medium">
                    ST Slope During Exercise
                  </label>
                  <select
                    name="slope"
                    required
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  >
                    <option value="">Select</option>
                    <option value="0" className="text-black">
                      Upsloping
                    </option>
                    <option value="1" className="text-black">
                      Flat
                    </option>
                    <option value="2" className="text-black">
                      Downsloping
                    </option>
                  </select>
                </div>

                {/* Select Fields */}
                {[
                  {
                    label: "Gender",
                    name: "sex",
                    options: [
                      { label: "Male", value: 1 },
                      { label: "Female", value: 0 },
                    ],
                  },
                  {
                    label: "Chest Pain Type",
                    name: "cp",
                    options: [
                      { label: "Typical Angina", value: 0 },
                      { label: "Atypical Angina", value: 1 },
                      { label: "Non-anginal Pain", value: 2 },
                      { label: "Asymptomatic", value: 3 },
                    ],
                  },
                  {
                    label: "Fasting Blood Sugar > 120",
                    name: "fbs",
                    options: [
                      { label: "Yes", value: 1 },
                      { label: "No", value: 0 },
                    ],
                  },
                  {
                    label: "Exercise Induced Angina",
                    name: "exang",
                    options: [
                      { label: "Yes", value: 1 },
                      { label: "No", value: 0 },
                    ],
                  },
                  {
                    label: "Thalassemia",
                    name: "thal",
                    options: [
                      { label: "Normal", value: 1 },
                      { label: "Fixed Defect", value: 2 },
                      { label: "Reversible Defect", value: 3 },
                    ],
                  },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block mb-3 text-gray-300 font-medium">
                      {field.label}
                    </label>
                    <select
                      name={field.name}
                      required
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                      <option value="">Select</option>
                      {field.options.map((opt, j) => (
                        <option key={j} value={opt.value} className="text-black">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </>

            {/* Submit Button */}
            <div className="col-span-2 mt-6 text-center">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold shadow-xl hover:scale-105 transition disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Prediction"}
              </button>
            </div>

          </form>
        </motion.div>
        )}

        {/* CSV Upload Form */}
        {mode === "csv" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl"
        >
          <form onSubmit={handleCsvSubmit} className="space-y-6">
            <div>
              <label className="block mb-4 text-gray-300 font-medium">
                Upload CSV File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-cyan-500 file:to-purple-600
                    file:text-white
                    hover:file:cursor-pointer"
                  required
                />
              </div>
              <p className="text-gray-400 text-sm mt-3">
                📋 CSV should contain columns: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                type="submit"
                disabled={csvLoading || !csvFile}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold shadow-xl hover:scale-105 transition disabled:opacity-50"
              >
                {csvLoading ? "Processing..." : "Process CSV"}
              </button>
            </div>
          </form>
        </motion.div>
        )}

        {/* CSV Results Display */}
        {mode === "csv" && csvResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 space-y-8"
        >
          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
              <p className="text-gray-400 text-sm">Total Predictions</p>
              <p className="text-4xl font-bold text-cyan-400 mt-2">
                {csvResults.total_rows}
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
              <p className="text-gray-400 text-sm">High Risk</p>
              <p className="text-4xl font-bold text-red-400 mt-2">
                {csvResults.predictions.filter((p: any) => p.prediction === "High Cardiovascular Risk").length}
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
              <p className="text-gray-400 text-sm">Low Risk</p>
              <p className="text-4xl font-bold text-emerald-400 mt-2">
                {csvResults.predictions.filter((p: any) => p.prediction === "Low Cardiovascular Risk").length}
              </p>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-4 py-3 text-left text-cyan-400">Row</th>
                  <th className="px-4 py-3 text-left text-cyan-400">Age</th>
                  <th className="px-4 py-3 text-left text-cyan-400">Sex</th>
                  <th className="px-4 py-3 text-left text-cyan-400">Prediction</th>
                  <th className="px-4 py-3 text-left text-cyan-400">Risk %</th>
                </tr>
              </thead>
              <tbody>
                {csvResults.predictions.map((pred: any, idx: number) => (
                  <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-gray-300">{pred.row_index}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {pred.error ? "N/A" : pred.input_data?.age || "?"}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {pred.error ? "N/A" : (pred.input_data?.sex === 1 ? "M" : "F")}
                    </td>
                    <td className="px-4 py-3">
                      {pred.error ? (
                        <span className="text-red-400">Error</span>
                      ) : (
                        <span className={pred.prediction === "High Cardiovascular Risk" ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
                          {pred.prediction === "High Cardiovascular Risk" ? "🔴 High" : "🟢 Low"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {pred.error ? pred.error.substring(0, 20) : pred.risk_percentage + "%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Download Report Button */}
          <div className="text-center">
            <button
              onClick={downloadPdfReport}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 font-semibold shadow-xl hover:scale-105 transition"
            >
              📥 Download PDF Report
            </button>
          </div>
        </motion.div>
        )}

        {/* Manual Result Card */}
        {mode === "manual" && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10"
          >
            <h3
              className={`text-3xl font-bold mb-4 ${
                result.prediction?.includes("High")
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {result.prediction}
            </h3>

            <p className="text-xl text-gray-300">
              Risk Probability:
              <span className="ml-2 font-bold text-cyan-400">
                {result.risk_percentage}%
              </span>
            </p>

            {/* PDF Download Button */}
            <div className="mt-8">
              <button
                onClick={downloadManualPdfReport}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 font-semibold shadow-xl hover:scale-105 transition"
              >
                📥 Download PDF Report
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}