import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { action } = await req.json();
    const videurId = session.user.id;

    // Détermine le nouveau statut d'activité
    const nouveauStatut = action === "START" ? "Actif" : "Inactif";

    // CORRECTION : variable renommée proprement et fonction Mongoose corrigée
    const videurMisAJour = await Videur.findByIdAndUpdate(
      videurId,
      { statutActivite: nouveauStatut },
      { new: true }
    );

    if (!videurMisAJour) {
      return NextResponse.json({ success: false, message: "Profil Chauffeur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: action === "START" ? "Tournée démarrée avec succès !" : "Tournée terminée.",
      statutActivite: videurMisAJour.statutActivite
    });

  } catch (error) {
    console.error("Erreur Tournée API:", error);
    return NextResponse.json({ success: false, message: "Erreur interne du serveur" }, { status: 500 });
  }
}