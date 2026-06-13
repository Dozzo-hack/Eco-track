import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import CollecteAchevee from "@/models/CollecteAchevee"; 
import Planning from "@/models/Planning"; 
import Commande from "@/models/Commande"; // 👈 Indispensable pour la vérification Premium
import { Types } from "mongoose"; 
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Accès interdit. Session invalide." }, { status: 401 });
    }

    const videurUserId = session.user.id || session.user._id;
    
    const isVideur = await Videur.findOne({
      $and: [
        { statutActivite: "Actif" },
        { $or: [{ _id: videurUserId }, { userId: videurUserId }] }
      ]
    });
    
    if (!isVideur) {
      return NextResponse.json({ success: false, message: "Action refusée. Vous devez être un chauffeur actif." }, { status: 403 });
    }

    const { targetClientId, actionType, planningId, chauffeurGps, poids } = await req.json();

    if (!planningId) {
      return NextResponse.json({ success: false, message: "Erreur : ID de planification manquant." }, { status: 400 });
    }

    const client = await User.findById(targetClientId);
    if (!client) {
      return NextResponse.json({ success: false, message: "Abonné introuvable." }, { status: 404 });
    }

    let mesQuartiersIds = Array.isArray(isVideur.quartiers) ? isVideur.quartiers : [];
    const aAccesATout = isVideur.role === "super_videur" || mesQuartiersIds.some(q => String(q).toUpperCase() === "TOUS");

    if (!aAccesATout) {
      if (!Types.ObjectId.isValid(planningId)) {
        return NextResponse.json({ success: false, message: "Format de planification invalide." }, { status: 400 });
      }

      // 🚀 DOUBLE RECHERCHE : Planning Standard OU Commande Premium
      let isCommandePremium = false;
      let planningEnCours = await Planning.findById(new Types.ObjectId(planningId));
      
      if (!planningEnCours) {
        planningEnCours = await Commande.findById(new Types.ObjectId(planningId));
        if (planningEnCours) isCommandePremium = true;
      }

      if (!planningEnCours) {
        return NextResponse.json({ success: false, message: "Session de collecte introuvable." }, { status: 404 });
      }

      if (isCommandePremium) {
         // Validation de sécurité pour la Commande Premium
         if (planningEnCours.videurId?.toString() !== isVideur._id.toString()) {
           return NextResponse.json({ success: false, message: "Vous n'êtes pas le chauffeur assigné à cette commande." }, { status: 403 });
         }
      } else {
         // Validation de sécurité classique pour les Plannings
         const qField = planningEnCours.quartier || planningEnCours.quartiers;
         const quartierIdPlanning = qField ? qField.toString() : "";
         const isAssignationDirecte = planningEnCours.videurId?.toString() === isVideur._id.toString() || planningEnCours.chauffeurId?.toString() === isVideur._id.toString();

         const aLaPermission = mesQuartiersIds.some(id => id.toString() === quartierIdPlanning) || isAssignationDirecte;

         if (!aLaPermission) {
           return NextResponse.json({ success: false, message: "Sécurité : Vous n'êtes pas assigné à ce secteur." }, { status: 403 });
         }
      }
    }

    if (actionType === "SCAN_BAC") {
      const bacDejaScanne = await CollecteAchevee.findOne({ planningId, clientId: targetClientId, typeCollecte: "bac" });
      if (bacDejaScanne) {
        return NextResponse.json({ success: false, message: "Cette vidange est déjà clôturée pour cette demande." }, { status: 400 });
      }
    }

    if (actionType === "BONUS_TRI") {
      const triDejaAttribue = await CollecteAchevee.findOne({ planningId, clientId: targetClientId, typeCollecte: "tri" });
      if (triDejaAttribue) {
        return NextResponse.json({ success: false, message: "Le bonus de tri a déjà été octroyé." }, { status: 400 });
      }
    }

    let coordsGeoJson = null;
    if (chauffeurGps && Array.isArray(chauffeurGps) && chauffeurGps.length === 2) {
      const statutGps = client.localisationCollecte?.statutEmplacement || "En attente";
      if (statutGps === "En attente" || statutGps === "À modifier") {
        coordsGeoJson = [Number(chauffeurGps[1]), Number(chauffeurGps[0])]; 
        client.localisationCollecte = {
          type: "Point",
          coordinates: coordsGeoJson,
          statutEmplacement: "Validé",
          adresseTextuelle: client.localisationCollecte?.adresseTextuelle || ""
        };
        await User.updateOne({ _id: client._id }, { $set: { localisationCollecte: client.localisationCollecte } });
      } else {
        coordsGeoJson = client.localisationCollecte?.coordinates;
      }
    }

    let pointsAjoutes = actionType === "SCAN_BAC" ? 10 : 15;
    const nomAffiche = client.nom || client.name || "Abonné";
    const soldeActuel = client.ecoPoints || client.points || 0;
    const nouveauSolde = soldeActuel + pointsAjoutes;

    const poidsCollecte = parseFloat(poids) || 5; 
    const co2Ajoute = parseFloat((poidsCollecte * 1.5).toFixed(1)); 
    const eauAjoutee = Math.round(poidsCollecte * 4); 
    const arbresAjoutes = parseFloat((poidsCollecte * 0.05).toFixed(2)); 
    const moisActuel = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'][new Date().getMonth()];

    await User.findByIdAndUpdate(client._id, {
      $set: { ecoPoints: nouveauSolde, points: nouveauSolde },
      $inc: {
        "poidsTotalNum": poidsCollecte, 
        "impact.co2Evite": co2Ajoute,
        "impact.eauEconomisee": eauAjoutee,
        "impact.arbresSauves": arbresAjoutes,
        [`impact.poidsMensuel.${moisActuel}`]: poidsCollecte 
      }
    });

    try {
      await CollecteAchevee.create({
        planningId,
        clientId: targetClientId,
        videurId: isVideur._id, 
        typeCollecte: actionType === "BONUS_TRI" ? "tri" : "bac" 
      });
    } catch (dbError) {
      if (dbError.code === 11000) {
        return NextResponse.json({ success: false, message: "Action déjà sécurisée en base." }, { status: 400 });
      }
      throw dbError;
    }

    try {
      await Transaction.create({
        userId: client._id,
        type: "Gain",
        points: pointsAjoutes,
        description: actionType === "SCAN_BAC" ? "Collecte Bac Ordinaire" : "Bonus Tri Sélectif Camion",
        date: new Date()
      });
    } catch (eLog) {
      console.warn("Transaction Error:", eLog.message);
    }

    const latLngLeaflet = coordsGeoJson ? [coordsGeoJson[1], coordsGeoJson[0]] : null;
    try {
      const sseOrigin = process.env.NEXTAUTH_URL || "http://localhost:3000";
      await fetch(`${sseOrigin}/api/live-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamType: "collecte-update",
          clientId: client._id.toString(),
          planningId: planningId,
          actionType: actionType,
          status: "Validé",
          coordinates: coordsGeoJson,   
          location: latLngLeaflet       
        })
      });
    } catch (sseError) {}

    return NextResponse.json({
      success: true,
      message: actionType === "SCAN_BAC" ? `Vidange validée pour ${nomAffiche}.` : `Bonus de tri appliqué.`,
      clientName: nomAffiche,
      nouveauSoldePoints: nouveauSolde
    });

  } catch (error) {
    console.error("Action Client Error:", error);
    return NextResponse.json({ success: false, message: "Une erreur interne est survenue." }, { status: 500 });
  }
}