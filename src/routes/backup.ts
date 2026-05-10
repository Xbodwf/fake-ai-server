import { Router, Request, Response } from 'express';
import { AuthRequest } from '../middleware.js';
import archiver from 'archiver';
import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { BSON } from 'bson';
import { getDB } from '../db/connection.js';
import { reloadAllCaches } from '../storage.js';

const upload = multer({ dest: 'temp-uploads/' });

const router: Router = Router();

// 备份元数据接口
interface BackupMetadata {
  id: string;
  filename: string;
  size: number;
  createdAt: number;
  createdBy: string;
  description?: string;
}

// 获取备份元数据集合
function getBackupMetadataCollection() {
  return getDB().collection('backup_metadata');
}

// 导出数据
router.post('/export', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { description } = req.body;
    const backupId = `backup_${Date.now()}`;
    const filename = `phantom-mock-${Date.now()}.pm.zip`;
    const backupDir = path.join(process.cwd(), 'backups');
    
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, filename);
    const db = getDB();

    // 创建压缩流
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // 监听错误
    archive.on('error', (err) => {
      throw err;
    });

    // 监听完成
    output.on('close', async () => {
      const size = archive.pointer();
      
      // 保存备份元数据
      await getBackupMetadataCollection().insertOne({
        id: backupId,
        filename,
        size,
        createdAt: Date.now(),
        createdBy: userId,
        description,
      });

      console.log(`[Backup] Created backup: ${filename}, size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    });

    archive.pipe(output);

    // 导出所有集合
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      
      // 跳过系统集合和备份元数据集合
      if (collectionName.startsWith('system.') || collectionName === 'backup_metadata') {
        continue;
      }

      const data = await db.collection(collectionName).find({}).toArray();
      
      // 将数据写入BSON文件 — 每个文档单独序列化后拼接，避免16MB BSON文档大小限制
      const bsonBuffers = data.map((doc: any) => BSON.serialize(doc));
      archive.append(Buffer.concat(bsonBuffers), {
        name: `data/${collectionName}.bson`
      });
      
      console.log(`[Backup] Exported collection: ${collectionName} (${data.length} documents)`);
    }

    // 添加元数据文件
    const metadata = {
      version: '1.0.0',
      exportedAt: Date.now(),
      exportedBy: userId,
      collections: collections.map((c: any) => c.name).filter((n: string) => !n.startsWith('system.') && n !== 'backup_metadata'),
    };
    
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    await archive.finalize();

    // 等待压缩完成
    await new Promise<void>(resolve => output.on('close', resolve));

    res.json({
      success: true,
      backup: {
        id: backupId,
        filename,
        size: archive.pointer(),
        createdAt: Date.now(),
      }
    });
  } catch (error: any) {
    console.error('[Backup] Export failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取备份列表
router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const backups = await getBackupMetadataCollection()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ backups });
  } catch (error: any) {
    console.error('[Backup] List failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 下载备份
router.get('/download/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const backup = await getBackupMetadataCollection().findOne({ id });
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const backupPath = path.join(process.cwd(), 'backups', backup.filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    res.download(backupPath, backup.filename);
  } catch (error: any) {
    console.error('[Backup] Download failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除备份
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const backup = await getBackupMetadataCollection().findOne({ id });
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // 删除文件
    const backupPath = path.join(process.cwd(), 'backups', backup.filename);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    // 删除元数据
    await getBackupMetadataCollection().deleteOne({ id });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Backup] Delete failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 导入数据
router.post('/import', upload.single('backup'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tempPath = req.file.path;
    const db = getDB();
    
    // 解压并验证
    const extractDir = path.join(process.cwd(), 'temp-import', Date.now().toString());
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(tempPath)
          .pipe(unzipper.Extract({ path: extractDir }))
          .on('close', resolve)
          .on('error', reject);
      });

      // 读取元数据
      const metadataPath = path.join(extractDir, 'metadata.json');
      if (!fs.existsSync(metadataPath)) {
        throw new Error('Invalid backup file: metadata.json not found');
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      // 导入数据
      const dataDir = path.join(extractDir, 'data');
      const files = fs.readdirSync(dataDir);

      // 阶段1：预验证所有备份数据（在写入数据库之前）
      console.log('[Backup] Validating backup data before import...');
      const collectionsToImport: { name: string; data: any[] }[] = [];
      for (const file of files) {
        if (!file.endsWith('.bson')) continue;
        const collectionName = file.replace('.bson', '');
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath);
        let data: any;
        try {
          // 读取拼接的BSON文档：每个BSON文档以自身长度(int32 LE)开头
          const documents: any[] = [];
          let offset = 0;
          while (offset < fileContent.length) {
            const docSize = fileContent.readInt32LE(offset);
            const doc = BSON.deserialize(fileContent.subarray(offset, offset + docSize));
            documents.push(doc);
            offset += docSize;
          }
          data = documents;
        } catch (e: any) {
          throw new Error(`Invalid BSON in ${file}: ${e.message}`);
        }
        if (!Array.isArray(data)) {
          throw new Error(`Invalid backup data in ${file}: expected array, got ${typeof data}`);
        }
        collectionsToImport.push({ name: collectionName, data });
      }
      console.log(`[Backup] Validated ${collectionsToImport.length} collections, starting import...`);

      // 阶段2：导入数据（不使用事务，兼容 standalone MongoDB）
      for (const { name, data } of collectionsToImport) {
        // 清空集合并导入数据
        await db.collection(name).deleteMany({});
        if (data.length > 0) {
          await db.collection(name).insertMany(data);
        }
        console.log(`[Backup] Imported collection: ${name} (${data.length} documents)`);
      }

      // 清理临时文件
      fs.rmSync(extractDir, { recursive: true, force: true });
      fs.unlinkSync(tempPath);

      // 从数据库重新加载所有缓存，无需重启
      await reloadAllCaches();

      res.json({
        success: true,
        message: 'Data imported successfully. All caches have been reloaded.',
      });

      console.log('[Backup] Data import complete, caches reloaded in-place.');

    } catch (error: any) {
      // 清理临时文件
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  } catch (error: any) {
    console.error('[Backup] Import failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
