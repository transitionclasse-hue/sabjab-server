import { 
    requestEmailOtp, 
    verifyOtp, 
    loginDeliveryPartner, 
    refreshToken, 
    fetchUser 
} from "../controllers/auth/auth.js";
import { verifyToken } from "../middleware/auth.js";

export const authRoutes = async (fastify) => {
    // Customer Endpoints
    fastify.post("/customer/request-otp", requestEmailOtp);
    fastify.post("/customer/verify-otp", verifyOtp);

    // Delivery Partner Endpoint
    fastify.post("/delivery/login", loginDeliveryPartner);

    // System Endpoints (Standardized to match your API client)
    // Changing these to match your getMe and refreshTokenApi calls
    fastify.post("/customer/refresh-token", refreshToken); 
    fastify.get("/customer/me", { preHandler: [verifyToken] }, fetchUser);
};
