use('FlowerShop');

db.users.deleteMany({});

db.users.insertMany([
  {
    // ไม่ใส่ _id เอง ปล่อยให้ MongoDB gen ObjectId ให้อัตโนมัติ (ตาม ER diagram: _id เป็น ObjectId ไม่ใช่ string)
    email: 'somsri.k@gmail.com',
    // password ยังเป็น plain text เดิม รอจัดการ hash ตอนทำ auth จริง
    password_hash: 'somsri123',
    phone_number: '081-234-5678',
    role: 'customer',
    status: 'active',
    created_at: ISODate('2026-01-10T09:00:00Z'),
    delete_at: null,
    profile: {
      first_name: 'Somsri',
      last_name: 'Khamkaew',
      gender: 'female'
    },
    shipping_addresses: [
      {
        // ใส่ _id เองเพราะ insertMany รันตรงผ่าน MongoDB driver ไม่ผ่าน mongoose เลยไม่ gen ให้อัตโนมัติ
        _id: ObjectId(),
        recipient_name: 'Somsri Khamkaew',
        address: '123/45 Sukhumvit Road',
        phone: '081-234-5678',
        sub_district: 'Khlong Tan Nuea',
        district: 'Watthana',
        province: 'Bangkok',
        postal_code: '10110',
        is_default: true
      }
    ]
  },
  {
    email: 'admin@atelierdeflora.com',
    password_hash: 'admin1234',
    phone_number: '089-999-8888',
    role: 'admin',
    status: 'active',
    created_at: ISODate('2025-11-02T09:00:00Z'),
    delete_at: null,
    profile: {
      first_name: 'Thanakorn',
      last_name: 'Wongphaisan',
      gender: 'male'
    },
    shipping_addresses: [
      {
        _id: ObjectId(),
        recipient_name: 'Thanakorn Wongphaisan',
        address: '88 Ratchadamnoen Road',
        phone: '089-999-8888',
        sub_district: 'Bowon Niwet',
        district: 'Phra Nakhon',
        province: 'Bangkok',
        postal_code: '10200',
        is_default: true
      }
    ]
  },
  {
    email: 'pichaya.n@hotmail.com',
    password_hash: 'pichaya456',
    phone_number: '062-345-1290',
    role: 'customer',
    status: 'suspended',
    created_at: ISODate('2026-03-22T09:00:00Z'),
    delete_at: null,
    profile: {
      first_name: 'Pichaya',
      last_name: 'Naksakul',
      gender: 'male'
    },
    shipping_addresses: [
      {
        _id: ObjectId(),
        recipient_name: 'Pichaya Naksakul',
        address: '45 Moo 3 Nimmanhaemin Road',
        phone: '062-345-1290',
        sub_district: 'Suthep',
        district: 'Mueang Chiang Mai',
        province: 'Chiang Mai',
        postal_code: '50200',
        is_default: true
      }
    ]
  },
  {
    email: 'kanyarat.p@gmail.com',
    password_hash: 'kanyarat789',
    phone_number: '095-678-1234',
    role: 'customer',
    status: 'active',
    created_at: ISODate('2026-05-14T09:00:00Z'),
    delete_at: null,
    profile: {
      first_name: 'Kanyarat',
      last_name: 'Prasertsuk',
      gender: 'female'
    },
    shipping_addresses: [
      {
        _id: ObjectId(),
        recipient_name: 'Kanyarat Prasertsuk',
        address: '7/19 Ngamwongwan Road',
        phone: '095-678-1234',
        sub_district: 'Bang Kraso',
        district: 'Mueang Nonthaburi',
        province: 'Nonthaburi',
        postal_code: '11000',
        is_default: true
      }
    ]
  }
]);
