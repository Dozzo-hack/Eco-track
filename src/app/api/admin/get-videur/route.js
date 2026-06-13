// Récupère un videur spécifique par son idChauffeur
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import Incident from "@/models/Incident";
import Quartier from "@/models/Quartier";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const idChauffeur = searchParams.get("id");

    if (!idChauffeur) {
      return NextResponse.json({ success: false, message: "ID manquant" }, { status: 400 });
    }

    // On cherche le videur par son idChauffeur
    const videur = await Videur.findOne({ idChauffeur: idChauffeur.toUpperCase() }).lean();

    if (!videur) {
      return NextResponse.json({ success: false, message: "Videur introuvable" }, { status: 404 });
    }

    // On récupère les noms des quartiers
    const quartiers = await Quartier.find({ _id: { $in: videur.quartiers } }).lean();
    const nomsQuartiers = quartiers.map(q => q.nom).join(", ");

    // On récupère les incidents actifs de ce videur
    const incidents = await Incident.find({
      videurId: videur._id,
      statut: { $in: ["En attente", "Pris en compte"] }
    }).sort({ createdAt: -1 }).lean();

    // On récupère l'historique complet des incidents
    const historique = await Incident.find({
      videurId: videur._id
    }).sort({ createdAt: -1 }).limit(20).lean();

    return NextResponse.json({
      success: true,
      data: {
        ...videur,
        zone: nomsQuartiers || "Non définie",
        incidentsActifs: incidents,
        historique: historique,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur get-videur:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}