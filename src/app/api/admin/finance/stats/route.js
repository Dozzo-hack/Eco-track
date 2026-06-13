import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    // 1. Chiffre d'Affaire Global (Statut adapté à CamPay: "Réussi")
    const caAggregator = await Transaction.aggregate([
      { $match: { statut: "Réussi" } },
      { $group: { _id: null, total: { $sum: "$montant" } } }
    ]);
    const chiffreAffairesTotal = caAggregator[0]?.total || 0;

    const transactionsEnAttente = await Transaction.countDocuments({ statut: "En attente" });

    const fluxRecents = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("reference userName montant operateur statut createdAt typeAbonnement")
      .lean();

    // 2. Calcul des revenus des 3 premiers mois
    const anneeCourante = new Date().getFullYear();
    
    const calculMois = async (numMois) => {
      const res = await Transaction.aggregate([
        {
          $match: {
            statut: "Réussi",
            createdAt: {
              $gte: new Date(anneeCourante, numMois, 1),
              $lt: new Date(anneeCourante, numMois + 1, 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: "$montant" } } }
      ]);
      return res[0]?.total || 0;
    };

    const janvTotal = await calculMois(0);
    const fevrTotal = await calculMois(1);
    const marsTotal = await calculMois(2);
    const totalTrimestre = janvTotal + fevrTotal + marsTotal;

    // 3. MOTEUR DE PRÉVISION MATHÉMATIQUE
    const xValues = [1, 2, 3];
    const yValues = [janvTotal, fevrTotal, marsTotal];
    
    const xMean = 2;
    const yMean = (janvTotal + fevrTotal + marsTotal) / 3;
    
    let num = 0;
  	let den = 0;
    for (let i = 0; i < 3; i++) {
      num += (xValues[i] - xMean) * (yValues[i] - yMean);
      den += Math.pow(xValues[i] - xMean, 2);
    }
    
    const slopeA = den !== 0 ? num / den : 0;
    const interceptB = yMean - (slopeA * xMean);

    const projectionRegression = Math.round((slopeA * 4) + interceptB);

    const projectionMoyenneMobile = totalTrimestre > 0 
      ? Math.round((janvTotal * 0.1) + (fevrTotal * 0.3) + (marsTotal * 0.6))
      : 0;

    const projectionOptimaleAvril = projectionRegression > 0 
      ? Math.round((projectionRegression + projectionMoyenneMobile) / 2)
      : Math.max(0, projectionMoyenneMobile);

    return NextResponse.json({
      success: true,
      summary: {
        chiffreAffaires: chiffreAffairesTotal,
        enAttente: transactionsEnAttente,
        // Marge nette après frais CamPay (environ 2.5% ou 3% selon tes vagues d'opérateurs MTN/Orange)
        soldeRetirable: Math.round(chiffreAffairesTotal * 0.975) 
      },
      graphique: [
        { mois: "Jan", montant: janvTotal, height: janvTotal > 0 ? "60%" : "10%" },
        { mois: "Fév", montant: fevrTotal, height: fevrTotal > janvTotal ? "75%" : "40%" },
        { mois: "Mar", montant: marsTotal, height: "100%" }
      ],
      analytics: {
        totalTrimestre,
        panierMoyen: totalTrimestre > 0 ? Math.round(totalTrimestre / await Transaction.countDocuments({ statut: "Réussi" })) : 0,
        previsions: {
          mois: "Avril",
          methodeTendance: Math.max(0, projectionRegression),
          methodeLissage: projectionMoyenneMobile,
          valeurRetenue: projectionOptimaleAvril,
          tauxCroissanceEstime: slopeA > 0 && yMean > 0 ? ((slopeA / yMean) * 100).toFixed(1) + "%" : "0%"
        }
      },
      fluxRecents
    });

  } catch (error) {
    console.error("Erreur API Analytics CamPay :", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}