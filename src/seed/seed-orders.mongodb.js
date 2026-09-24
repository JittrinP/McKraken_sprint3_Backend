/* global use, db */
// MongoDB Playground Script for Seeding Orders

// 1. เลือกใช้ฐานข้อมูล
use('FlowerShop');

// 2. เคลียร์ข้อมูลเก่าใน Collection orders ออกก่อน
db.orders.drop();

// 3. หยอดข้อมูล Mock Data เข้าตาราง orders โดยใช้อ้างอิง user_id และ product_id จาก Cart จริง
db.orders.insertMany([
  {
    order_number: 'ORD-202609-001',
    user_id: ObjectId('665f1c2a9b1e8a0012345678'), // user_id จาก Cart ใบที่ 1
    order_status: 'shipped',
    delivery_info: {
      delivery_date: ISODate('2026-09-25T10:00:00.000Z'),
      time_slot: '10:00 - 12:00',
      recipient_name: 'สมชาย ใจดี',
      recipient_phone: '0812345678',
      shipping_address: {
        address_line: '123/45 ซอยสุขใจ',
        sub_district: 'บางกะปิ',
        district: 'ห้วยขวาง',
        province: 'กรุงเทพมหานคร',
        postal_code: '10310'
      }
    },
    items: [
      {
        item_type: 'standard_product',
        product_id: ObjectId('665f1c2a9b1e8a00aaaaaaaa'), // product_id จริงจาก Cart
        item_name: 'Sunny Day Potted',
        quantity: 2,
        unit_price: 350
      },
      {
        item_type: 'custom_product',
        item_name: 'Custom Bouquet - Rose & Lily',
        quantity: 1,
        unit_price: 850,
        custom_specs: {
          design_name: 'Special Birthday Gift',
          design_description: 'ช่อดอกไม้เน้นกุหลาบแดงโทนหวาน',
          assembly_fee: 150,
          components: [
            {
              inventory_item_id: ObjectId('60d5ec496f892c001f8e4e20'),
              name: 'ดอกกุหลาบแดง',
              quantity: 5,
              unit_price: 100
            },
            {
              inventory_item_id: ObjectId('60d5ec496f892c001f8e4e21'),
              name: 'กระดาษห่อสีคราฟท์',
              quantity: 1,
              unit_price: 200
            }
          ]
        }
      }
    ],
    gift_note: 'Happy Birthday! Wishing you all the best.',
    payment_pricing: {
      subtotal: 1550,
      delivery_fee: 50,
      service_fee: 0,
      grand_total: 1600,
      payment_status: 'paid'
    },
    createdAt: ISODate('2026-09-21T01:15:27.254Z'),
    updatedAt: ISODate('2026-09-21T01:20:00.000Z')
  },
  {
    order_number: 'ORD-202609-002',
    user_id: ObjectId('665f1c2a9b1e8a0012345611'), // user_id จาก Cart ใบที่ 2
    order_status: 'processing',
    delivery_info: {
      delivery_date: ISODate('2026-09-26T14:00:00.000Z'),
      time_slot: '14:00 - 16:00',
      recipient_name: 'อนันต์ สุขเสริฐ',
      recipient_phone: '0898765432',
      shipping_address: {
        address_line: '99/9 อารีย์ซอย 1',
        sub_district: 'พญาไท',
        district: 'พญาไท',
        province: 'กรุงเทพมหานคร',
        postal_code: '10400'
      }
    },
    items: [
      {
        item_type: 'custom_product',
        item_name: 'Custom White Rose Bouquet',
        quantity: 1,
        unit_price: 1200,
        custom_specs: {
          design_name: 'White Premium Set',
          design_description: 'ช่อดอกกุหลาบขาวจัดเน้นความหรูหรา',
          assembly_fee: 200,
          components: [
            {
              inventory_item_id: ObjectId('60d5ec496f892c001f8e4e22'),
              name: 'ดอกกุหลาบขาว',
              quantity: 10,
              unit_price: 100
            }
          ]
        }
      }
    ],
    gift_note: 'Congratulations on your graduation!',
    payment_pricing: {
      subtotal: 1200,
      delivery_fee: 80,
      service_fee: 20,
      grand_total: 1300,
      payment_status: 'paid'
    },
    createdAt: ISODate('2026-09-21T01:22:54.622Z'),
    updatedAt: ISODate('2026-09-21T01:25:00.000Z')
  },
  {
    order_number: 'ORD-202609-003',
    user_id: ObjectId('665f1c2a9b1e8a0012340000'), // user_id จาก Cart ใบที่ 4
    order_status: 'pending',
    delivery_info: {
      delivery_date: ISODate('2026-09-27T11:00:00.000Z'),
      time_slot: '10:00 - 12:00',
      recipient_name: 'กัญญารัตน์ ประเสริฐสุข',
      recipient_phone: '0956781234',
      shipping_address: {
        address_line: '7/19 ถนนงามวงศ์วาน',
        sub_district: 'บางกระสอ',
        district: 'เมืองนนทบุรี',
        province: 'นนทบุรี',
        postal_code: '11000'
      }
    },
    items: [
      {
        item_type: 'standard_product',
        product_id: ObjectId('665f1c2a9b1e8a00aaaaa555'), // product_id จริงจาก Cart
        item_name: 'Tulip Flower Set',
        quantity: 2,
        unit_price: 500
      }
    ],
    gift_note: 'ขอให้มีความสุขมากๆ ในวันครบรอบครับ',
    payment_pricing: {
      subtotal: 1000,
      delivery_fee: 60,
      service_fee: 0,
      grand_total: 1060,
      payment_status: 'pending'
    },
    createdAt: ISODate('2026-09-21T08:18:13.526Z'),
    updatedAt: ISODate('2026-09-21T08:18:13.526Z')
  },
  {
    order_number: 'ORD-202609-004',
    user_id: ObjectId('6ab24c67f269ea1907ca8ca1'), // user_id จาก Cart ใบที่ 5
    order_status: 'completed',
    delivery_info: {
      delivery_date: ISODate('2026-09-23T15:00:00.000Z'),
      time_slot: '14:00 - 16:00',
      recipient_name: 'พิชญ์ นากสกุล',
      recipient_phone: '0623451290',
      shipping_address: {
        address_line: '45 หมู่ 3 ถนนนิมมานเหามินทร์',
        sub_district: 'สุเทพ',
        district: 'เมืองเชียงใหม่',
        province: 'เชียงใหม่',
        postal_code: '50200'
      }
    },
    items: [
      {
        item_type: 'standard_product',
        product_id: ObjectId('6ab0828634fa814a2db12b2e'), // product_id จริงจาก Cart
        item_name: 'Rose Flower Box',
        quantity: 2,
        unit_price: 450
      }
    ],
    gift_note: '',
    payment_pricing: {
      subtotal: 900,
      delivery_fee: 100,
      service_fee: 0,
      grand_total: 1000,
      payment_status: 'paid'
    },
    createdAt: ISODate('2026-09-22T13:15:31.797Z'),
    updatedAt: ISODate('2026-09-23T16:00:00.000Z')
  }
]);

// 4. แสดงข้อมูลทั้งหมดเพื่อตรวจสอบ
db.orders.find();