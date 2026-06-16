import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../app/user/model/user.model.js';
import { ContractorProfile } from '../app/contractor/model/contractorProfile.model.js';
import { ClientProfile } from '../app/client/model/clientProfile.model.js';
import { City } from '../app/city/model/city.model.js';
import { Category } from '../app/category/model/category.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/monil-corpus';

const contractorData = [
  {
    name: 'Raj Sharma',
    email: 'raj.sharma@example.com',
    password: 'RajSharma@123',
    businessName: 'Sharma Electrical Services',
    bio: 'Expert electrician with 10+ years of experience in residential and commercial wiring.',
    yearsExperience: 10,
    languages: ['English', 'Hindi', 'Marathi'],
    city: 'Mumbai',
    categories: ['Electrician'],  // Must match Category.name exactly
    contactPhone: '+91-9876543210',
    contactWhatsapp: '+91-9876543210',
    contactEmail: 'contact.raj@example.com',
    contactTelegram: 'rajsharma_electric',
    preferredChannel: 'whatsapp',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    password: 'PriyaPatel@123',
    businessName: 'Patel Plumbing Solutions',
    bio: 'Professional plumber fixing leaks, installations, and water systems. Same day service available.',
    yearsExperience: 8,
    languages: ['English', 'Hindi', 'Gujarati'],
    city: 'Mumbai',
    categories: ['Plumbing'],
    contactPhone: '+91-9876543211',
    contactWhatsapp: '+91-9876543211',
    contactEmail: 'priya.plumbing@example.com',
    contactTelegram: 'priyaplumber',
    preferredChannel: 'phone',
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    password: 'VikramSingh@123',
    businessName: 'Singh Painting & Decorating',
    bio: 'Interior and exterior painting specialist. Quality materials, fast execution.',
    yearsExperience: 7,
    languages: ['English', 'Hindi', 'Punjabi'],
    city: 'Delhi',
    categories: ['Painting'],
    contactPhone: '+91-9876543212',
    contactWhatsapp: '+91-9876543212',
    contactEmail: 'vikram.painter@example.com',
    contactTelegram: 'vikrampainter',
    preferredChannel: 'whatsapp',
  },
  {
    name: 'Arun Kumar',
    email: 'arun.kumar@example.com',
    password: 'ArunKumar@123',
    businessName: 'Kumar Carpentry Works',
    bio: 'Custom furniture, wooden installations, and renovation services.',
    yearsExperience: 9,
    languages: ['English', 'Hindi', 'Tamil'],
    city: 'Bangalore',
    categories: ['Carpentry'],
    contactPhone: '+91-9876543213',
    contactWhatsapp: '+91-9876543213',
    contactEmail: 'arun.carpenter@example.com',
    contactTelegram: 'aruncarpenter',
    preferredChannel: 'email',
  },
  {
    name: 'Deepak Mehta',
    email: 'deepak.mehta@example.com',
    password: 'DeepakMehta@123',
    businessName: 'Mehta AC Repair & Services',
    bio: 'AC installation, repair, and maintenance. Emergency service available 24/7.',
    yearsExperience: 6,
    languages: ['English', 'Hindi'],
    city: 'Pune',
    categories: ['AC Repair'],
    contactPhone: '+91-9876543214',
    contactWhatsapp: '+91-9876543214',
    contactEmail: 'deepak.ac@example.com',
    contactTelegram: 'deepakac',
    preferredChannel: 'whatsapp',
  },
  {
    name: 'Sunita Desai',
    email: 'sunita.desai@example.com',
    password: 'SunitaDesai@123',
    businessName: 'Desai Cleaning Services',
    bio: 'Professional cleaning for homes and offices. Eco-friendly products used.',
    yearsExperience: 5,
    languages: ['English', 'Hindi', 'Marathi'],
    city: 'Mumbai',
    categories: ['Cleaning'],
    contactPhone: '+91-9876543215',
    contactWhatsapp: '+91-9876543215',
    contactEmail: 'sunita.clean@example.com',
    contactTelegram: 'sunitacleaner',
    preferredChannel: 'whatsapp',
  },
  {
    name: 'Mohit Gupta',
    email: 'mohit.gupta@example.com',
    password: 'MohitGupta@123',
    businessName: 'Gupta Interior Design',
    bio: 'Modern and traditional interior design solutions for homes and offices.',
    yearsExperience: 7,
    languages: ['English', 'Hindi'],
    city: 'Delhi',
    categories: ['Interior Designer'],
    contactPhone: '+91-9876543216',
    contactWhatsapp: '+91-9876543216',
    contactEmail: 'mohit.design@example.com',
    contactTelegram: 'mohitdesigner',
    preferredChannel: 'email',
  },
  {
    name: 'Rajesh Yadav',
    email: 'rajesh.yadav@example.com',
    password: 'RajeshYadav@123',
    businessName: 'Yadav Masonry & Construction',
    bio: 'Expert mason for walls, floors, and structural work. Quality guaranteed.',
    yearsExperience: 12,
    languages: ['English', 'Hindi'],
    city: 'Bangalore',
    categories: ['Mason'],
    contactPhone: '+91-9876543217',
    contactWhatsapp: '+91-9876543217',
    contactEmail: 'rajesh.mason@example.com',
    contactTelegram: 'rajeshmason',
    preferredChannel: 'whatsapp',
  },
  {
    name: 'Sanjay Nair',
    email: 'sanjay.nair@example.com',
    password: 'SanjayNair@123',
    businessName: 'Nair Welding & Fabrication',
    bio: 'Professional welding, metal fabrication, and repair services.',
    yearsExperience: 8,
    languages: ['English', 'Hindi', 'Malayalam'],
    city: 'Pune',
    categories: ['Welder'],
    contactPhone: '+91-9876543218',
    contactWhatsapp: '+91-9876543218',
    contactEmail: 'sanjay.welding@example.com',
    contactTelegram: 'sanjayweld',
    preferredChannel: 'phone',
  },
  {
    name: 'Kavya Singh',
    email: 'kavya.singh@example.com',
    password: 'KavyaSingh@123',
    businessName: 'Singh Pest Control Solutions',
    bio: 'Eco-friendly pest control for homes and businesses. Safe for families.',
    yearsExperience: 6,
    languages: ['English', 'Hindi'],
    city: 'Delhi',
    categories: ['Pest Control'],
    contactPhone: '+91-9876543219',
    contactWhatsapp: '+91-9876543219',
    contactEmail: 'kavya.pest@example.com',
    contactTelegram: 'kavyapest',
    preferredChannel: 'whatsapp',
  },
];

const clientData = [
  {
    name: 'Rahul Kapoor',
    email: 'rahul.kapoor@example.com',
    password: 'RahulKapoor@123',
    city: 'Mumbai',
  },
  {
    name: 'Neha Sinha',
    email: 'neha.sinha@example.com',
    password: 'NehaSinha@123',
    city: 'Delhi',
  },
  {
    name: 'Arjun Reddy',
    email: 'arjun.reddy@example.com',
    password: 'ArjunReddy@123',
    city: 'Bangalore',
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    password: 'PriyaNair@123',
    city: 'Pune',
  },
  {
    name: 'Amit Joshi',
    email: 'amit.joshi@example.com',
    password: 'AmitJoshi@123',
    city: 'Mumbai',
  },
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Get cities and categories
    const cities = await City.find({}).lean();
    const categories = await Category.find({}).lean();

    if (cities.length === 0) {
      console.error('❌ No cities found. Run npm run seed:data first.');
      process.exit(1);
    }
    if (categories.length === 0) {
      console.error('❌ No categories found. Run npm run seed:data first.');
      process.exit(1);
    }

    // Create city and category lookup maps
    const cityMap = {};
    cities.forEach(c => {
      cityMap[c.name] = c._id;
    });

    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.name] = c._id;
    });

    console.log(`✓ Found ${cities.length} cities and ${categories.length} categories`);

    // Clear existing users to start fresh
    await User.deleteMany({ role: { $in: ['CLIENT', 'CONTRACTOR'] } });
    await ContractorProfile.deleteMany({});
    await ClientProfile.deleteMany({});
    console.log('✓ Cleared existing test users, profiles');

    const createdUsers = [];
    const infoContent = [];

    infoContent.push('# 👥 Test User Credentials\n');
    infoContent.push('## Contractors (10)\n');
    infoContent.push('| # | Name | Email | Password | User ID | Phone | WhatsApp |\n');
    infoContent.push('|---|---|---|---|---|---|---|\n');

    // Create contractors
    for (let i = 0; i < contractorData.length; i++) {
      const data = contractorData[i];
      const cityId = cityMap[data.city];

      if (!cityId) {
        console.warn(`⚠️  City "${data.city}" not found, skipping contractor ${data.name}`);
        continue;
      }

      // Create user
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'CONTRACTOR',
        isEmailVerified: true,
      });

      // Create contractor profile
      const categoryIds = data.categories
        .map(catName => categoryMap[catName])
        .filter(id => id !== undefined);

      const contractor = await ContractorProfile.create({
        userId: user._id,
        businessName: data.businessName,
        bio: data.bio,
        yearsExperience: data.yearsExperience,
        languages: data.languages,
        cityId: cityId,
        badge: 'BRONZE',
        contactChannels: {
          phone: data.contactPhone,
          whatsapp: data.contactWhatsapp,
          email: data.contactEmail,
          telegram: data.contactTelegram,
          preferredChannel: data.preferredChannel,
        },
        categories: categoryIds.map((catId, idx) => ({
          categoryId: catId,
          primary: idx === 0,
        })),
      });

      createdUsers.push({
        type: 'CONTRACTOR',
        name: data.name,
        email: data.email,
        password: data.password,
        userId: user._id.toString(),
        phone: data.contactPhone,
        whatsapp: data.contactWhatsapp,
      });

      infoContent.push(
        `| ${i + 1} | ${data.name} | ${data.email} | ${data.password} | ${user._id} | ${data.contactPhone} | ${data.contactWhatsapp} |\n`
      );

      console.log(`✓ Created contractor: ${data.name} (${data.email})`);
    }

    infoContent.push('\n## Clients (5)\n');
    infoContent.push('| # | Name | Email | Password | User ID | City |\n');
    infoContent.push('|---|---|---|---|---|---|\n');

    // Create clients
    for (let i = 0; i < clientData.length; i++) {
      const data = clientData[i];
      const cityId = cityMap[data.city];

      if (!cityId) {
        console.warn(`⚠️  City "${data.city}" not found, skipping client ${data.name}`);
        continue;
      }

      // Create user
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'CLIENT',
        isEmailVerified: true,
      });

      // Create client profile
      const client = await ClientProfile.create({
        userId: user._id,
        cityId: cityId,
      });

      createdUsers.push({
        type: 'CLIENT',
        name: data.name,
        email: data.email,
        password: data.password,
        userId: user._id.toString(),
        city: data.city,
      });

      infoContent.push(
        `| ${i + 1} | ${data.name} | ${data.email} | ${data.password} | ${user._id} | ${data.city} |\n`
      );

      console.log(`✓ Created client: ${data.name} (${data.email})`);
    }

    // Add detailed section
    infoContent.push('\n---\n');
    infoContent.push('\n## Detailed Contractor Information\n\n');

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      if (user.type === 'CONTRACTOR') {
        const contractor = contractorData.find(c => c.email === user.email);
        infoContent.push(`### ${i + 1}. ${user.name}\n`);
        infoContent.push(`**Email:** ${user.email}\n`);
        infoContent.push(`**Password:** ${user.password}\n`);
        infoContent.push(`**User ID:** ${user.userId}\n`);
        infoContent.push(`**Business Name:** ${contractor.businessName}\n`);
        infoContent.push(`**Contact Phone:** ${contractor.contactPhone}\n`);
        infoContent.push(`**WhatsApp:** ${contractor.contactWhatsapp}\n`);
        infoContent.push(`**Email:** ${contractor.contactEmail}\n`);
        infoContent.push(`**Telegram:** @${contractor.contactTelegram}\n`);
        infoContent.push(`**Years of Experience:** ${contractor.yearsExperience}\n`);
        infoContent.push(`**Languages:** ${contractor.languages.join(', ')}\n`);
        infoContent.push(`**City:** ${contractor.city}\n`);
        infoContent.push(`**Categories:** ${contractor.categories.join(', ')}\n\n`);
      }
    }

    infoContent.push('\n## Detailed Client Information\n\n');

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      if (user.type === 'CLIENT') {
        const client = clientData.find(c => c.email === user.email);
        infoContent.push(`### ${i + 1}. ${user.name}\n`);
        infoContent.push(`**Email:** ${user.email}\n`);
        infoContent.push(`**Password:** ${user.password}\n`);
        infoContent.push(`**User ID:** ${user.userId}\n`);
        infoContent.push(`**City:** ${client.city}\n\n`);
      }
    }

    // Write to file
    const infoPath = path.join(process.cwd(), 'info.md');
    fs.writeFileSync(infoPath, infoContent.join(''));
    console.log(`\n✓ Info written to: ${infoPath}`);

    console.log(`\n✅ Successfully seeded ${createdUsers.length} users!`);
    console.log(`   - Contractors: ${createdUsers.filter(u => u.type === 'CONTRACTOR').length}`);
    console.log(`   - Clients: ${createdUsers.filter(u => u.type === 'CLIENT').length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seedUsers();
