import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        // 1. Fetch base XML from user's external link (Proxy mode)
        const BASE_XML_URL = process.env.KASPI_BASE_XML_URL || 'https://mskaspi.fixhub.kz/xml/35fde8f355cd299f7a3e26cbe0e4f917.xml';

        const baseXmlResponse = await fetch(BASE_XML_URL, { cache: 'no-store' });
        if (!baseXmlResponse.ok) {
            throw new Error(`Failed to fetch base XML: ${baseXmlResponse.status}`);
        }
        const baseXmlText = await baseXmlResponse.text();

        // 2. Parse base XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            parseAttributeValue: true
        });
        const rawObj = parser.parse(baseXmlText);

        // STRICT: Only extract the required root node.
        const jsonObj = {
            kaspi_catalog: rawObj.kaspi_catalog || {
                offers: { offer: [] }
            }
        };

        if (!jsonObj.kaspi_catalog.offers) jsonObj.kaspi_catalog.offers = { offer: [] };

        // Normalize offers to array
        let existingOffers = jsonObj.kaspi_catalog.offers.offer;
        if (!Array.isArray(existingOffers)) {
            existingOffers = existingOffers ? [existingOffers] : [];
        }

        // 3. Fetch products from BOTH tables to get the 'code' (MoySklad Code)
        // We'll fetch all products first to map them by article
        const { data: allMSProducts, error: msError } = await supabase
            .from('products')
            .select('article, code');

        if (msError) console.error("MS Products fetch error:", msError);

        const codeMap = {};
        if (allMSProducts) {
            allMSProducts.forEach(p => {
                if (p.article && p.code) codeMap[String(p.article)] = p.code;
            });
        }

        const { data: newProducts, error: dbError } = await supabase
            .from('wb_search_results')
            .select('*')
            .filter('price_kzt', 'gt', 500)
            .eq('kaspi_created', true);

        if (dbError) throw dbError;

        // 4. Merge new products into offers
        const existingSkus = new Set(existingOffers.map(o => String(o['@_sku'])));

        for (const product of newProducts) {
            let sku = String(product.id); // Primary fallback: just the WB ID
            const specs = product.specs || {};

            // Priority 1: Explicitly saved SKU in specs
            if (specs.kaspi_sku) {
                sku = specs.kaspi_sku;
            }
            // Priority 2: MoySklad Code (found via article mapping)
            else if (codeMap[String(product.id)]) {
                sku = codeMap[String(product.id)];
            }
            // Priority 3: Fallback to raw ID (No suffixes)
            else {
                sku = `${product.id}`;
            }

            if (existingSkus.has(sku)) continue;

            const retailDivisor = parseFloat(process.env.RETAIL_DIVISOR || '0.3');
            const stock = product.specs?.stock || 0;
            const price = Math.round(product.price_kzt / retailDivisor);

            // Sanitize and limit model name length (Kaspi limit is often ~70-100 chars)
            let modelName = product.name || "Unknown Product";
            if (modelName.length > 100) {
                modelName = modelName.substring(0, 97) + "...";
            }

            // ENRICHMENT for Card Creation
            const description = product.description || modelName;
            const images = specs.image_urls || (product.image_url ? [product.image_url] : []);
            const category = specs.kaspi_category || "Master - Model cars and other vehicles";

            const newOffer = {
                "@_sku": sku,
                "model": modelName,
                "brand": (product.brand && product.brand !== "Unknown") ? product.brand : "Generic",
                "description": description,
                "category": category,
                "images": {
                    "image": images.slice(0, 5).map(url => ({ "@_url": url }))
                },
                "availabilities": {
                    "availability": {
                        "@_available": "yes",
                        "@_storeId": "PP1",
                        "@_stockCount": stock || 10
                    }
                },
                "price": price
            };

            existingOffers.push(newOffer);
            existingSkus.add(sku);
        }

        // Final Filter: Ensure ALL offers (including base XML) have price > 500
        const finalOffers = existingOffers.filter(o => {
            const price = parseInt(o.price);
            return !isNaN(price) && price >= 500;
        });

        // Final Deduplication
        const uniqueOffers = [];
        const finalSeenSkus = new Set();
        for (const offer of finalOffers) {
            const sku = String(offer['@_sku']);
            if (!finalSeenSkus.has(sku)) {
                uniqueOffers.push(offer);
                finalSeenSkus.add(sku);
            }
        }

        // 5. Build Final XML using a SAFE TEMPLATE
        const builder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            format: true,
            indentBy: "  ",
            suppressEmptyNode: true,
            processEntities: true
        });

        // Robust date: dd.mm.yyyy hh:mm
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const dateStr = `${d}.${m}.${y} ${hh}:${mm}`;

        // Build ONLY the offers part
        const offersXml = builder.build({ offers: { offer: uniqueOffers } });

        // HARDCODED TEMPLATE: Clean tags, No markers, Exactly one header.
        const finalXml = `<?xml version="1.0" encoding="utf-8"?>
<kaspi_catalog xmlns="kaspiShopping" date="${dateStr}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://kaspi.kz/kaspishopping.xsd">
  <company>VELVETO</company>
  <merchantid>30322748</merchantid>
${offersXml}
</kaspi_catalog>`.trim();

        return new NextResponse(finalXml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
            }
        });

    } catch (error) {
        console.error('XML Feed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
