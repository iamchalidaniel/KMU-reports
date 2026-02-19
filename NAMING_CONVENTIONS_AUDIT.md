# Naming Convention Audit - KMU Reports

## Overview
Detailed analysis of naming convention misalignments between frontend and backend.

---

## Backend Naming Conventions (Snake Case)

### StudentReport Model
- `student_id` (ObjectId reference)
- `student_name`
- `student_email`
- `incident_date`
- `description`
- `offense_type`
- `severity`
- `status`
- `is_anonymous`
- `admin_comments`
- `assigned_case_id`
- `created_at`
- `updated_at`

### Case Model
- `student_id` / `student_ids` (single/multiple)
- `staff_id` / `staff_ids` (single/multiple)
- `incident_date`
- `description`
- `offense_type`
- `severity`
- `status`
- `sanctions`
- `attachments`
- `created_by`
- `case_type`
- `appealStatus` ⚠️ (CAMEL CASE - inconsistent)
- `appealReason` ⚠️ (CAMEL CASE - inconsistent)
- `appealDate` ⚠️ (CAMEL CASE - inconsistent)
- `appealDecision` ⚠️ (CAMEL CASE - inconsistent)
- `createdAt`
- `updatedAt`

---

## Frontend Naming Conventions (Camel Case)

### Student Dashboard Submission
Student reports are sent as:
```javascript
{
  incident_date,       // snake_case (CORRECT)
  offense_type,        // snake_case (CORRECT)
  severity,            // correct
  description,         // correct
  is_anonymous         // snake_case (CORRECT)
}
```

### Case Response Transformation
Backend transforms response to camelCase:
```javascript
incidentDate: cases[i].incident_date,
offenseType: cases[i].offense_type,
createdBy: cases[i].created_by,
createdAt: cases[i].createdAt,
updatedAt: cases[i].updatedAt
```

---

## Issues Found

### 1. **Appeal Fields - INCONSISTENT CASING** ❌
**Location**: `backend/models/case.js`
- `appealStatus` (should be `appeal_status`)
- `appealReason` (should be `appeal_reason`)
- `appealDate` (should be `appeal_date`)
- `appealDecision` (should be `appeal_decision`)

**Impact**: Breaks consistency with rest of Case model. Frontend expects camelCase transformation, but these fields won't be transformed consistently.

### 2. **Appeal Model Missing** ❌
- No `appeal.js` model file exists
- Appeals are stored as fields on Case model
- Should have dedicated Appeal model for proper separation

### 3. **Student Report Frontend vs Backend** ✅
**Status**: ALIGNED
- Frontend sends: `incident_date`, `offense_type`, `is_anonymous`
- Backend expects: `incident_date`, `offense_type`, `is_anonymous`

### 4. **Response Transformation Incomplete** ❌
Backend `casesController.js` transforms some fields but not all:
- ✅ `incident_date` → `incidentDate`
- ✅ `offense_type` → `offenseType`
- ❌ `appeal_status` → NOT transformed (field is camelCase in model)
- ❌ `appeal_reason` → NOT transformed
- ❌ `appeal_date` → NOT transformed
- ❌ `appeal_decision` → NOT transformed

---

## Recommendations

### Fix #1: Standardize Case Model Appeal Fields to snake_case
Change all appeal fields to use snake_case convention consistently:
```javascript
appeal_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: null }
appeal_reason: String
appeal_date: Date
appeal_decision: String
```

### Fix #2: Update Response Transformation
Add appeal field transformations to `casesController.js`:
```javascript
appealStatus: cases[i].appeal_status,
appealReason: cases[i].appeal_reason,
appealDate: cases[i].appeal_date,
appealDecision: cases[i].appeal_decision
```

### Fix #3: Create Dedicated Appeal Model (Optional but Recommended)
Instead of storing appeals on Case model:
```javascript
const appealSchema = {
  case_id,
  student_id,
  appeal_reason,
  appeal_status,
  appeal_date,
  appeal_decision,
  created_at,
  updated_at
}
```

### Fix #4: Maintain Student Report Consistency
Current implementation is correct - continue using snake_case for all new StudentReport fields.

---

## Summary Table

| Component | Issue | Severity | Status |
|-----------|-------|----------|--------|
| Case Model Appeal Fields | CamelCase in snake_case model | Medium | ❌ Not Fixed |
| Response Transformation | Incomplete appeal field transform | Medium | ❌ Not Fixed |
| Student Report API | Correctly uses snake_case | - | ✅ Aligned |
| Student Dashboard Form | Sends correct field names | - | ✅ Aligned |

