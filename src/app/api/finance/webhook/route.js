import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Campay envoie le statut du paiement dans le champ 'status'
    // Les valeurs courantes de succès sont "SUCCESSFUL" ou "SUCCESS"
    if (body.status === "SUCCESSFUL" || body.status === "SUCCESS") {
      const campayId = body.reference; // La référence de transaction propre à Campay
      const externalRef = body.external_reference; // Notre référence unique (TX-CPY-...)

      // Rechercher la transaction correspondante
      const transaction = await Transaction.findOne({ reference: externalRef });

      if (!transaction) {
        console.error(`[Webhook Campay] Transaction introuvable pour la référence externe: ${externalRef}`);
        return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
      }

      // Harmonisation avec l'API analytics et le dashboard : statut passe à "Réussi"
      if (transaction.statut !== "Réussi") {
        transaction.statut = "Réussi";
        transaction.metadata = {
          ...transaction.metadata,
          approvedAt: new Date().toISOString(),
          campayStatus: body.status,
          operatorResponse: body.operator_reference || ""
        };
        await transaction.save();

        console.log(`[Webhook Campay] 🎉 Transaction ${transaction.reference} validée avec succès ! (Statut : Réussi)`);
      }
    } else {
      console.log(`[Webhook Campay] Notification reçue avec statut non-géré : ${body.status}`);
    }

    // Répondre avec un code 200 pour confirmer à Campay la bonne réception
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur critique dans le Webhook Campay :", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}