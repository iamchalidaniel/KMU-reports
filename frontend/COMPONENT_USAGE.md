# Component Usage Quick Reference

## Breadcrumb
```tsx
<Breadcrumb items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Records' }
]} />
```

## StatusBadge
```tsx
<StatusBadge status="approved" />
<StatusBadge status="pending" severity="high" />
```
Supported statuses: created, approved, rejected, pending, in_review, completed, resolved, denied, submitted, processing

## EmptyState
```tsx
<EmptyState
  icon={FileText}
  title="No Records"
  description="Create your first record to get started"
/>
```

## SkeletonLoader
```tsx
import { SkeletonTable, SkeletonDashboard } from '@/components/SkeletonLoader';
{isLoading ? <SkeletonTable /> : <Table />}
```

## SearchBar
```tsx
<SearchBar
  placeholder="Search..."
  onSearch={handleSearch}
  filterOptions={[...]}
/>
```

## ConfirmationDialog
```tsx
<ConfirmationDialog
  isOpen={open}
  title="Delete?"
  description="This cannot be undone"
  onConfirm={handleDelete}
  onCancel={handleCancel}
  variant="danger"
/>
```

## ActivityTimeline
```tsx
<ActivityTimeline
  activities={[
    {
      id: '1',
      type: 'created',
      title: 'Report filed',
      user: 'John',
      timestamp: new Date(),
    }
  ]}
/>
```

## Tooltip
```tsx
<Tooltip content="Help text" position="top">
  <input />
</Tooltip>
```

## NotificationCenter
```tsx
<NotificationCenter
  notifications={notifications}
  onMarkAsRead={handleRead}
  onDismiss={handleDismiss}
/>
```

## BulkActions
```tsx
<BulkActions
  selectedCount={selected.length}
  actions={[
    {
      id: 'approve',
      label: 'Approve',
      variant: 'success',
      onAction: handleApprove,
    }
  ]}
  onClear={() => setSelected([])}
/>
```

## MetricsCard
```tsx
<MetricsCard
  label="Cases Resolved"
  value={42}
  trend={{
    value: 15,
    direction: 'up',
    period: 'last month'
  }}
/>
```
