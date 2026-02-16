export const googleConfigRoutes = async (fastify) => {
  fastify.get("/googlemap-config", async () => {
    return {
      status: "success",
      key: process.env.GOOGLE_MAPS_API_KEY,
    };
  });
};
