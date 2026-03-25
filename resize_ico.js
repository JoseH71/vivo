import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';

async function doConvert() {
    try {
        console.log("Resizing esqueleto");
        await sharp('C:/Users/joseh/Antigravity/Esqueleto/public/skeleton-icon.png')
            .resize(256, 256)
            .png()
            .toFile('esq_small.png');
            
        console.log("Converting esqueleto to ico");
        const bufEsq = await pngToIco('esq_small.png');
        fs.writeFileSync('C:/Users/joseh/Antigravity/Esqueleto/public/skeleton.ico', bufEsq);

        console.log("Resizing vivo");
        await sharp('C:/Users/joseh/.gemini/antigravity/brain/89856383-c816-4c19-afce-eba08e84eabf/vivo_coach_icon_1774114933644.png')
            .resize(256, 256)
            .png()
            .toFile('vivo_small.png');
        
        console.log("Converting vivo to ico");
        const bufVivo = await pngToIco('vivo_small.png');
        fs.writeFileSync('C:/Users/joseh/Antigravity/Vivo/public/vivo.ico', bufVivo);
        
        console.log("Done!");
    } catch(err) {
        console.error(err);
    }
}
doConvert();
