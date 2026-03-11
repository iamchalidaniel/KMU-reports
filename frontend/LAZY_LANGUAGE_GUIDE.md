# Lazy Language Guide

This document outlines the simple, user-friendly language used throughout the KMU Reports application.

## What is Lazy Language?

Lazy language is plain, simple language that everyone can understand. It avoids:
- Technical jargon
- Complex formal terms
- Confusing abbreviations
- Unnecessarily long phrases

## Examples of Lazy Language Applied

### Navigation & Tabs

| Before | After | Why |
|--------|-------|-----|
| "Administrator Dashboard" | "Dashboard" | Shorter, same meaning |
| "Behavioral Ledger" | "Cases" | More intuitive |
| "Student Registry" | "Students" | Simpler |
| "Maintenance Ledger" | "Maintenance" | Clearer |
| "Technical Hub" | "Dashboard" | Less pretentious |
| "Command Center" | "Dashboard" | More straightforward |
| "Statements" | "My Reports" | More personal |
| "Appeals" | "Waiting" | More descriptive |

### Status Messages

| Before | After | Why |
|--------|-------|-----|
| "Pending" | "Waiting" | More human |
| "In Progress" | "In Progress" | Kept (clear enough) |
| "Resolved" | "Done" | More casual, friendly |
| "Completed" | "Done" | Simpler |
| "Escalated" | "Urgent" | Clearer intent |
| "In Review" | "Under Review" | More natural |
| "Open" | "Active" | Better describes current state |
| "Dismissed" | "Closed" | Standard term |
| "Critical" | "Urgent" | Less technical |
| "High" | "Important" | More intuitive |
| "Medium" | "Normal" | Easier to understand |
| "Low" | "Minor" | Friendlier |

### Dashboard Copy

| Before | After | Why |
|--------|-------|-----|
| "appeal(s) pending review" | "appeal(s) waiting for review" | More conversational |
| "case(s) in progress" | "active case(s)" | Clearer |
| "Report Incident" | "Report Issue" | Less formal |
| "Log a security matter" | "Tell us what happened" | Empathetic |
| "Request Repair" | "Request Fix" | Simpler |
| "Maintenance & facilities" | "Broken or damaged item" | More specific |
| "Student Status" | "Your Status" | More personal |
| "You're all set" | "Great news!" | More positive |
| "No statements, cases, or appeals on record" | "You don't have any records yet" | Easier to parse |

### Action Labels

| Before | After | Why |
|--------|-------|-----|
| "View records" | "See all" | Shorter, same meaning |
| "My Records" | "My Records" | Kept (good as is) |

## Key Principles for Lazy Language

1. **Use "You/Your"** - "Your Status" not "Student Status"
2. **Use Active Voice** - "You have 2 cases" not "2 cases are assigned"
3. **Use Short Words** - "Done" not "Completed", "Fix" not "Repair"
4. **Use Positive Framing** - "Great news!" not "Nothing here"
5. **Be Conversational** - "Tell us what happened" not "Log a security matter"
6. **Be Specific** - "Waiting for review" not just "Pending"
7. **Avoid Jargon** - "Under Review" not "In Progress Review State"

## Language Constants

See `/frontend/src/constants/language.ts` for centralized language definitions that can be reused across the app.

## Implementation

When adding new copy:

1. Ask yourself: "Would my grandma understand this?"
2. Use simple words (max 1-2 syllables when possible)
3. Keep sentences short
4. Use "I/you" language
5. Be positive and encouraging

## Status Code Map

The `formatStatus()` helper in `language.ts` automatically converts backend status values to user-friendly labels. When adding new statuses, add them to both the `STATUS_CONFIG` in StatusBadge and the language constants.
