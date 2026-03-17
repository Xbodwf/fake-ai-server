import { toEntity, toEntities } from './utils';
import { getDB } from './connection';
import { ApiKey } from '../types';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'apiKeys';

export async function createApiKey(apiKey: Omit<ApiKey, 'id'> & { _id?: ObjectId }): Promise<ApiKey> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = {
    ...apiKey,
    _id: apiKey._id || new ObjectId(),
    createdAt: new Date(),
  };

  await collection.insertOne(doc);
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as ApiKey;
}

export async function getApiKey(id: string): Promise<ApiKey | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as ApiKey;
}

export async function getApiKeyByKey(key: string): Promise<ApiKey | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ key });
  if (!doc) return null;

  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as ApiKey;
}

export async function getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({ userId }).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as ApiKey[];
}

export async function getAllApiKeys(): Promise<ApiKey[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({}).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as ApiKey[];
}

export async function updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: updates,
    },
    { returnDocument: 'after' }
  );

  if (!result || !result.value) return null;

  const doc = result.value as any;
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as ApiKey;
}

export async function deleteApiKey(id: string): Promise<boolean> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function updateApiKeyLastUsed(id: string): Promise<ApiKey | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: { lastUsedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  if (!result || !result.value) return null;

  const doc = result.value as any;
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as ApiKey;
}
