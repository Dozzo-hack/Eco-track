import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import Incident from "@/models/Incident";
import Quartier from "@/models/Quartier";

export async function GET() {
  try {
    await connectDB();

    const videurs = await Videur.find({}).sort({ createdAt: -1 }).lean();
    const tousLesQuartiers = await Quartier.find({}).lean();
    
    const quartierMap = {};
    tousLesQuartiers.forEach(q => {
      quartierMap[q._id.toString()] = q.nom;
    });

    const incidentsActifs = await Incident.find({ 
      statut: { $in: ["En attente", "Pris en compte"] } 
    }).lean();

    const dataFusionnee = videurs.map(videur => {
      const incidentTrouve = incidentsActifs.find(
        inc => inc.videurId.toString() === videur._id.toString()
      );
      
      let zoneAffichage = "Non définie";
      if (videur.quartiers && videur.quartiers.length > 0) {
        const nomsQuartiers = videur.quartiers
          .map(id => {
            const idStr = id ? id.toString() : "";
            return quartierMap[idStr] || null;
          })
          .filter(nom => nom !== null);

        if (nomsQuartiers.length > 0) {
          zoneAffichage = nomsQuartiers.join(", ");
        }
      }

      return {
        ...videur,
        zone: zoneAffichage,
        incidentActuel: incidentTrouve ? incidentTrouve.type : null,
        incidentId: incidentTrouve ? incidentTrouve._id : null
      };
    });

    return NextResponse.json({ success: true, data: dataFusionnee }, { status: 200 });
  } catch (error) {
    console.error("Erreur complète dans GET videurs avec mapping quartiers:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors du traitement des données de la flotte" },
      { status: 500 }
    );
  }
}