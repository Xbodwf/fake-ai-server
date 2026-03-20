import { toEntity, toEntities } from './utils';
import { getDB } from './connection';
import { Invoice } from '../types';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'invoices';

export async function createInvoice(invoice: Omit<Invoice, 'id'> & { _id?: ObjectId }): Promise<Invoice> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = {
    ...invoice,
    _id: invoice._id || new ObjectId(),
    createdAt: new Date(),
  };

  await collection.insertOne(doc);
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as Invoice;
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as Invoice;
}

export async function getUserInvoices(userId: string): Promise<Invoice[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as Invoice[];
}

export async function getInvoiceByPeriod(userId: string, period: string): Promise<Invoice | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ userId, period });
  if (!doc) return null;

  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as Invoice;
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as Invoice[];
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  // MongoDB 驱动 v6+ 直接返回文档，不再包装在 { value } 中
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: updates,
    },
    { returnDocument: 'after' }
  );

  if (!result) return null;

  const doc = result as any;
  return {
    ...doc,
    id: doc._id.toString(),
  } as unknown as Invoice;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getInvoicesByStatus(status: 'pending' | 'paid' | 'overdue'): Promise<Invoice[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const docs = await collection.find({ status }).sort({ createdAt: -1 }).toArray();
  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as unknown as Invoice[];
}
