import StudentReport from '../models/studentReport.js';

// Get all student reports (admin/staff only) or student's own reports
export const listStudentReports = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, severity, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};

        // If student, only show their own reports
        if (req.user && req.user.role === 'student') {
            query.student_id = req.user._id;
        }

        // Apply filters
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { student_name: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await StudentReport.countDocuments(query);
        const reports = await StudentReport.find(query)
            .populate('student_id', 'fullName email studentId')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            reports,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single student report
export const getStudentReport = async (req, res) => {
    try {
        const report = await StudentReport.findById(req.params.id).populate('student_id', 'fullName email studentId');

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Check authorization
        if (req.user.role === 'student' && report.student_id._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new student report (students only)
export const createStudentReport = async (req, res) => {
    try {
        const { incident_date, description, offense_type, severity, is_anonymous } = req.body;

        // Validation
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        if (description.trim().length < 10) {
            return res.status(400).json({ error: 'Description must be at least 10 characters' });
        }

        const validSeverities = ['Low', 'Medium', 'High'];
        if (severity && !validSeverities.includes(severity)) {
            return res.status(400).json({ error: 'Invalid severity level' });
        }

        if (incident_date) {
            const date = new Date(incident_date);
            if (isNaN(date.getTime())) {
                return res.status(400).json({ error: 'Invalid incident date format' });
            }
        }

        const report = new StudentReport({
            student_id: is_anonymous ? null : req.user._id,
            student_name: is_anonymous ? 'Anonymous' : req.user.fullName,
            student_email: is_anonymous ? null : req.user.email,
            incident_date: incident_date || new Date(),
            description: description.trim(),
            offense_type: offense_type || 'General',
            is_anonymous: is_anonymous || false,
            severity: severity || 'Medium',
            status: 'Pending',
        });

        await report.save();
        res.status(201).json({
            message: 'Report submitted successfully',
            report,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update student report (admin/staff only, for review purposes)
export const updateStudentReport = async (req, res) => {
    try {
        const { status, admin_comments } = req.body;

        // Validation
        const validStatuses = ['Pending', 'Reviewed', 'Approved', 'Rejected', 'Converted'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const report = await StudentReport.findByIdAndUpdate(
            req.params.id,
            {
                status,
                admin_comments: admin_comments ? admin_comments.trim() : undefined,
                updated_at: Date.now(),
            },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({
            message: 'Report updated successfully',
            report,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Convert student report to actual case (admin/staff only)
export const convertToCaseAction = async (req, res) => {
    try {
        const { case_description, assigned_staff } = req.body;

        const report = await StudentReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // This would typically create a Case from the StudentReport
        // For now, just mark it as converted
        report.status = 'Converted';
        await report.save();

        res.json({
            message: 'Report converted to case',
            report,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete student report (admin/staff only)
export const deleteStudentReport = async (req, res) => {
    try {
        const report = await StudentReport.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
