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

        // 3. Fetch new products from Supabase
        const { data: newProducts, error: dbError } = await supabase
            .from('wb_search_results')
            .select('*')
            .or('kaspi_created.eq.true,specs->>is_in_feed.eq.true');

        if (dbError) throw dbError;

        // 4. Merge new products into offers
        const existingSkus = new Set(existingOffers.map(o => String(o['@_sku'])));

        for (const product of newProducts) {
            const sku = String(product.id);
            if (existingSkus.has(sku)) continue;

            const stock = product.specs?.stock || 0;
            const price = product.price_kzt || 0;
            const specs = product.specs || {};

            const newOffer = {
                "@_sku": sku,
                "model": product.name,
                "brand": product.brand || "Generic",
                "availabilities": {
                    "availability": {
                        "@_available": stock > 0 ? "yes" : "no",
                        "@_storeId": "PP1",
                        "@_stockCount": stock
                    }
                },
                "price": price,
                "description": specs.description || product.description
            };

            // Images
            let images = specs.image_urls;
            if (!images || !Array.isArray(images) || images.length === 0) {
                images = product.image_url ? [product.image_url] : [];
            }
            if (images.length > 0) newOffer.picture = images;

            // Params
            const params = [];
            if (specs.kaspi_attributes) {
                const attrs = Array.isArray(specs.kaspi_attributes) ? specs.kaspi_attributes : Object.entries(specs.kaspi_attributes).map(([code, value]) => ({ code, value }));
                for (const attr of attrs) {
                    const values = Array.isArray(attr.value) ? attr.value : [attr.value];
                    for (const v of values) {
                        params.push({
                            "@_code": attr.code,
                            "@_name": attr.name || (attr.code ? attr.code.split('*').pop() : "Attribute"),
                            "#text": String(v)
                        });
                    }
                }
            }
            if (params.length > 0) newOffer.param = params;

            existingOffers.push(newOffer);
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

        // Update date to current (UTC for Vercel compatibility, but labeled RU)
        const dateStr = new Date().toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).replace(',', '');

        // Build ONLY the offers part to prevent double headers
        const offersXml = builder.build({ offers: { offer: existingOffers } });

        const liveTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // HARDCODED TEMPLATE: 100% guarantee of exactly ONE header and NO declaration on line 2.
        const finalXml = `<?xml version="1.0" encoding="utf-8"?>
<kaspi_catalog xmlns="kaspiShopping" date="${dateStr}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://kaspi.kz/kaspishopping.xsd">
  <company>VELVETO (Live ${liveTime})</company>
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
