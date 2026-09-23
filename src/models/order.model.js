import mongoose from "mongoose";

// ----------------------------------------------------------------
// 1. Sub-schemas สำหรับข้อมูลการจัดส่ง (Delivery Info)
// ----------------------------------------------------------------

// ล็อคโครงสร้างที่อยู่จัดส่งให้มีฟิลด์ตายตัวและบังคับกรอก
const addressSchema = new mongoose.Schema(
	{
		address_line: {
			type: String,
			required: true,
			trim: true,
		},
		sub_district: {
			type: String,
			required: true,
			trim: true,
		},
		district: {
			type: String,
			required: true,
			trim: true,
		},
		province: {
			type: String,
			required: true,
			trim: true,
		},
		postal_code: {
			type: String,
			required: true,
			trim: true,
		},
	},
	{ _id: false }
);

const deliveryInfoSchema = new mongoose.Schema(
	{
		delivery_date: {
			type: Date,
			required: true,
		},
		time_slot: {
			type: String,
			required: true,
			trim: true,
		},
		recipient_name: {
			type: String,
			required: true,
			trim: true,
		},
		recipient_phone: {
			type: String,
			required: true,
			trim: true,
		},
		shipping_address: {
			type: addressSchema,
			required: true,
		},
	},
	{ _id: false }
);

// ----------------------------------------------------------------
// 2. Sub-schemas สำหรับรายละเอียดสินค้า (Items & Custom Specs)
// ----------------------------------------------------------------

// Snapshot ของ Component ที่ดึงมาจาก Inventory สำหรับการจัดช่อดอกไม้เอง
const componentSnapshotSchema = new mongoose.Schema(
	{
		inventory_item_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "InventoryItem",
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		unit_price: {
			type: Number,
			required: true,
			min: 0,
		},
	},
	{ _id: false }
);

// รายละเอียดสเปคของ Custom Bouquet
const customSpecsSchema = new mongoose.Schema(
	{
		components: {
			type: [componentSnapshotSchema],
			default: [],
		},
		assembly_fee: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{ _id: false }
);

// Snapshot ของแต่ละ Item ในคำสั่งซื้อ ณ เวลาที่ทำการสั่ง
const orderItemSchema = new mongoose.Schema(
	{
		item_type: {
			type: String,
			enum: ["standard_product", "custom_bouquet"],
			required: true,
		},
		product_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: function () {
				// บังคับให้ต้องมี product_id อ้างอิงตาราง Product ก็ต่อเมื่อเป็น standard_product
				return this.item_type === "standard_product";
			},
		},
		item_name: {
			type: String,
			required: true,
			trim: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		unit_price: {
			type: Number,
			required: true,
			min: 0,
		},
		custom_specs: {
			type: customSpecsSchema,
			required: function () {
				// บังคับให้ต้องมีรายละเอียดจาก Inventory ก็ต่อเมื่อเป็น custom_bouquet
				return this.item_type === "custom_bouquet";
			},
		},
	},
	{ _id: false }
);

// ----------------------------------------------------------------
// 3. Sub-schemas สำหรับข้อมูลราคาและการชำระเงิน (Payment & Pricing)
// ----------------------------------------------------------------

const paymentPricingSchema = new mongoose.Schema(
	{
		subtotal: {
			type: Number,
			required: true,
			min: 0,
		},
		delivery_fee: {
			type: Number,
			required: true,
			min: 0,
		},
		discount: {
			type: Number,
			default: 0,
			min: 0,
		},
		grand_total: {
			type: Number,
			required: true,
			min: 0,
		},
		payment_status: {
			type: String,
			enum: ["pending", "paid", "failed", "refunded"],
			required: true,
			default: "pending",
		},
	},
	{ _id: false }
);

// ----------------------------------------------------------------
// 4. Main Order Schema (โครงสร้างหลักของคำสั่งซื้อ)
// ----------------------------------------------------------------

const orderSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // อ้างอิงไปยังตาราง User (อิงตาม ER Diagram)
			required: true,
		},
		order_number: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		order_status: {
			type: String,
			enum: ["pending", "processing", "shipped", "completed", "cancelled"],
			required: true,
			default: "pending",
		},
		delivery_info: {
			type: deliveryInfoSchema,
			required: true,
		},
		items: {
			type: [orderItemSchema],
			required: true,
		},
		payment_pricing: {
			type: paymentPricingSchema,
			required: true,
		},
	},
	{
		collection: "orders",
		timestamps: true, // สร้าง createdAt และ updatedAt ให้อัตโนมัติ
	}
);

// ----------------------------------------------------------------
// 5. Indexes (สำหรับการเพิ่มประสิทธิภาพการค้นหา)
// ----------------------------------------------------------------

orderSchema.index({ user_id: 1 });
orderSchema.index({ order_number: 1 }, { unique: true });
orderSchema.index({ order_status: 1 });
orderSchema.index({ "payment_pricing.payment_status": 1 });
orderSchema.index({ "delivery_info.delivery_date": 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;