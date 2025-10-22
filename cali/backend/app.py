# cali/backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
import re
from openai import OpenAI

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173", "*"]}})

AI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-proj--your-key")
client = OpenAI(api_key=OPENAI_API_KEY)

FAKESTORE_URL = "https://fakestoreapi.com/products"

@app.get("/health")
def health():
    return jsonify({"ok": True})

@app.get("/products")
def products():
    return jsonify(get_products())

def get_products():
    try:
        r = requests.get(FAKESTORE_URL, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("FakeStore fetch error:", e)
        return []

CATEGORY_MAP = {
    "men": "men's clothing", "mens": "men's clothing", "man": "men's clothing",
    "men clothing": "men's clothing", "men's": "men's clothing", "male": "men's clothing",
    "women": "women's clothing", "womens": "women's clothing", "woman": "women's clothing",
    "women clothing": "women's clothing", "women's": "women's clothing", "female": "women's clothing",
    "jewelry": "jewelery", "jewelery": "jewelery", "electronics": "electronics"
}

PRODUCT_SYNONYMS = {
    "shoes": "shoes", "shoe": "shoes", "sneakers": "shoes", "trainers": "shoes", "footwear": "shoes",
    "boots": "boots", "sandals": "sandals", "flip flops": "sandals", "slippers": "sandals",
    "heels": "heels", "pumps": "heels", "stilettos": "heels",
    "dress": "dress", "gown": "dress", "frock": "dress",
    "jacket": "jacket", "jackets": "jacket", "coat": "jacket", "blazer": "jacket",
    "pants": "pants", "trousers": "pants", "slacks": "pants",
    "jeans": "jeans", "denim": "jeans",
    "shirt": "shirt", "shirts": "shirt", "tshirt": "shirt", "t-shirt": "shirt", "tee": "shirt",
    "top": "shirt", "blouse": "shirt", "sweater": "shirt", "hoodie": "shirt",
    "ring": "ring", "necklace": "necklace", "bracelet": "bracelet", "bangle": "bracelet", "anklet": "bracelet",
    "bag": "bag", "purse": "bag", "handbag": "bag", "tote": "bag",
    "backpack": "backpack", "knapsack": "backpack",
    "watch": "watch", "wristwatch": "watch", "timepiece": "watch",
    "electronics": "electronics", "tech": "electronics", "gadget": "electronics", "device": "electronics",
    "laptop": "laptop", "notebook": "laptop", "computer": "laptop",
    "monitor": "monitor", "display": "monitor", "screen": "monitor",
    "mouse": "mouse", "keyboard": "keyboard", "headphones": "headphones", "earbuds": "headphones",
    "accessories": "jewelery", "jewelry": "jewelery", "jewellery": "jewelery"
}

IGNORED_WORDS = {
    "hi", "hello", "thanks", "thank", "please", "sorry", "andy", "i", "am", "really", "looking", "for",
    "the", "a", "an", "that", "this", "is", "it", "need", "want", "show", "find", "get"
}

KNOWN_COLORS = [
    "red", "blue", "green", "black", "white", "yellow", "pink", "purple",
    "brown", "orange", "gray", "grey", "beige", "gold", "silver"
]

PRODUCT_HINTS_COLOR_WORTH_ASKING = {
    "dress", "shirt", "t-shirt", "tshirt", "hoodie", "jacket", "coat", "skirt", "blouse",
    "jeans", "pants", "trousers", "ring", "necklace", "bracelet", "bag", "shoes",
    "boots", "sneakers", "heels"
}

def normalize_category(text):
    if not text: return None
    return CATEGORY_MAP.get(text.strip().lower(), text.strip().lower())

def parse_price_from_text(text):
    if not text: return None
    m = re.search(r'(\\d+(\\.\\d+)?)', text.replace(",", ""))
    if m:
        try: return float(m.group(1))
        except: return None
    return None

def detect_color(text):
    if not text: return None
    t = text.lower()
    for c in KNOWN_COLORS:
        if re.search(rf"\\b{re.escape(c)}\\b", t):
            return "grey" if c == "gray" else c
    return None

def safe_json_extract(s):
    if not s: return {}
    try:
        return json.loads(s)
    except:
        start = s.find("{"); end = s.rfind("}")
        if start != -1 and end != -1 and end > start:
            try: return json.loads(s[start:end+1])
            except: return {}
    return {}

def heuristic_action(text):
    t = (text or "").lower()
    if any(k in t for k in ["add ", "add to cart", "put in cart", "buy "]): return "add_to_cart"
    if any(k in t for k in ["remove ", "remove from cart", "delete from cart"]): return "remove_from_cart"
    return "filter"

def extract_product_keyword(text):
    if not text: return None
    t = re.sub(r"[^a-zA-Z0-9\\s\\-']", " ", text.lower())
    tokens = [w for w in t.split() if len(w) > 1 and w not in IGNORED_WORDS]
    for w in tokens:
        if w in PRODUCT_SYNONYMS:
            return PRODUCT_SYNONYMS[w]
    return tokens[0] if tokens else None

def guess_category_from_gender_words(text):
    if not text: return None
    t = text.lower()
    if any(w in t for w in ["men", "man", "mens", "male", "guy"]): return "men's clothing"
    if any(w in t for w in ["women", "woman", "womens", "female", "girls", "ladies"]): return "women's clothing"
    return None

def match_products(products, filters):
    results = products[:]
    cat = normalize_category(filters.get("category"))
    if cat:
        results = [p for p in results if cat in p.get("category", "").lower()]
    price = filters.get("price")
    if isinstance(price, str): price = parse_price_from_text(price)
    if isinstance(price, (int, float)):
        results = [p for p in results if float(p.get("price", 0)) <= float(price)]
    product_kw = (filters.get("product") or "").strip().lower()
    if product_kw:
        results = [p for p in results if product_kw in p.get("title", "").lower() or product_kw in p.get("description", "").lower()]
    color = (filters.get("color") or "").strip().lower()
    if color:
        tmp = [p for p in results if color in p.get("title", "").lower() or color in p.get("description", "").lower()]
        if tmp: results = tmp
    results.sort(key=lambda p: (float(p.get("price", 0)), p.get("title", "")))
    return results

def need_color_question(filters):
    product_kw = (filters.get("product") or "").lower()
    if not product_kw: return False
    for hint in PRODUCT_HINTS_COLOR_WORTH_ASKING:
        if hint in product_kw:
            return filters.get("color") in (None, "", "null")
    return False

def build_clarification(filters, matches):
    if not filters.get("category") and not filters.get("product"):
        return True, "What are you shopping for? You can say a category like men's clothing, women's clothing, electronics, or jewelery — or say a product like 'dress' or 'backpack'.", ["category_or_product"]
    if need_color_question(filters):
        return True, f"What color {filters.get('product','item')} would you like?", ["color"]
    t = (filters.get("transcript") or "").lower()
    if any(w in t for w in ["under", "less than", "below"]) and not isinstance(filters.get("price"), (int,float)):
        return True, "What price limit should I use?", ["price"]
    if matches is not None and len(matches) == 0:
        return True, "Here’s what I found that might interest you. Let me know if you'd like to add any of these to your cart.", ["category_or_product_or_price"]
    return False, "", []

@app.post("/parse-voice")
def parse_voice():
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "") or ""
    context = payload.get("context") or {}
    last_filters = context.get("last_filters") or {}

    prompt = f"""
    Parse this shopping utterance into JSON with keys:
    category: "men's clothing" | "women's clothing" | "electronics" | "jewelery" if mentioned (map synonyms)
    price: number (max price) if present
    color: color if present else null
    action: "add_to_cart" | "remove_from_cart" | "filter" (default "filter")
    product: short keyword/title fragment if present
    transcript: echo input
    Input: "{text}"
    Return ONLY a JSON object.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        raw = response.choices[0].message.content
    except Exception as e:
        print("OpenAI error:", e)
        raw = ""

    parsed = safe_json_extract(raw) or {}
    parsed.setdefault("transcript", text)
    auto_cat = guess_category_from_gender_words(text)
    if auto_cat and not parsed.get("category"):
        parsed["category"] = auto_cat
    if parsed.get("category"):
        parsed["category"] = normalize_category(parsed["category"])
    if parsed.get("price") is None:
        parsed["price"] = parse_price_from_text(text)
    if not parsed.get("color"):
        parsed["color"] = detect_color(text)
    if not parsed.get("product"):
        parsed["product"] = extract_product_keyword(text)
    if parsed.get("product") in PRODUCT_SYNONYMS:
        parsed["product"] = PRODUCT_SYNONYMS[parsed["product"]]
    if not parsed.get("action"):
        parsed["action"] = heuristic_action(text)

    products = get_products()
    matched = match_products(products, parsed)
    clarify, question, pending = build_clarification(parsed, matched)

    new_context = { "last_filters": parsed, "pending_slots": pending }
    return jsonify({
        "filters": parsed,
        "matches": matched,
        "clarify": clarify,
        "question": question,
        "pending_slots": pending,
        "context": new_context
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)