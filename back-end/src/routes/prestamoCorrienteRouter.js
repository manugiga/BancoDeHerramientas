import { Router } from 'express';
import { getLoans, createLoan, findLoanElements, addOrUpdate, deleteLoan, getAllLoanElements } from '../controllers/prestamoCorrienteController.js';
import { authenticate, verifyType, verifyRole } from '../middlewares/auth/authMiddleware.js';

const router = Router();

router.post('/', authenticate, verifyType(['administrador']), verifyRole(['admin', 'contratista', 'practicante']), createLoan);
router.get('/todosPrestamos', authenticate, verifyType(['administrador']), verifyRole(['admin', 'contratista', 'practicante']), getAllLoanElements);
router.post('/addElements/:idprestamo', authenticate, verifyType(['administrador']), verifyRole(['admin', 'contratista', 'practicante']), addOrUpdate);
router.get('/:idprestamo/elementos', authenticate, verifyType(['administrador']), verifyRole(['admin', 'contratista', 'practicante']), findLoanElements);
router.delete('/:idprestamo', authenticate, verifyType(['administrador']), verifyRole(['admin', 'contratista', 'practicante']), deleteLoan);

export default router;