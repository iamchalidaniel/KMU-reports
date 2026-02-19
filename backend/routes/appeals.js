import express from 'express';
import { authenticate } from '../middleware/auth.js';
import CaseModel from '../models/case.js';
import db from '../models/db.js';
const dbType = process.env.DB_TYPE || 'mongo';
const router = express.Router();

router.use(authenticate);

// GET appeals for a student or all appeals (admin only)
router.get('/', async (req, res) => {
    try {
        const studentId = req.query.studentId;
        const isAdmin = req.user && ['admin', 'academic_office', 'security_officer', 'chief_security_officer', 'dean_of_students', 'assistant_dean', 'secretary'].includes(req.user.role);

        if (dbType === 'mongo') {
            let query = { appealStatus: { $in: ['pending', 'approved', 'rejected'] } };
            
            // If student, only show their appeals
            if (req.user.role === 'student' && !isAdmin) {
                query.student_id = req.user.studentId;
            } else if (studentId) {
                query.student_id = studentId;
            }

            const appeals = await CaseModel.find(query)
                .select('_id student_id incident_date description offense_type severity status appealStatus appealReason appealDate appealDecision createdAt updatedAt')
                .sort({ appealDate: -1 });

            res.json(appeals);
        } else if (dbType === 'mysql') {
            let sql = 'SELECT * FROM cases WHERE appealStatus IS NOT NULL AND appealStatus != ""';
            const params = [];

            if (req.user.role === 'student' && !isAdmin) {
                sql += ' AND student_id = ?';
                params.push(req.user.studentId);
            } else if (studentId) {
                sql += ' AND student_id = ?';
                params.push(studentId);
            }

            sql += ' ORDER BY appealDate DESC';
            const [appeals] = await db.execute(sql, params);
            res.json(appeals);
        }
    } catch (err) {
        console.error('Error fetching appeals:', err);
        res.status(500).json({ error: 'Failed to fetch appeals' });
    }
});

// POST new appeal (students can only appeal their own cases)
router.post('/', async (req, res) => {
    try {
        const { caseId, reason } = req.body;

        if (!caseId || !reason) {
            return res.status(400).json({ error: 'Case ID and reason are required' });
        }

        if (dbType === 'mongo') {
            const caseDoc = await CaseModel.findById(caseId);
            
            if (!caseDoc) {
                return res.status(404).json({ error: 'Case not found' });
            }

            // Students can only appeal their own cases
            if (req.user.role === 'student' && caseDoc.student_id !== req.user.studentId) {
                return res.status(403).json({ error: 'Forbidden: You can only appeal your own cases' });
            }

            // Update case with appeal info
            caseDoc.appealStatus = 'pending';
            caseDoc.appealReason = reason;
            caseDoc.appealDate = new Date();
            await caseDoc.save();

            res.json({ success: true, message: 'Appeal submitted', caseId });
        } else if (dbType === 'mysql') {
            // First check the case exists and belongs to student
            const [cases] = await db.execute('SELECT * FROM cases WHERE id = ?', [caseId]);
            if (cases.length === 0) {
                return res.status(404).json({ error: 'Case not found' });
            }

            const caseRow = cases[0];
            if (req.user.role === 'student' && caseRow.student_id !== req.user.studentId) {
                return res.status(403).json({ error: 'Forbidden: You can only appeal your own cases' });
            }

            // Update case with appeal info
            await db.execute(
                'UPDATE cases SET appealStatus = ?, appealReason = ?, appealDate = NOW() WHERE id = ?',
                ['pending', reason, caseId]
            );

            res.json({ success: true, message: 'Appeal submitted', caseId });
        }
    } catch (err) {
        console.error('Error submitting appeal:', err);
        res.status(500).json({ error: 'Failed to submit appeal' });
    }
});

// PUT update appeal status (admin only)
router.put('/:caseId', async (req, res) => {
    try {
        const isAdmin = req.user && ['admin', 'academic_office', 'security_officer', 'chief_security_officer', 'dean_of_students', 'assistant_dean', 'secretary'].includes(req.user.role);
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Only admin can update appeals' });
        }

        const { caseId } = req.params;
        const { status, decision } = req.body;

        if (dbType === 'mongo') {
            const caseDoc = await CaseModel.findByIdAndUpdate(
                caseId,
                { 
                    appealStatus: status,
                    appealDecision: decision,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!caseDoc) {
                return res.status(404).json({ error: 'Case not found' });
            }

            res.json({ success: true, message: 'Appeal updated', case: caseDoc });
        } else if (dbType === 'mysql') {
            await db.execute(
                'UPDATE cases SET appealStatus = ?, appealDecision = ? WHERE id = ?',
                [status, decision, caseId]
            );

            res.json({ success: true, message: 'Appeal updated' });
        }
    } catch (err) {
        console.error('Error updating appeal:', err);
        res.status(500).json({ error: 'Failed to update appeal' });
    }
});

export default router;
