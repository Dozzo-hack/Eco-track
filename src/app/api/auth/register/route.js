// src/app/api/auth/register/route.js
// Cette route gère l'inscription des nouveaux utilisateurs
// Elle est appelée quand l'utilisateur clique sur "S'inscrire"

// src/app/api/auth/register/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

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

    // 4. Hachage (chiffrement) du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Création de l'utilisateur en base de données
    const newUser = await User.create({
      nom,
      prenom,
      email,
      telephone,
      quartier,
      password: hashedPassword,
      role: "user", // Sécurité : on force le rôle user
    });

    return NextResponse.json(
      { message: "Utilisateur enregistré avec succès !", userId: newUser._id },
      { status: 201 } // 201 = Created
    );

  } catch (error) {
    console.error("Erreur lors de l'inscription de l'utilisateur:", error);
    return NextResponse.json(
      { message: "Erreur serveur, veuillez réessayer plus tard." },
      { status: 500 }
    );
  }
}