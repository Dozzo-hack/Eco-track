// src/app/api/auth/admin/route.js
// Cette route n'est plus utilisée directement
// La connexion admin passe par NextAuth [...nextauth]
// On la garde juste pour compatibilité

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import { seedAdmin } from "@/lib/seedAdmin";

export async function GET() {
  return NextResponse.json({ message: "Utilisez NextAuth pour la connexion" });
}

export async function POST(request) {
  // On s'assure que l'admin existe en BD avant chaque tentative de connexion
  await seedAdmin();

  try {
    // On récupère l'identifiant et le mot de passe du formulaire /auth/admin
    const { identifiant, password } = await request.json();

    if (!identifiant || !password) {
      return NextResponse.json(
        { message: "Identifiant et mot de passe requis" },
        { status: 400 }
      );
    }

    await connectDB();

    // On cherche l'admin par son identifiant (en majuscule)
    const admin = await Admin.findOne({
      identifiant: identifiant.toUpperCase(),
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Identifiant ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Comparaison du mot de passe
    const passwordCorrect = await bcrypt.compare(password, admin.password);

    if (!passwordCorrect) {
      return NextResponse.json(
        { message: "Identifiant ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Connexion admin réussie
    return NextResponse.json(
      {
        message: "Accès autorisé !",
        admin: {
          id: admin._id,
          nom: admin.nom,
          identifiant: admin.identifiant,
          role: admin.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur connexion admin:", error);
    return NextResponse.json(
      { message: "Erreur serveur, réessaye plus tard" },
      { status: 500 }
    );
  }
}