// src/app/api/auth/videur/route.js
// Connexion spéciale pour les videurs
// Ils utilisent leur ID Chauffeur + Code PIN (pas d'email)

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    // On récupère l'ID chauffeur et le PIN depuis le formulaire /auth/truck
    const { idChauffeur, codePin } = await request.json();

    if (!idChauffeur || !codePin) {
      return NextResponse.json(
        { message: "ID Chauffeur et Code PIN requis" },
        { status: 400 }
      );
    }

    await connectDB();

    // On cherche le videur par son ID (en majuscule pour cohérence)
    const videur = await Videur.findOne({
      idChauffeur: idChauffeur.toUpperCase(),
    });

    // Videur introuvable
    if (!videur) {
      return NextResponse.json(
        { message: "ID Chauffeur ou Code PIN incorrect" },
        { status: 401 }
      );
    }

    // On vérifie si le videur est actif (pas suspendu par l'admin)
    if (!videur.actif) {
      return NextResponse.json(
        { message: "Ce compte a été désactivé. Contactez l'administrateur." },
        { status: 403 } // 403 = accès interdit
      );
    }

    // On compare le PIN entré avec celui chiffré en BD
    const pinCorrect = await bcrypt.compare(codePin, videur.codePin);

    if (!pinCorrect) {
      return NextResponse.json(
        { message: "ID Chauffeur ou Code PIN incorrect" },
        { status: 401 }
      );
    }

    // Connexion réussie
    return NextResponse.json(
      {
        message: "Service démarré !",
        videur: {
          id: videur._id,
          nom: videur.nom,
          prenom: videur.prenom,
          idChauffeur: videur.idChauffeur,
          zone: videur.zone,
          role: videur.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur connexion videur:", error);
    return NextResponse.json(
      { message: "Erreur serveur, réessaye plus tard" },
      { status: 500 }
    );
  }
}