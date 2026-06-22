import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User"; // Importation de ton modèle User validé

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    console.log(`[Webhook Campay] Notification reçue. Statut Campay : ${body.status}`);

    // 1. GESTION DU SUCCÈS
    if (body.status === "SUCCESSFUL" || body.status === "SUCCESS") {
      const campayId = body.reference; 
      const externalRef = body.external_reference; 

      // Rechercher la transaction correspondante
      const transaction = await Transaction.findOne({ reference: externalRef });

      if (!transaction) {
        console.error(`[Webhook Campay] Transaction introuvable pour la référence externe: ${externalRef}`);
        return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
      }

      // Si la transaction n'est pas encore marquée comme "Réussi"
      if (transaction.statut !== "Réussi") {
        transaction.statut = "Réussi";
        transaction.metadata = {
          ...transaction.metadata,
          approvedAt: new Date().toISOString(),
          campayStatus: body.status,
          operatorResponse: body.operator_reference || ""
        };
        await transaction.save();

        console.log(`[Webhook Campay] 🎉 Transaction ${transaction.reference} validée avec succès !`);

        // RÉCUPÉRATION DE L'ID UTILISATEUR
        const userId = transaction.userId || transaction.user;

        if (userId) {
          // Calcul des dates (Abonnement de 30 jours)
          const dateDebut = new Date();
          const dateFin = new Date();
          dateFin.setDate(dateFin.getDate() + 30);

          // Extraction du type d'abonnement s'il est stocké dans les métadonnées de ta transaction
          const typeAbonnement = transaction.metadata?.planType || transaction.typeAbonnement || "FOYER ÉCO";

          // MISE À JOUR RESPECTANT TON MODÈLE USER.JS
          await User.findByIdAndUpdate(userId, {
            $set: {
              "abonnement.statut": "Actif", // Changement ici pour cibler l'objet imbriqué
              "abonnement.type": typeAbonnement,
              "abonnement.dateDebut": dateDebut,
              "abonnement.dateFin": dateFin,
              "abonnement.derniereTransactionRef": transaction.reference
            }
          });

          console.log(`[Webhook Campay] 👤 L'abonnement de l'utilisateur ${userId} a été activé jusqu'au ${dateFin.toLocaleDateString()}.`);
        } else {
          console.error(`[Webhook Campay] ⚠️ Aucun userId trouvé lié à la transaction ${transaction.reference}`);
        }
      }
    } 
    
    // 2. GESTION DE L'ÉCHEC
    else if (body.status === "FAILED") {
      const externalRef = body.external_reference;
      const transaction = await Transaction.findOne({ reference: externalRef });
      
      if (transaction && transaction.statut !== "Échoué") {
        transaction.statut = "Échoué";
        await transaction.save();
        
        console.log(`[Webhook Campay] ❌ Transaction ${transaction.reference} marquée comme Échouée.`);
        
        // Optionnel : Passer l'abonnement en "Inactif" si la transaction échoue
        const userId = transaction.userId || transaction.user;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            $set: { "abonnement.statut": "Inactif" }
          });
        }
      }
    } 
    
    // 3. STATUT INCONNU OU REJETÉ
    else {
      console.log(`[Webhook Campay] Statut non-géré reçu : ${body.status}`);
    }

    // Toujours répondre avec un code 200 à Campay pour accuser réception
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur critique dans le Webhook Campay :", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}