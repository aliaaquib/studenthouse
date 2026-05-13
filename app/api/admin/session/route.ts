import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/guards";

export async function GET() {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: session });
}
