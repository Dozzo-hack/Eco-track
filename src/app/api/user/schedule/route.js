import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Planning from "@/models/Planning";
// 1. IMPORT CRUCIAL : Permet à Mongoose de lier les collections lors du populate
import Quartier from "@/models/Quartier"; 

export async function GET() {
  try {
    await connectDB();
    
    // Récupérer les plannings à partir d'aujourd'hui, triés du plus proche au plus lointain
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    // 2. CORRECTION : On ajoute .populate("quartiers") pour remplacer l'ID par l'objet Quartier complet
    const plannings = await Planning.find({
      datePrevue: { $gte: aujourdhui }
    })
    .sort({ datePrevue: 1 })
    .populate("quartiers");

    return NextResponse.json({ success: true, data: plannings }, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération calendrier public:", error);
    return NextResponse.json({ success: false, message: "Impossible de charger le calendrier" }, { status: 500 });
  }
}