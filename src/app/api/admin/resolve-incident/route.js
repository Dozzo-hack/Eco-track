import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Incident from '@/models/Incident';

export async function POST(request) {
  try {
    await connectDB();
    const { incidentId } = await request.json();

    if (!incidentId) {
      return NextResponse.json({ success: false, message: "ID Incident manquant" }, { status: 400 });
    }

    // On passe le statut à "Résolu" pour qu'il disparaisse du fetch de la page Fleet
    const updated = await Incident.findByIdAndUpdate(
      incidentId,
      { $set: { statut: "Résolu" } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Incident introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Incident marqué comme résolu" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}