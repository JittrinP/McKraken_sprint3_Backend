use('FlowerShop');

// ลบข้อมูล review เดิมทิ้งก่อน เพื่อให้ seed นี้รันซ้ำได้อย่างปลอดภัย (idempotent)
db.reviews.deleteMany({});

// แปลงมาจาก sprint2/src/assets/mockData/mockCMR.js
// - id (mock string เช่น 'rev-001') ไม่เก็บ ปล่อยให้ Mongo gen ObjectId ให้อัตโนมัติ
// - customerName -> customer_name, productName -> product_name, reviewDate -> review_date
// - productId ตัดออก (ตกลงกันแล้วว่าไม่ ref ไปหา Product จริง เก็บแค่ product_name พอ)
db.reviews.insertMany([
  {
    customer_name: 'คุณนภัสสร วิเศษกุล',
    rating: 5,
    comment: 'ช่อดอกกุหลาบสดและสวยงามมากค่ะ การจัดช่อดูหรูหราและประณีตสุดๆ แฟนประทับใจมาก ทางร้านจัดส่งตรงเวลา แพ็กเกจจิ้งแข็งแรงประทับใจจริงๆ ค่ะ',
    product_name: 'Red Rose Passion Bouquet',
    review_date: ISODate('2026-04-12T00:00:00Z'),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  {
    customer_name: 'คุณกิตติศักดิ์ เมธาพาณิชย์',
    rating: 5,
    comment: 'สั่งช่อทานตะวันให้เพื่อนวันรับปริญญา ดอกใหญ่สดใสและช่อใหญ่เต็มตามากครับ ถ่ายรูปออกมาสวยโดดเด่นสุดๆ บริการแอดมินดีมากครับ ให้คำแนะนำเป็นอย่างดี',
    product_name: 'Sunlight Sunflower Delight',
    review_date: ISODate('2026-04-20T00:00:00Z'),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    customer_name: 'คุณพิชญนันท์ สุวรรณเวช',
    rating: 4.5,
    comment: 'ดอกทิวลิปสีพาสเทลหวานละมุนมากค่ะ ตรงปกเหมือนในรูปเลย กลิ่นหอมอ่อนๆ สดชื่นมากๆ คุ้มค่าสมราคา นำเข้าคุณภาพดีจริงๆ ค่ะ',
    product_name: 'Pastel Dutch Tulip Ensemble',
    review_date: ISODate('2026-05-02T00:00:00Z'),
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
  },
  {
    customer_name: 'คุณธนกร วรโชติช่วง',
    rating: 5,
    comment: 'จัดชุดอลังการสมชื่อ Golden Jubilee จริงๆ ครับ ซื้อเป็นของขวัญผู้ใหญ่ ประทับใจกันทั้งบ้าน กล่องสวยหรูหรา ดอกไม้เกรดพรีเมียมสมราคาครับ',
    product_name: 'Golden Jubilee Luxury Box',
    review_date: ISODate('2026-05-15T00:00:00Z'),
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  {
    customer_name: 'คุณศิรินทิพย์ เด่นดวง',
    rating: 4,
    comment: 'ช่อน่ารักสไตล์มินิมอลเกาหลีมากค่ะ ดอกแคสเปียกับเบบี้บรีธละมุนเข้ากันสุดๆ วางประดับห้องแล้วดูละมุนตามาก จัดส่งเรียบร้อยไม่มีบอบช้ำเลยค่ะ',
    product_name: "Minimalist Baby's Breath Cloud",
    review_date: ISODate('2026-05-28T00:00:00Z'),
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  }
]);
