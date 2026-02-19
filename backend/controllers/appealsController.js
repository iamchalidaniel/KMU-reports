import CaseModel from '../models/case.js';

// Get all appeals (admin/staff only) or student's own appeals
export const listAppeals = async (req, res) => {
    try {
        const { page = 1, limit = 20, studentId } = req.query;
        const skip = (page - 1) * limit;

        let query = { appeal_status: { $in: ['pending', 'approved', 'rejected'] } };

        // If student, only show their own appeals
        if (req.user && req.user.role === 'student') {
            query.student_id = req.user._id;
        } else if (studentId) {
            query.student_id = studentId;
        }

        const total = await CaseModel.countDocuments(query);
        const appeals = await CaseModel.find(query)
            .select('_id student_id incident_date description offense_type severity status appeal_status appeal_reason appeal_date appeal_decision created_at updated_at')
            .sort({ appeal_date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            appeals: appeals.map(appeal => ({
                ...appeal.toObject(),
                appealStatus: appeal.appeal_status,
                appealReason: appeal.appeal_reason,
                appealDate: appeal.appeal_date,
                appealDecision: appeal.appeal_decision,
                createdAt: appeal.created_at,
                updatedAt: appeal.updated_at,
                incidentDate: appeal.incident_date,
                offenseType: appeal.offense_type,
            })),
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single appeal
export const getAppeal = async (req, res) => {
    try {
        const appeal = await CaseModel.findById(req.params.id);

        if (!appeal || !appeal.appeal_status) {
            return res.status(404).json({ error: 'Appeal not found' });
        }

        // Check authorization
        if (req.user.role === 'student' && appeal.student_id !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({
            ...appeal.toObject(),
            appealStatus: appeal.appeal_status,
            appealReason: appeal.appeal_reason,
            appealDate: appeal.appeal_date,
            appealDecision: appeal.appeal_decision,
            createdAt: appeal.created_at,
            updatedAt: appeal.updated_at,
            incidentDate: appeal.incident_date,
            offenseType: appeal.offense_type,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Submit appeal on a case (students only)
export const submitAppeal = async (req, res) => {
    try {
        const { appeal_reason } = req.body;

        if (!appeal_reason) {
            return res.status(400).json({ error: 'Appeal reason is required' });
        }

        const appeal = await CaseModel.findByIdAndUpdate(
            req.params.id,
            {
                appeal_status: 'pending',
                appeal_reason,
                appeal_date: new Date(),
                updated_at: new Date(),
            },
            { new: true }
        );

        if (!appeal) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // Check authorization
        if (appeal.student_id !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({
            message: 'Appeal submitted successfully',
            appeal: {
                ...appeal.toObject(),
                appealStatus: appeal.appeal_status,
                appealReason: appeal.appeal_reason,
                appealDate: appeal.appeal_date,
                createdAt: appeal.created_at,
                updatedAt: appeal.updated_at,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Review appeal (admin/staff only)
export const reviewAppeal = async (req, res) => {
    try {
        const { appeal_decision, appeal_status } = req.body;

        if (!appeal_decision || !appeal_status) {
            return res.status(400).json({ error: 'Appeal decision and status are required' });
        }

        if (!['approved', 'rejected'].includes(appeal_status)) {
            return res.status(400).json({ error: 'Invalid appeal status' });
        }

        const appeal = await CaseModel.findByIdAndUpdate(
            req.params.id,
            {
                appeal_status,
                appeal_decision,
                updated_at: new Date(),
            },
            { new: true }
        );

        if (!appeal) {
            return res.status(404).json({ error: 'Appeal not found' });
        }

        res.json({
            message: 'Appeal reviewed successfully',
            appeal: {
                ...appeal.toObject(),
                appealStatus: appeal.appeal_status,
                appealDecision: appeal.appeal_decision,
                updatedAt: appeal.updated_at,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
