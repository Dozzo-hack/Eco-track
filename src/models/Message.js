// src/models/Message.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // ID de l'utilisateur concerné
  text: { type: String, required: true },
  sender: { type: String, enum: ["user", "admin"], required: true }, // Qui a écrit ?
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);