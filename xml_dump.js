const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const axios = require('axios');

async function check() {
    const url = 'https://mskaspi.fixhub.kz/xml/35fde8f355cd299f7a3e26cbe0e4f917.xml';
    console.log("Fetching from:", url);
    const resp = await axios.get(url);
    const xml = resp.data;

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true
    });

    const jsonObj = parser.parse(xml);
    console.log("Root keys:", Object.keys(jsonObj));

    const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        format: true
    });

    const built = builder.build(jsonObj);
    console.log("Built XML first 200 chars (escaped):", JSON.stringify(built.substring(0, 200)));

    const cleaned = built.replace(/<\?xml.*?\?>/gi, '').trim();
    console.log("Cleaned length matches:", cleaned.length === built.length);
    console.log("Cleaned start:", JSON.stringify(cleaned.substring(0, 100)));
}

check().catch(console.error);
