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

  // Parse URL slug: /annonce/maison-vente-8-pieces-brece-178m2/r2063473
  const slugMatch = url.match(/\/annonce\/([^/]+)/);
  if (slugMatch) {
    const slug = slugMatch[1];
    parseSlug(slug, data);
  }

  // Fetch the page for structured data
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();
      parseHtml(html, data);
    }
  } catch {
    // Scraping failed, keep URL-parsed data
  }

  return NextResponse.json(data);
}

function parseSlug(slug: string, data: Record<string, unknown>) {
  const parts = slug.toLowerCase();

  // Transaction type
  if (parts.includes("-vente-")) data.transaction_type = "vente";
  else if (parts.includes("-location-")) data.transaction_type = "location";

  // Property type
  if (parts.startsWith("maison")) data.property_type = "maison";
  else if (parts.startsWith("appartement")) data.property_type = "appartement";
  else if (parts.startsWith("terrain")) data.property_type = "terrain";
  else if (parts.startsWith("local")) data.property_type = "local_commercial";
  else if (parts.startsWith("immeuble")) data.property_type = "immeuble";

  // Rooms: "8-pieces" or "3-pieces"
  const roomsMatch = parts.match(/(\d+)-pieces?/);
  if (roomsMatch) data.rooms = parseInt(roomsMatch[1]);

  // Area: "178m2"
  const areaMatch = parts.match(/(\d+)m2/);
  if (areaMatch) data.living_area = parseInt(areaMatch[1]);

  // City: extract from slug — it's between the last known keyword and the area/end
  // Pattern: type-transaction-Xpieces-CITY-AREAm2
  const cityMatch = parts.match(/\d+-pieces?-([a-z-]+?)(?:-\d+m2|$)/);
  if (cityMatch) {
    const rawCity = cityMatch[1].replace(/-+$/, "");
    data.city = rawCity
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("-");
  }

  // IAD reference
  const refMatch = slug.match(/\/(r\d+)$/);
  if (refMatch) data.iad_reference = refMatch[1];
  const refMatch2 = parts.match(/r(\d+)$/);
  if (!data.iad_reference && refMatch2) data.iad_reference = "r" + refMatch2[1];
}

function parseHtml(html: string, data: Record<string, unknown>) {
  // JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      const jsonStr = block.replace(/<\/?script[^>]*>/gi, "").trim();
      try {
        const ld = JSON.parse(jsonStr);
        if (ld["@type"] === "Product" || ld["@type"] === "RealEstateListing" || ld["@type"] === "Residence") {
          if (ld.offers?.price) data.price = parseInt(ld.offers.price);
          if (ld.name) data.title = ld.name;
          if (ld.description) data.description = cleanText(ld.description);
          if (ld.image) data.photo_url = typeof ld.image === "string" ? ld.image : ld.image?.url || ld.image?.[0];
        }
        if (ld["@type"] === "SingleFamilyResidence" || ld["@type"] === "Apartment") {
          if (ld.floorSize?.value) data.living_area = parseInt(ld.floorSize.value);
          if (ld.numberOfRooms) data.rooms = parseInt(ld.numberOfRooms);
          if (ld.numberOfBedrooms) data.bedrooms = parseInt(ld.numberOfBedrooms);
          if (ld.address?.addressLocality) data.city = ld.address.addressLocality;
          if (ld.address?.postalCode) data.postal_code = ld.address.postalCode;
        }
      } catch {
        // Invalid JSON
      }
    }
  }

  // OpenGraph meta tags as fallback
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

  if (!data.photo_url) {
    const imgMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
    if (imgMatch) data.photo_url = imgMatch[1];
  }

  // Look for price in common patterns
  if (!data.price) {
    const pricePattern = html.match(/(\d[\d\s]{2,})\s*€/);
    if (pricePattern) {
      const val = parseInt(pricePattern[1].replace(/\s/g, ""));
      if (val > 10000) data.price = val;
    }
  }

  // Bedrooms from HTML text
  if (!data.bedrooms) {
    const bedMatch = html.match(/(\d+)\s*chambre/i);
    if (bedMatch) data.bedrooms = parseInt(bedMatch[1]);
  }

  // Postal code
  if (!data.postal_code) {
    const cpMatch = html.match(/(\d{5})/);
    if (cpMatch && parseInt(cpMatch[1]) >= 1000 && parseInt(cpMatch[1]) <= 98999) {
      data.postal_code = cpMatch[1];
    }
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
