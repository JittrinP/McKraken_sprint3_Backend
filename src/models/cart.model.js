import mongoose from "mongoose";


//ต้อง ref มาจาก ชื่อ user id ใช้ชื่อ ref User, product id ใช้้ชื่อ ref Product ,inventory id ใช้ชื่อ ref InventoryItem

const cartItemSchema = new mongoose.Schema({
  item_type: {
    type: String,
    enum: ["standard_product", "custom_product"],
    required: true
  },
  // ตรงนี้ที่มี return เพราะว่าต้องการทำให้ ถ้าเป็น custom product ไม่จำเป็นต้องมี id
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: function () {
      return this.item_type === "standard_product";
    },
  },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  //ใช้กับ custom เท่านั้น
  custom_specs: {
    design_name: { type: String, trim: true},
    design_description: { type: String, trim: true },
    components: [
      {
        inventory_item_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryItem",
          required : true
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
  },
});

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    gift_note: {type: String, trim:true ,maxlength: 200}
  },
  {
    collection: "carts",
    timestamps: true,
  },
);


const cart = mongoose.model("Cart", cartSchema);

export default cart;
