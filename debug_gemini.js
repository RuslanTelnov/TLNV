const fs = require('fs');
const path = require('path');

// Basic .env parser since we can't assume dotenv is installed in root
function parseEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            config[match[1].trim()] = match[2].trim();
        }
    });
    return config;
}

const envPath = path.resolve(__dirname, 'moysklad-web/.env.local');
const config = parseEnv(envPath);
const apiKey = config.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("No GOOGLE_API_KEY found in", envPath);
    process.exit(1);
}

console.log("Using API Key starting with:", apiKey.substring(0, 5));

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\n✅ Available Models for this Key:");
            data.models.forEach(m => {
                // Filter for models that support content generation
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    // Extract clean name, e.g. "models/gemini-1.5-flash" -> "gemini-1.5-flash"
                    const cleanName = m.name.replace('models/', '');
                    const isLatest = m.name.includes('latest') || m.name.includes('1.5');
                    console.log(`- ${m.name} ${isLatest ? '✨' : ''}`);
                }
            });
        } else {
            console.log("❌ Error listing models:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Network Error:", error);
    }
}

listModels();
