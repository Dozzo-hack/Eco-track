import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Quartier from "@/models/Quartier";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

// GET : Charger les données de l'utilisateur connecté
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "user") {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id || session.user._id;

    // Récupération de l'user avec son quartier peuplé
    const user = await User.findById(userId).populate("quartier").select("-password");

    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur introuvable" }, { status: 404 });
    }

    // Récupération sécurisée du nom textuel du quartier
    let quartierFormatte = "NON SPÉCIFIÉ";
    if (user.quartier && user.quartier.nom) {
      quartierFormatte = user.quartier.nom.trim().toUpperCase();
    } else if (typeof user.quartier === "string" && user.quartier.trim() !== "") {
      quartierFormatte = user.quartier.trim().toUpperCase();
    }

    return NextResponse.json({
      success: true,
      data: {
        idUnique: user._id.toString(),
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        telephone: user.telephone && user.telephone !== "Non renseigné" ? user.telephone : "",
        quartier: quartierFormatte, 
        photo: user.photo || null,
        points: user.ecoPoints || user.points || 0,
        poidsTotalNum: user.poidsTotalNum ?? 0,
        poidsTotal: user.poidsTotal || "0kg",
        impact: user.impact || {
          co2Evite: 0,
          eauEconomisee: 0,
          arbresSauves: 0,
          poidsMensuel: { Jan: 0, Fev: 0, Mar: 0, Avr: 0, Mai: 0, Jui: 0, Jul: 0 }
        },
        recompensesEchangees: user.recompensesEchangees || [],
        abonnement: {
          statut: user.abonnement?.statut || "Inactif",
          type: user.abonnement?.type || "Aucun",
          dateFin: user.abonnement?.dateFin || null
        },
        localisationCollecte: user.localisationCollecte || {
          type: "Point",
          coordinates: null,
          statutEmplacement: "En attente",
          adresseTextuelle: ""
        }
      }
    });
  } catch (error) {
    console.error("Erreur GET Profile:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

// POST : Mettre à jour les données de l'utilisateur connecté
export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "user") {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id || session.user._id;
    const { nom, prenom, telephone, quartier, photo, currentPassword, newPassword } = await req.json();

    // 1. GESTION DU CHANGEMENT DE MOT DE PASSE
    if (newPassword) {
      const userObj = await User.findById(userId);
      if (!userObj) {
        return NextResponse.json({ success: false, message: "Utilisateur introuvable." }, { status: 404 });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, userObj.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: "Le mot de passe actuel est incorrect." }, { status: 400 });
      }
      
      const salt = await bcrypt.genSalt(10);
      userObj.password = await bcrypt.hash(newPassword, salt);
      await userObj.save();
    }

    // 2. PRÉPARATION DES DONNÉES DE MISE À JOUR
    const updateFields = {};
    
    if (nom !== undefined) updateFields.nom = nom.trim();
    if (prenom !== undefined) updateFields.prenom = prenom.trim();
    if (telephone !== undefined) updateFields.telephone = telephone.trim();
    if (photo) updateFields.photo = photo;

    // RESOLUTION DU BUG CAST OBJECTID
    if (quartier !== undefined && quartier.trim() !== "") {
      const nomQuartierMaj = quartier.trim().toUpperCase();
      const quartierDoc = await Quartier.findOne({ 
        nom: { $regex: new RegExp(`^${nomQuartierMaj}$`, "i") } 
      });

      if (quartierDoc) {
        updateFields.quartier = quartierDoc._id;
      } else {
        console.warn(`Quartier introuvable en BD pour le nom : ${nomQuartierMaj}`);
      }
    }

    // 3. APPLICATION EN BASE DE DONNÉES
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).populate("quartier");

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: "Échec de la mise à jour, utilisateur introuvable." }, { status: 404 });
    }

    let quartierFinal = "NON SPÉCIFIÉ";
    if (updatedUser.quartier && updatedUser.quartier.nom) {
      quartierFinal = updatedUser.quartier.nom.toUpperCase();
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        idUnique: updatedUser._id.toString(),
        nom: updatedUser.nom || "",
        prenom: updatedUser.prenom || "",
        email: updatedUser.email || "",
        telephone: updatedUser.telephone || "",
        quartier: quartierFinal,
        photo: updatedUser.photo || null,
        points: updatedUser.ecoPoints || updatedUser.points || 0,
        poidsTotalNum: updatedUser.poidsTotalNum ?? 0,
        poidsTotal: updatedUser.poidsTotal || "0kg",
        impact: updatedUser.impact || {
          co2Evite: 0,
          eauEconomisee: 0,
          arbresSauves: 0,
          poidsMensuel: { Jan: 0, Fev: 0, Mar: 0, Avr: 0, Mai: 0, Jui: 0, Jul: 0 }
        },
        abonnement: {
          statut: updatedUser.abonnement?.statut || "Inactif",
          type: updatedUser.abonnement?.type || "Aucun",
          dateFin: updatedUser.abonnement?.dateFin || null
        },
        localisationCollecte: updatedUser.localisationCollecte
      } 
    });
  } catch (error) {
    console.error("Erreur POST Profile:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}