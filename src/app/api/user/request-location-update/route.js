import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ajuste le chemin si nécessaire
import { MongoClient, ObjectId } from "mongodb";

// Initialisation du client MongoDB standard
const client = new MongoClient(process.env.MONGODB_URI);

export async function POST(req) {
  try {
    // 1. Vérification de la session utilisateur
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id || session.user._id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "ID utilisateur introuvable" }, { status: 400 });
    }

    // 2. Connexion à la base de données
    await client.connect();
    const db = client.db("EcoTrackDB");

    // 3. Réinitialisation du statut de localisation de l'utilisateur
    // Quand il clique sur "Changer ma localisation", son statut doit repasser à "En attente" 
    // pour qu'il puisse soumettre de nouvelles coordonnées ou attendre le passage du chauffeur.
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          "localisationCollecte.statutEmplacement": "En attente",
          "localisationCollecte.updatedAt": new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Le statut de localisation a été réinitialisé avec succès." 
    });

  } catch (error) {
    console.error("Erreur lors du changement de localisation :", error);
    return NextResponse.json({ success: false, error: "Erreur interne du serveur" }, { status: 500 });
  } finally {
    // Fermeture propre de la connexion
    await client.close();
  }
}