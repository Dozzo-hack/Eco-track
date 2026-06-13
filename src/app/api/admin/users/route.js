// src/app/api/admin/users/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    // Récupérer tous les utilisateurs de la collection 'users'
    const usersCursor = await db.collection("users").find({});
    const realUsers = await usersCursor.toArray();

    // Formater les données pour qu'elles correspondent à l'UI
    const formattedUsers = realUsers.map(user => ({
      id: user._id.toString(), // On convertit l'ObjectId de MongoDB en String
      nom: user.name || user.nom || "Utilisateur Sans Nom",
      quartier: user.quartier|| "Non spécifié",
      plan: (user.plan || "STANDARD").toUpperCase(),
      points: user.points || 0,
      statut: user.statut || "Actif"
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("Erreur récupération liste utilisateurs:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la récupération" }, { status: 500 });
  }
}