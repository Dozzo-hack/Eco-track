// Récupère les notifications envoyées à un videur
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import Videur from "@/models/Videur";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const idChauffeur = searchParams.get("id");

    if (!idChauffeur) {
      return NextResponse.json({ success: false, message: "ID manquant" }, { status: 400 });
    }

    const videur = await Videur.findOne({ idChauffeur: idChauffeur.toUpperCase() });

    if (!videur) {
      return NextResponse.json({ success: false, message: "Videur introuvable" }, { status: 404 });
    }

    const notifications = await Notification.find({ chauffeurId: videur._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, data: notifications }, { status: 200 });

  } catch (error) {
    console.error("Erreur get-notifications:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}