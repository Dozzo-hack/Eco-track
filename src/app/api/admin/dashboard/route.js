import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Collecte from "@/models/Collecte";
import Videur from "@/models/Videur";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    // Gestion des dates pour les filtres
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Exécution de toutes les requêtes en parallèle pour optimiser la vitesse
    const [
      clientsActifs,
      camionsEnRoute,
      collectesDuJour,
      revenusData
    ] = await Promise.all([
      // 1. Clients Actifs
      User.countDocuments({ "abonnement.statut": { $in: ["Actif", "actif"] } }),
      
      // 2. Camions en route (Basé sur les Videurs actifs)
      Videur.countDocuments({ statutActivite: "Actif" }),
      
      // 3. Collectes du jour
      Collecte.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } }),
      
      // 4. Revenu Mensuel
      Transaction.aggregate([
        { $match: { statut: "Réussi", createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$montant" } } }
      ])
    ]);

    // Calcul du revenu total (0 si aucune transaction)
    const totalRevenu = revenusData.length > 0 ? revenusData[0].total : 0;

    return NextResponse.json({
      success: true,
      stats: {
        clientsActifs,
        camionsEnRoute: `${camionsEnRoute}/10`, // 10 est ta capacité totale visible
        collectes: collectesDuJour,
        revenuMensuel: `${(totalRevenu / 1000000).toFixed(1)}M FCFA`
      }
    });

  } catch (error) {
    console.error("Erreur API Dashboard:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}