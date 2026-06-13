import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import mongoose from "mongoose";
import Notification from "@/models/Notification"; // Ajuste le chemin selon ton dossier models

// Fonction utilitaire pour se connecter à Mongoose si ce n'est pas déjà fait
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function POST(req) {
  try {
    // 1. Vérification de la session (Sécurité)
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    // 2. Récupération des données envoyées par le frontend
    const body = await req.json();
    const { chauffeurId, titre, contenu, type } = body;

    // 3. Validation des champs obligatoires
    if (!chauffeurId || !titre || !contenu) {
      return NextResponse.json(
        { success: false, error: "Le chauffeur, le titre et le contenu sont obligatoires." },
        { status: 400 }
      );
    }

    // 4. Connexion à la base de données
    await connectDB();

    // 5. Création de la notification en base
    const nouvelleNotification = await Notification.create({
      chauffeurId,
      titre,
      contenu,
      type: type || "info", // "info" par défaut si non spécifié
    });

    // 6. Réponse de succès
    return NextResponse.json({
      success: true,
      message: "Notification envoyée au chauffeur avec succès",
      notification: nouvelleNotification,
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur lors de la création de la notification." },
      { status: 500 }
    );
  }
}