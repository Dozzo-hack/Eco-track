import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Pricing from "@/models/Pricing";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { FedaPay, Transaction as FedaTransaction } from "fedapay";

// Configuration de FedaPay
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment("sandbox");

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
    const { planName, amount, nombreAppartements, operateur, phoneNumber, email } = await req.json();

    if (operateur !== "Card" && (!phoneNumber || phoneNumber.trim().length < 8)) {
      return NextResponse.json(
        { success: false, message: "Un numéro de téléphone valide est obligatoire." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber ? phoneNumber.replace(/\s+/g, "") : "";
    const planKey = planName.toLowerCase().trim();

    // 3. Validation du prix depuis la DB
    const pricingDb = await Pricing.findOne({ planId: planKey });
    let prixNetAttendu = 0;

    if (pricingDb) {
      prixNetAttendu = pricingDb.price;
    } else {
      if (planKey.includes("éco") || planKey.includes("eco")) prixNetAttendu = 3000;
      else if (planKey.includes("premium")) prixNetAttendu = 5000;
      else if (planKey.includes("standard")) prixNetAttendu = 15000;
      else if (planKey.includes("business")) prixNetAttendu = 40000;
      else if (planKey === "immeuble") prixNetAttendu = 2500;
    }

    if (planKey === "immeuble") {
      const apps = parseInt(nombreAppartements) || 0;
      prixNetAttendu = apps * prixNetAttendu;
    }

    // 4. Génération de la référence unique
    const prefixDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const referenceUnique = `TX-FED-${prefixDate}-${Math.floor(Math.random() * 10000)}`;

    // 5. Création de la transaction chez FedaPay
try {
  // Nettoyer en profondeur le numéro pour FedaPay (enlever +237 ou 237 au début si présents)
  let localPhone = cleanPhone;
  if (localPhone.startsWith("+237")) {
    localPhone = localPhone.replace("+237", "");
  } else if (localPhone.startsWith("237") && localPhone.length > 9) {
    localPhone = localPhone.substring(3);
  }

  const transactionData = {
    description: `Abonnement EcoTrack - Formule ${planName}`,
    amount: prixNetAttendu,
    currency: "XOF", // FCFA Afrique Centrale
    callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/abonnement?status=success&ref=${referenceUnique}`,
    customer: {
      email: session.user.email || "client@ecotrack.com",
      firstname: session.user.name?.split(" ")[0] || "Client",
      lastname: session.user.name?.split(" ")[1] || "EcoTrack",
      phone_number: {
        number: localPhone, // Uniquement le numéro local (ex: 640483676)
        country: "cm"       // En minuscule (parfois exigé par le validateur FedaPay)
      }
    }
  };

  const fedaTrans = await FedaTransaction.create(transactionData);
  const token = await fedaTrans.generateToken();
  
  // ... reste du code (sauvegarde MongoDB et retour NextResponse)
      // 6. Sauvegarde en attente dans la MongoDB
      await Transaction.create({
        reference: referenceUnique,
        userId: userId,
        userName: session.user.name || "Client EcoTrack",
        typeAbonnement: planName,
        nombreAppartements: planKey === "immeuble" ? parseInt(nombreAppartements) : 1,
        montant: prixNetAttendu,
        operateur: operateur || "FedaPay",
        statut: "En attente",
        metadata: {
          telephonePaiement: cleanPhone,
          fedaTransactionId: fedaTrans.id
        }
      });

      return NextResponse.json({
        success: true,
        paymentUrl: token.url,
        reference: referenceUnique
      });

    } catch (fedaError) {
      console.error("Erreur passerelle FedaPay :", fedaError);
      return NextResponse.json(
        { success: false, message: fedaError.message || "Impossible d'initialiser le paiement avec FedaPay." },
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