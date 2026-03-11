# UI/UX Improvements Guide

This document outlines all the new UI/UX components and improvements implemented in the KMU Reports application to enhance user experience, reduce confusion, and simplify the interface.

## New Components Created

### 1. **Breadcrumb** (`Breadcrumb.tsx`)
Navigation breadcrumbs showing the current page location within the app hierarchy.

**Usage:**
```tsx
import Breadcrumb from '@/components/Breadcrumb';

<Breadcrumb items={[
  { label: 'Dashboard', href: '/student-dashboard' },
  { label: 'Records' }
]} />
```

**Features:**
- Clean navigation hierarchy
- Links to parent pages
- Mobile-responsive
- Dark mode support

---

### 2. **StatusBadge** (`StatusBadge.tsx`)
Standardized status display component with predefined status types and color coding.

**Usage:**
```tsx
import StatusBadge from '@/components/StatusBadge';

<StatusBadge status="approved" />
<StatusBadge status="pending" />
<StatusBadge status="rejected" severity="high" />
```

**Supported Statuses:**
- `created`, `approved`, `rejected`, `pending`, `in_review`, `completed`, `resolved`, `denied`, `submitted`, `processing`

**Severity Levels:**
- `low`, `medium`, `high`, `critical`

**Features:**
- Consistent color coding across app
- Icon support
- Severity indicators
- Dark mode support

---

### 3. **EmptyState** (`EmptyState.tsx`)
Beautiful empty state component with customizable icons, titles, descriptions, and action buttons.

**Usage:**
```tsx
import EmptyState from '@/components/EmptyState';

<EmptyState
  icon={FileText}
  title="No Records Found"
  description="Start by creating a new report to get started"
/>
```

**Features:**
- Customizable icons
- Clear call-to-action text
- Guides user on what to do next
- Reduces user confusion on empty pages

---

### 4. **SkeletonLoader** (`SkeletonLoader.tsx`)
Five skeleton loading components for different content types.

**Components:**
- `SkeletonCard` - Single card placeholder
- `SkeletonTable` - Table rows placeholder
- `SkeletonStats` - Stats card placeholder
- `SkeletonDashboard` - Dashboard grid placeholder
- `SkeletonDetail` - Detail page placeholder

**Usage:**
```tsx
import { SkeletonDashboard, SkeletonTable } from '@/components/SkeletonLoader';

{isLoading ? <SkeletonDashboard /> : <Dashboard />}
{isLoading ? <SkeletonTable /> : <Table />}
```

**Features:**
- Smooth loading animations
- Pulse effect for perceived performance
- Matches actual content layout
- Reduces perceived load time

---

### 5. **SearchBar** (`SearchBar.tsx`)
Advanced search component with text search and collapsible filter options.

**Usage:**
```tsx
import SearchBar from '@/components/SearchBar';

<SearchBar
  placeholder="Search cases..."
  onSearch={(query) => handleSearch(query)}
  onFilter={(filters) => handleFilters(filters)}
  filterOptions={[
    { id: 'status', label: 'Status', options: ['Pending', 'Approved'] }
  ]}
/>
```

**Features:**
- Text search input
- Collapsible advanced filters
- Clear/reset functionality
- Dark mode support
- Responsive design

---

### 6. **ConfirmationDialog** (`ConfirmationDialog.tsx`)
Modal confirmation dialog for destructive actions.

**Usage:**
```tsx
import ConfirmationDialog from '@/components/ConfirmationDialog';

<ConfirmationDialog
  isOpen={showDialog}
  title="Delete Record?"
  description="This action cannot be undone"
  onConfirm={handleDelete}
  onCancel={handleCancel}
  variant="danger"
/>
```

**Variants:**
- `danger` - Red, for destructive actions
- `warning` - Amber, for important confirmations
- `success` - Green, for positive actions
- `default` - Green (brand color), for standard confirmations

**Features:**
- Type-safe variant system
- Loading state support
- Icon-based visual hierarchy
- Accessible button states

---

### 7. **ActivityTimeline** (`ActivityTimeline.tsx`)
Visual timeline showing activity history and audit trail.

**Usage:**
```tsx
import ActivityTimeline, { Activity } from '@/components/ActivityTimeline';

const activities: Activity[] = [
  {
    id: '1',
    type: 'created',
    title: 'Report filed',
    description: 'Incident report submitted',
    user: 'John Doe',
    timestamp: new Date(),
  },
  {
    id: '2',
    type: 'approved',
    title: 'Case approved',
    user: 'Admin',
    timestamp: new Date(),
  }
];

<ActivityTimeline activities={activities} />
```

**Activity Types:**
- `created` - Item created
- `approved` - Item approved
- `rejected` - Item rejected
- `updated` - Item updated
- `changed` - Status changed
- `commented` - Comment added

**Features:**
- Color-coded activity types
- Relative timestamps
- User attribution
- Metadata display
- Loading skeleton support

---

### 8. **Tooltip** (`Tooltip.tsx`)
Contextual help tooltips for form fields and UI elements.

**Usage:**
```tsx
import Tooltip from '@/components/Tooltip';

<Tooltip content="Enter the incident date in MM/DD/YYYY format">
  <input type="date" />
</Tooltip>

// Or with custom children
<Tooltip content="Help information" position="top">
  <HelpCircle className="w-4 h-4" />
</Tooltip>
```

**Positions:**
- `top` (default)
- `bottom`
- `left`
- `right`

**Features:**
- Hover-activated tooltips
- Multiple position options
- Help icon by default
- Dark mode support

---

### 9. **NotificationCenter** (`NotificationCenter.tsx`)
Notification bell with dropdown showing recent notifications.

**Usage:**
```tsx
import NotificationCenter from '@/components/NotificationCenter';

const [notifications, setNotifications] = useState<Notification[]>([]);

<NotificationCenter
  notifications={notifications}
  onMarkAsRead={(id) => markAsRead(id)}
  onDismiss={(id) => dismissNotification(id)}
  onMarkAllAsRead={() => markAllAsRead()}
/>
```

**Notification Types:**
- `success` - Green
- `warning` - Amber
- `error` - Red
- `info` - Blue

**Features:**
- Bell icon with unread count badge
- Dropdown panel with all notifications
- Mark as read functionality
- Dismiss/archive individual notifications
- Unread count indicator
- Responsive to mobile

---

### 10. **BulkActions** (`BulkActions.tsx`)
Sticky action bar for bulk operations on multiple items.

**Usage:**
```tsx
import BulkActions from '@/components/BulkActions';

const [selected, setSelected] = useState<string[]>([]);

<BulkActions
  selectedCount={selected.length}
  actions={[
    {
      id: 'approve',
      label: 'Approve',
      variant: 'success',
      onAction: () => approveSelected(selected),
    },
    {
      id: 'reject',
      label: 'Reject',
      variant: 'danger',
      onAction: () => rejectSelected(selected),
      confirmMessage: 'Reject selected items?',
    }
  ]}
  onClear={() => setSelected([])}
/>
```

**Features:**
- Sticky positioning on mobile
- Floating bar on desktop
- Multiple action buttons
- Confirmation dialogs for destructive actions
- Loading states
- Clear selection functionality

---

### 11. **MetricsCard** (`MetricsCard.tsx`)
Dashboard metric card with trend indicators.

**Usage:**
```tsx
import MetricsCard from '@/components/MetricsCard';

<MetricsCard
  label="Cases Resolved"
  value={42}
  trend={{
    value: 15,
    direction: 'up',
    period: 'last month'
  }}
  icon={<CheckCircle2 />}
  color="green"
  onClick={() => navigate('/cases')}
/>
```

**Colors:**
- `kmuGreen` (default)
- `red`
- `blue`
- `amber`
- `purple`

**Trend Directions:**
- `up` - Positive trend (green)
- `down` - Negative trend (red)
- `neutral` - No change (gray)

**Features:**
- Trend indicators with percentage
- Color-coded metrics
- Clickable cards
- Period comparison
- Icon support

---

## Integration Examples

### Adding Breadcrumbs to a Page
```tsx
import Breadcrumb from '@/components/Breadcrumb';

export default function RecordsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/student-dashboard' },
        { label: 'Records' }
      ]} />
      {/* Page content */}
    </>
  );
}
```

### Using Status Badges in Tables
```tsx
import StatusBadge from '@/components/StatusBadge';

export default function CasesTable({ cases }) {
  return (
    <table>
      <tbody>
        {cases.map(c => (
          <tr key={c.id}>
            <td>{c.title}</td>
            <td>
              <StatusBadge status={c.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Implementing Skeleton Loading
```tsx
import { SkeletonTable } from '@/components/SkeletonLoader';

export default function DataPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);

  return loading ? <SkeletonTable /> : <DataTable data={data} />;
}
```

### Adding Form Field Help
```tsx
import Tooltip from '@/components/Tooltip';

<div className="flex items-center gap-2">
  <label>Incident Date</label>
  <Tooltip content="Enter the date when the incident occurred" position="top" />
  <input type="date" />
</div>
```

### Using Activity Timeline
```tsx
import ActivityTimeline from '@/components/ActivityTimeline';

export default function CaseDetail({ caseId }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchCaseActivities(caseId).then(setActivities);
  }, [caseId]);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">{/* Case details */}</div>
      <div>{/* Sidebar */}
        <h3>Activity</h3>
        <ActivityTimeline activities={activities} />
      </div>
    </div>
  );
}
```

---

## Best Practices

### 1. Skeleton Loading
- Always show skeleton loaders while fetching data
- Match skeleton layout to actual content
- Use 2-3 second duration animations

### 2. Status Badges
- Use consistent status values across the app
- Match colors to user expectations (green = good, red = bad)
- Include severity levels for important statuses

### 3. Empty States
- Never show blank screens
- Always provide guidance on what to do next
- Include a clear call-to-action button

### 4. Breadcrumbs
- Include on all non-root pages
- Always include the current page as the final item
- Make parent items clickable

### 5. Confirmations
- Always confirm destructive actions
- Use appropriate variant (danger for delete, warning for important)
- Provide clear description of what will happen

### 6. Activity Timeline
- Show recent actions first
- Include user attribution
- Use relative timestamps
- Limit to 5-10 recent activities per page

### 7. Tooltips
- Use for complex form fields
- Keep content under 100 characters
- Position to avoid covering important UI
- Use help icons consistently

---

## Color System

All components use the existing KMU color system:

- **Primary**: `kmuGreen` (#10B981 or similar)
- **Secondary**: `kmuOrange` (for accents)
- **Status Colors**:
  - Success: Green
  - Warning: Amber
  - Error: Red
  - Info: Blue
- **Neutrals**: Gray-50 to Gray-950 (light to dark)

---

## Accessibility Features

All components include:
- Proper ARIA labels
- Keyboard navigation support
- High contrast in dark mode
- Focus indicators
- Screen reader support
- Semantic HTML

---

## Dark Mode Support

All components fully support dark mode with:
- Dark backgrounds
- Adjusted text colors
- Darker border colors
- Preserved contrast ratios

---

## Mobile Responsiveness

All components are mobile-first with:
- Touch-friendly targets (48px minimum)
- Responsive padding and spacing
- Hidden elements on small screens
- Optimized layouts for mobile
- Safe area support for notched devices

---

## Performance Considerations

- Skeleton loaders reduce perceived load time
- Lazy loading for tooltips (only show on hover)
- Memoized components to prevent unnecessary re-renders
- Efficient state management
- No blocking animations

---

## Future Enhancements

- [ ] Keyboard shortcuts for bulk actions
- [ ] Custom notification sounds
- [ ] Export activity timeline as PDF
- [ ] Advanced filtering UI
- [ ] Search history and saved filters
- [ ] Activity timeline filtering
- [ ] Notification preferences/settings
- [ ] Animated transitions between states
