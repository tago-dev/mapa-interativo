const fs = require('fs');
const https = require('https');
const path = require('path');

const MOCK_FILE_PATH = path.join(__dirname, '../public/data/municipios.json');
const OUTPUT_FILE_PATH = path.join(__dirname, '../public/data/municipios.json');
const GEOJSON_URL = 'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-41-mun.json';

// 1. Read existing mock data to preserve properties
const mockData = JSON.parse(fs.readFileSync(MOCK_FILE_PATH, 'utf8'));
const mockProperties = {};

mockData.features.forEach(feature => {
    if (feature.properties && feature.properties.name) {
        mockProperties[feature.properties.name] = feature.properties;
    }
});

console.log('Preserving properties for:', Object.keys(mockProperties));

// 2. Fetch real GeoJSON
console.log('Fetching real GeoJSON...');
https.get(GEOJSON_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const realGeoJSON = JSON.parse(data);
            console.log(`Fetched ${realGeoJSON.features.length} features.`);

            // 3. Merge properties
            realGeoJSON.features.forEach(feature => {
                // The real GeoJSON has 'name' in properties, usually.
                // Let's check the structure from the curl output earlier:
                // { "type": "Feature", "properties": {"id": "4100103", "name": "Abatiá", "description": "Abatiá"}, ... }
                
                const cityName = feature.properties.name;
                if (mockProperties[cityName]) {
                    console.log(`Merging data for ${cityName}...`);
                    // Merge existing properties (like prefeito, partido, etc.) into the new feature
                    // We keep the real geometry and id from the new file (or prefer the old id if it matches?)
                    // The real file has IBGE ID as 'id' property inside properties.
                    
                    feature.properties = {
                        ...feature.properties,
                        ...mockProperties[cityName]
                    };
                }
            });

            // 4. Save to file
            fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(realGeoJSON, null, 2));
            console.log('Successfully updated municipios.json with real geometry and merged data.');

        } catch (e) {
            console.error('Error parsing or processing GeoJSON:', e);
        }
    });

}).on('error', (err) => {
    console.error('Error fetching GeoJSON:', err);
});
