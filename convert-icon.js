const pngToIco = require('png-to-ico');
const fs = require('fs');

async function convertToIco() {
  try {
    const buf = await pngToIco('assets/icon.png');
    fs.writeFileSync('assets/icon.ico', buf);
    console.log('✓ Icon converted successfully to assets/icon.ico');
  } catch (error) {
    console.error('Error converting icon:', error);
  }
}

convertToIco();
