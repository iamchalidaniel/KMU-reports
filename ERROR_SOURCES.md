# Potential Error Sources in KMU Reports

## 1. Case Model Status Enum Issue
**Problem**: Case model doesn't define a status enum
- StudentReport has: `['Pending', 'Reviewed', 'Approved', 'Rejected', 'Converted']`
- Case model has: No enum constraint on `status` field
- Frontend sends: 'Pending', 'Open', 'Closed', 'In Appeal', etc.
**Impact**: Invalid status values can be saved to Case documents without validation
**Fix**: Add status enum to Case model matching StudentReport or establish shared enum

## 2. Case Model MySQL Code Still Referenced
**Problem**: Case model references `dbType === 'mysql'` but backend only uses MongoDB
- Lines 30-32 in case.js check for MySQL but it's never used
- Controllers were cleaned of MySQL code but model still has it
**Impact**: Confusing codebase, potential future bugs if someone extends it
**Fix**: Remove MySQL conditional logic from case.js

## 3. Missing Input Validation
**Problem**: No validation for case creation fields
- StudentReport validates only `description` (line 70-71)
- Doesn't validate `incident_date`, `offense_type`, `severity` format/enum
- Case creation has no schema validation
**Impact**: Invalid data can be stored (e.g., wrong severity values)
**Fix**: Add input validation middleware or schema validation

## 4. Missing Required Fields in Frontend API Calls
**Problem**: Frontend doesn't always send required backend fields
- Case creation may not validate all required fields
- Appeal submission missing error handling for missing fields
**Impact**: 400 errors from backend if required fields are missing
**Fix**: Add frontend form validation that matches backend schema

## 5. Appeal Status Enum Values Don't Match Case Model
**Problem**: Case model has `appeal_status: ['pending', 'approved', 'rejected']` (lowercase)
- Frontend might send 'Pending', 'Approved', 'Rejected' (capitalized)
**Impact**: Appeal status updates fail validation
**Fix**: Standardize to one case convention throughout

## 6. Missing Null/Undefined Checks
**Problem**: Controller doesn't check if student_id exists on req.user
- Line 75: `student_id: req.user._id` - assumes _id exists
- Line 76: `req.user.fullName` - assumes fullName exists
**Impact**: TypeError if user object structure changes or is incomplete
**Fix**: Add validation checks: `if (!req.user?._id)` before using

## 7. No Population of Referenced Documents
**Problem**: Case model references StudentReport with `ref: 'Case'` but never populates
- `assigned_case_id` is stored but frontend doesn't populate it
- Admin can't easily see which StudentReport created which Case
**Impact**: Orphaned data, difficult troubleshooting
**Fix**: Add `.populate()` calls when fetching records

## 8. Convert Report to Case Missing
**Problem**: Frontend calls `/student-reports/:id/convert-to-case` endpoint (line 155)
- This endpoint doesn't exist in studentReports.js routes
**Impact**: 404 errors when admin tries to convert report to case
**Fix**: Add `convert-to-case` endpoint to studentReports.js controller

## 9. Appeals Controller Missing
**Problem**: Appeals route file created but controller doesn't exist
- `/api/appeals` route registered (app.js line 46)
- But `/appeal.js` controller or `/appeals.js` controller doesn't exist
**Impact**: 500 errors when appeals routes are called
**Fix**: Create appeals controller with proper error handling

## 10. Missing Authorization Checks in Some Endpoints
**Problem**: Student reports route allows all authenticated users to list reports
- Students could potentially see other students' reports
**Impact**: Data privacy breach
**Fix**: Add `is_anonymous` check and filter by student_id for student role

## 11. Case Type Enum Not Used
**Problem**: Case model defines `case_type` enum but it's never validated/used
- Frontend doesn't send case_type when creating cases
**Impact**: Invalid case_type values or always defaults to 'single_student'
**Fix**: Ensure frontend always sends valid case_type

## 12. Missing Response Field Transformations in Appeals
**Problem**: Appeals controller (if it exists) might not transform snake_case to camelCase
- Backend stores as `appeal_status`, `appeal_date`, etc.
- Frontend expects `appealStatus`, `appealDate`, etc.
**Impact**: Appeals data displays incorrectly in frontend
**Fix**: Add response transformation in appeals controller

## 13. Async/Await Error Handling Gaps
**Problem**: Some endpoints might not handle all async errors
- No timeout handling for long-running operations
- No graceful degradation if database is slow
**Impact**: Requests hang or timeout silently
**Fix**: Add timeout middleware and better error messages

## 14. Missing CORS Headers
**Problem**: If frontend and backend on different domains, might have CORS issues
- No explicit CORS configuration visible
**Impact**: Frontend API calls fail with CORS errors
**Fix**: Add CORS middleware if on different domains

## 15. Status Filter Values Mismatch
**Problem**: Admin reports page filter shows: 'Pending', 'Reviewed', 'Approved', 'Rejected', 'Converted'
- But StudentReport status enum is: `['Pending', 'Reviewed', 'Approved', 'Rejected', 'Converted']` ✓ CORRECT
- Case status has no enum, so any value could exist
**Impact**: Filtering might not work for Case records
**Fix**: Add status enum to Case model

## 16. Missing Pagination Validation
**Problem**: Frontend sends `page` and `limit` without validation
- Backend doesn't validate `limit > 0` or `page > 0`
**Impact**: Negative values could cause unexpected behavior
**Fix**: Add validation: `limit = Math.max(1, limit)`, `page = Math.max(1, page)`

## 17. Anonymous Report Handling Gap
**Problem**: When `is_anonymous: true`, student_name is set to 'Anonymous' but student_id still stored
- Admin can still trace who submitted via student_id
- Might violate anonymity expectations
**Impact**: Whistleblowers could be identified
**Fix**: If true anonymity needed, don't store student_id or use separate anonymous_reports table

## Summary of Critical Fixes Needed:
1. **Convert-to-case endpoint** - Missing implementation
2. **Appeals controller** - Missing implementation  
3. **Case status enum** - Add to model
4. **Appeal status case matching** - Fix camelCase/snake_case
5. **Input validation** - Add proper validation
6. **Authorization checks** - Prevent cross-student data access
7. **Response transformations** - Ensure all controllers transform data consistently
