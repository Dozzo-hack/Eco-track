// Active ou désactive un videur (le met au garage)
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";

export async function POST(request) {
  try {
    await connectDB();

    const { idChauffeur } = await request.json();

    if (!idChauffeur) {
      return NextResponse.json(
        { success: false, message: "ID Chauffeur manquant" },
        { status: 400 }
      );
    }

    // On trouve le videur
    const videur = await Videur.findOne({ idChauffeur: idChauffeur.toUpperCase() });

    if (!videur) {
      return NextResponse.json(
        { success: false, message: "Videur introuvable" },
        { status: 404 }
      );
    }

    // On inverse l'état actif
    const nouvelEtat = !videur.actif;
    const nouveauStatut = nouvelEtat ? "Actif" : "Inactif";

    await Videur.findByIdAndUpdate(videur._id, {
      actif: nouvelEtat,
      statutActivite: nouveauStatut,
    });

    return NextResponse.json({
      success: true,
      message: `Videur ${nouvelEtat ? "activé" : "désactivé"} avec succès`,
      actif: nouvelEtat,
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur toggle-videur:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}