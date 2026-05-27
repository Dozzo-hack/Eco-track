// src/app/api/admin/get-videurs/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb"; // Ajuste le chemin selon ton fichier de connexion
import Videur from "@/models/Videur"; // Ajuste le chemin selon ton modèle

export async function GET() {
  try {
    await connectDB();

    // Récupérer tous les videurs de la base de données
    const videurs = await Videur.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: videurs }, { status: 200 });
  } catch (error) {
    console.error("Erreur GET videurs:", error);
    return NextResponse.json(
      { success: false, message: "Impossible de récupérer les chauffeurs" },
      { status: 500 }
    );
  }
}