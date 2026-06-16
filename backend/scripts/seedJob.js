import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Job } from '../app/job/model/job.model.js';
import { Lead } from '../app/job/model/lead.model.js';
import { User } from '../app/user/model/user.model.js';
import { City } from '../app/city/model/city.model.js';
import { Category } from '../app/category/model/category.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/monil-corpus';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Get Indore city
    const indore = await City.findOne({ slug: 'indore' });
    if (!indore) {
      console.error('❌ Indore city not found');
      process.exit(1);
    }
    console.log('✓ Found Indore city');

    // Get Carpenter category
    const carpenter = await Category.findOne({ slug: 'carpenter' });
    if (!carpenter) {
      console.error('❌ Carpenter category not found');
      process.exit(1);
    }
    console.log('✓ Found Carpenter category');

    // Get a client from Indore (or use any client)
    const client = await User.findOne({ role: 'CLIENT' });
    if (!client) {
      console.error('❌ No client found');
      process.exit(1);
    }
    console.log(`✓ Using client: ${client.name}`);

    // Create job in Indore for Carpentry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const job = await Job.create({
      clientId: client._id,
      categoryId: carpenter._id,
      cityId: indore._id,
      title: 'Build Custom Wooden Wardrobe',
      description: `Need an expert carpenter to build a custom wooden wardrobe for my bedroom.

Requirements:
- High-quality wood (teak or similar)
- 8ft height, 6ft width
- 4 doors with soft-close hinges
- Internal shelving and hanging rods
- Modern minimalist design

Timeline: 2-3 weeks
Budget: ₹50,000 - ₹80,000

Please share your portfolio and quotes.`,
      budgetMin: 50000,
      budgetMax: 80000,
      pincode: '452001',
      address: 'Silver Spring Colony, Indore',
      urgency: 'NORMAL',
      status: 'OPEN',
      expiresAt,
    });

    console.log(`✓ Job created: ${job._id}`);
    console.log(`  Title: ${job.title}`);
    console.log(`  City: Indore`);
    console.log(`  Category: Carpenter`);
    console.log(`  Budget: ₹${job.budgetMin} - ₹${job.budgetMax}`);

    // Find all carpenters in Indore who are available
    const { ContractorProfile } = await import('../app/contractor/model/contractorProfile.model.js');
    const carpenters = await ContractorProfile.find({
      cityId: indore._id,
      'categories.categoryId': carpenter._id,
      isAvailable: true,
      badge: { $ne: 'NONE' },
      deletedAt: null,
    }).select('_id userId');

    console.log(`✓ Found ${carpenters.length} carpenters in Indore`);

    if (carpenters.length === 0) {
      console.log('\n⚠️  No carpenters found in Indore with Carpentry category');
      console.log('Tip: Add a contractor profile in Indore with Carpentry as category');
    } else {
      // Create leads for each carpenter
      const leadData = carpenters.map(carpenter => ({
        jobId: job._id,
        contractorId: carpenter.userId,
        status: 'NEW',
        visibleFrom: new Date(),
        expiresAt: job.expiresAt,
      }));

      const leads = await Lead.insertMany(leadData);
      console.log(`✓ Created ${leads.length} leads for carpenters in Indore`);

      console.log('\n📋 Job Details:');
      console.log(`   Job ID: ${job._id}`);
      console.log(`   Leads Created: ${leads.length}`);
      console.log(`   Carpenters Notified: ${carpenters.map(c => c.userId).join(', ')}`);
    }

    console.log('\n✅ Job seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
})();
