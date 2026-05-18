import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/guards";

export async function GET() {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ user: session }, { headers: { "Cache-Control": "no-store" } });
}
