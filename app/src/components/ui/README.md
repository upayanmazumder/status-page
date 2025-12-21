# UI Component Library

A comprehensive, modular UI component library built with React, TypeScript, Tailwind CSS, and Framer Motion. Designed for the Status Page application with a focus on consistency, accessibility, and smooth animations.

## Components

### Core Components

#### Button

A versatile button component with multiple variants, sizes, and states.

**Props:**

- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean

**Example:**

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" leftIcon={<Icon />}>
  Click Me
</Button>

<Button variant="danger" isLoading>
  Loading...
</Button>
```

#### Input

Styled input field with error handling and icon support.

**Props:**

- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean

**Example:**

```tsx
import { Input } from '@/components/ui';
import { FaEnvelope } from 'react-icons/fa';

<Input
  type="email"
  placeholder="Enter email"
  leftIcon={<FaEnvelope />}
  error={errors.email}
  helperText="We'll never share your email"
/>;
```

#### Card

Flexible card container with variants and customizable padding.

**Props:**

- `variant`: 'default' | 'bordered' | 'elevated'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hoverable`: boolean

**Example:**

```tsx
import { Card } from '@/components/ui';

<Card variant="bordered" padding="lg" hoverable>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>;
```

#### Textarea

Multi-line text input with the same features as Input.

**Props:**

- `error`: string
- `helperText`: string
- `fullWidth`: boolean
- `resize`: 'none' | 'vertical' | 'horizontal' | 'both'

**Example:**

```tsx
import { Textarea } from '@/components/ui';

<Textarea placeholder="Enter description" rows={4} resize="vertical" error={errors.description} />;
```

### Form Components

#### Label

Form label with optional required indicator and icon.

**Props:**

- `required`: boolean
- `icon`: ReactNode

**Example:**

```tsx
import { Label } from '@/components/ui';

<Label htmlFor="email" required icon={<EmailIcon />}>
  Email Address
</Label>;
```

#### FormField

Complete form field combining Label and Input.

**Props:**

- All Input props
- `label`: string
- `labelIcon`: ReactNode
- `required`: boolean

**Example:**

```tsx
import { FormField } from '@/components/ui';

<FormField
  label="Email Address"
  required
  labelIcon={<EmailIcon />}
  type="email"
  value={email}
  onChange={e => setEmail(e.target.value)}
  error={errors.email}
  helperText="We'll send verification to this email"
/>;
```

### Layout Components

#### Modal

Accessible modal dialog with backdrop and animations.

**Props:**

- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showCloseButton`: boolean (default: true)
- `closeOnOverlayClick`: boolean (default: true)

**Example:**

```tsx
import { Modal, Button } from '@/components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action" size="md">
  <p>Are you sure you want to proceed?</p>
  <div className="flex gap-3 mt-4">
    <Button onClick={handleConfirm}>Confirm</Button>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
  </div>
</Modal>;
```

#### Container

Responsive container with max-width control.

**Props:**

- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `centerContent`: boolean

**Example:**

```tsx
import { Container } from '@/components/ui';

<Container size="lg">
  <h1>Page Content</h1>
</Container>;
```

### Feedback Components

#### Badge

Small label for statuses, tags, or counts.

**Props:**

- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
- `size`: 'sm' | 'md' | 'lg'
- `dot`: boolean

**Example:**

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" dot>
  Active
</Badge>

<Badge variant="danger" size="sm">
  Error
</Badge>
```

#### StatusIndicator

Visual indicator for system/application status.

**Props:**

- `status`: 'online' | 'offline' | 'unknown' | 'warning'
- `showLabel`: boolean (default: true)
- `size`: 'sm' | 'md' | 'lg'
- `pulse`: boolean

**Example:**

```tsx
import { StatusIndicator } from '@/components/ui';

<StatusIndicator status="online" pulse />
<StatusIndicator status="offline" showLabel={false} size="sm" />
```

#### Spinner

Loading spinner with size and color variants.

**Props:**

- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'primary' | 'white' | 'gray'

**Example:**

```tsx
import { Spinner } from '@/components/ui';

<Spinner size="lg" color="primary" />;
```

## Design System

### Color Palette

- **Primary**: Blue gradient (blue-600 to blue-700)
- **Secondary**: Gray (gray-800/gray-700)
- **Success**: Green gradient (green-600 to green-700)
- **Danger**: Red gradient (red-600 to red-700)
- **Warning**: Yellow (yellow-600)
- **Info**: Cyan (cyan-600)

### Typography

- Base font: Montserrat/RedHatDisplay
- Headings: Bold, gradient text for emphasis
- Body: Regular weight, good line-height for readability

### Spacing

- Consistent padding: 'sm' (1rem), 'md' (1.5rem), 'lg' (2rem)
- Gap spacing: 0.5rem, 0.75rem, 1rem, 1.5rem

### Animations

Minimal, purposeful animations using Framer Motion:

- **Scale**: Subtle 1.02x on hover for interactive elements
- **Fade**: Opacity transitions for modals and notifications
- **Slide**: Smooth y-axis movement for entries/exits
- Duration: 0.2s - 0.3s for responsiveness

## Best Practices

### 1. Composition

Combine components to create complex UIs:

```tsx
<Card variant="bordered" padding="lg">
  <FormField label="Email" type="email" required error={errors.email} />
  <Button fullWidth isLoading={submitting}>
    Submit
  </Button>
</Card>
```

### 2. Consistency

Always use the UI library components instead of custom buttons/inputs for:

- Visual consistency across the application
- Reduced code duplication
- Centralized updates and bug fixes

### 3. Accessibility

- All interactive elements have focus states
- Modals trap focus and support ESC key
- Labels are properly associated with inputs
- Color contrast meets WCAG AA standards

### 4. Responsive Design

- Components adapt to screen sizes
- Touch-friendly targets (min 44x44px)
- Mobile-first approach

## Migration Guide

To migrate existing components:

### Before:

```tsx
<button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Click Me</button>
```

### After:

```tsx
<Button variant="primary">Click Me</Button>
```

### Before:

```tsx
<input className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg" type="email" />;
{
  error && <p className="text-red-400">{error}</p>;
}
```

### After:

```tsx
<Input type="email" error={error} />
```

## Future Enhancements

- [ ] Select/Dropdown component
- [ ] Checkbox and Radio components
- [ ] Toast notification system
- [ ] Tooltip component
- [ ] Progress bar
- [ ] Skeleton loaders
- [ ] Accordion component
- [ ] Tabs component
