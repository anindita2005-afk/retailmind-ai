import axios from "axios";

export interface TargetProduct {
  product_name: string;
  platform: string;
  platformName: string;        // canonical display name
  platformCategory: string;    // ecommerce | quick | grocery | fashion | brand
  price: number;
  rating: number;
  link: string;
  seller: string;
  image?: string;
  product_id?: string;
  isTrusted: boolean;          // from a known authorized platform
}

export interface ProductDetails {
  specs: Record<string, string>;
  description: string;
  images: string[];
}

/* ─────────────────────────────────────────────────────────────
   TRUSTED PLATFORM REGISTRY
   Only these platforms are used for buy_links and price calculation.
   Any seller NOT in this list is silently dropped.
───────────────────────────────────────────────────────────── */

interface PlatformDef {
  pattern: RegExp;
  name: string;
  category: "ecommerce" | "quick" | "grocery" | "fashion" | "brand";
}

// Core: always available. Brand sites are added dynamically per product.
const TRUSTED_PLATFORM_REGISTRY: PlatformDef[] = [
  // ── Major e-commerce ──────────────────────────────────────
  { pattern: /amazon/i, name: "Amazon", category: "ecommerce" },
  { pattern: /flipkart/i, name: "Flipkart", category: "ecommerce" },
  { pattern: /myntra/i, name: "Myntra", category: "fashion" },
  { pattern: /nykaa/i, name: "Nykaa", category: "ecommerce" },
  { pattern: /meesho/i, name: "Meesho", category: "ecommerce" },
  { pattern: /tata.?cliq/i, name: "Tata CLiQ", category: "ecommerce" },
  { pattern: /ajio/i, name: "Ajio", category: "fashion" },
  { pattern: /shopsy/i, name: "Shopsy", category: "ecommerce" },
  { pattern: /snapdeal/i, name: "Snapdeal", category: "ecommerce" },
  { pattern: /paytm.?mall/i, name: "Paytm Mall", category: "ecommerce" },
  // ── Electronics specialists ────────────────────────────────
  { pattern: /croma/i, name: "Croma", category: "ecommerce" },
  { pattern: /reliance.?digital/i, name: "Reliance Digital", category: "ecommerce" },
  { pattern: /vijay.?sales/i, name: "Vijay Sales", category: "ecommerce" },
  { pattern: /jiomart/i, name: "JioMart", category: "ecommerce" },
  // ── Quick commerce ──────────────────────────────────────────
  { pattern: /blinkit/i, name: "Blinkit", category: "quick" },
  { pattern: /zepto/i, name: "Zepto", category: "quick" },
  { pattern: /swiggy/i, name: "Swiggy Instamart", category: "quick" },
  { pattern: /instamart/i, name: "Swiggy Instamart", category: "quick" },
  { pattern: /dunzo/i, name: "Dunzo", category: "quick" },
  // ── Grocery / FMCG ──────────────────────────────────────────
  { pattern: /bigbasket/i, name: "BigBasket", category: "grocery" },
  { pattern: /grofers/i, name: "Blinkit", category: "grocery" },
  { pattern: /dmart/i, name: "D-Mart", category: "grocery" },
  // ── OEM / official brand sites ──────────────────────────────
  { pattern: /samsung\.com/i, name: "Samsung Official", category: "brand" },
  { pattern: /apple\.com/i, name: "Apple Official", category: "brand" },
  { pattern: /oneplus\.in/i, name: "OnePlus Official", category: "brand" },
  { pattern: /mi\.com|xiaomi/i, name: "Mi Official", category: "brand" },
  { pattern: /realme\.com/i, name: "Realme Official", category: "brand" },
  { pattern: /oppo\.com/i, name: "OPPO Official", category: "brand" },
  { pattern: /vivo\.com/i, name: "Vivo Official", category: "brand" },
  { pattern: /motorola/i, name: "Motorola Official", category: "brand" },
  { pattern: /nokia/i, name: "Nokia Official", category: "brand" },
  { pattern: /lg\.com/i, name: "LG Official", category: "brand" },
  { pattern: /sony/i, name: "Sony Official", category: "brand" },
  { pattern: /boat-lifestyle/i, name: "boAt Official", category: "brand" },
];

/** Detect if a seller/source matches any trusted platform */
function detectTrustedPlatform(source: string): PlatformDef | null {
  for (const def of TRUSTED_PLATFORM_REGISTRY) {
    if (def.pattern.test(source)) return def;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────
   TEXT NORMALIZATION
───────────────────────────────────────────────────────────── */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b([a-z])\s+(\d+)\b/g, "$1$2")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ─────────────────────────────────────────────────────────────
   ACCESSORY / WRONG-CONDITION BLOCKER
───────────────────────────────────────────────────────────── */

const EXCLUSION_KEYWORDS = [
  // Accessories
  "cover", "back cover", "flip cover", "case", "phone case",
  "screen guard", "screen protector", "tempered glass", "glass protector",
  "silicone", "bumper", "wallet case", "pouch", "sleeve", "skin",
  "decal", "sticker", "matte skin", "skinz", "qskinz",
  // Cables
  "charger", "cable", "adapter", "type-c", "usb cable",
  // Audio
  "earphone", "headphone", "earbud", "airpod",
  // Wrong categories
  "power bank", "tablet", "tab", "smart watch", "smartwatch", "galaxy watch",
  // Spare parts
  "display replacement", "screen replacement", "lcd replacement",
  "battery replacement", "spare part", "touchscreen", "display with touch",
  // Condition
  "refurbished", "refurb", "pre-owned", "preowned", "pre owned",
  "open box", "second hand", "used phone", "exchange",
  " demo", "demo unit", "demo phone",
  // Sell intent
  "sell my", "buy my",
  // Mount/accessories
  "holder", "mount", "car mount", "cleaning kit", "dust plug",
];

function isExcluded(title: string): boolean {
  const norm = normalize(title);
  if (norm.startsWith("sell ")) return true;
  return EXCLUSION_KEYWORDS.some(kw => norm.includes(normalize(kw)));
}

/* ─────────────────────────────────────────────────────────────
   AI-BASED EXACT MODEL MATCHING
───────────────────────────────────────────────────────────── */

async function filterExactModelWithAI(query: string, products: TargetProduct[]): Promise<TargetProduct[]> {
  if (!products.length) return [];

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.warn("[WARN] GROQ_API_KEY not set. Skipping AI model match.");
    // Fallback: simple text inclusion if AI is offline
    const nq = normalize(query);
    return products.filter(p => normalize(p.product_name).includes(nq));
  }

  const systemPrompt = `You are an expert e-commerce product matching AI. You will be given a target product query and a list of product titles.
Return a JSON object with a single array key "matching_indices" containing the 0-based indices of titles that represent exactly the requested model, ignoring differences in color, storage, RAM, and condition.
CRITICAL: REJECT entirely different models! If query is "OnePlus Nord 5", REJECT "OnePlus Nord CE 5". If query is "S24", REJECT "S24 FE". Do NOT hardcode, use your knowledge.`;

  const userPrompt = `Query: "${query}"\nTitles:\n` + products.map((p, i) => `${i}: ${p.product_name}`).join("\n");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";
    const result = JSON.parse(rawContent);
    const validIndices = new Set<number>(result.matching_indices || []);

    return products.filter((_, i) => validIndices.has(i));
  } catch (err) {
    console.error("[ERROR] AI Model Match failed. Using fallback.", err);
    return products; // If AI fails, fallback to keeping them
  }
}

/* ─────────────────────────────────────────────────────────────
   PRICE NORMALIZATION
───────────────────────────────────────────────────────────── */

function normalizePrice(item: any): number {
  if (typeof item.extracted_price === "number") return item.extracted_price;
  if (typeof item.price === "string") return Number(item.price.replace(/[^\d.]/g, ""));
  return 0;
}

/* ─────────────────────────────────────────────────────────────
   MEDIAN HELPER
───────────────────────────────────────────────────────────── */

export function computeMedian(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[m - 1] + s[m]) / 2) : s[m];
}

/* ─────────────────────────────────────────────────────────────
   DEDUPLICATION (by link)
───────────────────────────────────────────────────────────── */

function deduplicate(products: TargetProduct[]): TargetProduct[] {
  return Array.from(new Map(products.map(p => [p.link, p])).values());
}

/* ─────────────────────────────────────────────────────────────
   IQR OUTLIER REMOVAL
───────────────────────────────────────────────────────────── */

function removeOutliers(products: TargetProduct[]): TargetProduct[] {
  if (products.length < 4) return products;
  const sorted = [...products].sort((a, b) => a.price - b.price);
  const prices = sorted.map(p => p.price);
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q3 = prices[Math.floor(prices.length * 0.75)];
  const iqr = q3 - q1;
  return sorted.filter(p => p.price >= q1 - 1.5 * iqr && p.price <= q3 + 1.5 * iqr);
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT — fetchProductPrices
───────────────────────────────────────────────────────────── */

export async function fetchProductPrices(query: string): Promise<TargetProduct[]> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) throw new Error("SERP_API_KEY is not configured");

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q: query.toLowerCase().replace(/\b([a-z])\s+(\d+)\b/g, "$1$2"),
        gl: "in",
        hl: "en",
        google_domain: "google.co.in",
        api_key: apiKey,
      },
    });

    const raw: any[] =
      response.data.shopping_results ||
      response.data.inline_shopping_results ||
      [];

    console.log(`[SERP] Raw results: ${raw.length}`);

    /* ── STEP 1: Parse + tag each result ── */
    const parsed: TargetProduct[] = raw.flatMap((item: any) => {
      const price = normalizePrice(item);
      if (!price || isNaN(price) || price <= 0) return [];

      const sourceName: string = item.source || item.store || "";
      const trusted = detectTrustedPlatform(sourceName);

      return [{
        product_name: item.title || "",
        platform: sourceName,
        platformName: trusted?.name || sourceName,
        platformCategory: trusted?.category || "other",
        price,
        rating: item.rating || 0,
        link: item.product_link || item.link || "",
        seller: sourceName,
        image: item.thumbnail,
        product_id: item.product_id,
        isTrusted: !!trusted,
      }];
    });

    /* ── STEP 2: Remove excluded/accessory ── */
    const noExcluded = parsed.filter(p => !isExcluded(p.product_name));
    console.log(`[FILTER] After exclusion: ${noExcluded.length}`);

    /* ── STEP 3: Model match (AI) ── */
    const modelMatched = await filterExactModelWithAI(query, noExcluded);
    console.log(`[FILTER] After model match: ${modelMatched.length}`);

    /* ── STEP 4: Keep ONLY trusted platforms ── */
    const trustedOnly = modelMatched.filter(p => p.isTrusted);
    console.log(`[FILTER] Trusted platforms only: ${trustedOnly.length}`);

    // Fallback: if no trusted results at all, use all model-matched (but log it)
    const working = trustedOnly.length > 0 ? trustedOnly : modelMatched;
    if (trustedOnly.length === 0) {
      console.warn("[WARN] No trusted platform listings found — using all model-matched results");
    }

    /* ── STEP 5: Deduplicate ── */
    const unique = deduplicate(working);
    console.log(`[FILTER] After dedup: ${unique.length}`);

    /* ── STEP 6: Outlier removal ── */
    const cleaned = removeOutliers(unique);
    console.log(`[FILTER] After outlier removal: ${cleaned.length}`);

    /* ── STEP 7: Sort cheapest first ── */
    cleaned.sort((a, b) => a.price - b.price);

    console.log("[RESULT] Final prices:", cleaned.map(p => `₹${p.price} (${p.platformName})`).join(", "));
    console.log("[RESULT] Median: ₹" + computeMedian(cleaned.map(p => p.price)));

    return cleaned.slice(0, 12);

  } catch (error) {
    console.error("SerpAPI fetch error:", error);
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
   Fetch rich product details via SERP Product API
───────────────────────────────────────────────────────────── */

export async function fetchProductDetails(
  query: string,
  productId?: string
): Promise<ProductDetails> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) return { specs: {}, description: "", images: [] };

  try {
    if (productId) {
      const res = await axios.get("https://serpapi.com/search.json", {
        params: {
          engine: "google_product",
          product_id: productId,
          gl: "in",
          hl: "en",
          api_key: apiKey,
        },
      });

      const d = res.data;
      const specs: Record<string, string> = {};
      if (d.product_results?.specs) {
        for (const spec of d.product_results.specs) {
          if (spec.title && spec.value) specs[spec.title] = spec.value;
        }
      }

      const images: string[] = [];
      if (d.product_results?.media) {
        for (const m of d.product_results.media) {
          if (m.type === "image" && m.link) images.push(m.link);
        }
      }

      return {
        specs,
        description: d.product_results?.description || "",
        images,
      };
    }
    return { specs: {}, description: "", images: [] };
  } catch (err) {
    console.error("Product details fetch error:", err);
    return { specs: {}, description: "", images: [] };
  }
}