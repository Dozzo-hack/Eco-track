// src/app/api/vidange/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Commande from "@/models/Commande";

// 1. Ajouter une commande (Utilisé par le formulaire Premium)
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { typeDechet, volume, dateSouhaitee, instructions } = body;

    if (!typeDechet || !volume || !dateSouhaitee) {
      return NextResponse.json({ success: false, message: "Champs obligatoires manquants" }, { status: 400 });
    }

    const nouvelleCommande = await Commande.create({
      typeDechet,
      volume,
      dateSouhaitee: new Date(dateSouhaitee),
      instructions
    });

    return NextResponse.json({ success: true, data: nouvelleCommande }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST Vidange:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la commande" }, { status: 500 });
  }
}

// 2. Récupérer toutes les commandes (Utilisé par le Dashboard Admin)
export async function GET() {
  try {
    await connectDB();
    const commandes = await Commande.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: commandes }, { status: 200 });
  } catch (error) {
    console.error("Erreur GET Vidange:", error);
    return NextResponse.json({ success: false, message: "Impossible de charger les demandes" }, { status: 500 });
  }
}