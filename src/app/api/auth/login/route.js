// src/app/api/auth/login/route.js
// Cette route gère la connexion des utilisateurs normaux
// Appelée quand l'utilisateur clique sur "Se connecter"

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    // On récupère email et mot de passe envoyés depuis le formulaire
    const { email, password } = await request.json();

    // Vérification basique
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Connexion à la BD
    await connectDB();

    // On cherche l'utilisateur par son email
    const user = await User.findOne({ email });

    // Si aucun utilisateur trouvé → on refuse
    if (!user) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401 } // 401 = non autorisé
      );
    }

    // On compare le mot de passe tapé avec celui chiffré dans la BD
    const passwordCorrect = await bcrypt.compare(password, user.password);

    if (!passwordCorrect) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Connexion réussie ! On retourne les infos utiles
    return NextResponse.json(
      {
        message: "Connexion réussie !",
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          quartier: user.quartier,
          role: user.role,
        },
      },
      { status: 200 } // 200 = succès
    );
  } catch (error) {
    console.error("Erreur connexion:", error);
    return NextResponse.json(
      { message: "Erreur serveur, réessaye plus tard" },
      { status: 500 }
    );
  }
}