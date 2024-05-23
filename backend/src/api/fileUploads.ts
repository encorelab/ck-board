// fileRoutes.ts
import { Router } from 'express';
import multer, { File } from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import db from '../database/db'; // Assuming your db.ts is in the config folder

const router = Router();

// Multer GridFS Storage Configuration
const storage = new GridFsStorage({
  db: db.getConnection().db, // Use the connection from the singleton
  file: (file) => {
    return new Promise((resolve, reject) => {
      const filename = Date.now() + '-' + file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads'
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ storage });

// Upload Endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    
    // Access file details (req.file)
    const file = req.file as File;
    res.status(200).send({ filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

// Download Endpoint
router.get('/download/:filename', async (req, res) => {
  try {
    const gfsBucket = new mongoose.mongo.GridFSBucket(db.getConnection().db, { // Use the connection from the singleton
      bucketName: 'uploads'
    });

    const readStream = gfsBucket.openDownloadStreamByName(req.params.filename);
    readStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file');
  }
});

// Delete Endpoint
router.delete('/delete/:filename', async (req, res) => {
  try {
    const gfsBucket = new mongoose.mongo.GridFSBucket(db.getConnection().db, { // Use the connection from the singleton
      bucketName: 'uploads'
    });
    
    await gfsBucket.delete(new mongoose.Types.ObjectId(req.params.filename));
    res.sendStatus(204); // No Content on successful deletion
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).send('Error deleting file');
  }
});

export default router;
