import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose"; // Importation requise pour générer un ID valide

const authOptions = {}; 

export async function POST(req) {
  try {
    await connectDB();
    
    // Récupération de la session
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const { recompenseId, name, price } = await req.json();

    // 1. Validation basique des données
    if (!recompenseId || !name || price === undefined) {
      return NextResponse.json(
        { success: false, message: "Données de la récompense manquantes." },
        { status: 400 }
      );
    }

    // 2. Récupérer l'utilisateur
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    // 3. Vérifier le solde de points
    if ((user.points || 0) < price) {
      return NextResponse.json(
        { success: false, message: `Points insuffisants. Il vous faut ${price} points.` },
        { status: 400 }
      );
    }

    // =========================================================================
    // CORRECTION DU TYPE : Validation et conversion sécurisée pour l'ObjectId Mongoose
    // =========================================================================
    let validatedObjectId;
    if (mongoose.Types.ObjectId.isValid(recompenseId)) {
      validatedObjectId = recompenseId;
    } else {
      // Si l'id est "1", "2", etc., on crée un ObjectId unique basé sur une génération propre
      validatedObjectId = new mongoose.Types.ObjectId();
    }

    // Préparation de l'objet d'historique
    const nouvelEchange = {
      recompenseId: validatedObjectId, // Injecté sous forme d'un vrai ObjectId valide
      name: name,
      price: Number(price),
      statut: "En attente",
      dateEchange: new Date()
    };

    if (!user.recompensesEchangees) {
      user.recompensesEchangees = [];
    }

    // Déduction des points et ajout à l'historique
    user.points -= price;
    user.recompensesEchangees.push(nouvelEchange);

    // Sauvegarde en base de données
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Félicitations ! Votre récompense a été enregistrée.",
      remainingPoints: user.points,
      recompenses: user.recompensesEchangees
    });

  } catch (error) {
    console.error("====== ERREUR CRITIQUE API ======", error);
    return NextResponse.json(
      { success: false, message: `Erreur interne : ${error.message || "Traitement échoué"}` },
      { status: 500 }
    );
  }
}