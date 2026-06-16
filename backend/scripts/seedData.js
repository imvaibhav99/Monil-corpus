import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Category } from '../app/category/model/category.model.js';
import { City } from '../app/city/model/city.model.js';
import { Settings } from '../app/settings/model/settings.model.js';

dotenv.config();

const categories = [
  { slug: 'electrician', name: 'Electrician', description: 'Electrical repairs and installations', sortOrder: 1 },
  { slug: 'plumber', name: 'Plumber', description: 'Plumbing repairs and installations', sortOrder: 2 },
  { slug: 'painter', name: 'Painter', description: 'Interior and exterior painting', sortOrder: 3 },
  { slug: 'carpenter', name: 'Carpenter', description: 'Woodwork and furniture repairs', sortOrder: 4 },
  { slug: 'ac-repair', name: 'AC Repair', description: 'Air conditioner service and repair', sortOrder: 5 },
  { slug: 'pest-control', name: 'Pest Control', description: 'Pest extermination and prevention', sortOrder: 6 },
  { slug: 'cleaning', name: 'Cleaning', description: 'Home and office cleaning services', sortOrder: 7 },
  { slug: 'interior-designer', name: 'Interior Designer', description: 'Interior design and decoration', sortOrder: 8 },
  { slug: 'mason', name: 'Mason', description: 'Masonry and construction work', sortOrder: 9 },
  { slug: 'welder', name: 'Welder', description: 'Welding and metal fabrication', sortOrder: 10 },
];

const cities = [
  {
    slug: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    geo: { type: 'Point', coordinates: [77.4126, 23.2599] },
  },
  {
    slug: 'indore',
    name: 'Indore',
    state: 'Madhya Pradesh',
    geo: { type: 'Point', coordinates: [75.8577, 22.7196] },
  },
  {
    slug: 'delhi',
    name: 'Delhi',
    state: 'Delhi',
    geo: { type: 'Point', coordinates: [77.209, 28.6139] },
  },
  {
    slug: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    geo: { type: 'Point', coordinates: [72.8777, 19.076] },
  },
  {
    slug: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    geo: { type: 'Point', coordinates: [77.5946, 12.9716] },
  },
];

async function run() {
  await connectDB();

  for (const cat of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { ...cat, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // eslint-disable-next-line no-console
    console.log(`Category upserted: ${doc.slug}`);
  }

  for (const city of cities) {
    const doc = await City.findOneAndUpdate(
      { slug: city.slug },
      { ...city, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // eslint-disable-next-line no-console
    console.log(`City upserted: ${doc.slug}`);
  }

  let settings = await Settings.findById('platform');
  if (!settings) {
    settings = await Settings.create({ _id: 'platform' });
    // eslint-disable-next-line no-console
    console.log('Settings singleton created');
  } else {
    // eslint-disable-next-line no-console
    console.log('Settings singleton already exists — skipped');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
