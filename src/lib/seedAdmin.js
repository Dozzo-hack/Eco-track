// src/lib/seedAdmin.js
// Crée l'admin par défaut dans MongoDB si il n'existe pas encore
// Appelé automatiquement à chaque tentative de connexion admin

import connectDB from "./mongodb";
import Admin from "../models/Admin"; // import relatif pour éviter les conflits
import bcrypt from "bcryptjs";

export async function seedAdmin() {
  try {
    await connectDB();

    // On vérifie si l'admin existe déjà
    const adminExiste = await Admin.findOne({ identifiant: "ADM-2026" });

    if (adminExiste) {
      // Admin déjà en BD, rien à faire
      return;
    }

    // On chiffre le mot de passe avant de l'insérer
    const passwordChiffre = await bcrypt.hash("admin123", 10);

    // On crée l'admin dans MongoDB
    await Admin.create({
      identifiant: "ADM-2026",
      password: passwordChiffre,
      nom: "Administrateur Principal",
      role: "admin",
    });

    console.log("✅ Admin créé en BD !");
    console.log("   Identifiant : ADM-2026");
    console.log("   Mot de passe : admin123");

  } catch (error) {
    console.error("❌ Erreur seedAdmin:", error);
  }
}