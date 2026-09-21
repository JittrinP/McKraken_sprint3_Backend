import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		category: {
			type: String,
			enum: ["flower", "wrapping_paper", "vase"],
			required: true,
		},
		cost_price: {
			type: Number,
			required: true,
			min: 0,
		},
		stock_quantity: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		attributes: {
			color: { type: String, trim: true },
			origin: {
				type: String,
				enum: ["local", "imported"],
			},
		},
	},
	{
		collection: "inventory_items",
		timestamps: true,
	},
);

inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ stock_quantity: 1 });

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);

export default InventoryItem;
