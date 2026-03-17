import { toEntity, toEntities } from './utils';
import { getDB } from './connection';
import { UsageRecord } from '../types';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'usageRecords';

export async function createUsageRecord(record: Omit<UsageRecord, 'id'> & { _id?: ObjectId }): Promise<UsageRecord> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = {
    ...record,
    _id: record._id || new ObjectId(),
    timestamp: new Date(),
  };

  await collection.insertOne(doc);
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as UsageRecord;
}

export async function getUsageRecord(id: string): Promise<UsageRecord | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as UsageRecord;
}

export async function getUserUsageRecords(userId: string): Promise<UsageRecord[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({ userId }).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as UsageRecord[];
}

export async function getUsageRecordsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageRecord[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection
    .find({
      userId,
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    })
    .toArray();

  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as UsageRecord[];
}

export async function getUsageRecordsByApiKey(apiKeyId: string): Promise<UsageRecord[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({ apiKeyId }).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as UsageRecord[];
}

export async function getAllUsageRecords(): Promise<UsageRecord[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({}).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as UsageRecord[];
}

export async function deleteUsageRecordsByApiKey(apiKeyId: string): Promise<number> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.deleteMany({ apiKeyId });
  return result.deletedCount;
}

export async function getUserUsageSummary(userId: string): Promise<{
  totalTokens: number;
  totalCost: number;
  recordCount: number;
}> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection
    .aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          recordCount: { $sum: 1 },
        },
      },
    ])
    .toArray();

  if (result.length === 0) {
    return { totalTokens: 0, totalCost: 0, recordCount: 0 };
  }

  return {
    totalTokens: result[0].totalTokens,
    totalCost: result[0].totalCost,
    recordCount: result[0].recordCount,
  };
}
