import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category, Product } from "./src/models/index.js"; //
import { MONGO_URI } from "./src/config/config.js"; //

dotenv.config();

export const categories = [
    {
      name: "Milk, Curd & Paneer",
      image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/cq7m7yxuttemyb4tkidp.png",
    },
    {
      name: "Pharma & Wellness",
      image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444870/category/n438dcddfgrhyq9mck3z.png",
    },
    {
      name: "Vegetables & Fruits",
      image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/uic8gcnbzknosdvva13o.png",
    },
    {
      name: "Munchies",
      image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/vyakccm3axdyt8yei8wc.png",
    },
    {
      name: "Home & Office",
      image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/diucqrlsuqympqtwdkip.png",
    },
    {
      name: "Baby Care",
      image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444870/category/f6er254kgnmymlbguddd.png",
    },
    {
      name: "Ata, Rice & Dal",
      image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/flyjbsigiuxsd4pbwpjb.png",
    },
    {
      name: "Cleaning Essentials",
      image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/pfbuktnsxdub5njww7tj.png",
    },
];
  
export const products = [
    {
      name: "Amul Gold Cream Milk",
      price: 34,
      discountPrice: 38,
      quantity: "500 ml",
      image: "https://m.media-amazon.com/images/I/812816L+HkL._AC_UL640_QL65_.jpg",
      category: "Milk, Curd & Paneer",
    },
    {
      name: "BranO Plus Brown Bread",
      image: "https://m.media-amazon.com/images/I/71dpKUWhfmL._AC_UL640_QL65_.jpg",
      price: 35,
      discountPrice: 38,
      quantity: "300 g",
      category: "Milk, Curd & Paneer",
    },
    {
      name: "Nestle Milkmaid",
      image: "https://m.media-amazon.com/images/I/71tikpIQnbL._AC_UL640_QL65_.jpg",
      price: 380,
      discountPrice: 400,
      quantity: "348 g",
      category: "Milk, Curd & Paneer",
    },
    {
      name: "Lay's India's Magic Masala Potato Chips",
      image: "https://m.media-amazon.com/images/I/71+bz5i4SDL._AC_UL640_QL65_.jpg",
      price: 16,
      discountPrice: 20,
      quantity: "48 g",
      category: "Munchies",
    },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI); //

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Insert Categories
    const categoryDocs = await Category.insertMany(categories);

    // Map products to their new Category IDs
    const productWithCategoryIds = products.map((product) => {
      const category = categoryDocs.find((c) => c.name === product.category);
      return { ...product, category: category._id };
    });

    // Insert Products
    await Product.insertMany(productWithCategoryIds);

    console.log("DATABASE SEEDED SUCCESSFULLY! ✅");
    process.exit();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();