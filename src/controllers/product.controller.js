import mongoose from "mongoose";
import Product from "../models/product.model.js";

const PRODUCT_TYPES = ["bouquet_set", "single_item"];

function escapeRegex(value) {
	// escape อักขระพิเศษก่อนสร้าง regex เพื่อให้ search เป็นข้อความธรรมดาและปลอดภัย
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getProducts(req, res, next) {
	try {
		// query เหล่านี้เป็น contract ที่ frontend ใช้สำหรับ search และ filter สินค้า
		const {
			search,
			product_type,
			is_popular,
			is_active = "true",
			tag,
		} = req.query;

		const filter = {};

		// storefront เห็นเฉพาะสินค้าที่ active โดย default; Admin ขอทั้งหมดได้ด้วย is_active=all
		if (is_active !== "all") {
			if (is_active !== "true" && is_active !== "false") {
				return res.status(400).json({
					success: false,
					message: "is_active must be true, false, or all",
				});
			}
			filter.is_active = is_active === "true";
		}

		if (product_type) {
			// จำกัดค่าตาม enum ของ Product model เพื่อให้ query ที่ผิดตอบ 400 อย่างชัดเจน
			if (!PRODUCT_TYPES.includes(product_type)) {
				return res.status(400).json({
					success: false,
					message: `product_type must be one of: ${PRODUCT_TYPES.join(", ")}`,
				});
			}
			filter.product_type = product_type;
		}

		if (is_popular !== undefined) {
			// query string จาก URL เป็น string จึงต้องแปลงเป็น boolean ก่อนค้นหา MongoDB
			if (is_popular !== "true" && is_popular !== "false") {
				return res.status(400).json({
					success: false,
					message: "is_popular must be true or false",
				});
			}
			filter.is_popular = is_popular === "true";
		}

		if (tag) {
			// MongoDB จะ match tag เดียวที่อยู่ใน array tags ของ product
			filter.tags = tag;
		}

		if (search?.trim()) {
			// ค้นหาจากทั้งชื่อและคำอธิบายแบบไม่สนใจตัวพิมพ์เล็ก/ใหญ่
			const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
			filter.$or = [{ name: searchRegex }, { description: searchRegex }];
		}

		// ส่ง popular และสินค้าที่ขายดีขึ้นก่อน เพื่อรองรับ curated collections ของหน้า Home
		const products = await Product.find(filter).sort({
			is_popular: -1,
			sales_count: -1,
		});

		return res.json(products);
	} catch (err) {
		next(err);
	}
}

export async function getProductById(req, res, next) {
	try {
		// ตรวจ id ก่อน query เพื่อคืน 400 แทนปล่อย CastError ไปเป็น server error
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product id",
			});
		}

		const product = await Product.findById(req.params.id);
		if (!product) {
			// id ถูกต้องแต่ไม่มี document ต้องแยกเป็น 404
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		return res.json(product);
	} catch (err) {
		next(err);
	}
}
