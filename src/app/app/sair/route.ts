import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const base = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/login", base));
}
