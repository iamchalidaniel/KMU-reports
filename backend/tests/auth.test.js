import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import UserModel from '../models/user.js';
import { login, register } from '../controllers/authController.js';

// Create a minimal express app for testing
const app = express();
app.use(express.json());
app.post('/api/login', login);
app.post('/api/register', register);

describe('Auth Controller', () => {
  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          password: 'password123',
          name: 'Test User',
          role: 'user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.name).toBe('Test User');
    });

    it('should not register a user with existing username', async () => {
      // First registration
      await request(app)
        .post('/api/register')
        .send({
          username: 'existinguser',
          password: 'password123',
          name: 'Existing User',
          role: 'user'
        });

      // Second registration with same username
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'existinguser',
          password: 'different123',
          name: 'Another User',
          role: 'user'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Username already exists');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      await UserModel.create({
        username: 'loginuser',
        password: hashedPassword,
        name: 'Login Test User',
        role: 'admin'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'loginuser',
          password: 'correctpassword'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('loginuser');
      expect(response.body.user.role).toBe('admin');
    });

    it('should fail login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'anypassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
