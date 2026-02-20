import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  // Connects the address to the Customer profile
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
  // Detailed fields for professional data management
  houseNo: { type: String, required: true },
  area: { type: String, required: true },
  landmark: { type: String },
  fullAddress: { type: String, required: true }, 
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { timestamps: true });

const Address = mongoose.model("Address", addressSchema);
export default Address;
