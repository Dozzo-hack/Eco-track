// src/app/api/quartiers/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quartier from "@/models/Quartier";

export async function GET() {
  try {
    await connectDB();
    // On ne récupère que les zones actives pour les clients
    const quartiersActifs = await Quartier.find({ estActif: true }).sort({ nom: 1 });
    return NextResponse.json({ success: true, data: quartiersActifs });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Impossible de charger les quartiers." }, { status: 500 });
  }
}