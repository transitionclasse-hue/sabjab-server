import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", 
    required: true 
  },
  label: { 
    type: String, 
    required: true, 
    enum: ["Home", "Work", "Hotel", "Other"],
    default: "Home" 
  },
  houseNo: { type: String, required: true },
  area: { type: String, required: true },
  landmark: { type: String },
  fullAddress: { type: String, required: true }, 
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { timestamps: true });

// Using default export to match your index.js pattern
const Address = mongoose.model("Address", addressSchema);
export default Address;
