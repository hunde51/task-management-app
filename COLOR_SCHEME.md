# Color Scheme Reference

## Light Mode

### Primary Colors
- **Primary**: `#0ea5e9` (Cyan 500) - Main brand color, buttons, links
- **Primary Deep**: `#0284c7` (Cyan 600) - Hover states, emphasis
- **Primary Light**: `#38bdf8` (Cyan 400) - Accents, highlights

### Accent Colors
- **Accent**: `#8b5cf6` (Purple 500) - Secondary actions, gradients
- **Accent Light**: `#a78bfa` (Purple 400) - Subtle accents

### Semantic Colors
- **Success**: `#10b981` (Emerald 500) - Completed tasks, positive actions
- **Warning**: `#f59e0b` (Amber 500) - Warnings, pending states
- **Danger**: `#ef4444` (Red 500) - Errors, destructive actions, overdue

### Background Colors
- **BG Primary**: `#ffffff` - Main content background
- **BG Secondary**: `#f8fafc` (Slate 50) - Secondary surfaces
- **BG Tertiary**: `#f1f5f9` (Slate 100) - Tertiary surfaces

### Text Colors
- **Text Primary**: `#0f172a` (Slate 900) - Headings, primary text
- **Text Secondary**: `#475569` (Slate 600) - Body text
- **Text Tertiary**: `#64748b` (Slate 500) - Muted text, labels

### Border Colors
- **Border**: `#e2e8f0` (Slate 200) - Default borders
- **Border Light**: `#f1f5f9` (Slate 100) - Subtle dividers

---

## Dark Mode

### Primary Colors
- **Primary**: `#38bdf8` (Cyan 400) - Brighter for dark backgrounds
- **Primary Deep**: `#0ea5e9` (Cyan 500) - Hover states
- **Primary Light**: `#7dd3fc` (Cyan 300) - Highlights

### Accent Colors
- **Accent**: `#a78bfa` (Purple 400) - Brighter for visibility
- **Accent Light**: `#c4b5fd` (Purple 300) - Subtle accents

### Background Colors
- **BG Primary**: `#0f172a` (Slate 900) - Main background
- **BG Secondary**: `#1e293b` (Slate 800) - Cards, surfaces
- **BG Tertiary**: `#334155` (Slate 700) - Elevated surfaces

### Text Colors
- **Text Primary**: `#f1f5f9` (Slate 100) - Headings, primary text
- **Text Secondary**: `#cbd5e1` (Slate 300) - Body text
- **Text Tertiary**: `#94a3b8` (Slate 400) - Muted text

### Border Colors
- **Border**: `#334155` (Slate 700) - Default borders
- **Border Light**: `#1e293b` (Slate 800) - Subtle dividers

---

## Gradient Examples

### Light Mode Gradients
```css
/* Hero Background */
background: 
  radial-gradient(ellipse at 20% 10%, rgba(14, 165, 233, 0.12), transparent 50%),
  radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.1), transparent 50%),
  linear-gradient(180deg, #f8fafc 0%, #e0f2fe 50%, #f1f5f9 100%);

/* Primary Button */
background: linear-gradient(135deg, #0ea5e9, #0284c7);

/* Card Hover */
background: linear-gradient(135deg, rgba(224, 242, 254, 0.6), rgba(255, 255, 255, 0.8));
```

### Dark Mode Gradients
```css
/* Hero Background */
background: 
  radial-gradient(ellipse at 20% 10%, rgba(56, 189, 248, 0.15), transparent 50%),
  radial-gradient(ellipse at 80% 80%, rgba(167, 139, 250, 0.12), transparent 50%),
  linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);

/* Card Background */
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(24px);
```

---

## Status Colors

### Task Status
- **Todo**: Slate gray - `#94a3b8` / `#475569`
- **In Progress**: Cyan - `#0ea5e9` / `#38bdf8`
- **Done**: Emerald - `#10b981` / `#86efac`
- **Overdue**: Red - `#ef4444` / `#fca5a5`

### Role Badges
- **Owner**: Orange - `#f97316` with warm background
- **Member**: Blue - `#3b82f6` with cool background
- **Neutral**: Slate - `#64748b` with gray background

---

## Usage Guidelines

### When to Use Primary (Cyan)
- Primary action buttons
- Active navigation items
- Links and interactive elements
- Progress indicators
- Focus states

### When to Use Accent (Purple)
- Secondary actions
- Decorative gradients
- Hover state accents
- Badge highlights
- Special features

### When to Use Semantic Colors
- **Success (Green)**: Completed tasks, success messages, positive confirmations
- **Warning (Amber)**: Warnings, pending states, attention needed
- **Danger (Red)**: Errors, destructive actions, overdue tasks, critical alerts

### Contrast Requirements
- **Text on Light BG**: Use Text Primary (#0f172a) for 21:1 contrast
- **Text on Dark BG**: Use Text Primary (#f1f5f9) for 18:1 contrast
- **Interactive Elements**: Minimum 3:1 contrast with background
- **Focus Indicators**: 4px ring with 10% opacity of primary color

---

## Implementation

### CSS Variable Usage
```css
/* Always use variables, never hardcoded colors */
.my-component {
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
}

/* Theme-specific overrides */
[data-theme="dark"] .my-component {
  /* Variables automatically update */
}
```

### Gradient Patterns
```css
/* Subtle background gradient */
background: linear-gradient(135deg, var(--color-bg-primary), var(--color-bg-secondary));

/* Button gradient */
background: linear-gradient(135deg, var(--color-primary), var(--color-primary-deep));

/* Card with radial accent */
background: 
  radial-gradient(circle at 100% 0%, rgba(14, 165, 233, 0.08), transparent 50%),
  var(--color-bg-primary);
```
