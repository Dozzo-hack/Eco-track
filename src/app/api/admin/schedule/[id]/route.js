// src/app/api/admin/schedule/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Planning from "@/models/Planning";

// 1. MODIFIER UN PLANNING (PUT)
export async function PUT(req, context) {
  try {
    await connectDB();
    
    // Extraction sécurisée des paramètres de la route
    const params = await context.params;
    const { id } = params;
    
    const body = await req.json();
    const { quartier, date, type, chauffeur } = body;

    const updatedSchedule = await Planning.findByIdAndUpdate(
      id,
      {
        quartiers: quartier,
        datePrevue: new Date(date),
        typeDechet: type,
        chauffeur: chauffeur,
      },
      { new: true }
    );

    if (!updatedSchedule) {
      return NextResponse.json({ success: false, message: "Planning introuvable dans la base de données" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSchedule }, { status: 200 });
  } catch (error) {
    console.error("Erreur PUT schedule:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la modification" }, { status: 500 });
  }
}

// 2. SUPPRIMER UN PLANNING (DELETE)
export async function DELETE(req, context) {
  try {
    await connectDB();
    
    // Extraction sécurisée des paramètres de la route
    const params = await context.params;
    const { id } = params;

    const deletedSchedule = await Planning.findByIdAndDelete(id);

    if (!deletedSchedule) {
      return NextResponse.json({ success: false, message: "Planning introuvable dans la base de données" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Planning supprimé avec succès" }, { status: 200 });
  } catch (error) {
    console.error("Erreur DELETE schedule:", error);
    return NextResponse.json({ success: false, message: "Impossible de supprimer" }, { status: 500 });
  }
}