import '../load-env.js';
import { getPublicSampleUrl } from '../src/lib/r2.js';
import { prisma } from '../src/lib/prisma.js';

const datasetNames = [
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
  'restaurant_inspections',
  'crime_reports_metro',
  'job_postings_2024',
  'movie_ratings_sample',
  'public_transit_ridership',
  'solar_panel_output',
  'covid_case_counts',
  'library_checkouts',
  'ev_charging_stations',
  'air_quality_readings',
];

function titleCase(name: string) {
  return name
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    throw new Error(
      'No admin user found — promote a user to admin before seeding.',
    );
  }

  await prisma.order.deleteMany();
  await prisma.file.deleteMany();

  for (const name of datasetNames) {
    await prisma.file.create({
      data: {
        title: titleCase(name),
        description: `Sample dataset: ${titleCase(name).toLowerCase()}.`,
        priceCents: 400,
        currency: 'usd',
        numRows: 5000,
        sizeBytes: BigInt(100 * 1024 * 1024), // placeholder ~100MB
        originalFilename: `${name}.csv`,
        r2KeyFull: `${name}_full.csv`,
        r2KeySample: `${name}_sample.csv`,
        sampleUrl: getPublicSampleUrl(`${name}_sample.csv`),
        status: 'ready',
        uploadedBy: admin.id,
      },
    });
  }

  console.log(`Seeded ${datasetNames.length} files`);
}

main().finally(() => prisma.$disconnect());