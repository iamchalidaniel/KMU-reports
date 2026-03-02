import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'user' },
    studentId: { type: String, required: false }, // Link to student record for student users

    // Profile Fields (Shared/Staff)
    firstName: String,
    surName: String,
    nrc: String,
    gender: String,
    maritalStatus: String,
    nationality: String,
    dateOfBirth: String,
    phone: String,
    email: String,

    // Address (Shared/Staff)
    province: String,
    town: String,
    address: String,

    createdAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

export default UserModel;