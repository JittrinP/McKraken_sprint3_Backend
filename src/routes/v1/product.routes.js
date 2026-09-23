import { Router } from "express";
import {
	getProductById,
	getProducts,
} from "../../controllers/product.controller.js";

export const router = Router();

// routes มีหน้าที่ผูก URL กับ controller ส่วน business logic อยู่ใน product.controller.js
router.get("/", getProducts);
router.get("/:id", getProductById);
