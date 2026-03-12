import mongoose, { Schema, model, models } from "mongoose";

const predictionSchema = new Schema({
  userId: { type: String, required: true },
  inputData: { type: Object, required: true },
  riskPercentage: { type: Number, required: true },
  result: { type: String, required: true },
  source: { type: String, enum: ["manual", "csv"], default: "manual" },
  createdAt: { type: Date, default: Date.now },
});

const Prediction = models.Prediction || model("Prediction", predictionSchema);
export default Prediction;