import mongoose from "mongoose";

const productComponentSchema = new mongoose.Schema(
	{
		inventory_item_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "InventoryItem",
			required: true,
		},
		quantity_required: {
			type: Number,
			required: true,
			min: 1,
		},
	},
	{ _id: false },
);

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		images: {
			type: [String],
			default: [],
		},
		product_type: {
			type: String,
			enum: ["bouquet_set", "single_item"],
			required: true,
		},
		base_price: {
			type: Number,
			required: true,
			min: 0,
		},
		is_active: {
			type: Boolean,
			default: true,
		},
		is_popular: {
			type: Boolean,
			default: false,
		},
		sales_count: {
			type: Number,
			default: 0,
			min: 0,
		},
		tags: {
			type: [String],
			default: [],
		},
		components: {
			type: [productComponentSchema],
			default: [],
		},
	},
	{
		collection: "products",
		timestamps: true,
	},
);

productSchema.index({ is_active: 1, is_popular: 1 });
productSchema.index({ product_type: 1 });
productSchema.index({ tags: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
