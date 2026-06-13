// src/app/api/admin/quartiers/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quartier from "@/models/Quartier";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 1. AJOUTER UN QUARTIER (POST)
export async function POST(req) {
  try {
    await connectDB();

    // Sécurité : Vérifier si l'utilisateur est connecté et est bien admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Accès interdit." }, { status: 403 });
    }

    const { nom } = await req.json();
    if (!nom || nom.trim() === "") {
      return NextResponse.json({ success: false, message: "Le nom du quartier est requis." }, { status: 400 });
    }

    // Normalisation du nom (Tout en majuscules pour une uniformité parfaite, ex: "AKWA")
    const nomNormalise = nom.toUpperCase().trim();

    // Vérifier si le quartier existe déjà
    const quartierExistant = await Quartier.findOne({ nom: nomNormalise });
    if (quartierExistant) {
      return NextResponse.json({ success: false, message: "Ce quartier existe déjà." }, { status: 400 });
    }

    const nouveauQuartier = await Quartier.create({
      nom: nomNormalise,
      ajoutePar: session.user.name || "Admin"
    });

    return NextResponse.json({ success: true, data: nouveauQuartier, message: "Quartier ajouté avec succès !" });
  } catch (error) {
    console.error("Erreur ajout quartier :", error);
    return NextResponse.json({ success: false, message: "Erreur interne du serveur." }, { status: 500 });
  }
}

// 2. RÉCUPÉRER TOUS LES QUARTIER POUR L'ADMIN (GET)
export async function GET() {
  try {
    await connectDB();
    // L'admin voit TOUS les quartiers (actifs ou pas), triés par ordre alphabétique
    const quartiers = await Quartier.find({}).sort({ nom: 1 });
    return NextResponse.json({ success: true, data: quartiers });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}