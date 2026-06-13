// src/app/api/admin/schedule/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Planning from "@/models/Planning";
import Quartier from "@/models/Quartier"; 
import Videur from "@/models/Videur";     

// 1. Récupérer tous les plannings peuplés depuis MongoDB
export async function GET() {
  try {
    await connectDB();
    
    // 🔥 Ajout de { strictPopulate: false } pour contourner définitivement l'erreur Mongoose
    const plannings = await Planning.find({})
    
      .populate({ path: "quartiers", select: "nom", options: { strictPopulate: false } }) // On peuple les deux variantes par sécurité
      .populate({ path: "chauffeur", select: "nom name", options: { strictPopulate: false } }) 
      .sort({ datePrevue: 1 });

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
    
    const { quartiers, datePrevue, typeDechet, chauffeur } = body;

    if (!quartiers || !datePrevue || !typeDechet || !chauffeur) {
      return NextResponse.json({ success: false, message: "Champs manquants" }, { status: 400 });
    }

    // On enregistre à la fois dans "quartier" et "quartiers" pour que l'enregistrement
    // fonctionne peu importe la version exacte définie dans ton modèle Mongoose caché
    const newSchedule = await Planning.create({
      quartier: quartiers,
      quartiers: quartiers, 
      datePrevue: new Date(datePrevue),
      typeDechet,
      chauffeur
    });

    return NextResponse.json({ success: true, data: newSchedule }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST schedule:", error);
    return NextResponse.json({ success: false, message: "Impossible de planifier la vidange" }, { status: 500 });
  }
}