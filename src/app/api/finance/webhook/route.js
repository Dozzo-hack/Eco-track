import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // On écoute l'événement d'approbation de transaction de FedaPay
    if (body.event === "transaction.approved") {
      const fedaTransaction = body.entity;
      const fedaId = fedaTransaction.id;

      // Retrouver la transaction dans ta DB par l'ID FedaPay stocké dans les métadonnées
      const transaction = await Transaction.findOne({ "metadata.fedaTransactionId": fedaId });

      if (!transaction) {
        console.error(`[Webhook FedaPay] Transaction introuvable pour l'ID FedaPay: ${fedaId}`);
        return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
      }

      if (transaction.statut !== "Payé") {
        transaction.statut = "Payé";
        transaction.metadata = {
          ...transaction.metadata,
          approvedAt: fedaTransaction.approved_at,
          modePaiement: fedaTransaction.mode
        };
        await transaction.save();

        console.log(`[Webhook] 🎉 Transaction ${transaction.reference} validée avec succès !`);
      }
    }

    // FedaPay demande un statut 200 pour confirmer la bonne réception du webhook
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Erreur critique dans le Webhook FedaPay :", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}