import { connectDB } from "@/lib/mongodb";
import Prediction from "@/models/Prediction";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectDB();

    // 1️⃣ Get token from cookies
    const cookie = req.headers.get("cookie");
    if (!cookie) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = cookie.split("; ").find((c) => c.startsWith("token="))?.split("=")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // 2️⃣ Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 3️⃣ Fetch user history
    const history = await Prediction.find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}