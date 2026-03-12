import { connectDB } from "@/lib/mongodb";
import Prediction from "@/models/Prediction";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1️⃣ Verify JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      return NextResponse.json(
        { message: "Server not properly configured (JWT_SECRET missing)" },
        { status: 500 }
      );
    }

    // 2️⃣ Connect to MongoDB
    try {
      await connectDB();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { message: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }

    // 3️⃣ Get token from cookies
    const cookie = req.headers.get("cookie");
    if (!cookie) {
      return NextResponse.json({ message: "Unauthorized: No cookie" }, { status: 401 });
    }
    const token = cookie.split("; ").find((c) => c.startsWith("token="))?.split("=")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: Token missing" }, { status: 401 });
    }

    // 4️⃣ Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return NextResponse.json({ message: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // 5️⃣ Parse JSON prediction data
    const body = await req.json();
    const { inputData, riskPercentage, result, source } = body;

    if (!inputData || riskPercentage === undefined || !result) {
      return NextResponse.json({ message: "Missing or invalid fields" }, { status: 400 });
    }

    console.log(`📍 Saving prediction - Source: ${source || "manual"} (received: "${source}")`);

    // 6️⃣ Store prediction in MongoDB scoped to current user
    const prediction = await Prediction.create({
      userId: decoded.id,
      inputData,
      riskPercentage,
      result,
      source: source || "manual",
    });

    console.log(`✅ Prediction saved with source: ${prediction.source}`);
    return NextResponse.json(prediction, { status: 201 });

  } catch (error) {
    console.error("Error in /api/predict:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}