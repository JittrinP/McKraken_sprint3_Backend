/**
 * คำนวณราคาของตะกร้า ใช้ทั้งใน GET /cart (แสดงผล) และตอนสร้าง Order (snapshot)
 *
 * รับ: cart (mongoose document) ที่ populate แล้วสองที่ ไม่งั้นราคาจะเป็น 0
 *   .populate("items.product_id", "name description images base_price")
 *   .populate("items.custom_specs.components.inventory_item_id", "name cost_price")
 *
 * คืน: { items, subtotal, service_fee, delivery_fee, total }
 *   - items: item เดิมทุก field + unit_price (ราคาต่อชิ้น) + line_total (unit_price × quantity)
 *   - subtotal: ผลรวม line_total
 *   - service_fee: SERVICE_FEE × จำนวนช่อ custom (นับตาม quantity)
 *   - delivery_fee: DELIVERY_FEE (0 ถ้าตะกร้าว่าง)
 *   - total: subtotal + service_fee + delivery_fee
 *
 * ราคา: standard_product = base_price, custom_product = ผลรวม (cost_price × quantity ของแต่ละ component)
 *
 * ตอนสร้าง Order ให้เอาผลที่ได้ไปเก็บเป็น snapshot (ราคาและชื่อสินค้า ณ ตอนสั่ง)
 * ห้ามเก็บแค่ product_id แล้วไปดึงราคาใหม่ภายหลัง
 */

export const SERVICE_FEE = 100; // ต่อช่อ 100 ต่อ 1 custom ช่อ
export const DELIVERY_FEE = 10; // fix delivery

// รับ cart ที่มี items.product_id ที่มี base_price กับ custom_specs.components.inventory_item_id ที่มี cost_price
export function calcCart(cart) {
  let customCount = 0;

  const items = cart.items.map((item) => {
    //แปลง mongoose document เป็น obj เพื่อเพิ่ม field
    const obj = item.toObject();
    let unitPrice = 0;

    // อันนี้ ? คือ (optional chaining) กัน error , ?? คือ (nullish coalescing) ตั้งค่าสำรอง

    if (obj.item_type === "standard_product") {
      unitPrice = obj.product_id?.base_price ?? 0;
    } else {
      // ราคาต่อช่อ = ผลรวม cost_price ของแต่ละ component × จำนวน
      // .reduce คือ array.reduce((ตัวสะสม, ตัวปัจจุบัน) => ตัวสะสมใหม่, ค่าเริ่มต้น)
      unitPrice = (obj.custom_specs?.components ?? []).reduce(
        (sum, c) => sum + (c.inventory_item_id?.cost_price ?? 0) * c.quantity,
        0,
      );
      customCount += obj.quantity;
    }

    return {
      ...obj,
      unit_price: unitPrice,
      line_total: unitPrice * obj.quantity,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
  const service_fee = customCount * SERVICE_FEE;
  //สำหรับตะกร้าว่างไม่คิดค่าส่ง
  const delivery_fee = items.length > 0 ? DELIVERY_FEE : 0;

  return {
    items,
    subtotal,
    service_fee,
    delivery_fee,
    total: subtotal + service_fee + delivery_fee,
  };
}
