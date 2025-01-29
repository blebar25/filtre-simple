const sharp = require('sharp');
const fs = require('fs').promises;

async function convertIcons() {
  const svg = await fs.readFile('icons/icon.svg');
  
  const sizes = [16, 48, 128];
  
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`icons/icon${size}.png`);
  }
}

convertIcons().catch(console.error);
