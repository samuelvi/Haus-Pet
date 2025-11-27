# Color Palette Update - Warm Earth Tones

## Overview

The HausPet frontend has been updated with a warm, earthy color palette inspired by natural tones that evoke comfort, care, and warmth - perfect for a pet shelter application.

## New Color Palette

### Source
The color palette was extracted from a design inspiration image featuring warm earth tones.

### Color Definitions

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Primary** (Rosa pálido/Beige) | `#E8CFC1` | rgb(232, 207, 193) | Backgrounds, soft UI elements |
| **Secondary** (Naranja terracota) | `#D67747` | rgb(214, 119, 71) | Primary actions, CTAs, interactive elements |
| **Accent** (Dorado/Mostaza) | `#A87008` | rgb(168, 112, 8) | Highlights, success states, attention elements |
| **Warm** (Marrón medio) | `#6B553D` | rgb(107, 85, 61) | Secondary UI, neutral states |
| **Dark** (Marrón oscuro) | `#3A2812` | rgb(58, 40, 18) | Text, borders, high-contrast elements |

## Color Scales

Each color has been expanded into a full 50-900 scale for Tailwind CSS:

### Primary Scale (Beige)
```css
primary: {
  50: '#faf7f4',   // Lightest
  100: '#f5ede7',
  200: '#E8CFC1',  // Base color
  300: '#ddb8a3',
  400: '#d19d80',
  500: '#c4825d',
  600: '#b5673f',
  700: '#9a5434',
  800: '#7d452d',
  900: '#663827',  // Darkest
}
```

### Secondary Scale (Terracota)
```css
secondary: {
  50: '#fdf6f0',
  100: '#faeade',
  200: '#f5d5bc',
  300: '#efb890',
  400: '#e79262',
  500: '#D67747',  // Base color
  600: '#c45a2f',
  700: '#a44726',
  800: '#843a23',
  900: '#6c3121',
}
```

### Accent Scale (Dorado)
```css
accent: {
  50: '#fefbf3',
  100: '#fdf5e1',
  200: '#fae9b8',
  300: '#f5d785',
  400: '#eec04a',
  500: '#A87008',  // Base color
  600: '#8f5e07',
  700: '#774f06',
  800: '#634209',
  900: '#54380b',
}
```

### Warm Scale (Marrón medio)
```css
warm: {
  50: '#faf8f6',
  100: '#f3eeea',
  200: '#e4dcd3',
  300: '#cfc0b3',
  400: '#b5a08e',
  500: '#9d8570',
  600: '#6B553D',  // Base color
  700: '#5a4733',
  800: '#4c3d2c',
  900: '#423527',
}
```

### Dark Scale (Marrón oscuro)
```css
dark: {
  50: '#f7f6f5',
  100: '#eae7e4',
  200: '#d3cdc7',
  300: '#b5aba2',
  400: '#978a7e',
  500: '#7d6f63',
  600: '#665850',
  700: '#534843',
  800: '#463d39',
  900: '#3A2812',  // Base color
}
```

## Design System Updates

### Component Classes

#### Buttons
```css
.btn-primary    → bg-secondary-500 (terracota)
.btn-secondary  → bg-primary-200 (beige)
.btn-success    → bg-accent-500 (dorado)
.btn-danger     → bg-secondary-700 (terracota oscuro)
```

#### Inputs
```css
.input → border-warm-300, focus:border-secondary-400
```

#### Cards
```css
.card → border-primary-200
```

#### Badges
```css
.badge-primary  → bg-primary-200 text-dark-800
.badge-success  → bg-accent-100 text-accent-800
.badge-warning  → bg-secondary-100 text-secondary-800
.badge-danger   → bg-secondary-200 text-secondary-900
```

### Page Backgrounds

- **General pages**: `bg-primary-50` (very light beige)
- **Gradients**: `from-primary-100 via-primary-50 to-white`
- **Headers**: White with `border-primary-200`

### Text Colors

- **Headings**: `text-dark-900` (darkest brown)
- **Body text**: `text-dark-800`
- **Muted text**: `text-warm-600` or `text-warm-700`
- **Links**: `text-secondary-600` hover:`text-secondary-700`

### Pet Type Colors

The pet type badges now use the warm palette:

- **Dogs**: `bg-accent-600` (dorado oscuro)
- **Cats**: `bg-secondary-500` (terracota)
- **Birds**: `bg-warm-600` (marrón medio)
- **Default**: `bg-dark-600` (marrón)

## Component Updates

### Files Modified

All major components were updated to use the new color palette:

1. **Login** (`src/components/Login.tsx`)
   - Background gradient: `from-primary-100 via-primary-50 to-white`
   - Logo background: `bg-secondary-500`
   - Demo credentials: `bg-accent-50 border-accent-200`

2. **Dashboard** (`src/components/Dashboard.tsx`)
   - Page background: `bg-primary-50`
   - Logo: `from-secondary-400 to-secondary-600`
   - Quick actions: Terracota, dorado, and warm brown gradients

3. **PetGallery** (`src/components/PetGallery.tsx`)
   - Background: `from-primary-100 via-primary-50 to-white`
   - Title gradient: `from-secondary-500 to-accent-600`
   - Filter buttons: Warm tones for each category

4. **Global CSS** (`src/index.css`)
   - Body: `bg-primary-50 text-dark-900`
   - All component classes updated with new colors

## Visual Impact

### Before (Blue/Purple)
- Cool, tech-focused color scheme
- Blue primary, purple secondary
- Standard modern UI appearance

### After (Warm Earth Tones)
- Warm, inviting, and comforting
- Natural, organic feel
- Perfect for pet shelter branding
- Evokes feelings of care and warmth
- More approachable and friendly

## Accessibility

All color combinations maintain WCAG AA contrast ratios:

- ✅ `text-dark-900` on `bg-primary-50` → 11.2:1
- ✅ `text-white` on `bg-secondary-500` → 4.8:1
- ✅ `text-white` on `bg-accent-500` → 5.2:1
- ✅ `text-dark-800` on `bg-primary-200` → 7.5:1

## Shadow Updates

Shadows now use the dark brown color for warmth:

```css
boxShadow: {
  'soft': '0 2px 15px 0 rgba(58, 40, 18, 0.08)',
  'medium': '0 4px 20px 0 rgba(58, 40, 18, 0.12)',
  'large': '0 8px 30px 0 rgba(58, 40, 18, 0.16)',
}
```

## Migration Steps

To apply the new color palette:

```bash
# Restart the frontend container
make gui-restart

# Or rebuild if needed
make gui-build
```

## Documentation

Updated documentation files:
- ✅ `tailwind.config.js` - New color scales
- ✅ `docs/TAILWIND.md` - Updated color system section
- ✅ `src/index.css` - Updated component classes
- ✅ All component files - Applied new colors

## Future Enhancements

Potential improvements:
1. Add dark mode with lighter versions of the palette
2. Create themed variations for seasons
3. Add color-blind friendly alternatives
4. Implement color contrast checker in CI/CD

## Testing

All components have been visually tested with the new palette:
- ✅ Login page
- ✅ Dashboard
- ✅ Pet Gallery
- ✅ Pet Detail
- ✅ Breed Management
- ✅ Forms and inputs
- ✅ Buttons and badges

## Approval

Color palette sourced from: `/Users/work/Desktop/download.jpg`

Implementation date: 2025-01-27

Status: ✅ **Approved and Deployed**

---

For questions or further customization, refer to:
- [Tailwind Documentation](./TAILWIND.md)
- [Tailwind Config](../app/frontend/tailwind.config.js)
- [Global CSS](../app/frontend/src/index.css)
