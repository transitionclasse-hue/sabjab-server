import "dotenv/config.js";
import mongoose from "mongoose";
import { Category, Product } from "./src/models/index.js";
import { categories, products } from "./seedData.js";

async function seedDatabase() {
  try {
    // 1. Connect to your MongoDB database
    await mongoose.connect(process.env.MONGO_URI);

    // 2. Clear existing products and categories to avoid duplicates
    await Product.deleteMany({});
    await Category.deleteMany({});

    // 3. Insert categories and capture the created documents
    const categoryDocs = await Category.insertMany(categories);

    // 4. Create a map of Category Name -> Category ID
    const categoryMap = categoryDocs.reduce((map, category) => {
      map[category.name] = category._id;
      return map;
    }, {});

    // 5. Replace category names in product data with actual MongoDB IDs
    const productWithCategoryIds = products.map((product) => ({
      ...product,
      category: categoryMap[product.category],
    }));

    // 6. Insert the finalized products into the database
    await Product.insertMany(productWithCategoryIds);

    console.log("DATABASE SEEDED SUCCESSFULLY ✅");
  } catch (error) {
    console.error("Error Seeding database:", error);
  } finally {
    // 7. Always close the connection when finished
    mongoose.connection.close();
  }
}

seedDatabase();