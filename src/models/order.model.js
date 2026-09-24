import mongoose from "mongoose";

// ----------------------------------------------------------------
// 1. Sub-schemas สำหรับข้อมูลการจัดส่ง (Delivery Info)
// ----------------------------------------------------------------

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

// Snapshot ของ Component ที่ดึงมาจาก Inventory
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

// ปรับให้รองรับ design_name และ design_description เหมือนกับ cart.model.js
const customSpecsSchema = new mongoose.Schema(
	{
		design_name: {
			type: String,
			trim: true,
		},
		design_description: {
			type: String,
			trim: true,
		},
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

// Snapshot ของแต่ละ Item ในคำสั่งซื้อ
const orderItemSchema = new mongoose.Schema(
	{
		item_type: {
			type: String,
			// ปรับ enum เป็น custom_product ให้ตรงกับ cart.model.js
			enum: ["standard_product", "custom_product"],
			required: true,
		},
		product_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: function () {
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
				// ปรับเงื่อนไขให้ตรงกับ custom_product
				return this.item_type === "custom_product";
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
		service_fee: {
			type: Number,
			required: true,
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
// 4. Main Order Schema
// ----------------------------------------------------------------

const orderSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
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
		// เพิ่ม gift_note เพื่อรองรับข้อมูลการ์ดอวยพรจาก Cart
		gift_note: {
			type: String,
			trim: true,
			maxlength: 200,
		},
		payment_pricing: {
			type: paymentPricingSchema,
			required: true,
		},
	},
	{
		collection: "orders",
		timestamps: true,
	}
);

// ----------------------------------------------------------------
// 5. Indexes
// ----------------------------------------------------------------

orderSchema.index({ user_id: 1 });
orderSchema.index({ order_number: 1 }, { unique: true });
orderSchema.index({ order_status: 1 });
orderSchema.index({ "payment_pricing.payment_status": 1 });
orderSchema.index({ "delivery_info.delivery_date": 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;