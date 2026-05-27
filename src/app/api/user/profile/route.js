import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
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

    // Trouver l'utilisateur complet en base de données
    const user = await User.findById(session.user.id).select("-password");

    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        idUnique: user._id.toString(),
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        telephone: user.telephone || "Non renseigné",
        quartier: user.quartier || "Non spécifié",
        photo: user.photo || null,
        points: user.points || 0,
        recompensesEchangees: user.recompensesEchangees || [],
        // 📍 INCLUSION CRITIQUE DU BLOC DE GÉOLOCALISATION
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

    const { nom, prenom, telephone, quartier, photo, currentPassword, newPassword } = await req.json();

    if (newPassword) {
      const userObj = await User.findById(session.user.id);
      const isMatch = await bcrypt.compare(currentPassword, userObj.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: "Le mot de passe actuel est incorrect." }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      userObj.password = await bcrypt.hash(newPassword, salt);
      await userObj.save();
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          nom,
          prenom,
          telephone,
          quartier,
          ...(photo && { photo })
        }
      },
      { new: true }
    ).select("-password");

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Erreur POST Profile:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}