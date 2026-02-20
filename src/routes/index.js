import { authRoutes } from "./auth.js";
import { orderRoutes } from "./order.js";
import { categoryRoutes, productRoutes } from "./products.js";
import { googleConfigRoutes } from "./googleConfig.js";
// ✅ Line 5: Corrected to match your renamed file 'addressRoutes.js'
import { addressRoutes } from "./addressRoutes.js"; 

const prefix = "/api";

/**
 * Main Route Registry
 * This function registers all sub-routes under the global '/api' prefix.
 * It is called by the main Fastify server instance in app.js.
 */
export const registerRoutes = async (fastify) => {
  // Authentication & User Management (Login, OTP, Refresh)
  // URL: https://sabjab.com/api/...
  fastify.register(authRoutes, { prefix });

  // Catalog Management (Products & Categories)
  // URL: https://sabjab.com/api/...
  fastify.register(productRoutes, { prefix });
  fastify.register(categoryRoutes, { prefix });

  // Transactional Management (Orders)
  // URL: https://sabjab.com/api/...
  fastify.register(orderRoutes, { prefix });

  // Utility & Configuration (Google Maps/Places Config)
  // URL: https://sabjab.com/api/...
  fastify.register(googleConfigRoutes, { prefix });

  // User Logistics (Saved Addresses)
  // ✅ Corrected: This creates the clean URL: https://sabjab.com/api/address
  // It combines your global prefix '/api' with the specific '/address' path
  fastify.register(addressRoutes, { prefix: `${prefix}/address` });
};
