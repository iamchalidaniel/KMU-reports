// Simple, user-friendly language used throughout the app
export const LANGUAGE = {
  // Buttons
  BUTTONS: {
    SAVE: 'Save',
    CANCEL: 'Cancel',
    DELETE: 'Delete',
    CONFIRM: 'Confirm',
    CLOSE: 'Close',
    NEXT: 'Next',
    BACK: 'Back',
    VIEW: 'View',
    EDIT: 'Edit',
    ADD: 'Add',
    NEW: 'New',
    SUBMIT: 'Submit',
    APPROVE: 'Approve',
    REJECT: 'Reject',
    DOWNLOAD: 'Download',
    UPLOAD: 'Upload',
    SEARCH: 'Search',
  },

  // Navigation
  NAV: {
    DASHBOARD: 'Dashboard',
    HOME: 'Home',
    PROFILE: 'Profile',
    SETTINGS: 'Settings',
    LOGOUT: 'Log Out',
    LOGIN: 'Log In',
    HELP: 'Help',
  },

  // Status Messages
  STATUS: {
    PENDING: 'Waiting for review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Done',
    OPEN: 'Active',
    CLOSED: 'Closed',
  },

  // Feedback Messages
  MESSAGES: {
    SUCCESS: 'Done!',
    ERROR: 'Something went wrong',
    LOADING: 'Loading...',
    EMPTY: 'Nothing here yet',
    SAVED: 'Saved successfully',
    DELETED: 'Deleted',
    CREATED: 'Created',
    UPDATED: 'Updated',
  },

  // Form Labels
  FORM: {
    REQUIRED: 'Required',
    OPTIONAL: 'Optional',
    ENTER_VALUE: 'Enter value',
    SELECT: 'Select',
    CHOOSE: 'Choose',
    DATE: 'Date',
    TIME: 'Time',
    EMAIL: 'Email',
    NAME: 'Name',
    DESCRIPTION: 'Description',
  },

  // Dialogs & Confirmations
  DIALOGS: {
    CONFIRM_DELETE: 'Are you sure? This can\'t be undone.',
    CONFIRM_ACTION: 'Are you sure?',
    SUCCESS_TITLE: 'Done!',
    ERROR_TITLE: 'Oops',
  },

  // Student-Specific
  STUDENT: {
    REPORT_ISSUE: 'Report Issue',
    REQUEST_FIX: 'Request Fix',
    MY_CASES: 'My Cases',
    MY_REPORTS: 'My Reports',
    WAITING: 'Waiting',
  },

  // Status-Specific
  STATUSES: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    UNDER_REVIEW: 'Under Review',
  },
};

// Helper function to format status as user-friendly text
export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    'Pending': 'Waiting for review',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'In Progress': 'In progress',
    'Completed': 'Done',
    'Open': 'Active',
    'Closed': 'Closed',
    'Resolved': 'Done',
    'Denied': 'Denied',
  };
  return map[status] || status;
}

// Helper for empty state messages
export function getEmptyStateMessage(type: string): { title: string; description: string } {
  const messages: Record<string, { title: string; description: string }> = {
    cases: {
      title: 'No cases yet',
      description: 'If you have an issue, use the button above to report it.',
    },
    reports: {
      title: 'No reports yet',
      description: 'When you report something, it will show up here.',
    },
    appeals: {
      title: 'No appeals',
      description: 'You can appeal a decision if you disagree with it.',
    },
    students: {
      title: 'No students',
      description: 'Students will show up here when they register.',
    },
    cases_admin: {
      title: 'No cases',
      description: 'New cases will appear here as they\'re created.',
    },
  };
  return messages[type] || { title: 'Nothing here', description: 'Try checking back later.' };
}
