import mongoose from 'mongoose';

const StudentReportSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    student_name: String,
    student_email: String,
    incident_date: Date,
    description: {
        type: String,
        required: true,
    },
    offense_type: String,
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Approved', 'Rejected', 'Converted'],
        default: 'Pending',
    },
    is_anonymous: {
        type: Boolean,
        default: false,
    },
    admin_comments: String,
    assigned_case_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        default: null,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

// Update the updated_at field before saving
StudentReportSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

export default mongoose.model('StudentReport', StudentReportSchema);
