import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase.from("masters").select("*").eq("status", "approved");

  const city  = searchParams.get("city");
  const trade = searchParams.get("trade");
  const minRating = searchParams.get("minRating");
  const emergency = searchParams.get("emergency");

  if (city)       query = query.ilike("city", `%${city}%`);
  if (trade)      query = query.contains("trades", [trade]);
  if (minRating)  query = query.gte("rating", parseFloat(minRating));
  if (emergency === "true") query = query.eq("emergency", true);

  query = query.order("rating", { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("masters")
    .insert({ ...body, status: "pending", verified: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
