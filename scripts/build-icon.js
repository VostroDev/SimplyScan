const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

async function createIco() {
  try {
    const pngPath = path.join(__dirname, 'resources', 'icon.png');
    const icoPath = path.join(__dirname, 'build', 'icon.ico');

    console.log('Reading PNG from:', pngPath);
    const image = await Jimp.read(pngPath);
    
    // Resize to 256x256 which is standard for ICO
    image.resize(256, 256);
    
    console.log('Writing ICO to:', icoPath);
    // JIMP doesn't write ICO natively well sometimes, but let's try writing as PNG buffer then rename/use specialized lib if needed.
    // Actually, electron-builder prefers a real ICO.
    // Let's use a specific tool 'png-to-ico' properly this time, ensuring we handle the promise.
    // Re-requiring png-to-ico as we installed it.
    const pngToIco = require('png-to-ico');
    
    const buffer = await pngToIco(pngPath);
    fs.writeFileSync(icoPath, buffer);
    console.log('Successfully created icon.ico');
    
  } catch (error) {
    console.error('Error creating ICO:', error);
    process.exit(1);
  }
}

createIco();



