import { Router } from 'express';
import { uploadFile, getFile, deleteFileById, upload } from '../controllers/file.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.get('/:id', getFile);
router.delete('/:id', authenticate, deleteFileById);

export default router;


