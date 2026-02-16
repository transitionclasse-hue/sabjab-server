import AdminJS from "adminjs";
import AdminJSFastify from "@adminjs/fastify";
import * as AdminJSMongoose from "@adminjs/mongoose";
import mongoose from "mongoose";

AdminJS.registerAdapter(AdminJSMongoose);

export async function buildAdminRouter(app) {
  const admin = new AdminJS({
    rootPath: "/admin",
    resources: Object.values(mongoose.models),
    branding: {
      companyName: "SabJab Admin",
      withMadeWithLove: false,
    },
  });

  // ✅ IMPORTANT: In your AdminJS version, fastify app must be passed here
  await AdminJSFastify.buildRouter(admin, app);

  console.log("✅ AdminJS running at http://localhost:5000/admin");
}
