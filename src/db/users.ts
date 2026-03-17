import { toEntity, toEntities } from './utils';
import { getDB } from './connection';
import { User } from '../types';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'users';

export async function createUser(user: Omit<User, 'id'> & { _id?: ObjectId }): Promise<User> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = {
    ...user,
    _id: user._id || new ObjectId(),
    createdAt: new Date(),
  };

  await collection.insertOne(doc);
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as User;
}

export async function getUser(id: string): Promise<User | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as User;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ username });
  if (!doc) return null;

  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ email });
  if (!doc) return null;

  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as User;
}

export async function getAllUsers(): Promise<User[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({}).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as User[];
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
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
  } as unknown as User;
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function updateUserBalance(id: string, amount: number): Promise<User | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $inc: { balance: amount },
    },
    { returnDocument: 'after' }
  );

  if (!result || !result.value) return null;

  const doc = result.value as any;
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as User;
}

export async function updateUserUsage(id: string, tokens: number): Promise<User | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $inc: { totalUsage: tokens },
    },
    { returnDocument: 'after' }
  );

  if (!result || !result.value) return null;

  const doc = result.value as any;
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as User;
}
