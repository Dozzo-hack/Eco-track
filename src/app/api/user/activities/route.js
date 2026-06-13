import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non autorisé." }, { status: 401 });
    }

    const userId = session.user.id || session.user._id;

    // CORRECTION : Tri appliqué sur `createdAt` (géré par les timestamps du schéma) au lieu de `date`
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error("Erreur GET Activités:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la récupération de l'historique." }, { status: 500 });
  }
}