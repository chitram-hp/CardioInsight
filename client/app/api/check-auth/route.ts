import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    // Get token from cookies
    const cookie = req.headers.get("cookie");
    if (!cookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const token = cookie.split("; ").find((c) => c.startsWith("token="))?.split("=")[1];
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify JWT token
    try {
      jwt.verify(token, process.env.JWT_SECRET as string);
      return NextResponse.json({ authenticated: true }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error("Error checking auth:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}