import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
    // Support both single student/staff and multiple students/staff
    student_id: { type: String, required: false }, // Keep for backward compatibility
    student_ids: [{ type: String, required: false }], // New field for multiple students
    staff_id: { type: String, required: false }, // New field for single staff
    staff_ids: [{ type: String, required: false }], // New field for multiple staff
    incident_date: String,
    description: String,
    offense_type: String,
    severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'Pending', 'Closed', 'In Appeal'], default: 'Open' },
    sanctions: String,
    attachments: [String],
    ob_number: String,
    dossier: {
        occurrenceDocket: {
            investigatingOfficer: String,
            occurrenceBookNumber: String,
            dateTimeReported: String,
            complainant: {
                name: String,
                address: String,
                phone: String,
                yearOfStudy: String,
                programOfStudy: String,
                sex: String,
                age: String,
                nationality: String,
                tribe: String,
                village: String,
                chief: String,
                district: String
            },
            accused: {
                name: String,
                address: String,
                phone: String,
                yearOfStudy: String,
                programOfStudy: String,
                sex: String,
                age: String,
                nationality: String,
                tribe: String,
                village: String,
                chief: String,
                district: String
            },
            offence: String,
            occurrenceDetails: String,
            damagedValue: String,
            recoveredValue: String,
            disposalManner: String
        },
        statements: [{
            fullName: String,
            sex: String,
            age: String,
            sin: String,
            occupation: String,
            phone: String,
            tribe: String,
            village: String,
            chief: String,
            district: String,
            residentialAddress: String,
            businessAddress: String,
            takenAt: String,
            time: String,
            content: String,
            signature: String,
            audioUrl: String
        }],
        warnAndCaution: {
            fullName: String,
            sex: String,
            tribe: String,
            age: String,
            address: String,
            village: String,
            chief: String,
            district: String,
            program: String,
            occupation: String,
            sin: String,
            phone: String,
            takenAt: String,
            place: String,
            offence: String,
            occurrenceDate: String,
            occurrenceTime: String,
            occurrencePlace: String,
            signature: String
        },
        signatures: {
            investigatingOfficer: String,
            complainant: String,
            accused: String
        }
    },
    created_by: String,
    case_type: { type: String, enum: ['single_student', 'group_student', 'single_staff', 'group_staff'], default: 'single_student' }, // Updated field to distinguish case types
    appeal_status: { type: String, enum: ['Pending', 'Approved', 'Rejected', null], default: null },
    appeal_reason: String,
    appeal_date: Date,
    appeal_decision: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const CaseModel = mongoose.models.Case || mongoose.model('Case', caseSchema);

export default CaseModel;
