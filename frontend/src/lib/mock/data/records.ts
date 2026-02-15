import type { AerospikeRecord, GeoJSON, BinValue } from "@/lib/api/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const firstNames = [
  "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank",
  "Irene", "Jack", "Karen", "Leo", "Mona", "Nick", "Olivia", "Paul",
  "Quinn", "Rita", "Sam", "Tina", "Uma", "Vic", "Wendy", "Xander",
  "Yara", "Zane",
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
];

const productNames = [
  "Wireless Mouse", "Mechanical Keyboard", "USB-C Hub", "Monitor Stand",
  "Webcam HD", "Desk Lamp", "Laptop Stand", "Cable Organizer",
  "Noise-Cancelling Headphones", "Bluetooth Speaker", "External SSD",
  "Portable Charger", "Smart Watch", "Fitness Tracker", "VR Headset",
  "Drone Mini", "Action Camera", "E-Reader", "Tablet Stylus", "Docking Station",
  "Ring Light", "Microphone USB", "Game Controller", "Mouse Pad XL",
  "Screen Protector", "Phone Mount", "Car Charger", "Wall Adapter",
  "HDMI Cable", "Ethernet Adapter",
];

const categories = [
  "Electronics", "Accessories", "Audio", "Computing", "Gaming",
  "Photography", "Wearables", "Storage",
];

const orderStatuses = [
  "pending", "processing", "shipped", "delivered", "cancelled", "refunded",
];

const streetNames = [
  "Main St", "Oak Ave", "Cedar Ln", "Elm Dr", "Pine Rd",
  "Maple Ct", "Birch Blvd", "Walnut Way", "Spruce Pl", "Ash Cir",
];

const cities = [
  "San Francisco", "New York", "Chicago", "Austin", "Seattle",
  "Denver", "Boston", "Portland", "Miami", "Atlanta",
];

const states = [
  "CA", "NY", "IL", "TX", "WA", "CO", "MA", "OR", "FL", "GA",
];

const tags = [
  "premium", "new", "verified", "vip", "beta-tester",
  "newsletter", "referral", "loyalty", "early-adopter", "enterprise",
];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

function generateDigest(rand: () => number): string {
  const hex = "0123456789abcdef";
  let digest = "";
  for (let i = 0; i < 40; i++) {
    digest += hex[Math.floor(rand() * hex.length)];
  }
  return digest;
}

// ---------------------------------------------------------------------------
// User records (conn-1, test:users)
// ---------------------------------------------------------------------------

function generateUserRecords(): AerospikeRecord[] {
  const rand = seededRandom(42);
  const records: AerospikeRecord[] = [];

  for (let i = 1; i <= 50; i++) {
    const firstName = pick(firstNames, rand);
    const lastName = pick(lastNames, rand);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const age = 18 + Math.floor(rand() * 52);
    const active = rand() > 0.2;
    const userTags = pickN(tags, 1 + Math.floor(rand() * 4), rand);

    const metadata: Record<string, BinValue> = {
      signupDate: `2025-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
      lastLogin: `2026-02-${String(1 + Math.floor(rand() * 14)).padStart(2, "0")}T${String(Math.floor(rand() * 24)).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}:00Z`,
      loginCount: Math.floor(rand() * 500),
      preferredLanguage: pick(["en", "es", "fr", "de", "ja"], rand),
      timezone: pick(["US/Pacific", "US/Eastern", "UTC", "Europe/London", "Asia/Tokyo"], rand),
    };

    records.push({
      key: {
        namespace: "test",
        set: "users",
        pk: `user-${String(i).padStart(4, "0")}`,
        digest: generateDigest(rand),
      },
      meta: {
        generation: 1 + Math.floor(rand() * 10),
        ttl: -1,
        lastUpdateMs: Date.now() - Math.floor(rand() * 86400000 * 30),
      },
      bins: {
        name: `${firstName} ${lastName}`,
        email,
        age,
        active,
        metadata,
        tags: userTags,
      },
    });
  }
  return records;
}

// ---------------------------------------------------------------------------
// Product records (conn-1, test:products)
// ---------------------------------------------------------------------------

function generateProductRecords(): AerospikeRecord[] {
  const rand = seededRandom(137);
  const records: AerospikeRecord[] = [];

  for (let i = 1; i <= 30; i++) {
    const name = productNames[(i - 1) % productNames.length];
    const price = Math.round((5 + rand() * 495) * 100) / 100;
    const category = pick(categories, rand);
    const inStock = rand() > 0.15;

    const specs: Record<string, BinValue> = {
      weight: `${Math.round(50 + rand() * 2000)}g`,
      dimensions: `${Math.round(5 + rand() * 30)}x${Math.round(5 + rand() * 20)}x${Math.round(2 + rand() * 10)}cm`,
      color: pick(["Black", "White", "Silver", "Blue", "Red", "Gray"], rand),
      warranty: pick(["6 months", "1 year", "2 years", "3 years"], rand),
      manufacturer: pick(["TechCorp", "GadgetPro", "DigitalWorks", "NexGen", "InnoTech"], rand),
      rating: Math.round((3 + rand() * 2) * 10) / 10,
      reviewCount: Math.floor(rand() * 1200),
    };

    records.push({
      key: {
        namespace: "test",
        set: "products",
        pk: `prod-${String(i).padStart(4, "0")}`,
        digest: generateDigest(rand),
      },
      meta: {
        generation: 1 + Math.floor(rand() * 5),
        ttl: -1,
        lastUpdateMs: Date.now() - Math.floor(rand() * 86400000 * 60),
      },
      bins: {
        name,
        price,
        category,
        inStock,
        specs,
      },
    });
  }
  return records;
}

// ---------------------------------------------------------------------------
// Order records (conn-2, staging:orders)
// ---------------------------------------------------------------------------

function generateOrderRecords(): AerospikeRecord[] {
  const rand = seededRandom(256);
  const records: AerospikeRecord[] = [];

  for (let i = 1; i <= 200; i++) {
    const orderId = `ORD-${String(10000 + i)}`;
    const userId = `user-${String(1 + Math.floor(rand() * 50)).padStart(4, "0")}`;
    const status = pick(orderStatuses, rand);

    const itemCount = 1 + Math.floor(rand() * 5);
    const items: BinValue[] = [];
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const itemPrice = Math.round((10 + rand() * 200) * 100) / 100;
      const qty = 1 + Math.floor(rand() * 3);
      total += itemPrice * qty;
      items.push({
        productId: `prod-${String(1 + Math.floor(rand() * 30)).padStart(4, "0")}`,
        name: pick(productNames, rand),
        price: itemPrice,
        quantity: qty,
      });
    }
    total = Math.round(total * 100) / 100;

    const stateIdx = Math.floor(rand() * states.length);
    const address: Record<string, BinValue> = {
      street: `${100 + Math.floor(rand() * 9900)} ${pick(streetNames, rand)}`,
      city: cities[stateIdx],
      state: states[stateIdx],
      zip: String(10000 + Math.floor(rand() * 89999)),
      country: "US",
    };

    // Realistic US coordinates: lat ~25-48, lng ~(-124)-(-71)
    const lat = Math.round((25 + rand() * 23) * 1000000) / 1000000;
    const lng = Math.round((-124 + rand() * 53) * 1000000) / 1000000;
    const location: GeoJSON = {
      type: "Point",
      coordinates: [lng, lat],
    };

    records.push({
      key: {
        namespace: "staging",
        set: "orders",
        pk: orderId,
        digest: generateDigest(rand),
      },
      meta: {
        generation: 1 + Math.floor(rand() * 3),
        ttl: 86400 * 90, // 90 days TTL
        lastUpdateMs: Date.now() - Math.floor(rand() * 86400000 * 30),
      },
      bins: {
        orderId,
        userId,
        total,
        status,
        items,
        address,
        location,
      },
    });
  }
  return records;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Mock records keyed by connection ID, then by "namespace:set".
 */
export const mockRecords: Record<string, Record<string, AerospikeRecord[]>> = {
  "conn-1": {
    "test:users": generateUserRecords(),
    "test:products": generateProductRecords(),
  },
  "conn-2": {
    "staging:orders": generateOrderRecords(),
  },
};
