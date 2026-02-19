# Theme Toggle Usage Guide

## Overview
The application now supports both light and dark modes with automatic detection and persistent storage.

## Features

### 1. **Automatic Theme Detection**
- Detects system preference on first visit
- Uses `prefers-color-scheme` media query
- Respects user's OS/browser settings

### 2. **Manual Toggle**
- Theme toggle button in sidebar footer
- Sun icon for light mode
- Moon icon for dark mode
- Smooth icon rotation on hover

### 3. **Persistent Storage**
- Theme choice saved to localStorage
- Persists across browser sessions
- Overrides system preference after manual selection

### 4. **Smooth Transitions**
- Instant theme switching (no page reload)
- CSS transitions for color changes
- No flash of unstyled content

## User Flow

```
First Visit
├─ Check localStorage for saved theme
├─ If not found, check system preference
├─ Apply detected theme
└─ Set data-theme attribute on <html>

Manual Toggle
├─ User clicks theme toggle button
├─ Switch theme (light ↔ dark)
├─ Update data-theme attribute
├─ Save to localStorage
└─ Apply CSS transitions
```

## Implementation Details

### Component Location
```
src/components/ui/ThemeToggle.tsx
```

### Integration
```tsx
// In Sidebar.tsx
import ThemeToggle from "../ui/ThemeToggle";

<div className="layout-sidebar-footer">
  <ThemeToggle />
  {/* other footer content */}
</div>
```

### How It Works

#### 1. Initial Load
```typescript
useEffect(() => {
  // Check saved preference
  const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
  
  // Check system preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  // Determine initial theme
  const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
  
  // Apply theme
  setTheme(initialTheme);
  document.documentElement.setAttribute("data-theme", initialTheme);
}, []);
```

#### 2. Toggle Action
```typescript
const toggleTheme = () => {
  const newTheme = theme === "light" ? "dark" : "light";
  setTheme(newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
};
```

#### 3. CSS Application
```css
/* Default (light mode) */
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #0f172a;
}

/* Dark mode override */
[data-theme="dark"] {
  --color-bg-primary: #0f172a;
  --color-text-primary: #f1f5f9;
}

/* Smooth transitions */
body {
  transition: background 0.3s ease, color 0.3s ease;
}
```

## Styling the Toggle Button

### CSS Classes
```css
.theme-toggle {
  /* Full width button in sidebar */
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  
  /* Glassmorphic style */
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  
  /* Smooth transitions */
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.theme-toggle svg {
  transition: transform 0.3s ease;
}

.theme-toggle:hover svg {
  transform: rotate(15deg);
}
```

## Accessibility

### ARIA Labels
```tsx
<button
  onClick={toggleTheme}
  className="theme-toggle"
  aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
  title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
>
```

### Keyboard Navigation
- Fully keyboard accessible
- Tab to focus
- Enter/Space to toggle
- Focus visible with outline

### Screen Readers
- Descriptive aria-label
- Announces current state
- Clear action description

## Testing

### Manual Testing Checklist
- [ ] Toggle switches between light and dark
- [ ] Theme persists after page reload
- [ ] System preference detected on first visit
- [ ] All components render correctly in both themes
- [ ] No flash of wrong theme on load
- [ ] Smooth transitions between themes
- [ ] Icons change appropriately
- [ ] Hover states work correctly
- [ ] Keyboard navigation functional
- [ ] Screen reader announces correctly

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Troubleshooting

### Theme Not Persisting
**Issue**: Theme resets on page reload
**Solution**: Check localStorage is enabled and not blocked

### Flash of Wrong Theme
**Issue**: Brief flash of light theme before dark applies
**Solution**: Add inline script in index.html to apply theme before React loads

```html
<script>
  const theme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
</script>
```

### Colors Not Updating
**Issue**: Some colors don't change with theme
**Solution**: Ensure all colors use CSS variables, not hardcoded values

### Performance Issues
**Issue**: Lag when switching themes
**Solution**: Reduce number of transitions, use GPU-accelerated properties only

## Future Enhancements

### Planned Features
- [ ] Auto theme switching based on time of day
- [ ] Custom theme builder
- [ ] High contrast mode
- [ ] Theme preview before applying
- [ ] Animated theme transition
- [ ] Per-page theme preferences

### Advanced Options
```typescript
// Time-based auto switching
const hour = new Date().getHours();
const autoTheme = hour >= 6 && hour < 18 ? "light" : "dark";

// Smooth transition animation
document.documentElement.classList.add('theme-transitioning');
setTimeout(() => {
  document.documentElement.classList.remove('theme-transitioning');
}, 300);
```

## Best Practices

### Do's
✅ Use CSS variables for all colors
✅ Test both themes during development
✅ Ensure sufficient contrast in both modes
✅ Provide smooth transitions
✅ Respect user preferences
✅ Make toggle easily accessible

### Don'ts
❌ Hardcode colors in components
❌ Force a theme without user control
❌ Ignore system preferences
❌ Use jarring transitions
❌ Forget to test dark mode
❌ Hide the toggle button
