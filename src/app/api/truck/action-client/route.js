import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import CollecteAchevee from "@/models/CollecteAchevee"; 
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    // 1. CONTROLE D'ACCÈS ET SÉCURITÉ COMPTE Chauffeur/Videur
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Accès interdit. Session invalide." }, 
        { status: 401 }
      );
    }

    const videurUserId = session.user.id || session.user._id;
    
    // Vérification du statut actif du chauffeur
    const isVideur = await Videur.findOne({
      $and: [
        { statutActivite: "Actif" },
        {
          $or: [
            { _id: videurUserId },
            { userId: videurUserId }
          ]
        }
      ]
    });
    
    if (!isVideur) {
      return NextResponse.json(
        { success: false, message: "Action refusée. Vous devez être un chauffeur en mission active." }, 
        { status: 403 }
      );
    }

    // 2. EXTRACTION ET VALIDATION DES DONNÉES ENTRANTES
    const { targetClientId, actionType, planningId, chauffeurGps } = await req.json();

    if (!planningId) {
      return NextResponse.json(
        { success: false, message: "Erreur : ID de planification (Planning) manquant." }, 
        { status: 400 }
      );
    }

    const client = await User.findById(targetClientId);
    if (!client) {
      return NextResponse.json(
        { success: false, message: "Abonné introuvable ou QR code corrompu." }, 
        { status: 404 }
      );
    }

    // 3. SÉCURITÉ ANTI-FRAUDE STRICTE (MÉMOIRE DES PASSAGES)
    // RÈGLE A : Si le bac est déjà traité, on verrouille tout
    const bacDejaScanne = await CollecteAchevee.findOne({ 
      planningId, 
      clientId: targetClientId, 
      typeCollecte: "bac" 
    });
    
    if (bacDejaScanne) {
      return NextResponse.json({ 
        success: false, 
        message: "Cette collecte est clôturée définitivement (Bac déjà validé)." 
      }, { status: 400 });
    }

    // RÈGLE B : Limitation unitaire sur les points bonus de tri
    if (actionType === "BONUS_TRI") {
      const triDejaAttribue = await CollecteAchevee.findOne({ 
        planningId, 
        clientId: targetClientId, 
        typeCollecte: "tri" 
      });
      
      if (triDejaAttribue) {
        return NextResponse.json({ 
          success: false, 
          message: "Le bonus de tri a déjà été octroyé pour cette tournée." 
        }, { status: 400 });
      }
    }

    // 4. LOGIQUE DE GÉO-ANCRAGE ET MISE À JOUR MONGO_DB
    let coordsGeoJson = null;

    if (chauffeurGps && Array.isArray(chauffeurGps) && chauffeurGps.length === 2) {
      const statutGps = client.localisationCollecte?.statutEmplacement || "En attente";
      
      // Géo-ancrage unique au premier passage valide
      if (statutGps === "En attente" || statutGps === "À modifier") {
        coordsGeoJson = [Number(chauffeurGps[1]), Number(chauffeurGps[0])]; // Format GeoJSON officiel : [Longitude, Latitude]
        
        client.localisationCollecte = {
          type: "Point",
          coordinates: coordsGeoJson,
          statutEmplacement: "Validé",
          adresseTextuelle: client.localisationCollecte?.adresseTextuelle || ""
        };
        
        await User.updateOne(
          { _id: client._id },
          { $set: { localisationCollecte: client.localisationCollecte } }
        );
      } else {
        // Si déjà validé auparavant, on récupère les coordonnées existantes pour le SSE
        coordsGeoJson = client.localisationCollecte?.coordinates;
      }
    }

    // 5. CALCUL ET ATTRIBUTION DES POINTS ECO-TRACK
    let pointsAjoutes = 0;
    let messageRetour = "";
    const nomAffiche = client.nom || client.name || "Abonné";
    const soldeActuel = client.ecoPoints || client.points || 0;

    if (actionType === "SCAN_BAC") {
      pointsAjoutes = 10;
      messageRetour = `Vidange validée avec succès pour ${nomAffiche}. +10 points.`;
    } else if (actionType === "BONUS_TRI") {
      pointsAjoutes = 15;
      messageRetour = `Bonus de tri appliqué à ${nomAffiche}. +15 points.`;
    } else {
      return NextResponse.json({ success: false, message: "Type d'action non reconnu." }, { status: 400 });
    }

    // Égalisation des champs de points pour compatibilité ascendante
    client.ecoPoints = soldeActuel + pointsAjoutes;
    client.points = soldeActuel + pointsAjoutes;
    await client.save();

    // 6. ENREGISTREMENT HISTORIQUE ET TRANSACTIONS (IDEMPITENCE INDEX 11000)
    try {
      await CollecteAchevee.create({
        planningId,
        clientId: targetClientId,
        videurId: isVideur._id, 
        typeCollecte: actionType === "BONUS_TRI" ? "tri" : "bac" 
      });
    } catch (dbError) {
      if (dbError.code === 11000) {
        return NextResponse.json({ 
          success: false, 
          message: "Action déjà enregistrée et sécurisée en base de données." 
        }, { status: 400 });
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
      console.warn("[Transaction Warning] Échec log transaction secondaire:", eLog.message);
    }

    // 7. 📡 TRANSMISSION EN DIRECT VIA PIPELINE SSE ULTRA-STABLE
    // On prépare deux structures de coordonnées pour éviter tout conflit côté frontend (Leaflet vs Mapbox)
    const latLngLeaflet = coordsGeoJson ? [coordsGeoJson[1], coordsGeoJson[0]] : null; // [Lat, Lng]

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
          statutEmplacement: "Validé",
          coordinates: coordsGeoJson,   // Format [Lng, Lat] (MongoDB / Mapbox)
          location: latLngLeaflet       // Format [Lat, Lng] (Leaflet standard)
        })
      });
    } catch (sseError) {
      console.error("[SSE Pipeline Error] Échec de la notification instantanée:", sseError.message);
      // On ne bloque pas le retour client si le service SSE a eu un micro-clignotement
    }

    // 8. RÉPONSE FINALE NETTE POUR LE TERMINAL VIDEUR
    return NextResponse.json({
      success: true,
      message: messageRetour,
      clientName: nomAffiche,
      nouveauSoldePoints: client.points,
      gpsStatut: "Validé"
    });

  } catch (error) {
    console.error("[Fatal Error Action Client]:", error);
    return NextResponse.json(
      { success: false, message: "Une erreur interne est survenue lors du traitement." }, 
      { status: 500 }
    );
  }
}