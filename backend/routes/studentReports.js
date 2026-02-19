import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    listStudentReports,
    getStudentReport,
    createStudentReport,
    updateStudentReport,
    convertToCaseAction,
    deleteStudentReport,
} from '../controllers/studentReportController.js';

const router = express.Router();

// Authenticate all requests
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

// GET all student reports (admin/staff see all, students see own)
router.get('/', listStudentReports);

// GET specific student report
router.get('/:id', getStudentReport);

// POST new student report (students only)
router.post('/', async (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ error: 'Only students can submit reports' });
    }
}, createStudentReport);

// PUT update student report (admin/staff only)
router.put('/:id', isAdminOrStaff, updateStudentReport);

// POST convert to case (admin/staff only)
router.post('/:id/convert-to-case', isAdminOrStaff, convertToCaseAction);

// DELETE student report (admin/staff only)
router.delete('/:id', isAdminOrStaff, deleteStudentReport);

export default router;
