// Envoie une notification/instruction à un videur
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import Videur from "@/models/Videur";

export async function POST(request) {
  try {
    await connectDB();

    const { idChauffeur, titre, contenu, type } = await request.json();

    if (!idChauffeur || !titre || !contenu) {
      return NextResponse.json(
        { success: false, message: "Champs manquants" },
        { status: 400 }
      );
    }

    // On trouve le videur pour avoir son _id MongoDB
    const videur = await Videur.findOne({ idChauffeur: idChauffeur.toUpperCase() });

    if (!videur) {
      return NextResponse.json(
        { success: false, message: "Videur introuvable" },
        { status: 404 }
      );
    }

    // On crée la notification en BD
    const notification = await Notification.create({
      chauffeurId: videur._id,
      titre,
      contenu,
      type: type || "info",
      lue: false,
    });

    return NextResponse.json({
      success: true,
      message: "Notification envoyée avec succès",
      data: notification,
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur send-notification:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}