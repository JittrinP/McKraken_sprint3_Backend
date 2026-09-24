import mongoose from "mongoose";
import Product from "../models/product.model.js";

const PRODUCT_TYPES = ["bouquet_set", "single_item"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getProducts(req, res, next) {
  try {
    const {
      search,
      product_type,
      is_popular,
      is_active = "true",
      tag,
    } = req.query;

    const filter = {};

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
      if (!PRODUCT_TYPES.includes(product_type)) {
        return res.status(400).json({
          success: false,
          message: `product_type must be one of: ${PRODUCT_TYPES.join(", ")}`,
        });
      }
      filter.product_type = product_type;
    }

    if (is_popular !== undefined) {
      if (is_popular !== "true" && is_popular !== "false") {
        return res.status(400).json({
          success: false,
          message: "is_popular must be true or false",
        });
      }
      filter.is_popular = is_popular === "true";
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search?.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    // กำหนดการเรียงเริ่มต้น (สำหรับหน้าบ้านลูกค้า)
    let sortCondition = { is_popular: -1, sales_count: -1, createdAt: -1 };

    // ถ้าเป็นแอดมินเรียกดู (มี is_active=all) ให้เรียงจากสินค้าใหม่ล่าสุดขึ้นก่อน
    if (is_active === "all") {
      sortCondition = { createdAt: -1 };
    }

    const products = await Product.find(filter)
      .populate("components.inventory_item_id", "name category cost_price")
      .sort(sortCondition); // เอาตัวแปร sortCondition มาใส่แทน

    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(req.params.id).populate(
      "components.inventory_item_id",
      "name category cost_price",
    ); // เพิ่ม populate ตรงนี้ด้วยเผื่อเรียกดูสินค้าชิ้นเดียว

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // ปรับรูปแบบข้อมูลให้ตรงกัน
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

// สร้างสินค้าใหม่
export const createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();

    res.status(201).json({ success: true, data: savedProduct });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Validation Error",
      error: error.message,
    });
  }
};

// อัปเดตข้อมูลสินค้า (PUT)
export const updateProduct = async (req, res) => {
  try {
    // findByIdAndUpdate จะหาตาม ID แล้วอัปเดตข้อมูลให้
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after", runValidators: true }, // เปลี่ยนตรงนี้เพื่อให้ส่งข้อมูลก้อนใหม่กลับมาตามที่ Mongoose แนะนำ
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Update failed.",
      error: error.message,
    });
  }
};

// ลบสินค้า (DELETE)
export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Delete Product Successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete Prodouct Failed",
      error: error.message,
    });
  }
};
