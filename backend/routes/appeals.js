import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    listAppeals,
    getAppeal,
    submitAppeal,
    reviewAppeal,
} from '../controllers/appealsController.js';

const router = express.Router();

router.use(authenticate);

// Middleware to check if user is admin/staff
const isAdminOrStaff = (req, res, next) => {
    if (
        req.user &&
        ['admin', 'academic_office', 'security_officer', 'chief_security_officer', 'dean_of_students', 'assistant_dean', 'secretary'].includes(req.user.role)
    ) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};

// GET all appeals (admin/staff see all, students see their own)
router.get('/', listAppeals);

// GET specific appeal
router.get('/:id', getAppeal);

// POST submit appeal (students only)
router.post('/:id/submit', async (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ error: 'Only students can submit appeals' });
    }
}, submitAppeal);

// PUT review appeal (admin/staff only)
router.put('/:id/review', isAdminOrStaff, reviewAppeal);

export default router;
