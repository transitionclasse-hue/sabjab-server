import jwt from "jsonwebtoken";

/**
 * ✅ FASTIFY AUTH MIDDLEWARE
 * Secured for the new OTP login flow and synchronized with the Address Book system.
 */
export const verifyToken = async (req, reply) => {
    try {
        const authHeader = req.headers["authorization"];
        
        // 1. Validate Header Presence
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return reply.status(401).send({ 
                success: false, 
                message: "Access token required" 
            });
        }

        const token = authHeader.split(" ")[1];
        
        // 2. Verify token against the secret key
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        /**
         * 3. Attach decoded payload to req.user
         * This creates a bridge between your Auth Controller (which uses userId)
         * and your Address Controller (which uses id).
         */
        req.user = {
            ...decoded,
            id: decoded.userId || decoded.id // Ensures 'id' is always available
        };

        // In Fastify, returning true in a preHandler allows the request to continue
        return true; 
    } catch (error) {
        // 4. Enhanced Error Handling for Frontend Refresh Logic
        if (error.name === 'TokenExpiredError') {
            return reply.status(401).send({ 
                success: false,
                message: "Token Expired", 
                code: "TOKEN_EXPIRED" 
            });
        }

        return reply.status(403).send({ 
            success: false, 
            message: "Invalid or tampered token" 
        });
    }
};
