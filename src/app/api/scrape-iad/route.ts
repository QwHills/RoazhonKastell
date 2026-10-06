import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { url } = await request.json();

  if (!url || !url.includes("iadfrance.fr/annonce/")) {
    return NextResponse.json({ error: "URL IAD invalide" }, { status: 400 });
  }

  const data: Record<string, unknown> = { iad_url: url };

  const slugMatch = url.match(/\/annonce\/([^/]+)/);
  if (slugMatch) {
    parseSlug(slugMatch[1], data);
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const html = await res.text();
      parseHtml(html, data);
    }
  } catch {
    // Keep URL-parsed data
  }

  return NextResponse.json(data);
}

function parseSlug(slug: string, data: Record<string, unknown>) {
  const parts = slug.toLowerCase();

  if (parts.includes("-vente-")) data.transaction_type = "vente";
  else if (parts.includes("-location-")) data.transaction_type = "location";

  if (parts.startsWith("maison")) data.property_type = "maison";
  else if (parts.startsWith("appartement")) data.property_type = "appartement";
  else if (parts.startsWith("terrain")) data.property_type = "terrain";
  else if (parts.startsWith("local")) data.property_type = "local_commercial";
  else if (parts.startsWith("immeuble")) data.property_type = "immeuble";

  const roomsMatch = parts.match(/(\d+)-pieces?/);
  if (roomsMatch) data.rooms = parseInt(roomsMatch[1]);

  const areaMatch = parts.match(/(\d+)m2/);
  if (areaMatch) data.living_area = parseInt(areaMatch[1]);

  const cityMatch = parts.match(/\d+-pieces?-([a-z-]+?)(?:-\d+m2|$)/);
  if (cityMatch) {
    const rawCity = cityMatch[1].replace(/-+$/, "");
    data.city = rawCity
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("-");
  }

  const refMatch2 = parts.match(/r(\d+)$/);
  if (refMatch2) data.iad_reference = "r" + refMatch2[1];
}

function parseHtml(html: string, data: Record<string, unknown>) {
  parseJsonLd(html, data);
  parseOpenGraph(html, data);
  parsePhotos(html, data);
  parseDpe(html, data);
  parseFallbacks(html, data);
}

function parseJsonLd(html: string, data: Record<string, unknown>) {
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (!jsonLdMatch) return;
  for (const block of jsonLdMatch) {
    const jsonStr = block.replace(/<\/?script[^>]*>/gi, "").trim();
    try {
      const ld = JSON.parse(jsonStr);
      const items: Record<string, unknown>[] = [];
      if (ld["@graph"]) items.push(...ld["@graph"]);
      else items.push(ld);

      for (const item of items) {
        const type = item["@type"] as string;
        if (type === "Product" || type === "RealEstateListing" || type === "Residence") {
          const offers = item.offers as Record<string, unknown> | undefined;
          if (offers?.price) data.price = parseInt(String(offers.price).replace(/[^\d]/g, ""));
          if (item.name) data.title = item.name;
          if (item.description) data.description = cleanText(item.description as string);
        }
        if (type === "SingleFamilyResidence" || type === "Apartment" || type === "House") {
          const floor = item.floorSize as Record<string, unknown> | undefined;
          if (floor?.value) data.living_area = parseInt(String(floor.value));
          if (item.numberOfRooms) data.rooms = parseInt(String(item.numberOfRooms));
          if (item.numberOfBedrooms) data.bedrooms = parseInt(String(item.numberOfBedrooms));
          const addr = item.address as Record<string, unknown> | undefined;
          if (addr?.addressLocality) data.city = addr.addressLocality;
          if (addr?.postalCode) data.postal_code = addr.postalCode;
          if (item.name) data.title = item.name;
          if (item.description) data.description = cleanText(item.description as string);
        }
        if (type === "Offer") {
          if (item.price && !data.price) {
            data.price = parseInt(String(item.price).replace(/[^\d]/g, ""));
          }
        }
      }
    } catch {
      // Invalid JSON
    }
  }
}

function parseOpenGraph(html: string, data: Record<string, unknown>) {
  if (!data.price) {
    const priceMatch = html.match(/property="og:price:amount"\s+content="(\d+)"/i)
      || html.match(/"price"[:\s]*"?(\d[\d\s]*)"?/);
    if (priceMatch) data.price = parseInt(priceMatch[1].replace(/\s/g, ""));
  }

  if (!data.description) {
    const descMatch = html.match(/property="og:description"\s+content="([^"]+)"/i)
      || html.match(/name="description"\s+content="([^"]+)"/i);
    if (descMatch) data.description = cleanText(descMatch[1]);
  }
}

function parsePhotos(html: string, data: Record<string, unknown>) {
  const seen = new Set<string>();
  let mainDatePath = "";

  // 1. Find main carousel photos — width=1560 appears in srcset for the gallery
  const srcsetRegex = /images\.iadfrance\.fr\/property\/broadcast\/(\d{4}\/\d{2}\/\d{2})\/([a-f0-9]+\.(?:png|jpg|jpeg|webp))\?[^"'\s]*width=1560/g;
  let m;
  while ((m = srcsetRegex.exec(html)) !== null) {
    if (!mainDatePath) mainDatePath = m[1];
    const base = `https://images.iadfrance.fr/property/broadcast/${m[1]}/${m[2]}`;
    seen.add(base);
  }

  // 2. Fallback: if no width=1560 found, use width=1200 (og:image)
  if (!mainDatePath) {
    const ogRegex = /images\.iadfrance\.fr\/property\/broadcast\/(\d{4}\/\d{2}\/\d{2})\/([a-f0-9]+\.(?:png|jpg|jpeg|webp))\?[^"'\s]*width=1200/g;
    while ((m = ogRegex.exec(html)) !== null) {
      if (!mainDatePath) mainDatePath = m[1];
      const base = `https://images.iadfrance.fr/property/broadcast/${m[1]}/${m[2]}`;
      seen.add(base);
    }
  }

  // 3. From Nuxt data, extract all property photos that share the same upload date
  if (mainDatePath) {
    const dp = mainDatePath.replace(/\//g, "\\\\u002F");
    const escapedRegex = new RegExp(
      `images\\.playiad\\.com\\\\u002Fproperty\\\\u002Fbroadcast\\\\u002F${dp}\\\\u002F([a-f0-9]+\\.(?:png|jpg|jpeg|webp))`,
      "g",
    );
    while ((m = escapedRegex.exec(html)) !== null) {
      const base = `https://images.iadfrance.fr/property/broadcast/${mainDatePath}/${m[1]}`;
      seen.add(base);
    }
  }

  const photos = [...seen].map((base) => base + "?format=auto&width=800");
  if (photos.length > 0) {
    data.photos = photos;
    if (!data.photo_url) data.photo_url = photos[0];
  }
}

function parseDpe(html: string, data: Record<string, unknown>) {
  // DPE/GES class letters from the active indicator (border-white border-4)
  // The page has 2 diagnostic bars: first = DPE energy, second = GES
  const simpleRegex = /border-white\s+border-4[^>]*>[\s\S]*?<span[^>]*font-semibold[^>]*>([A-G])<\/span>/g;
  const dpeMatches: string[] = [];
  let m;
  while ((m = simpleRegex.exec(html)) !== null) {
    dpeMatches.push(m[1]);
  }

  if (dpeMatches.length >= 1) data.dpe_energy_class = dpeMatches[0];
  if (dpeMatches.length >= 2) data.dpe_ges_class = dpeMatches[1];

  // Consumption value from Nuxt data flat array
  // Pattern: ..."available","C",121,...
  const nuxtConsMatch = html.match(
    /\{"status":\d+,"class":\d+,"consumption":\d+\},"available","([A-G])",(\d+)/
  );
  if (nuxtConsMatch) {
    data.dpe_energy_class = nuxtConsMatch[1];
    data.dpe_energy_value = parseInt(nuxtConsMatch[2]);
  }

  // Fallback for DPE value from rendered text
  if (!data.dpe_energy_value) {
    const kwhMatch = html.match(/(\d+)\s*kWh\s*\/\s*m/i);
    if (kwhMatch) data.dpe_energy_value = parseInt(kwhMatch[1]);
  }
}

function parseFallbacks(html: string, data: Record<string, unknown>) {
  if (!data.price) {
    const pricePattern = html.match(/(\d[\d\s]{2,})\s*€/);
    if (pricePattern) {
      const val = parseInt(pricePattern[1].replace(/\s/g, ""));
      if (val > 10000) data.price = val;
    }
  }

  if (!data.bedrooms) {
    const bedMatch = html.match(/(\d+)\s*chambre/i);
    if (bedMatch) data.bedrooms = parseInt(bedMatch[1]);
  }

  if (!data.postal_code) {
    const cpMatch = html.match(/(\d{5})/);
    if (cpMatch && parseInt(cpMatch[1]) >= 1000 && parseInt(cpMatch[1]) <= 98999) {
      data.postal_code = cpMatch[1];
    }
  }

  if (!data.land_area) {
    const landMatch = html.match(/terrain[^<]{0,30}?(\d[\d\s]*)\s*m²/i);
    if (landMatch) data.land_area = parseInt(landMatch[1].replace(/\s/g, ""));
  }
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim()
    .slice(0, 500);
}
