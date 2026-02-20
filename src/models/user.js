import mongoose from "mongoose";

// ================= BASE USER SCHEMA =================
/**
 * Base schema shared across all user roles.
 * Note: 'address' string removed to use relational Address.js model instead.
 */
const userSchema = new mongoose.Schema({
  name: { type: String },
  role: {
    type: String,
    enum: ["Customer", "Admin", "DeliveryPartner"],
    required: true,
  },
  isActivated: { type: Boolean, default: false },
});

// ================= CUSTOMER MODEL =================
/**
 * Customer specific data.
 * The 'address' field is now handled by the separate Address collection.
 * Linkage is done via Address.customer -> Customer._id
 */
const customerSchema = new mongoose.Schema({
  ...userSchema.obj,
  phone: { type: Number, required: true, unique: true },
  email: { type: String, unique: true, sparse: true }, 
  otp: { type: String },
  otpExpires: { type: Date },
  role: { type: String, enum: ["Customer"], default: "Customer" },
  liveLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  // Deprecated: address: { type: String } 
  // We rely on the Address model for saved locations.
});

// ================= DELIVERY PARTNER MODEL =================
/**
 * Delivery Partner specific data.
 * Includes live tracking coordinates and branch association.
 */
const deliveryPartnerSchema = new mongoose.Schema({
  ...userSchema.obj,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: Number, required: true },
  role: {
    type: String,
    enum: ["DeliveryPartner"],
    default: "DeliveryPartner",
  },
  liveLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
});

// ================= ADMIN MODEL =================
const adminSchema = new mongoose.Schema({
  ...userSchema.obj,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin"], default: "Admin" },
});

// ================= EXPORTS =================
export const Customer = mongoose.model("Customer", customerSchema);
export const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
export const Admin = mongoose.model("Admin", adminSchema);
