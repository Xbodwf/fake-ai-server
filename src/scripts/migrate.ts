import { connectDB, disconnectDB, initializeIndexes } from '../db';
import * as fs from 'fs';
import * as path from 'path';
import { ObjectId } from 'mongodb';

interface DataFile {
  name: string;
  collection: string;
  transform?: (item: any) => any;
}

const dataFiles: DataFile[] = [
  {
    name: 'users.json',
    collection: 'users',
    transform: (item) => ({
      ...item,
      _id: new ObjectId(),
      createdAt: new Date(item.createdAt),
      lastLoginAt: item.lastLoginAt ? new Date(item.lastLoginAt) : undefined,
    }),
  },
  {
    name: 'api_keys.json',
    collection: 'apiKeys',
    transform: (item) => ({
      ...item,
      _id: new ObjectId(),
      createdAt: new Date(item.createdAt),
      lastUsedAt: item.lastUsedAt ? new Date(item.lastUsedAt) : undefined,
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
    }),
  },
  {
    name: 'usage_records.json',
    collection: 'usageRecords',
    transform: (item) => ({
      ...item,
      _id: new ObjectId(),
      timestamp: new Date(item.timestamp),
    }),
  },
  {
    name: 'invoices.json',
    collection: 'invoices',
    transform: (item) => ({
      ...item,
      _id: new ObjectId(),
      createdAt: new Date(item.createdAt),
      dueDate: new Date(item.dueDate),
    }),
  },
  {
    name: 'actions.json',
    collection: 'actions',
    transform: (item) => ({
      ...item,
      _id: new ObjectId(),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt || item.createdAt),
    }),
  },
  {
    name: 'notifications.json',
    collection: 'notifications',
    transform: (item) => ({
      ...item,
      _id: new ObjectId(),
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
    }),
  },
  {
    name: 'invitations.json',
    collection: 'invitationRecords',
    transform: (item) => ({
      ...item,
      _id: new ObjectId(),
      createdAt: new Date(item.createdAt),
    }),
  },
];

async function migrateData() {
  try {
    console.log('🚀 Starting data migration to MongoDB...\n');

    // Connect to MongoDB
    const db = await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Initialize indexes
    await initializeIndexes();
    console.log('✅ Database indexes initialized\n');

    // Migrate each data file
    for (const dataFile of dataFiles) {
      const filePath = path.join(process.cwd(), 'data', dataFile.name);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${dataFile.name}, skipping...`);
        continue;
      }

      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        if (!Array.isArray(data)) {
          console.log(`⚠️  ${dataFile.name} is not an array, skipping...`);
          continue;
        }

        if (data.length === 0) {
          console.log(`⏭️  ${dataFile.name} is empty, skipping...`);
          continue;
        }

        // Transform data
        const transformedData = data.map(item => {
          const transformed = dataFile.transform ? dataFile.transform(item) : item;
          // Remove the old id field if it exists and we're using _id
          if (transformed._id && transformed.id && typeof transformed.id === 'string') {
            delete transformed.id;
          }
          return transformed;
        });

        // Insert into MongoDB
        const collection = db.collection(dataFile.collection);
        const result = await collection.insertMany(transformedData);

        console.log(`✅ ${dataFile.name}`);
        console.log(`   Inserted ${result.insertedCount} documents into ${dataFile.collection}\n`);
      } catch (error: any) {
        console.error(`❌ Error migrating ${dataFile.name}:`, error.message);
      }
    }

    console.log('🎉 Data migration completed!');
    await disconnectDB();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();
