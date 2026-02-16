import Product from "../../models/products.js";

// The 'export' keyword here is what the error is looking for
export const getProductsByCategoryId = async (req, reply) => {
    const { categoryId } = req.params;
    try {
        const products = await Product.find({ category: categoryId })
            .select("-category")
            .exec();
        return reply.send(products);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error });
    }
};