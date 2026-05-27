// src/app/api/recompenses/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Recompense from "@/models/Recompense";

export async function GET() {
  try {
    await connectDB();
    const catalogue = await Recompense.find({ actif: true });
    return NextResponse.json({ success: true, catalogue });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur catalogue" }, { status: 500 });
  }
}