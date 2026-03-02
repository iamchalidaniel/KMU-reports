import UserModel from '../models/user.js';
import StudentModel from '../models/student.js';
import db from '../models/db.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
const dbType = process.env.DB_TYPE || 'mongo';

export async function listUsers(req, res) {
    try {
        let users;
        if (dbType === 'mongo') {
            users = await UserModel.find({}, '-password');
        } else if (dbType === 'mysql') {
            const [rows] = await db.execute('SELECT id, username, name, role FROM users');
            users = rows;
        }
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function getUser(req, res) {
    try {
        let user;
        if (dbType === 'mongo') {
            user = await UserModel.findById(req.params.id, '-password');
        } else if (dbType === 'mysql') {
            const [rows] = await db.execute('SELECT id, username, name, role FROM users WHERE id = ?', [req.params.id]);
            user = rows[0];
        }
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function createUser(req, res) {
    // Registration handled in authController
    res.status(501).json({ error: 'Use /register' });
}

export async function updateUser(req, res) {
    try {
        let result;
        if (dbType === 'mongo') {
            result = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true, select: '-password' });
        } else if (dbType === 'mysql') {
            const fields = Object.keys(req.body).map(k => `${k} = ?`).join(', ');
            const values = Object.values(req.body);
            values.push(req.params.id);
            await db.execute(`UPDATE users SET ${fields} WHERE id = ?`, values);
            const [rows] = await db.execute('SELECT id, username, name, role FROM users WHERE id = ?', [req.params.id]);
            result = rows[0];
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function deleteUser(req, res) {
    try {
        if (dbType === 'mongo') {
            await UserModel.findByIdAndDelete(req.params.id);
        } else if (dbType === 'mysql') {
            await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function getOwnProfile(req, res) {
    console.log('getOwnProfile called');
    try {
        console.log('getOwnProfile:', req.user, 'id:', req.user && req.user.id);
        let user;
        if (dbType === 'mongo') {
            let id = req.user.id;
            // Only convert to ObjectId if it looks like a valid ObjectId
            if (id && typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id)) {
                try {
                    id = new mongoose.Types.ObjectId(id);
                } catch (error) {
                    console.error('Invalid ObjectId format:', id);
                    return res.status(400).json({ error: 'Invalid user ID format' });
                }
            }
            user = await UserModel.findById(id, '-password');
        } else if (dbType === 'mysql') {
            const [rows] = await db.execute('SELECT id, username, name, role FROM users WHERE id = ?', [req.user.id]);
            user = rows[0];
        }
        if (!user) {
            console.log('User not found for id:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }

        // Convert to plain object if it's a Mongoose document
        let userObj = user.toObject ? user.toObject() : user;

        // If student, merge with student record
        if (userObj.role === 'student' && userObj.studentId) {
            try {
                const student = await StudentModel.findOne({ studentId: userObj.studentId });
                if (student) {
                    const studentObj = student.toObject ? student.toObject() : student;
                    // Merge student data into user profile
                    userObj = { ...userObj, ...studentObj };
                }
            } catch (err) {
                console.error('Error fetching student data for profile:', err);
                // Continue with user data if student fetch fails
            }
        }

        console.log('User found:', userObj);
        res.json(userObj);
    } catch (err) {
        console.error('getOwnProfile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function updateOwnProfile(req, res) {
    try {
        let result;
        if (dbType === 'mongo') {
            // Allow updating personal and address fields
            const allowedFields = [
                'name', 'username', 'firstName', 'surName', 'nrc', 'gender',
                'maritalStatus', 'nationality', 'dateOfBirth', 'phone', 'email',
                'province', 'town', 'address'
            ];

            const updateData = {};
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) updateData[field] = req.body[field];
            });

            let id = req.user.id;
            // Only convert to ObjectId if it looks like a valid ObjectId
            if (id && typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id)) {
                try {
                    id = new mongoose.Types.ObjectId(id);
                } catch (error) {
                    console.error('Invalid ObjectId format:', id);
                    return res.status(400).json({ error: 'Invalid user ID format' });
                }
            }

            result = await UserModel.findByIdAndUpdate(id, updateData, { new: true, select: '-password' });

            // If student, also update the student model
            if (result && result.role === 'student' && result.studentId) {
                try {
                    // Map user profile fields to student model fields if they overlap
                    const studentUpdateData = { ...updateData };
                    if (updateData.name) studentUpdateData.fullName = updateData.name;

                    // Added fields specific to student dashboard requirements
                    const studentSpecificFields = [
                        'yearOfStudy', 'status', 'deliveryMode', 'passport', 'roomNo', 'program'
                    ];
                    studentSpecificFields.forEach(field => {
                        if (req.body[field] !== undefined) studentUpdateData[field] = req.body[field];
                    });

                    await StudentModel.findOneAndUpdate(
                        { studentId: result.studentId },
                        studentUpdateData,
                        { new: true }
                    );
                } catch (err) {
                    console.error('Error updating linked student record:', err);
                }
            }
        } else if (dbType === 'mysql') {
            const updates = [];
            const values = [];
            if (req.body.name !== undefined) {
                updates.push('name = ?');
                values.push(req.body.name);
            }
            if (req.body.username !== undefined) {
                updates.push('username = ?');
                values.push(req.body.username);
            }

            if (updates.length > 0) {
                values.push(req.user.id);
                await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
            }

            const [rows] = await db.execute('SELECT id, username, name, role FROM users WHERE id = ?', [req.user.id]);
            result = rows[0];
        }
        res.json(result);
    } catch (err) {
        console.error('updateOwnProfile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function changeOwnPassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;
        let user;
        if (dbType === 'mongo') {
            let id = req.user.id;
            // Only convert to ObjectId if it looks like a valid ObjectId
            if (id && typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id)) {
                try {
                    id = new mongoose.Types.ObjectId(id);
                } catch (error) {
                    console.error('Invalid ObjectId format:', id);
                    return res.status(400).json({ error: 'Invalid user ID format' });
                }
            }

            user = await UserModel.findById(id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const valid = await bcrypt.compare(oldPassword, user.password);
            if (!valid) return res.status(400).json({ error: 'Old password is incorrect' });
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
        } else if (dbType === 'mysql') {
            const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
            user = rows[0];
            if (!user) return res.status(404).json({ error: 'User not found' });
            const valid = await bcrypt.compare(oldPassword, user.password);
            if (!valid) return res.status(400).json({ error: 'Old password is incorrect' });
            const hashed = await bcrypt.hash(newPassword, 10);
            await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}