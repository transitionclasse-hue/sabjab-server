import { authRoutes } from "./auth.js";
import { orderRoutes } from "./order.js";
import { categoryRoutes, productRoutes } from "./products.js";
import { googleConfigRoutes } from "./googleConfig.js";
import { addressRoutes } from "./address.js";

const prefix = "/api";

/**
 * Main Route Registry
 * This function registers all sub-routes under the global '/api' prefix.
 * It is called by the main Fastify server instance in app.js.
 */
export const registerRoutes = async (fastify) => {
  // Authentication & User Management (Login, OTP, Refresh)
  fastify.register(authRoutes, { prefix });

  // Catalog Management (Products & Categories)
  fastify.register(productRoutes, { prefix });
  fastify.register(categoryRoutes, { prefix });

  // Transactional Management (Orders)
  fastify.register(orderRoutes, { prefix });

  // Utility & Configuration (Google Maps/Places Config)
  fastify.register(googleConfigRoutes, { prefix });

  // User Logistics (Saved Addresses)
  fastify.register(addressRoutes, { prefix });
};
