import express from 'express';
import upload from '../middlewares/excelMiddleware.js'; // Middleware para subir Excel
import { authenticate, verifyType, verifyRole } from '../middlewares/auth/authMiddleware.js';
import { uploadExcelClienteData, uploadExcelElementoData } from '../controllers/importarExcelController.js';

const router = express.Router();

// Ruta para subir y procesar el archivo Excel
router.post('/cliente', upload.single('file'), uploadExcelClienteData);
router.post('/elemento', authenticate, upload.single('file'), uploadExcelElementoData);

export default router;
