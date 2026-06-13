// src/app/api/finance/subscribe/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Pricing from "@/models/Pricing";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    await connectDB();

    // 1. Vérification de la session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Session expirée. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }
    const userId = session.user.id || session.user._id;

    // 2. Récupération des données
    const { planName, amount, nombreAppartements, operateur, phoneNumber } = await req.json();

    if (!phoneNumber || phoneNumber.trim().length < 9) {
      return NextResponse.json(
        { success: false, message: "Un numéro de téléphone camerounais valide à 9 chiffres est obligatoire." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, "");
    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith("237")) {
      formattedPhone = `237${formattedPhone}`;
    }

    const planKey = planName.toLowerCase().trim();

    // 3. Validation et routage dynamique des prix officiels (Calqués sur image_c9a88e.png)
    const pricingDb = await Pricing.findOne({ planId: planKey });
    let prixNetAttendu = 0;

    if (pricingDb) {
      prixNetAttendu = pricingDb.price;
    } else {
      if (planKey.includes("éco") || planKey.includes("eco")) {
        prixNetAttendu = 25; // Parfait pour ton test CamPay Demo
      } else if (planKey.includes("premium")) {
        prixNetAttendu = 5000;
      } else if (planKey.includes("business")) {
        prixNetAttendu = 40000;
      } else if (planKey.includes("standard")) {
        prixNetAttendu = 15000; // Pour PRO STANDARD
      } else if (planKey.includes("immeuble")) {
        prixNetAttendu = 2500; // Prix de base par appartement
      }
    }

    if (planKey.includes("immeuble")) {
      const apps = parseInt(nombreAppartements) || 0;
      prixNetAttendu = apps * prixNetAttendu;
    }

    // 4. Génération de la référence externe unique
    const prefixDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const referenceUnique = `TX-CPY-${prefixDate}-${Math.floor(Math.random() * 100000)}`;

    // 5. Intégration et Appel Collect de l'API Campay
    try {
      const tokenResponse = await fetch("https://demo.campay.net/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: process.env.CAMPAY_USERNAME,
          password: process.env.CAMPAY_PASSWORD
        })
      });

      if (!tokenResponse.ok) {
        const tokenErrLog = await tokenResponse.text();
        console.error("Détails échec génération Token Campay :", tokenErrLog);
        throw new Error("Impossible d'obtenir le token d'authentification Campay.");
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.token;

      // Étape B : Lancer la requête de collecte de fonds
      const collectResponse = await fetch("https://demo.campay.net/api/collect/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${accessToken}`
        },
        body: JSON.stringify({
          amount: String(prixNetAttendu),
          currency: "XAF",
          from: formattedPhone,
          description: `Abonnement EcoTrack - Formule ${planName}`,
          external_reference: referenceUnique
        })
      });

      if (!collectResponse.ok) {
        const errBody = await collectResponse.text();
        console.error("Détails erreur collecte Campay :", errBody);
        throw new Error("La demande de débit a échoué auprès de Campay.");
      }

      const collectData = await collectResponse.json();

      // Normalisation du nom de l'opérateur
      let validatedOperator = operateur || "Campay";
      if (validatedOperator === "OM") validatedOperator = "Orange Money";
      if (validatedOperator === "MOMO") validatedOperator = "MTN MoMo";

      // 6. Sauvegarde de la transaction en attente dans MongoDB
      await Transaction.create({
        reference: referenceUnique,
        userId: userId,
        userName: session.user.nom || session.user.name || "Client EcoTrack",
        typeAbonnement: planName, // Envoie le nom exact reçu du front (Ex: "Foyer Éco" ou "PRO STANDARD")
        nombreAppartements: planKey.includes("immeuble") ? parseInt(nombreAppartements) : 1,
        montant: prixNetAttendu,
        operateur: validatedOperator,
        statut: "En attente",
        metadata: {
          telephonePaiement: formattedPhone,
          campayReference: collectData.reference
        }
      });

      return NextResponse.json({
        success: true,
        reference: referenceUnique,
        campayRef: collectData.reference,
        message: "Demande de paiement envoyée. Veuillez valider le prompt PIN sur votre téléphone."
      });

    } catch (campayError) {
      console.error("Erreur passerelle Campay :", campayError);
      return NextResponse.json(
        { success: false, message: campayError.message || "Impossible d'initialiser le paiement avec Campay." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Erreur critique serveur :", error);
    return NextResponse.json(
      { success: false, message: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}