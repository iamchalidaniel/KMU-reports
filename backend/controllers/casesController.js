import CaseModel from '../models/case.js';
import { logAudit } from './auditController.js';

export async function listCases(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const studentId = req.query.studentId;
        const search = req.query.search;
        const status = req.query.status;
        const severity = req.query.severity;
        // Build query with filters
        const query = {};
        if (studentId) query.student_id = studentId;
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (search) {
            query.$or = [
                { offense_type: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await CaseModel.countDocuments(query);
        const cases = await CaseModel.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        // Populate student or staff information for each case
        const StudentModel = (await import('../models/student.js')).default;
        const StaffModel = (await import('../models/staff.js')).default;
        for (let i = 0; i < cases.length; i++) {
            cases[i] = cases[i].toObject();

            // Handle student cases
            if (cases[i].student_ids && cases[i].student_ids.length > 0) {
                // Multiple students case - get the first student for display
                const student = await StudentModel.findOne({ studentId: cases[i].student_ids[0] });
                if (student) {
                    cases[i].student = student.toObject();
                } else {
                    cases[i].student = null;
                    console.warn(`Student not found for case ${cases[i]._id}, student_id: ${cases[i].student_ids[0]}`);
                }
            } else if (cases[i].student_id) {
                // Single student case
                const student = await StudentModel.findOne({ studentId: cases[i].student_id });
                if (student) {
                    cases[i].student = student.toObject();
                } else {
                    cases[i].student = null;
                    console.warn(`Student not found for case ${cases[i]._id}, student_id: ${cases[i].student_id}`);
                }
            }
            // Handle staff cases
            else if (cases[i].staff_ids && cases[i].staff_ids.length > 0) {
                // Multiple staff case - get the first staff for display
                const staff = await StaffModel.findOne({ staffId: cases[i].staff_ids[0] });
                if (staff) {
                    cases[i].staff = staff.toObject();
                } else {
                    cases[i].staff = null;
                    console.warn(`Staff not found for case ${cases[i]._id}, staff_id: ${cases[i].staff_ids[0]}`);
                }
            } else if (cases[i].staff_id) {
                // Single staff case
                const staff = await StaffModel.findOne({ staffId: cases[i].staff_id });
                if (staff) {
                    cases[i].staff = staff.toObject();
                } else {
                    cases[i].staff = null;
                    console.warn(`Staff not found for case ${cases[i]._id}, staff_id: ${cases[i].staff_id}`);
                }
            } else {
                cases[i].student = null;
                cases[i].staff = null;
                console.warn(`Case ${cases[i]._id} has no student_id, student_ids, staff_id, or staff_ids`);
            }

            // Transform field names to camelCase for frontend
            cases[i] = {
                ...cases[i],
                incidentDate: cases[i].incident_date,
                offenseType: cases[i].offense_type,
                createdBy: cases[i].created_by,
                createdAt: cases[i].created_at,
                updatedAt: cases[i].updated_at,
                appealStatus: cases[i].appeal_status,
                appealReason: cases[i].appeal_reason,
                appealDate: cases[i].appeal_date,
                appealDecision: cases[i].appeal_decision
            };
        }
        res.json({ cases, total });
    } catch (err) {
        console.error('Error in listCases:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function getCase(req, res) {
    try {
        let caseItem = await CaseModel.findById(req.params.id);
        if (caseItem) {
            // Populate student or staff information
            const StudentModel = (await import('../models/student.js')).default;
            const StaffModel = (await import('../models/staff.js')).default;
            caseItem = caseItem.toObject();

            // Handle student cases
            if (caseItem.student_ids && caseItem.student_ids.length > 0) {
                // Multiple students case - get all students
                const students = await StudentModel.find({ studentId: { $in: caseItem.student_ids } });
                caseItem.students = students.map(s => s.toObject());
                // Keep first student for backward compatibility
                caseItem.student = students.length > 0 ? students[0].toObject() : null;
            } else if (caseItem.student_id) {
                // Single student case
                const student = await StudentModel.findOne({ studentId: caseItem.student_id });
                if (student) {
                    caseItem.student = student.toObject();
                    caseItem.students = [student.toObject()]; // Add students array for consistency
                } else {
                    caseItem.student = null;
                    caseItem.students = [];
                }
            }
            // Handle staff cases
            else if (caseItem.staff_ids && caseItem.staff_ids.length > 0) {
                // Multiple staff case - get all staff
                const staffMembers = await StaffModel.find({ staffId: { $in: caseItem.staff_ids } });
                caseItem.staffMembers = staffMembers.map(s => s.toObject());
                // Keep first staff for single staff compatibility
                caseItem.staff = staffMembers.length > 0 ? staffMembers[0].toObject() : null;
            } else if (caseItem.staff_id) {
                // Single staff case
                const staff = await StaffModel.findOne({ staffId: caseItem.staff_id });
                if (staff) {
                    caseItem.staff = staff.toObject();
                    caseItem.staffMembers = [staff.toObject()]; // Add staffMembers array for consistency
                } else {
                    caseItem.staff = null;
                    caseItem.staffMembers = [];
                }
            } else {
                caseItem.student = null;
                caseItem.students = [];
                caseItem.staff = null;
                caseItem.staffMembers = [];
            }

            // Transform field names to camelCase for frontend
            caseItem = {
                ...caseItem,
                incidentDate: caseItem.incident_date,
                offenseType: caseItem.offense_type,
                createdBy: caseItem.created_by,
                createdAt: caseItem.created_at,
                updatedAt: caseItem.updated_at,
                appealStatus: caseItem.appeal_status,
                appealReason: caseItem.appeal_reason,
                appealDate: caseItem.appeal_date,
                appealDecision: caseItem.appeal_decision
            };
        }
        if (!caseItem) return res.status(404).json({ error: 'Case not found' });
        res.json(caseItem);
    } catch (err) {
        console.error('Error in getCase:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function createCase(req, res) {
    try {
        // Check if this is a student case or staff case
        const isMultipleStudents = req.body.student_ids && Array.isArray(req.body.student_ids) && req.body.student_ids.length > 0;
        const isSingleStudent = req.body.student_id && req.body.student_id.trim() !== '';
        const isMultipleStaff = req.body.staff_ids && Array.isArray(req.body.staff_ids) && req.body.staff_ids.length > 0;
        const isSingleStaff = req.body.staff_id && req.body.staff_id.trim() !== '';

        // Validate that we have either student or staff information
        if (!isMultipleStudents && !isSingleStudent && !isMultipleStaff && !isSingleStaff) {
            return res.status(400).json({ error: 'Either student_id, student_ids, staff_id, or staff_ids must be provided' });
        }

        // Check if both student and staff information is provided (not allowed)
        const hasStudentInfo = isMultipleStudents || isSingleStudent;
        const hasStaffInfo = isMultipleStaff || isSingleStaff;
        if (hasStudentInfo && hasStaffInfo) {
            return res.status(400).json({ error: 'Cannot create a case for both student and staff simultaneously' });
        }

        // Enforce required fields
        const requiredFields = ['incident_date', 'offense_type', 'severity', 'description'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        // Determine case type
        let caseType;
        if (isMultipleStudents) {
            caseType = 'group_student';
        } else if (isSingleStudent) {
            caseType = 'single_student';
        } else if (isMultipleStaff) {
            caseType = 'group_staff';
        } else if (isSingleStaff) {
            caseType = 'single_staff';
        }

        // Set default values for optional fields
        const caseData = {
            ...req.body,
            status: req.body.status || 'Open', // Default to 'Open' for new cases
            sanctions: req.body.sanctions || '', // Default to empty string if not provided
            attachments: req.body.attachments || [], // Default to empty array
            created_by: (req.user && req.user.username) ? req.user.username : req.body.created_by,
            case_type: caseType
        };

        let caseItem = await CaseModel.create(caseData);
        // Populate student or staff information
        const StudentModel = (await import('../models/student.js')).default;
        const StaffModel = (await import('../models/staff.js')).default;

        if (isMultipleStudents) {
            // For multiple students, populate all students
            const students = await StudentModel.find({ studentId: { $in: caseItem.student_ids } });
            caseItem = caseItem.toObject();
            caseItem.students = students.map(s => s.toObject());
            caseItem.student = null; // Keep null for backward compatibility
        } else if (isSingleStudent) {
            // For single student, populate single student (backward compatibility)
            const student = await StudentModel.findOne({ studentId: caseItem.student_id });
            caseItem = caseItem.toObject();
            if (student) {
                caseItem.student = student.toObject();
            } else {
                caseItem.student = null; // Set to null if student not found
            }
            caseItem.students = caseItem.student ? [caseItem.student] : []; // Add students array for consistency
        } else if (isMultipleStaff) {
            // For multiple staff, populate all staff
            const staffMembers = await StaffModel.find({ staffId: { $in: caseItem.staff_ids } });
            caseItem = caseItem.toObject();
            caseItem.staffMembers = staffMembers.map(s => s.toObject());
            caseItem.staff = null; // Keep null for single staff compatibility
        } else if (isSingleStaff) {
            // For single staff, populate single staff
            const staff = await StaffModel.findOne({ staffId: caseItem.staff_id });
            caseItem = caseItem.toObject();
            if (staff) {
                caseItem.staff = staff.toObject();
            } else {
                caseItem.staff = null; // Set to null if staff not found
            }
            caseItem.staffMembers = caseItem.staff ? [caseItem.staff] : []; // Add staffMembers array for consistency
        }

        // Transform field names to camelCase for frontend
        caseItem = {
            ...caseItem,
            incidentDate: caseItem.incident_date,
            offenseType: caseItem.offense_type,
            createdBy: caseItem.created_by,
            createdAt: caseItem.createdAt,
            updatedAt: caseItem.updatedAt
        };

        // Audit log for case creation
        await logAudit({
            action: 'case_created',
            entity: 'case',
            entityId: caseItem._id || caseItem.id,
            user: (req.user && req.user.username) || req.body.created_by || 'unknown',
            details: {
                caseData: {
                    incidentDate: caseData.incident_date,
                    offenseType: caseData.offense_type,
                    severity: caseData.severity,
                    status: caseData.status,
                    caseType: caseData.case_type,
                    studentCount: isMultipleStudents ? req.body.student_ids.length : (isSingleStudent ? 1 : 0),
                    staffCount: isMultipleStaff ? req.body.staff_ids.length : (isSingleStaff ? 1 : 0)
                },
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json(caseItem);
    } catch (err) {
        console.error('Error in createCase:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function updateCase(req, res) {
    try {
        // Fetch old case for status comparison
        const oldCase = await CaseModel.findById(req.params.id);
        const oldStatus = oldCase ? oldCase.status : undefined;
        let caseItem = await CaseModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (caseItem) {
            // Populate student information
            const StudentModel = (await import('../models/student.js')).default;
            const student = await StudentModel.findOne({ studentId: caseItem.student_id });
            caseItem = caseItem.toObject();
            if (student) {
                caseItem.student = student.toObject();
            } else {
                caseItem.student = null; // Set to null if student not found
            }
            // Transform field names to camelCase for frontend
            caseItem = {
                ...caseItem,
                incidentDate: caseItem.incident_date,
                offenseType: caseItem.offense_type,
                createdBy: caseItem.created_by,
                createdAt: caseItem.created_at,
                updatedAt: caseItem.updated_at,
                appealStatus: caseItem.appeal_status,
                appealReason: caseItem.appeal_reason,
                appealDate: caseItem.appeal_date,
                appealDecision: caseItem.appeal_decision
            };
        }
        // Audit log for status change
        if (req.body.status && oldStatus && req.body.status !== oldStatus) {
            await logAudit({
                action: 'status_change',
                entity: 'case',
                entityId: req.params.id,
                user: (req.user && req.user.username) || req.body.user || 'unknown',
                details: {
                    oldStatus,
                    newStatus: req.body.status,
                    changes: req.body,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        // Audit log for other updates
        if (Object.keys(req.body).length > 0) {
            await logAudit({
                action: 'case_updated',
                entity: 'case',
                entityId: req.params.id,
                user: (req.user && req.user.username) || req.body.user || 'unknown',
                details: {
                    changes: req.body,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
        res.json(caseItem);
    } catch (err) {
        console.error('Error in updateCase:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function deleteCase(req, res) {
    try {
        await CaseModel.findByIdAndDelete(req.params.id);
        // Audit log for deletion
        await logAudit({
            action: 'case_deleted',
            entity: 'case',
            entityId: req.params.id,
            user: (req.user && req.user.username) || req.body.user || 'unknown',
            details: {
                timestamp: new Date().toISOString(),
                reason: 'Case permanently deleted'
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}
