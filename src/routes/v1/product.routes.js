import { Router } from "express";
import {
  getProductById,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../controllers/product.controller.js";
import { authen } from "../../middleware/authen.js";
import { authorize } from "../../middleware/authorize.js";

export const router = Router();

// Public Routes (หน้าบ้านลูกค้า)
// getProducts มีระบบ Filter (search, product_type, is_active) รองรับอยู่แล้ว
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin Routes (ระบบหลังบ้าน)
router.post("/", authen, authorize(["admin"]), createProduct);
router.put("/:id", authen, authorize(["admin"]), updateProduct);
router.delete("/:id", authen, authorize(["admin"]), deleteProduct);
