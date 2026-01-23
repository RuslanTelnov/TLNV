const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const axios = require('axios');

async function debug() {
    const BASE_XML_URL = 'https://mskaspi.fixhub.kz/xml/35fde8f355cd299f7a3e26cbe0e4f917.xml';
    const resp = await axios.get(BASE_XML_URL);
    const text = resp.data;

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true
    });
    const jsonObj = parser.parse(text);

    console.log("Keys in jsonObj:", Object.keys(jsonObj));
    if (jsonObj['?xml']) {
        console.log("Found ?xml in jsonObj:", jsonObj['?xml']);
    }

    const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        format: true
    });
    const buildOutput = builder.build(jsonObj);
    console.log("First 100 chars of build output:");
    console.log(buildOutput.substring(0, 100));
}

debug();
