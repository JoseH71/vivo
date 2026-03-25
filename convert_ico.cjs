const Jimp = require('jimp');
const pngToIco = require('png-to-ico');
const fs = require('fs');

async function convert() {
    try {
        const image = await Jimp.read('C:/Users/joseh/OneDrive/Desktop/Antigravity/Esqueleto/public/skeleton-icon.png');
        await image.resize(256, 256).writeAsync('temp_icon.png');
        
        const buf = await pngToIco('temp_icon.png');
        fs.writeFileSync('C:/Users/joseh/OneDrive/Desktop/Antigravity/Esqueleto/public/skeleton.ico', buf);
        
        console.log('Icon converted successfully!');
    } catch (e) {
        console.error('Error converting:', e);
    }
}
convert();
