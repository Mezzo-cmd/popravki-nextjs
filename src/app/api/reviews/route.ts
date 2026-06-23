import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json();

  const { data, error } = await supabase.from("reviews").insert({
    master_id:     body.master_id,
    reviewer_id:   user?.id ?? null,
    reviewer_name: user ? null : (body.reviewer_name || "Анонимен"),
    rating:        body.rating,
    text:          body.text || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
