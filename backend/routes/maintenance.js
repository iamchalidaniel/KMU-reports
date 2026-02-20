import express from 'express';
import { 
    listMaintenanceReports, 
    getMaintenanceReport, 
    createMaintenanceReport, 
    updateMaintenanceReport, 
    deleteMaintenanceReport,
    getMaintenanceAnalytics
} from '../controllers/maintenanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Middleware to check if user can access maintenance reports
const canAccessMaintenance = (req, res, next) => {
    const allowedRoles = [
        'admin',
        'chief_security_officer',
        'dean_of_students',
        'assistant_dean',
        'secretary',
        'hall_warden',
        'electrician',
        'student' // Students can view their own maintenance reports
    ];
    
    if (req.user && allowedRoles.includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Access denied to maintenance reports' });
    }
};

// Middleware to check if user can create/update/delete maintenance reports
const canManageMaintenance = (req, res, next) => {
    const allowedRoles = [
        'admin',
        'chief_security_officer',
        'dean_of_students',
        'assistant_dean',
        'secretary',
        'hall_warden'
    ];
    
    if (req.user && allowedRoles.includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: You do not have permission to manage maintenance reports' });
    }
};

// GET all maintenance reports (filtered by role)
router.get('/', canAccessMaintenance, listMaintenanceReports);

// GET maintenance analytics
router.get('/analytics', canAccessMaintenance, getMaintenanceAnalytics);

// GET specific maintenance report
router.get('/:id', canAccessMaintenance, getMaintenanceReport);

// POST new maintenance report (students can create, but only admins/staff can manage)
router.post('/', (req, res, next) => {
    // Allow students to create maintenance reports
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        canManageMaintenance(req, res, next);
    }
}, createMaintenanceReport);

// PUT update maintenance report
router.put('/:id', canManageMaintenance, updateMaintenanceReport);

// DELETE maintenance report (admin only)
router.delete('/:id', authorize(['admin', 'chief_security_officer']), deleteMaintenanceReport);

export default router;
