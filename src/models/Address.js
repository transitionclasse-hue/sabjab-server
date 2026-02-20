const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  // Links the address to a specific user
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
  // Split fields for better data management
  houseNo: { type: String, required: true },
  area: { type: String, required: true },
  landmark: { type: String },
  fullAddress: { type: String, required: true }, 
  
  // Coordinates for the Map
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);
