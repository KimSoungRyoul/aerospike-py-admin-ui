from __future__ import annotations

import math
import time

from aerospike_ui_api.models.record import AerospikeRecord, RecordKey, RecordMeta

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FIRST_NAMES = [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Eve",
    "Frank",
    "Grace",
    "Hank",
    "Irene",
    "Jack",
    "Karen",
    "Leo",
    "Mona",
    "Nick",
    "Olivia",
    "Paul",
    "Quinn",
    "Rita",
    "Sam",
    "Tina",
    "Uma",
    "Vic",
    "Wendy",
    "Xander",
    "Yara",
    "Zane",
]

LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
]

PRODUCT_NAMES = [
    "Wireless Mouse",
    "Mechanical Keyboard",
    "USB-C Hub",
    "Monitor Stand",
    "Webcam HD",
    "Desk Lamp",
    "Laptop Stand",
    "Cable Organizer",
    "Noise-Cancelling Headphones",
    "Bluetooth Speaker",
    "External SSD",
    "Portable Charger",
    "Smart Watch",
    "Fitness Tracker",
    "VR Headset",
    "Drone Mini",
    "Action Camera",
    "E-Reader",
    "Tablet Stylus",
    "Docking Station",
    "Ring Light",
    "Microphone USB",
    "Game Controller",
    "Mouse Pad XL",
    "Screen Protector",
    "Phone Mount",
    "Car Charger",
    "Wall Adapter",
    "HDMI Cable",
    "Ethernet Adapter",
]

CATEGORIES = [
    "Electronics",
    "Accessories",
    "Audio",
    "Computing",
    "Gaming",
    "Photography",
    "Wearables",
    "Storage",
]

ORDER_STATUSES = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
]

STREET_NAMES = [
    "Main St",
    "Oak Ave",
    "Cedar Ln",
    "Elm Dr",
    "Pine Rd",
    "Maple Ct",
    "Birch Blvd",
    "Walnut Way",
    "Spruce Pl",
    "Ash Cir",
]

CITIES = [
    "San Francisco",
    "New York",
    "Chicago",
    "Austin",
    "Seattle",
    "Denver",
    "Boston",
    "Portland",
    "Miami",
    "Atlanta",
]

STATES = ["CA", "NY", "IL", "TX", "WA", "CO", "MA", "OR", "FL", "GA"]

TAGS = [
    "premium",
    "new",
    "verified",
    "vip",
    "beta-tester",
    "newsletter",
    "referral",
    "loyalty",
    "early-adopter",
    "enterprise",
]


def _seeded_random(seed: int):
    state = seed

    def _next() -> float:
        nonlocal state
        state = (state * 1664525 + 1013904223) & 0x7FFFFFFF
        return state / 0x7FFFFFFF

    return _next


def _pick(arr: list, rand) -> object:
    return arr[math.floor(rand() * len(arr))]


def _pick_n(arr: list, n: int, rand) -> list:
    shuffled = sorted(arr, key=lambda _: rand())
    return shuffled[:n]


def _generate_digest(rand) -> str:
    hex_chars = "0123456789abcdef"
    return "".join(hex_chars[math.floor(rand() * 16)] for _ in range(40))


# ---------------------------------------------------------------------------
# User records (conn-1, test:users)
# ---------------------------------------------------------------------------


def _generate_user_records() -> list[AerospikeRecord]:
    rand = _seeded_random(42)
    records: list[AerospikeRecord] = []
    now_ms = int(time.time() * 1000)

    for i in range(1, 51):
        first = _pick(FIRST_NAMES, rand)
        last = _pick(LAST_NAMES, rand)
        email = f"{first.lower()}.{last.lower()}{i}@example.com"
        age = 18 + math.floor(rand() * 52)
        active = rand() > 0.2
        user_tags = _pick_n(TAGS, 1 + math.floor(rand() * 4), rand)

        metadata = {
            "signupDate": f"2025-{str(1 + math.floor(rand() * 12)).zfill(2)}-{str(1 + math.floor(rand() * 28)).zfill(2)}",
            "lastLogin": f"2026-02-{str(1 + math.floor(rand() * 14)).zfill(2)}T{str(math.floor(rand() * 24)).zfill(2)}:{str(math.floor(rand() * 60)).zfill(2)}:00Z",
            "loginCount": math.floor(rand() * 500),
            "preferredLanguage": _pick(["en", "es", "fr", "de", "ja"], rand),
            "timezone": _pick(["US/Pacific", "US/Eastern", "UTC", "Europe/London", "Asia/Tokyo"], rand),
        }

        records.append(
            AerospikeRecord(
                key=RecordKey(
                    namespace="test",
                    set="users",
                    pk=f"user-{str(i).zfill(4)}",
                    digest=_generate_digest(rand),
                ),
                meta=RecordMeta(
                    generation=1 + math.floor(rand() * 10),
                    ttl=-1,
                    lastUpdateMs=now_ms - math.floor(rand() * 86400000 * 30),
                ),
                bins={
                    "name": f"{first} {last}",
                    "email": email,
                    "age": age,
                    "active": active,
                    "metadata": metadata,
                    "tags": user_tags,
                },
            )
        )
    return records


# ---------------------------------------------------------------------------
# Product records (conn-1, test:products)
# ---------------------------------------------------------------------------


def _generate_product_records() -> list[AerospikeRecord]:
    rand = _seeded_random(137)
    records: list[AerospikeRecord] = []
    now_ms = int(time.time() * 1000)

    for i in range(1, 31):
        name = PRODUCT_NAMES[(i - 1) % len(PRODUCT_NAMES)]
        price = round((5 + rand() * 495) * 100) / 100
        category = _pick(CATEGORIES, rand)
        in_stock = rand() > 0.15

        specs = {
            "weight": f"{round(50 + rand() * 2000)}g",
            "dimensions": f"{round(5 + rand() * 30)}x{round(5 + rand() * 20)}x{round(2 + rand() * 10)}cm",
            "color": _pick(["Black", "White", "Silver", "Blue", "Red", "Gray"], rand),
            "warranty": _pick(["6 months", "1 year", "2 years", "3 years"], rand),
            "manufacturer": _pick(["TechCorp", "GadgetPro", "DigitalWorks", "NexGen", "InnoTech"], rand),
            "rating": round((3 + rand() * 2) * 10) / 10,
            "reviewCount": math.floor(rand() * 1200),
        }

        records.append(
            AerospikeRecord(
                key=RecordKey(
                    namespace="test",
                    set="products",
                    pk=f"prod-{str(i).zfill(4)}",
                    digest=_generate_digest(rand),
                ),
                meta=RecordMeta(
                    generation=1 + math.floor(rand() * 5),
                    ttl=-1,
                    lastUpdateMs=now_ms - math.floor(rand() * 86400000 * 60),
                ),
                bins={
                    "name": name,
                    "price": price,
                    "category": category,
                    "inStock": in_stock,
                    "specs": specs,
                },
            )
        )
    return records


# ---------------------------------------------------------------------------
# Order records (conn-2, staging:orders)
# ---------------------------------------------------------------------------


def _generate_order_records() -> list[AerospikeRecord]:
    rand = _seeded_random(256)
    records: list[AerospikeRecord] = []
    now_ms = int(time.time() * 1000)

    for i in range(1, 201):
        order_id = f"ORD-{10000 + i}"
        user_id = f"user-{str(1 + math.floor(rand() * 50)).zfill(4)}"
        status = _pick(ORDER_STATUSES, rand)

        item_count = 1 + math.floor(rand() * 5)
        items: list[dict] = []
        total = 0.0
        for _j in range(item_count):
            item_price = round((10 + rand() * 200) * 100) / 100
            qty = 1 + math.floor(rand() * 3)
            total += item_price * qty
            items.append(
                {
                    "productId": f"prod-{str(1 + math.floor(rand() * 30)).zfill(4)}",
                    "name": _pick(PRODUCT_NAMES, rand),
                    "price": item_price,
                    "quantity": qty,
                }
            )
        total = round(total * 100) / 100

        state_idx = math.floor(rand() * len(STATES))
        address = {
            "street": f"{100 + math.floor(rand() * 9900)} {_pick(STREET_NAMES, rand)}",
            "city": CITIES[state_idx],
            "state": STATES[state_idx],
            "zip": str(10000 + math.floor(rand() * 89999)),
            "country": "US",
        }

        lat = round((25 + rand() * 23) * 1000000) / 1000000
        lng = round((-124 + rand() * 53) * 1000000) / 1000000
        location = {"type": "Point", "coordinates": [lng, lat]}

        records.append(
            AerospikeRecord(
                key=RecordKey(
                    namespace="staging",
                    set="orders",
                    pk=order_id,
                    digest=_generate_digest(rand),
                ),
                meta=RecordMeta(
                    generation=1 + math.floor(rand() * 3),
                    ttl=86400 * 90,
                    lastUpdateMs=now_ms - math.floor(rand() * 86400000 * 30),
                ),
                bins={
                    "orderId": order_id,
                    "userId": user_id,
                    "total": total,
                    "status": status,
                    "items": items,
                    "address": address,
                    "location": location,
                },
            )
        )
    return records


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

mock_records: dict[str, dict[str, list[AerospikeRecord]]] = {
    "conn-1": {
        "test:users": _generate_user_records(),
        "test:products": _generate_product_records(),
    },
    "conn-2": {
        "staging:orders": _generate_order_records(),
    },
}
