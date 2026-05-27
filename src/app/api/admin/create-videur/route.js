// src/app/api/admin/create-videur/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    // 1. Sécurité : Vérifier si la personne qui appelle cette API est connectée et est ADMIN
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Accès refusé. Seul l'administrateur peut effectuer cette action." },
        { status: 403 } // 403 = Interdit
      );
    }

    // 2. Récupérer les données envoyées par le dashboard Admin
    const { nom, prenom, idChauffeur, codePin, zone } = await request.json();

    if (!nom || !prenom || !idChauffeur || !codePin || !zone) {
      return NextResponse.json(
        { message: "Tous les champs sont obligatoires pour créer un chauffeur." },
        { status: 400 }
      );
    }

    await connectDB();

    // 3. Vérifier si l'ID Chauffeur existe déjà
    const formattedId = idChauffeur.toUpperCase().trim();
    const videurExists = await Videur.findOne({ idChauffeur: formattedId });
    if (videurExists) {
      return NextResponse.json(
        { message: `L'ID Chauffeur "${formattedId}" est déjà attribué.` },
        { status: 400 }
      );
    }

    // 4. Hachage du code PIN (comme pour un mot de passe classique)
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(codePin.toString(), salt);

    // 5. Sauvegarde dans la base de données
    const newVideur = await Videur.create({
      nom,
      prenom,
      idChauffeur: formattedId,
      codePin: hashedPin,
      zone,
      role: "videur",
      actif: true
    });

    return NextResponse.json(
      { message: "Compte chauffeur/videur créé avec succès !", id: newVideur._id },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur lors de la création du videur par l'admin:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}