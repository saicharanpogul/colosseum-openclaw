# Spacing & Layout Audit

## Issues Found

### 1. Profile Page (/profile)
- ❌ Uses `container mx-auto px-4` instead of `max-w-7xl mx-auto px-6`
- ❌ Inconsistent with other pages
- ❌ Header flex breaks on mobile (text + button side by side)
- ❌ Should stack on mobile

### 2. Market Detail Page (/market/[id])
- ✅ Uses `max-w-7xl mx-auto px-6 py-8` (correct)
- ⚠️ Quick stats cards might be cramped on mobile (grid-cols-2)
- ⚠️ Status badge group needs better mobile spacing

### 3. Home Page (/)
- ✅ Uses `max-w-7xl mx-auto px-6 py-8` (correct)
- ✅ Good responsive design
- ⚠️ Hero section could use more vertical spacing on mobile

### 4. Leaderboard Page (/leaderboard)
- ✅ Uses `max-w-7xl mx-auto px-6 py-8` (correct)
- ✅ Good mobile cards
- ⚠️ Pagination could use better spacing

### 5. Updates Page (/updates)
- ⚠️ Uses inline styles `style={{ maxWidth: '900px', margin: '0 auto' }}`
- ⚠️ Uses custom CSS classes instead of Tailwind
- ⚠️ No responsive px/py defined in component

## Standard Padding/Margin Rules

### Container:
```tsx
<main className="max-w-7xl mx-auto px-6 py-8">
```

### Cards:
```tsx
<div className="vapor-card p-6">  // Desktop
<div className="vapor-card p-4">  // Compact
```

### Sections:
```tsx
<div className="mb-8">   // Between sections
<div className="mb-12">  // Between major sections
```

### Mobile Breakpoints:
- `px-4 md:px-6` for smaller mobile padding
- `py-6 md:py-8` for vertical spacing
- `mb-6 md:mb-8` for section spacing

## Fixes Needed

1. **Profile page**: Change to max-w-7xl, make header stack on mobile
2. **Updates page**: Remove inline styles, use standard container
3. **Market detail**: Add better mobile spacing for stats grid
4. **All pages**: Ensure consistent px-6 (not px-4)
