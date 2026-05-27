// src/app/api/admin/schedule/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Planning from "@/models/Planning";

// 1. Récupérer tous les plannings depuis MongoDB
export async function GET() {
  try {
    await connectDB();
    const plannings = await Planning.find({}).sort({ datePrevue: 1 });
    return NextResponse.json({ success: true, data: plannings }, { status: 200 });
  } catch (error) {
    console.error("Erreur GET schedule:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la récupération du calendrier" }, { status: 500 });
  }
}

// 2. Créer un nouveau planning dans la Base de données
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { quartier, date, type, chauffeur } = body;

    if (!quartier || !date || !type || !chauffeur) {
      return NextResponse.json({ success: false, message: "Champs manquants" }, { status: 400 });
    }

    const newSchedule = await Planning.create({
      quartiers: quartier, // Lie le champ du formulaire au modèle
      datePrevue: new Date(date),
      typeDechet: type,
      chauffeur: chauffeur
    });

    return NextResponse.json({ success: true, data: newSchedule }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST schedule:", error);
    return NextResponse.json({ success: false, message: "Impossible de planifier la vidange" }, { status: 500 });
  }
}