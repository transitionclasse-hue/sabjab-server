import { authRoutes } from "./auth.js";
import { orderRoutes } from "./order.js";
import { categoryRoutes, productRoutes } from "./products.js";
import { googleConfigRoutes } from "./googleConfig.js";
import { addressRoutes } from "./address.js"; // ✅ NEW

const prefix = "/api";

export const registerRoutes = async (fastify) => {
  fastify.register(authRoutes, { prefix });
  fastify.register(productRoutes, { prefix });
  fastify.register(categoryRoutes, { prefix });
  fastify.register(orderRoutes, { prefix });

  fastify.register(googleConfigRoutes, { prefix });

  // ✅ ADDRESS ROUTE
  fastify.register(addressRoutes, { prefix });
};
