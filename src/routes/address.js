import { addAddress, getCustomerAddresses } from "../controllers/addressController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // Assuming this is your middleware path

export const addressRoutes = async (fastify) => {
  // 1. Protection: Only logged-in users can access these routes
  // This ensures request.user.id is available
  fastify.addHook("preHandler", verifyToken);

  // 2. The Path: POST sabjab.com/api/address
  // This calls the 'addAddress' function in your controller
  fastify.post("/", addAddress);

  // 3. The Path: GET sabjab.com/api/address
  // This lets the user see their saved address book
  fastify.get("/", getCustomerAddresses);
};
