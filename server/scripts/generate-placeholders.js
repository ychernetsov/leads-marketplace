const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'placeholder-files');
fs.mkdirSync(outDir, { recursive: true });

const datasets = [
  'retail_sales_2024',
  'weather_stations_us',
  'flight_delays_2023',
  'housing_prices_metro',
  'ecommerce_orders_2024',
  'energy_consumption_us',
  'stock_trades_sample',
  'healthcare_claims_anon',
  'traffic_sensors_nyc',
  'social_media_engagement',
];

for (const name of datasets) {
  const header = 'id,value,timestamp\n';
  const sampleRows = Array.from(
    { length: 50 },
    (_, i) => `${i},${Math.random()},2024-01-01`,
  ).join('\n');
  const fullRows = Array.from(
    { length: 5000 },
    (_, i) => `${i},${Math.random()},2024-01-01`,
  ).join('\n');

  fs.writeFileSync(
    path.join(outDir, `${name}_sample.csv`),
    header + sampleRows,
  );
  fs.writeFileSync(path.join(outDir, `${name}_full.csv`), header + fullRows);
}

console.log(`Generated ${datasets.length * 2} placeholder files in ${outDir}`);
