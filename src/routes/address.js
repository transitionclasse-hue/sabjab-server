export const addressRoutes = async (fastify) => {
  fastify.post("/address", async (request, reply) => {
    try {
      const {
        house,
        street,
        city,
        address,
        latitude,
        longitude,
      } = request.body;

      // basic validation
      if (!address || !latitude || !longitude) {
        return reply.status(400).send({
          message: "Missing required fields",
        });
      }

      // TEMP: just return success
      // Later you can save into MongoDB

      return {
        success: true,
        message: "Address saved successfully",
        data: {
          house,
          street,
          city,
          address,
          latitude,
          longitude,
        },
      };
    } catch (err) {
      console.log(err);
      return reply.status(500).send({
        message: "Server error",
      });
    }
  });
};
