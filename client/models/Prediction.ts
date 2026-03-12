import mongoose from "mongoose";

const PredictionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    inputData: {
      type: Object,
      required: true,
    },
    riskPercentage: {
      type: Number,
      required: true,
    },
    result: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["manual", "csv"],
      default: "manual",
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Prediction ||
  mongoose.model("Prediction", PredictionSchema);