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
    // _id ของ design ที่เซฟไว้ (user.saved_custom_designs) ที่กด Add to cart มา ไม่บังคับ (ช่อที่กดจากหน้า Home ตรงๆ ไม่มี)
    // ใช้แค่โยงกลับ: ให้หน้า CustomList รู้ว่าช่อไหนอยู่ในตะกร้าแล้ว + กดซ้ำให้บวกจำนวนแทนสร้างรายการใหม่
    // ไม่ใส่ ref เพราะ design เป็น subdocument ใน user ไม่มี collection ของตัวเองให้ populate
    // สูตรช่อ (design_name, components) ยังต้องเก็บเป็นสำเนาเหมือนเดิม ถ้า design ถูกแก้/ลบทีหลัง ช่อในตะกร้าจะไม่เปลี่ยนตาม
    design_id: { type: mongoose.Schema.Types.ObjectId },
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
