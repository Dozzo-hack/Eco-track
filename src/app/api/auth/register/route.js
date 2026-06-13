import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    const { nom, prenom, email, telephone, quartier, password } = await request.json();

    // 1. Validation basique des données reçues
    if (!nom || !prenom || !email || !telephone || !quartier || !password) {
      return NextResponse.json(
        { message: "Tous les champs sont obligatoires." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    // 2. Connexion à la base de données
    await connectDB();

    // 3. Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé par un autre compte." },
        { status: 400 }
      );
    }

    // 4. RÉCUPÉRATION DE L'OBJECTID DU QUARTIER
    const quartiersCollection = mongoose.connection.db.collection("quartiers");
    const quartierDoc = await quartiersCollection.findOne({
      nom: { $regex: `^${quartier.trim()}$`, $options: "i" }
    });

    // Si le quartier n'existe pas dans la base de données admin
    if (!quartierDoc) {
      return NextResponse.json(
        { message: `Le quartier "${quartier}" n'est pas encore enregistré ou actif dans le système.` },
        { status: 400 }
      );
    }

    // 5. Hachage (chiffrement) du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Création de l'utilisateur avec abonnement Inactif / Bloqué par défaut
    const newUser = await User.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone.trim(),
      quartier: quartierDoc._id, 
      password: hashedPassword,
      role: "user",
      abonnement: {
        statut: "Inactif", // 🔥 Devient inactif par défaut : n'apparaîtra PAS sur la feuille de route du camion
        type: "Aucun",     // 🔥 "Aucun" ou chaîne vide tant que le choix du forfait et le paiement ne sont pas validés
        dateDebut: null    // Sera initialisé au moment exact du webhook de paiement réussi
      },
      points: 0,
      ecoPoints: 0
    });

    return NextResponse.json(
      { message: "Utilisateur enregistré avec succès ! Veuillez procéder au paiement pour activer votre compte.", userId: newUser._id },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur lors de l'inscription de l'utilisateur:", error);
    return NextResponse.json(
      { message: "Erreur serveur, veuillez réessayer plus tard." },
      { status: 500 }
    );
  }
}