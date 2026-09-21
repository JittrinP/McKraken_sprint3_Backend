use('FlowerShop');

// Clear only the product and inventory collections so this seed can be rerun safely.
db.products.deleteMany({});
db.inventory_items.deleteMany({});

const inventoryIdMap = {};
const inventoryItems = [
  ['inv01', 'Ecuadorian Red Rose', 'flower', 18, 640, 'red', 'imported'],
  ['inv02', 'Kraft Wrapping Paper', 'wrapping_paper', 12, 300, 'brown', 'local'],
  ['inv03', 'Pink Tulip', 'flower', 25, 180, 'pink', 'imported'],
  ['inv04', 'Korean Wrapping Paper', 'wrapping_paper', 15, 260, 'cream', 'imported'],
  ['inv05', 'White Lily', 'flower', 22, 150, 'white', 'local'],
  ['inv06', 'Sunflower', 'flower', 20, 220, 'yellow', 'local'],
  ['inv07', 'Blue Hydrangea', 'flower', 45, 90, 'blue', 'imported'],
  ['inv08', 'Pink Carnation', 'flower', 12, 400, 'pink', 'local'],
  ['inv09', 'Satin Ribbon', 'wrapping_paper', 8, 500, 'ivory', 'local'],
  ['inv10', 'Tall Glass Vase', 'vase', 65, 70, 'clear', 'local'],
  ['inv11', "Baby's Breath", 'flower', 15, 310, 'white', 'local'],
  ['inv12', 'Potted Orchid in Ceramic Pot', 'flower', 90, 40, 'purple', 'imported'],
  ['inv13', 'Pink Peony', 'flower', 70, 55, 'pink', 'imported'],
  ['inv14', 'Yellow Daisy', 'flower', 9, 480, 'yellow', 'local'],
  ['inv15', 'Purple Eustoma', 'flower', 16, 160, 'purple', 'local'],
  ['inv16', 'Jasmine Plant', 'flower', 30, 80, 'white', 'local'],
  ['inv17', 'Orange Rose', 'flower', 17, 240, 'orange', 'local'],
  ['inv18', 'White Rose', 'flower', 16, 260, 'white', 'local'],
  ['inv19', 'Eucalyptus Leaves', 'flower', 10, 350, 'green', 'local'],
  ['inv20', 'Dried Lavender', 'flower', 28, 120, 'purple', 'imported'],
  ['inv21', 'Peach English Rose', 'flower', 24, 140, 'peach', 'imported'],
  ['inv22', 'Cotton Flower', 'flower', 14, 200, 'white', 'imported']
].map(([seedKey, name, category, cost_price, stock_quantity, color, origin]) => {
  const _id = new ObjectId();
  inventoryIdMap[seedKey] = _id;
  return {
    _id,
    name,
    category,
    cost_price,
    stock_quantity,
    attributes: { color, origin }
  };
});

db.inventory_items.insertMany(inventoryItems);

db.products.insertMany([
  {
    name: 'Red Rose Passion Bouquet',
    description: 'A premium red rose bouquet, carefully arranged for anniversaries.',
    images: ['https://images.unsplash.com/photo-1561181286-d3fee7d55364'],
    product_type: 'bouquet_set',
    base_price: 1290,
    is_active: true,
    is_popular: true,
    sales_count: 142,
    tags: ['popular', 'bestseller', 'valentine', 'rose'],
    components: [
      { inventory_item_id: inventoryIdMap.inv01, quantity_required: 12 },
      { inventory_item_id: inventoryIdMap.inv02, quantity_required: 1 }
    ]
  },
  {
    name: 'Pastel Dutch Tulip Ensemble',
    description: 'A pastel-toned tulip bouquet imported from the Netherlands.',
    images: ['https://images.unsplash.com/photo-1526047932273-341f2a7631f9'],
    product_type: 'bouquet_set',
    base_price: 1850,
    is_active: true,
    is_popular: true,
    sales_count: 98,
    tags: ['popular', 'imported', 'tulip', 'birthday'],
    components: [
      { inventory_item_id: inventoryIdMap.inv03, quantity_required: 10 },
      { inventory_item_id: inventoryIdMap.inv04, quantity_required: 1 }
    ]
  },
  {
    name: 'Single White Lily Single Box',
    description: 'A single white lily presented in an elegant gift box.',
    images: ['https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11'],
    product_type: 'single_item',
    base_price: 450,
    is_active: true,
    is_popular: false,
    sales_count: 34,
    tags: ['lily', 'minimal', 'single'],
    components: [{ inventory_item_id: inventoryIdMap.inv05, quantity_required: 1 }]
  },
  {
    name: 'Sunlight Sunflower Delight',
    description: 'A bright sunflower bouquet that makes a cheerful graduation gift.',
    images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651'],
    product_type: 'bouquet_set',
    base_price: 990,
    is_active: true,
    is_popular: true,
    sales_count: 210,
    tags: ['popular', 'bestseller', 'sunflower', 'graduation'],
    components: [
      { inventory_item_id: inventoryIdMap.inv06, quantity_required: 5 },
      { inventory_item_id: inventoryIdMap.inv02, quantity_required: 1 }
    ]
  },
  {
    name: 'Vintage Dried Hydrangea Arrangement',
    description: 'Vintage-style dried hydrangeas that can last for years.',
    images: ['https://images.unsplash.com/photo-1563241527-3004b7be0ffd'],
    product_type: 'single_item',
    base_price: 750,
    is_active: true,
    is_popular: false,
    sales_count: 15,
    tags: ['dried', 'vintage', 'hydrangea'],
    components: [{ inventory_item_id: inventoryIdMap.inv07, quantity_required: 1 }]
  },
  {
    name: "Pink Carnation Mother's Joy",
    description: 'A pink carnation bouquet symbolizing pure affection.',
    images: ['https://images.unsplash.com/photo-1508610048659-a06b669e3321'],
    product_type: 'bouquet_set',
    base_price: 890,
    is_active: true,
    is_popular: true,
    sales_count: 88,
    tags: ['popular', 'carnation', 'motherday'],
    components: [
      { inventory_item_id: inventoryIdMap.inv08, quantity_required: 10 },
      { inventory_item_id: inventoryIdMap.inv09, quantity_required: 1 }
    ]
  },
  {
    name: 'Royal Blue Hydrangea Glass Vase',
    description: 'Blue hydrangeas arranged in a tall glass vase for a desk or workspace.',
    images: ['https://images.unsplash.com/photo-1527061011665-3652c757a4d4'],
    product_type: 'bouquet_set',
    base_price: 1490,
    is_active: true,
    is_popular: false,
    sales_count: 42,
    tags: ['vase', 'hydrangea', 'home_decor'],
    components: [
      { inventory_item_id: inventoryIdMap.inv07, quantity_required: 2 },
      { inventory_item_id: inventoryIdMap.inv10, quantity_required: 1 }
    ]
  },
  {
    name: "Minimalist Baby's Breath Cloud",
    description: "A minimalist Korean-style bouquet of caspia and white baby's breath.",
    images: ['https://images.unsplash.com/photo-1518895949257-7621c3c786d7'],
    product_type: 'bouquet_set',
    base_price: 690,
    is_active: true,
    is_popular: true,
    sales_count: 175,
    tags: ['popular', 'minimal', 'korean'],
    components: [
      { inventory_item_id: inventoryIdMap.inv11, quantity_required: 5 },
      { inventory_item_id: inventoryIdMap.inv04, quantity_required: 1 }
    ]
  },
  {
    name: 'Luxury Orchid Ceramic Set',
    description: 'Imported orchids presented in a luxurious ceramic pot.',
    images: ['https://images.unsplash.com/photo-1567696911980-2eed69a46042'],
    product_type: 'single_item',
    base_price: 2500,
    is_active: true,
    is_popular: false,
    sales_count: 12,
    tags: ['luxury', 'orchid', 'gift'],
    components: [{ inventory_item_id: inventoryIdMap.inv12, quantity_required: 1 }]
  },
  {
    name: 'Peony Romance Limited Edition',
    description: 'A soft pink peony bouquet available in limited seasonal quantities.',
    images: ['https://images.unsplash.com/photo-1521737604893-d14cc237f11d'],
    product_type: 'bouquet_set',
    base_price: 2200,
    is_active: true,
    is_popular: true,
    sales_count: 115,
    tags: ['popular', 'peony', 'limited', 'romantic'],
    components: [
      { inventory_item_id: inventoryIdMap.inv13, quantity_required: 6 },
      { inventory_item_id: inventoryIdMap.inv02, quantity_required: 1 }
    ]
  },
  {
    name: 'Yellow Daisy Sunshine',
    description: 'A bright yellow daisy bouquet that adds joy to an ordinary day.',
    images: ['https://images.unsplash.com/photo-1606041008023-472dfb5e530f'],
    product_type: 'bouquet_set',
    base_price: 590,
    is_active: true,
    is_popular: false,
    sales_count: 55,
    tags: ['daisy', 'cute', 'friendship'],
    components: [
      { inventory_item_id: inventoryIdMap.inv14, quantity_required: 15 },
      { inventory_item_id: inventoryIdMap.inv09, quantity_required: 1 }
    ]
  },
  {
    name: 'Single Ecuador Red Rose',
    description: 'One extra-large premium Ecuadorian red rose.',
    images: ['https://images.unsplash.com/photo-1559563458-527698bf5295'],
    product_type: 'single_item',
    base_price: 350,
    is_active: true,
    is_popular: true,
    sales_count: 300,
    tags: ['popular', 'single', 'ecuador_rose'],
    components: [{ inventory_item_id: inventoryIdMap.inv01, quantity_required: 1 }]
  },
  {
    name: 'Rustic Dried Flower Bottle',
    description: 'A rustic glass bottle filled with a mix of dried flowers.',
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38'],
    product_type: 'single_item',
    base_price: 490,
    is_active: true,
    is_popular: false,
    sales_count: 28,
    tags: ['dried', 'rustic', 'decor'],
    components: [{ inventory_item_id: inventoryIdMap.inv11, quantity_required: 2 }]
  },
  {
    name: 'Purple Eustoma Elegance',
    description: 'A deep purple eustoma bouquet representing commitment and remembrance.',
    images: ['https://images.unsplash.com/photo-1563241527-3004b7be0ffd'],
    product_type: 'bouquet_set',
    base_price: 1190,
    is_active: true,
    is_popular: false,
    sales_count: 47,
    tags: ['eustoma', 'purple', 'congrats'],
    components: [
      { inventory_item_id: inventoryIdMap.inv15, quantity_required: 8 },
      { inventory_item_id: inventoryIdMap.inv02, quantity_required: 1 }
    ]
  },
  {
    name: 'White Jasmine Scented Pot',
    description: 'A naturally fragrant jasmine plant for home decoration.',
    images: ['https://images.unsplash.com/photo-1592150621744-aca64f48394a'],
    product_type: 'single_item',
    base_price: 390,
    is_active: true,
    is_popular: false,
    sales_count: 62,
    tags: ['jasmine', 'pot', 'fragrance'],
    components: [{ inventory_item_id: inventoryIdMap.inv16, quantity_required: 1 }]
  },
  {
    name: 'Sunset Orange Rose Bouquet',
    description: 'A sunset-orange rose bouquet combining warmth and brightness.',
    images: ['https://images.unsplash.com/photo-1533616688419-b7a585564566'],
    product_type: 'bouquet_set',
    base_price: 1350,
    is_active: true,
    is_popular: true,
    sales_count: 92,
    tags: ['popular', 'orange', 'rose'],
    components: [
      { inventory_item_id: inventoryIdMap.inv17, quantity_required: 10 },
      { inventory_item_id: inventoryIdMap.inv04, quantity_required: 1 }
    ]
  },
  {
    name: 'Blue Hydrangea & White Rose Mix',
    description: 'An elegant mixed bouquet of blue hydrangeas and white roses.',
    images: ['https://images.unsplash.com/photo-1561181286-d3fee7d55364'],
    product_type: 'bouquet_set',
    base_price: 1690,
    is_active: true,
    is_popular: true,
    sales_count: 130,
    tags: ['popular', 'mix', 'luxury'],
    components: [
      { inventory_item_id: inventoryIdMap.inv07, quantity_required: 1 },
      { inventory_item_id: inventoryIdMap.inv18, quantity_required: 6 },
      { inventory_item_id: inventoryIdMap.inv02, quantity_required: 1 }
    ]
  },
  {
    name: 'Single Pink Tulip Stem',
    description: 'A single pink tulip stem with minimalist clear packaging.',
    images: ['https://images.unsplash.com/photo-1526047932273-341f2a7631f9'],
    product_type: 'single_item',
    base_price: 220,
    is_active: true,
    is_popular: false,
    sales_count: 80,
    tags: ['tulip', 'single', 'minimal'],
    components: [{ inventory_item_id: inventoryIdMap.inv03, quantity_required: 1 }]
  },
  {
    name: 'Eucalyptus Greenery Bundle',
    description: 'A fresh eucalyptus bundle with a soothing aromatic scent.',
    images: ['https://images.unsplash.com/photo-1518531933037-91b2f5f229cc'],
    product_type: 'single_item',
    base_price: 390,
    is_active: true,
    is_popular: false,
    sales_count: 40,
    tags: ['greenery', 'eucalyptus', 'aroma'],
    components: [{ inventory_item_id: inventoryIdMap.inv19, quantity_required: 5 }]
  },
  {
    name: 'Classic 99 Red Roses Huge Bouquet',
    description: 'A grand bouquet of 99 red roses for a memorable declaration of love.',
    images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23'],
    product_type: 'bouquet_set',
    base_price: 8900,
    is_active: true,
    is_popular: true,
    sales_count: 25,
    tags: ['popular', 'grand', 'proposal', 'rose'],
    components: [
      { inventory_item_id: inventoryIdMap.inv01, quantity_required: 99 },
      { inventory_item_id: inventoryIdMap.inv02, quantity_required: 3 }
    ]
  },
  {
    name: 'Lavender Field Small Vase',
    description: 'Dried lavender in a small ceramic vase with a refreshing scent.',
    images: ['https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a'],
    product_type: 'bouquet_set',
    base_price: 550,
    is_active: true,
    is_popular: false,
    sales_count: 71,
    tags: ['lavender', 'dried', 'vase'],
    components: [
      { inventory_item_id: inventoryIdMap.inv20, quantity_required: 1 },
      { inventory_item_id: inventoryIdMap.inv10, quantity_required: 1 }
    ]
  },
  {
    name: 'Peach Garden Rose Delight',
    description: 'Pastel peach English roses arranged in an English garden style.',
    images: ['https://images.unsplash.com/photo-1561181286-d3fee7d55364'],
    product_type: 'bouquet_set',
    base_price: 1590,
    is_active: true,
    is_popular: false,
    sales_count: 53,
    tags: ['peach', 'english_rose', 'bouquet'],
    components: [
      { inventory_item_id: inventoryIdMap.inv21, quantity_required: 10 },
      { inventory_item_id: inventoryIdMap.inv04, quantity_required: 1 }
    ]
  },
  {
    name: 'Sunflower Single Stand',
    description: 'A single sunflower on a wooden stand to brighten a desk.',
    images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651'],
    product_type: 'single_item',
    base_price: 290,
    is_active: true,
    is_popular: false,
    sales_count: 89,
    tags: ['sunflower', 'single', 'desk'],
    components: [{ inventory_item_id: inventoryIdMap.inv06, quantity_required: 1 }]
  },
  {
    name: 'Cotton Flower Warmth Bouquet',
    description: 'A warm Nordic-style bouquet of cotton and dried flowers.',
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38'],
    product_type: 'bouquet_set',
    base_price: 850,
    is_active: true,
    is_popular: false,
    sales_count: 31,
    tags: ['cotton', 'nordic', 'cozy'],
    components: [
      { inventory_item_id: inventoryIdMap.inv22, quantity_required: 5 },
      { inventory_item_id: inventoryIdMap.inv09, quantity_required: 1 }
    ]
  },
  {
    name: 'Red & White Celebration Mix',
    description: 'A red rose and white lily bouquet for celebrating an achievement.',
    images: ['https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11'],
    product_type: 'bouquet_set',
    base_price: 1790,
    is_active: true,
    is_popular: true,
    sales_count: 105,
    tags: ['popular', 'congrats', 'mix'],
    components: [
      { inventory_item_id: inventoryIdMap.inv01, quantity_required: 6 },
      { inventory_item_id: inventoryIdMap.inv05, quantity_required: 3 },
      { inventory_item_id: inventoryIdMap.inv02, quantity_required: 1 }
    ]
  },
  {
    name: 'Seasonal Wildflower Garden',
    description: 'A seasonal wildflower bouquet with a natural and charming feel.',
    images: ['https://images.unsplash.com/photo-1508610048659-a06b669e3321'],
    product_type: 'bouquet_set',
    base_price: 950,
    is_active: true,
    is_popular: false,
    sales_count: 64,
    tags: ['wildflower', 'natural', 'season'],
    components: [
      { inventory_item_id: inventoryIdMap.inv14, quantity_required: 10 },
      { inventory_item_id: inventoryIdMap.inv09, quantity_required: 1 }
    ]
  },
  {
    name: 'Arch Flower Wedding Special',
    description: 'A ready-made floral arch for events or weddings.',
    images: ['https://images.unsplash.com/photo-1526047932273-341f2a7631f9'],
    product_type: 'bouquet_set',
    base_price: 4500,
    is_active: false,
    is_popular: false,
    sales_count: 8,
    tags: ['wedding', 'event', 'arch'],
    components: [
      { inventory_item_id: inventoryIdMap.inv01, quantity_required: 30 },
      { inventory_item_id: inventoryIdMap.inv05, quantity_required: 10 }
    ]
  },
  {
    name: 'Pink Daisy Petite Bouquet',
    description: 'A petite pink daisy bouquet that makes a sweet small gift.',
    images: ['https://images.unsplash.com/photo-1606041008023-472dfb5e530f'],
    product_type: 'bouquet_set',
    base_price: 490,
    is_active: true,
    is_popular: false,
    sales_count: 95,
    tags: ['daisy', 'petite', 'pink'],
    components: [
      { inventory_item_id: inventoryIdMap.inv14, quantity_required: 8 },
      { inventory_item_id: inventoryIdMap.inv04, quantity_required: 1 }
    ]
  },
  {
    name: 'Single Black Rose Mystery',
    description: 'One mysterious dyed black rose in special packaging.',
    images: ['https://images.unsplash.com/photo-1559563458-527698bf5295'],
    product_type: 'single_item',
    base_price: 390,
    is_active: true,
    is_popular: false,
    sales_count: 48,
    tags: ['gothic', 'black_rose', 'unique'],
    components: [{ inventory_item_id: inventoryIdMap.inv01, quantity_required: 1 }]
  },
  {
    name: 'Golden Jubilee Luxury Box',
    description: 'A VIP luxury box featuring golden and premium red roses.',
    images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23'],
    product_type: 'bouquet_set',
    base_price: 3200,
    is_active: true,
    is_popular: true,
    sales_count: 160,
    tags: ['popular', 'bestseller', 'luxury', 'vip'],
    components: [{ inventory_item_id: inventoryIdMap.inv01, quantity_required: 24 }]
  }
]);

print(`Seeded ${db.products.countDocuments()} products.`);
