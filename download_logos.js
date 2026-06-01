const fs = require('fs');
const https = require('https');
const path = require('path');

const logos = [
  { name: 'telkomsel.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Telkomsel_2021_icon.svg' },
  { name: 'indosat.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Indosat_Ooredoo_Hutchison_logo.svg' },
  { name: 'xl.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/XL_logo_2016.svg' },
  { name: 'smartfren.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Smartfren_Logo_%282024%29.svg' },
  { name: 'tvri.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/TVRI_logo_2019.svg' },
  { name: 'rcti.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_RCTI.svg' },
  { name: 'sctv.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/SCTV_logo_%282005-present%2C_transparent-colored%29.svg' },
  { name: 'indosiar.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Indosiar_2014_logo.svg' },
  { name: 'transtv.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Trans_TV_2013_logo.svg' },
  { name: 'metrotv.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/MetroTV_2010.svg' },
  { name: 'antv.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Logo_antv_2009.svg' },
  { name: 'rtv.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/RTV_logo_2014.svg' }
];

logos.forEach(logo => {
  const file = fs.createWriteStream(path.join(__dirname, 'public', 'logos', logo.name));
  https.get(logo.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Rabelle/1.0' } }, response => {
    response.pipe(file);
    file.on('finish', () => file.close());
  });
});
