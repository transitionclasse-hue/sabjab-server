// 1. ESM uses 'import' instead of 'require'
import Address from "../models/Address.js";

// SAVE NEW ADDRESS
export const addAddress = async (request, reply) => {
  try {
    const { label, houseNo, area, landmark, latitude, longitude } = request.body;
    
    // Safety check: ensure middleware provided the user ID
    if (!request.user || !request.user.id) {
      return reply.code(401).send({ success: false, message: "Unauthorized" });
    }

    const fullAddress = `${houseNo}, ${area}${landmark ? `, ${landmark}` : ""}`;

    const newAddress = new Address({
      customer: request.user.id,
      label,
      houseNo,
      area,
      landmark,
      fullAddress,
      latitude,
      longitude
    });

    const savedAddress = await newAddress.save();
    return reply.code(201).send({ 
      success: true, 
      address: savedAddress 
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ success: false, message: "Server Error" });
  }
};

// FETCH ALL SAVED ADDRESSES
export const getCustomerAddresses = async (request, reply) => {
  try {
    const addresses = await Address.find({ customer: request.user.id }).sort({ createdAt: -1 });
    return reply.send({ success: true, addresses });
  } catch (error) {
    return reply.code(500).send({ success: false, message: "Error fetching addresses" });
  }
};

// ESM uses 'export const' at the top of the functions instead of module.exports at the bottom
