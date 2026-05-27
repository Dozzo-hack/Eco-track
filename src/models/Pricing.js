import mongoose from "mongoose";

const PricingSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true }, // "basic", "premium", "immeuble"
    price: { type: Number, required: true },
    features: [{ text: String, check: Boolean }],
    desc: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.Pricing || mongoose.model("Pricing", PricingSchema);