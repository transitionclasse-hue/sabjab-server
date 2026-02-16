import { 
    confirmOrder, 
    createOrder, 
    getOrderById, 
    getOrders, 
    updateOrderStatus 
} from "../controllers/order/order.js"; //
import { verifyToken } from "../middleware/auth.js"; //

export const orderRoutes = async (fastify, options) => {
    // Protect all routes in this file
    fastify.addHook("preHandler", async (request, reply) => {
        const isAuthenticated = await verifyToken(request, reply); //
        if (!isAuthenticated) {
            return reply.code(401).send({ message: "Unauthorized" }); //
        }
    });

    fastify.post("/order", createOrder); //
    fastify.get("/order", getOrders); //
    fastify.patch("/order/:orderId/status", updateOrderStatus); //
    fastify.post("/order/:orderId/confirm", confirmOrder); //
    fastify.get("/order/:orderId", getOrderById); //
};