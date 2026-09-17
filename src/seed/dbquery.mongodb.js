use('FlowerShop');

// ล้างข้อมูลเดิมก่อน เพื่อให้รันซ้ำได้โดยไม่เกิด duplicate key error
db.blog.deleteMany({});

db.blog.insertMany([
  {
    _id: 'shb01',
    title: 'The Art of Preserving Dried Flowers So They Last All Year',
    description:
      'Techniques for air-drying and hanging flowers so they keep their color and shape for months, plus ideas for arranging them all over again.',
    content:
      'Dried flowers are not expired flowers. Preserve them the right way and the bouquet you were given becomes a piece of home decor that lasts for years.\n\nThe simplest method is hanging them upside down in a dark, well-ventilated spot for two to three weeks. Roses, lavender, and statice all work beautifully this way.\n\nFor thin-petalled flowers such as hydrangeas, stand them in shallow water and let it evaporate on its own. The petals stay smooth instead of shrivelling, and the head keeps its full, rounded form.',
    cover_image: 'https://images.unsplash.com/photo-1487070183336-b863922373d4',
    category: 'guide',
    status: 'published',
    is_popular: true,
    published_at: ISODate('2026-09-02T09:00:00Z'),
    created_at: ISODate('2026-08-28T10:12:00Z'),
    updated_at: ISODate('2026-09-02T09:00:00Z')
  },
  {
    _id: 'shb02',
    title: 'A Tour of Our Flower Studio on a Bright Morning',
    description:
      'We open the back door and show you where every bouquet actually comes together, from the cutting bench to the cold room.',
    content:
      'People often ask us where the bouquets they order are put together. Today we are walking you through the whole studio.\n\nIt starts in the morning intake area. Flowers from our own growers and from importers arrive before 7 a.m., and the team sorts them and cuts the stems underwater straight away.\n\nNext comes the arranging bench by the window, where the light is at its best, and finally the cold room held at 8 degrees Celsius, which keeps everything fresh right up until it reaches your hands.',
    cover_image: 'https://images.unsplash.com/photo-1558603668-6570496b66f8',
    category: 'behind_the_scenes',
    status: 'published',
    is_popular: true,
    published_at: ISODate('2026-08-27T08:30:00Z'),
    created_at: ISODate('2026-08-24T14:00:00Z'),
    updated_at: ISODate('2026-08-27T08:30:00Z')
  },
  {
    _id: 'shb03',
    title: 'Setting the Dinner Table with Cool-Toned Greenery',
    description:
      'Ideas for year-end dinner tables using eucalyptus, pine, and candles for a warm mood without needing many flowers.',
    content:
      'The end of the year is the season of family gatherings and long dinners, and setting the table does not call for expensive flowers.\n\nTry running eucalyptus branches down the middle of the table in a long line, then tucking in sprigs of pine and a few pine cones.\n\nAdd cream-colored candles at alternating heights. The flames catch the leaves and give the arrangement depth, and the faint scent of eucalyptus leaves the whole room feeling fresh.',
    cover_image: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103',
    category: 'inspiration',
    status: 'published',
    is_popular: true,
    published_at: ISODate('2026-08-20T10:00:00Z'),
    created_at: ISODate('2026-08-17T09:30:00Z'),
    updated_at: ISODate('2026-08-20T10:00:00Z')
  },
  {
    _id: 'shb04',
    title: 'Choosing Flowers for the Occasion: A Beginner\'s Guide',
    description:
      'Red roses are not right for every event. A short guide to which flowers and which colors suit which occasion.',
    content:
      'Giving the wrong flowers for the occasion can send a message you never intended. This guide helps you decide faster.\n\nFor celebrations such as graduations or a new shop opening, reach for bright tones like sunflowers and gerberas.\n\nFor expressions of sympathy, choose all-white arrangements such as lilies and white roses, and avoid bold colors. For anniversaries, red or deep pink roses are still the answer.',
    cover_image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946',
    category: 'guide',
    status: 'published',
    is_popular: false,
    published_at: ISODate('2026-08-14T09:15:00Z'),
    created_at: ISODate('2026-08-11T11:00:00Z'),
    updated_at: ISODate('2026-08-14T09:15:00Z')
  },
  {
    _id: 'shb05',
    title: 'A Day in the Life of a Florist Before Valentine\'s Day',
    description:
      'The busiest stretch of our year: how the team preps more than 3,000 roses in time to send them all out in a single day.',
    content:
      'The week before Valentine\'s Day is the most hectic of the year. We place our rose order almost a month ahead.\n\nThree days out, the team begins stripping the thorns and lower leaves from every single stem, then stores them in buckets of cold water sorted by shade.\n\nThe night before delivery, everyone arranges bouquets until two in the morning and sleeps at the shop so packing can start at five.',
    cover_image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7',
    category: 'behind_the_scenes',
    status: 'published',
    is_popular: false,
    published_at: ISODate('2026-08-08T13:00:00Z'),
    created_at: ISODate('2026-08-05T16:20:00Z'),
    updated_at: ISODate('2026-08-08T13:00:00Z')
  },
  {
    _id: 'shb06',
    title: 'Lifting a Home Office with One Small Vase of Flowers',
    description:
      'You do not need a big bouquet. A narrow-necked vase with three to five stems is enough to change the feel of your desk.',
    content:
      'A desk with flowers on it makes you want to sit down and work, and it does not take much of an investment.\n\nPick a narrow-necked vase roughly 15 to 20 centimeters tall and fill it with three to five upright stems such as lisianthus or carnations.\n\nChange the water every two days and trim the stems at a slight angle, and they will keep for nearly a week.',
    cover_image: 'https://images.unsplash.com/photo-1509423350716-97f2360af2e4',
    category: 'inspiration',
    status: 'published',
    is_popular: false,
    published_at: ISODate('2026-08-01T09:45:00Z'),
    created_at: ISODate('2026-07-29T10:00:00Z'),
    updated_at: ISODate('2026-08-01T09:45:00Z')
  },
  {
    _id: 'shb07',
    title: 'How to Make a Bouquet You Were Given Last as Long as Possible',
    description:
      'Five easy steps, from unwrapping and trimming the stems to mixing flower food and picking the right spot for the vase.',
    content:
      'A lovely bouquet you have been given will last seven to ten days if you look after it well.\n\nUnwrap it the moment you get home, cut the stems at a 45-degree angle underwater, then stand them in clean water mixed with flower food.\n\nKeep the vase away from direct sunlight, air conditioning, and the fruit bowl, because fruit gives off ethylene gas that makes blooms fade faster.',
    cover_image: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac',
    category: 'guide',
    status: 'published',
    is_popular: true,
    published_at: ISODate('2026-07-25T08:00:00Z'),
    created_at: ISODate('2026-07-22T12:00:00Z'),
    updated_at: ISODate('2026-07-25T08:00:00Z')
  },
  {
    _id: 'shb08',
    title: 'Behind the Scenes of Our New Seasonal Product Shoot',
    description:
      'What it takes to get a bouquet onto the website: lighting the set, choosing the backdrop, and retouching the final frames.',
    content:
      'Every product photo on the website is shot in our own studio. None of it is stock imagery.\n\nWe shoot in the late morning, when the daylight coming through the north-facing window is at its softest, and use a white reflector to lift the harsh shadows.\n\nThe backdrop is a mid-tone linen so the flower colors stand out. Afterwards we retouch only lightly, so the colors match the real thing as closely as possible.',
    cover_image: 'https://images.unsplash.com/photo-1524863479829-916d8e77f114',
    category: 'behind_the_scenes',
    status: 'published',
    is_popular: false,
    published_at: ISODate('2026-07-18T10:30:00Z'),
    created_at: ISODate('2026-07-15T09:00:00Z'),
    updated_at: ISODate('2026-07-18T10:30:00Z')
  },
  {
    _id: 'shb09',
    title: 'The Most Popular Flower Palettes of the Year',
    description:
      'A roundup of the color palettes customers ordered most, from soft peach through to deep burgundy, with the flowers that match each one.',
    content:
      'Looking back at a full year of orders, the color trends are getting clearer and clearer.\n\nSoft peach mixed with cream still holds first place. It suits weddings and congratulatory gifts, and the flowers that match it are peach roses and white lisianthus.\n\nSecond place goes to deep burgundy set against copper, a combination that feels rich and warm and is especially popular at the end of the year.',
    cover_image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321',
    category: 'inspiration',
    status: 'published',
    is_popular: false,
    published_at: ISODate('2026-07-10T09:00:00Z'),
    created_at: ISODate('2026-07-07T11:30:00Z'),
    updated_at: ISODate('2026-07-10T09:00:00Z')
  },
  {
    _id: 'shb10',
    title: 'A DIY Bouquet for Beginners in 20 Minutes',
    description:
      'The spiral method real florists use, built up one layer at a time: focal blooms, filler flowers, then foliage.',
    content:
      'The spiral is the heart of every round bouquet, and it is not hard to follow.\n\nStart with three focal stems held at an angle in your hand, then add filler flowers, always laying each stem at the same angle and turning the bouquet as you go.\n\nFinish with foliage around the outside, tie the binding point firmly with twine, and trim the stems to an even length.',
    cover_image: 'https://images.unsplash.com/photo-1464982326199-86f32f81b211',
    category: 'guide',
    status: 'published',
    is_popular: false,
    published_at: ISODate('2026-07-03T08:20:00Z'),
    created_at: ISODate('2026-06-30T15:00:00Z'),
    updated_at: ISODate('2026-07-03T08:20:00Z')
  },
  {
    _id: 'shb11',
    title: 'Rainy Season Flowers We Recommend',
    description:
      'The rainy season is no obstacle. These flowers handle humidity well and stay fresh and pretty right through the wet months. (Draft, not yet published.)',
    content: 'This article is still a draft. The text is being edited and the photos have yet to be shot.',
    cover_image: 'https://images.unsplash.com/photo-1502977249166-824b3a8a4d6d',
    category: 'guide',
    status: 'draft',
    is_popular: false,
    published_at: null,
    created_at: ISODate('2026-09-04T10:00:00Z'),
    updated_at: ISODate('2026-09-05T14:30:00Z')
  }
]);

//db.Content.countDocuments();