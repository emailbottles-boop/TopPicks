// Product catalogue — edit or replace with your own data.
// affiliate: your Amazon affiliate tag goes at the end of each URL (?tag=YOUR-TAG-20)

const PRODUCTS = [
  {
    id: 1,
    title: "Anker 65W USB-C Charger",
    description: "Charges a MacBook Pro to 50% in 45 min. Foldable plug, GaN technology, ultra-compact.",
    category: "tech",
    price: 35.99,
    rating: 4.8,
    reviews: 12430,
    image: "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B09VFF5HBM?tag=toppicks-20"
  },
  {
    id: 2,
    title: "Sony WH-1000XM5 Headphones",
    description: "Best-in-class noise cancellation with 30-hour battery life and crystal-clear call quality.",
    category: "tech",
    price: 279.99,
    rating: 4.9,
    reviews: 8723,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B09XS7JWHH?tag=toppicks-20"
  },
  {
    id: 3,
    title: "Kindle Paperwhite (16 GB)",
    description: "Waterproof, glare-free 6.8\" display. Weeks of battery life. Reads like real paper.",
    category: "tech",
    price: 139.99,
    rating: 4.7,
    reviews: 53801,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B09TMF6745?tag=toppicks-20"
  },
  {
    id: 4,
    title: "Philips Hue Starter Kit",
    description: "4 smart bulbs + bridge. 16 million colors. Works with Alexa, Google, and Apple HomeKit.",
    category: "home",
    price: 99.99,
    rating: 4.6,
    reviews: 22187,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B09PYBM7QM?tag=toppicks-20"
  },
  {
    id: 5,
    title: "Dyson V15 Detect Vacuum",
    description: "Laser illuminates dust you can't see. Automatically adjusts suction. Whole-home clean.",
    category: "home",
    price: 649.99,
    rating: 4.8,
    reviews: 9341,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B09JJW2V3J?tag=toppicks-20"
  },
  {
    id: 6,
    title: "Casper Original Mattress",
    description: "Zoned support system aligns your spine. CertiPUR-US foam. 100-night risk-free trial.",
    category: "home",
    price: 895.00,
    rating: 4.5,
    reviews: 31052,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B00UVDTCYC?tag=toppicks-20"
  },
  {
    id: 7,
    title: "Ninja Foodi 9-in-1 Pressure Cooker",
    description: "Air fry, pressure cook, slow cook, steam, roast, bake, broil, sear & dehydrate.",
    category: "kitchen",
    price: 179.99,
    rating: 4.8,
    reviews: 27643,
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B07TR4G8ZT?tag=toppicks-20"
  },
  {
    id: 8,
    title: "Vitamix 5200 Blender",
    description: "Aircraft-grade stainless blades liquefy the toughest ingredients. Self-cleaning in 60 sec.",
    category: "kitchen",
    price: 449.95,
    rating: 4.7,
    reviews: 15923,
    image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B008H4SLV6?tag=toppicks-20"
  },
  {
    id: 9,
    title: "Lodge 12\" Cast Iron Skillet",
    description: "Pre-seasoned, ready to use. Unmatched heat retention. Oven-safe to 500°F. Lasts a lifetime.",
    category: "kitchen",
    price: 34.90,
    rating: 4.8,
    reviews: 99800,
    image: "https://images.unsplash.com/photo-1648577374455-afb5c16ccea2?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B00006JSUA?tag=toppicks-20"
  },
  {
    id: 10,
    title: "Theragun Prime Massager",
    description: "Quiet Force Technology. 5 built-in speeds. 16mm amplitude. Pairs with the Therabody app.",
    category: "lifestyle",
    price: 299.00,
    rating: 4.7,
    reviews: 8412,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B099Z7W56Q?tag=toppicks-20"
  },
  {
    id: 11,
    title: "Hydro Flask 32 oz Water Bottle",
    description: "TempShield double-wall insulation keeps drinks cold 24h, hot 12h. Lifetime warranty.",
    category: "lifestyle",
    price: 44.95,
    rating: 4.8,
    reviews: 62014,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B09TMQM1LZ?tag=toppicks-20"
  },
  {
    id: 12,
    title: "Lululemon Everywhere Belt Bag",
    description: "1L capacity. Adjustable strap. Water-repellent. Perfect for runs, travel, or errands.",
    category: "lifestyle",
    price: 38.00,
    rating: 4.6,
    reviews: 19234,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
    affiliate: "https://www.amazon.com/dp/B09Q2L6HFX?tag=toppicks-20"
  }
];
