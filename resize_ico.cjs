const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');

async function doConvert() {
    try {
        await sharp('C:/Users/joseh/OneDrive/Desktop/Antigravity/Esqueleto/public/skeleton-icon.png')
            .resize(256, 256)
            .png()
            .toFile('esq_small.png');
            
        const bufEsq = await pngToIco('esq_small.png');
        fs.writeFileSync('C:/Users/joseh/OneDrive/Desktop/Antigravity/Esqueleto/public/skeleton.ico', bufEsq);
        
        // Also check if Salud has an icon or we'll skip it
    } catch(err) {
        console.error(err);
    }
}
doConvert();
