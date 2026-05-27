import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Incident from "@/models/Incident";
import Videur from "@/models/Videur";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    // 1. Connexion à la base de données
    await connectDB();

    // 2. Vérification de la session du chauffeur connecté
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Non authentifié. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    const chauffeurUserId = session.user.id || session.user._id;

    // 3. Récupération du profil "Videur" associé à cet utilisateur
    const videur = await Videur.findOne({
      $or: [{ _id: chauffeurUserId }, { userId: chauffeurUserId }]
    });

    if (!videur) {
      return NextResponse.json(
        { success: false, message: "Profil Chauffeur/Videur introuvable." },
        { status: 404 }
      );
    }

    // 4. Extraction des données envoyées par le front-end
    const body = await req.json();
    const { type, details, photo, localisation } = body;

    // Validation stricte des données requises par le modèle
    if (!type) {
      return NextResponse.json(
        { success: false, message: "Le type d'incident est obligatoire." },
        { status: 400 }
      );
    }

    // 5. Création et sauvegarde de l'incident en base de données
    const nouvelIncident = new Incident({
      videurId: videur._id, // Liaison avec l'ID de la collection Videurs
      type,
      details: details || "",
      photo: photo || null, // Chaîne de caractères contenant le Base64
      localisation: localisation || { latitude: null, longitude: null },
      statut: "En attente"
    });

    await nouvelIncident.save();

    // 6. Réponse de succès
    return NextResponse.json({
      success: true,
      message: "Incident enregistré avec succès et transmis à l'administration.",
      incident: nouvelIncident
    });

  } catch (error) {
    console.error("Erreur API Enregistrement Incident:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne lors de la soumission de l'incident." },
      { status: 500 }
    );
  }
}