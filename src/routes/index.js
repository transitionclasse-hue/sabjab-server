import { authRoutes } from "./auth.js";
import { orderRoutes } from "./order.js";
import { categoryRoutes, productRoutes } from "./products.js";
import { googleConfigRoutes } from "./googleConfig.js"; // ⭐ NEW

const prefix = "/api";

export const registerRoutes = async (fastify) => {
    fastify.register(authRoutes, { prefix: prefix });
    fastify.register(productRoutes, { prefix: prefix });
    fastify.register(categoryRoutes, { prefix: prefix });
    fastify.register(orderRoutes, { prefix: prefix });

    // ⭐ NEW ROUTE
    fastify.register(googleConfigRoutes, { prefix: prefix });
};
