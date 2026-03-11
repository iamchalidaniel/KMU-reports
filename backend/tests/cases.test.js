import request from 'supertest';
import express from 'express';
import CaseModel from '../models/case.js';
import StudentModel from '../models/student.js';
import { listCases, createCase, getCaseById } from '../controllers/casesController.js';

// Create a minimal express app for testing
const app = express();
app.use(express.json());
app.get('/api/cases', listCases);
app.post('/api/cases', createCase);
app.get('/api/cases/:id', getCaseById);

describe('Cases Controller', () => {
  describe('GET /api/cases', () => {
    it('should return empty array when no cases exist', async () => {
      const response = await request(app).get('/api/cases');
      
      expect(response.status).toBe(200);
      expect(response.body.cases).toEqual([]);
    });

    it('should return paginated cases', async () => {
      // Create test cases
      await CaseModel.create([
        { offense_type: 'Test Offense 1', description: 'Description 1', status: 'open' },
        { offense_type: 'Test Offense 2', description: 'Description 2', status: 'closed' }
      ]);

      const response = await request(app).get('/api/cases?page=1&limit=10');
      
      expect(response.status).toBe(200);
      expect(response.body.cases.length).toBe(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter cases by status', async () => {
      await CaseModel.create([
        { offense_type: 'Open Case', description: 'Desc', status: 'open' },
        { offense_type: 'Closed Case', description: 'Desc', status: 'closed' }
      ]);

      const response = await request(app).get('/api/cases?status=open');
      
      expect(response.status).toBe(200);
      expect(response.body.cases.length).toBe(1);
      expect(response.body.cases[0].status).toBe('open');
    });
  });

  describe('POST /api/cases', () => {
    it('should create a new case', async () => {
      const response = await request(app)
        .post('/api/cases')
        .send({
          offense_type: 'New Offense',
          description: 'Test description',
          status: 'open',
          severity: 'medium'
        });

      expect(response.status).toBe(201);
      expect(response.body.offense_type).toBe('New Offense');
    });
  });

  describe('GET /api/cases/:id', () => {
    it('should return a case by ID', async () => {
      const newCase = await CaseModel.create({
        offense_type: 'Test Case',
        description: 'Test Description',
        status: 'open'
      });

      const response = await request(app).get(`/api/cases/${newCase._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.offense_type).toBe('Test Case');
    });

    it('should return 404 for non-existent case', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app).get(`/api/cases/${fakeId}`);
      
      expect(response.status).toBe(404);
    });
  });
});
