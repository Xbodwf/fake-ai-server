import { getDB } from './connection';
import { Model } from '../types';
import { ObjectId } from 'mongodb';
import { toEntity, toEntities } from './utils';

const COLLECTION_NAME = 'models';

export async function createModel(model: Omit<Model, 'id'> & { _id?: ObjectId }): Promise<Model> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = {
    ...model,
    _id: model._id || new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await collection.insertOne(doc);
  return toEntity<Model>(doc);
}

export async function getModel(id: string): Promise<Model | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return toEntity<Model>(doc);
}

export async function getModelByName(name: string): Promise<Model | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ id: name });
  if (!doc) return null;

  return toEntity<Model>(doc);
}

export async function getAllModels(): Promise<Model[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({}).toArray();
  return toEntities<Model>(docs);
}

export async function updateModel(id: string, updates: Partial<Model>): Promise<Model | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  if (!result || !result.value) return null;

  return toEntity<Model>(result.value);
}

export async function deleteModel(id: string): Promise<boolean> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function searchModels(query: {
  category?: string;
  provider?: string;
  feature?: string;
  priceRange?: [number, number];
}): Promise<Model[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const filter: any = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.provider) {
    filter.owned_by = query.provider;
  }

  if (query.feature) {
    filter.supported_features = { $in: [query.feature] };
  }

  if (query.priceRange) {
    const [min, max] = query.priceRange;
    filter.$or = [
      { 'pricing.input': { $gte: min, $lte: max } },
      { 'pricing.perRequest': { $gte: min, $lte: max } },
    ];
  }

  const docs = await collection.find(filter).toArray();
  return toEntities<Model>(docs);
}
