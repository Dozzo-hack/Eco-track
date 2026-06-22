import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "L'email est obligatoire" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Pour des raisons de sécurité, on ne dit pas explicitement si l'email existe ou pas
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Générer un token unique et une date d'expiration (+1 heure)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    // Sauvegarder dans le profil utilisateur (champs dynamiques Mongoose acceptés)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Configuration du transporteur Nodemailer avec tes variables Brevo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Détermination dynamique du domaine (localhost ou Vercel en production)
    const host = req.headers.get("host");
    const protocol = host.includes("localhost") ? "http" : "https";
    const resetUrl = `${protocol}://${host}/auth/reset-password?token=${token}`;

    // Structure du mail pro
    const mailOptions = {
      from: `"EcoTrack Support" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe - EcoTrack",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6200ee; text-align: center;">EcoTrack</h2>
          <p>Bonjour ${user.prenom || ""},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte EcoTrack. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6200ee; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="font-size: 12px; color: #777;">Ce lien est valide pendant 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur API forgot-password :", error);
    return NextResponse.json({ error: "Une erreur interne est survenue" }, { status: 500 });
  }
}