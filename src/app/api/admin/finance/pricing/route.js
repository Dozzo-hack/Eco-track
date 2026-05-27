import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Pricing from "@/models/Pricing";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectDB();
    const pricing = await Pricing.find().lean();
    return NextResponse.json({ success: true, pricing });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé. Privilèges Administrateur requis." },
        { status: 403 }
      );
    }

    const { planId, newPrice } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { success: false, message: "L'identifiant du plan est obligatoire." },
        { status: 400 }
      );
    }

    const cleanPrice = Number(newPrice);
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Le prix doit être un nombre positif valide." },
        { status: 400 }
      );
    }

    const updatedPricing = await Pricing.findOneAndUpdate(
      { planId: planId.trim().toLowerCase() },
      { $set: { price: cleanPrice } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, updatedPricing });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}