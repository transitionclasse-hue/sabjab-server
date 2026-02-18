import { 
    requestEmailOtp, 
    verifyOtp, 
    loginDeliveryPartner, 
    refreshToken, 
    fetchUser 
} from "../controllers/auth/auth.js";
import { verifyToken } from "../middleware/auth.js"; // Standard JWT middleware

export const authRoutes = async (fastify) => {
    // Customer Endpoints
    fastify.post("/customer/request-otp", requestEmailOtp);
    fastify.post("/customer/verify-otp", verifyOtp);

    // Delivery Partner Endpoint
    fastify.post("/delivery/login", loginDeliveryPartner);

    // System Endpoints
    fastify.post("/refresh-token", refreshToken);
    fastify.get("/user", { preHandler: [verifyToken] }, fetchUser);
};
