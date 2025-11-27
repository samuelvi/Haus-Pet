# Tailwind CSS Integration

This document describes the Tailwind CSS setup and usage in the HausPet frontend application.

## Overview

HausPet frontend uses **Tailwind CSS v3.4** as its styling framework, providing a utility-first approach to building modern, responsive user interfaces.

## Installation

Tailwind CSS is already configured in the project. The following packages are installed:

```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "postcss": "^8.5.6",
    "autoprefixer": "^10.4.22"
  }
}
```

### Re-installing Tailwind

If you need to reinstall or update Tailwind CSS:

```bash
# From the project root
cd app/frontend
npm install -D tailwindcss@^3.4.1 postcss autoprefixer

# Then rebuild the Docker container
cd ../..
make gui-build
```

## Configuration Files

### 1. `tailwind.config.js`

Located at `app/frontend/tailwind.config.js`, this file configures Tailwind's behavior:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... full color scale
          900: '#0c4a6e',
        },
        secondary: {
          50: '#fdf4ff',
          // ... purple scale
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 20px 0 rgba(0, 0, 0, 0.12)',
        'large': '0 8px 30px 0 rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
}
```

**Key configurations:**
- **Content paths**: Tells Tailwind where to look for class names
- **Custom colors**: Primary (blue) and secondary (purple) palettes
- **Custom shadows**: Soft, medium, and large elevation levels
- **Fonts**: Inter as the primary sans-serif font

### 2. `postcss.config.js`

Located at `app/frontend/postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

This configures PostCSS to process Tailwind directives and add vendor prefixes.

### 3. `src/index.css`

The main CSS file that imports Tailwind and defines custom components:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold tracking-tight;
  }
}

@layer components {
  /* Reusable button styles */
  .btn {
    @apply inline-flex items-center justify-center rounded-lg font-medium
           transition-all duration-200 focus:outline-none focus:ring-2
           focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700
           focus:ring-primary-500 shadow-sm hover:shadow-md;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400;
  }

  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700
           focus:ring-red-500 shadow-sm hover:shadow-md;
  }

  .btn-success {
    @apply bg-green-600 text-white hover:bg-green-700
           focus:ring-green-500 shadow-sm hover:shadow-md;
  }

  /* Input fields */
  .input {
    @apply w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white
           text-gray-900 placeholder:text-gray-400 focus:border-primary-500
           focus:ring-2 focus:ring-primary-500/20 transition-colors;
  }

  /* Card components */
  .card {
    @apply bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden;
  }

  .card-body {
    @apply p-6;
  }

  /* Badge styles */
  .badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium;
  }

  .badge-primary {
    @apply bg-primary-100 text-primary-700;
  }

  .badge-success {
    @apply bg-green-100 text-green-700;
  }

  .badge-warning {
    @apply bg-yellow-100 text-yellow-700;
  }

  .badge-danger {
    @apply bg-red-100 text-red-700;
  }
}
```

## Design System

### Colors

#### Primary (Blue)
Used for main actions, links, and primary UI elements.
- `primary-50` to `primary-900` (lighter to darker)

#### Secondary (Purple)
Used for accents and secondary actions.
- `secondary-50` to `secondary-900`

#### Semantic Colors
- **Success**: `green-*` (e.g., `bg-green-600`)
- **Danger**: `red-*` (e.g., `bg-red-600`)
- **Warning**: `yellow-*` (e.g., `bg-yellow-600`)
- **Info**: `blue-*` (e.g., `bg-blue-600`)

### Typography

- **Headings**: Use `text-{size}` and `font-bold` or `font-semibold`
- **Body**: Default is `text-base` with `font-normal`
- **Small text**: `text-sm` or `text-xs`
- **Colors**: `text-gray-900` (dark), `text-gray-600` (medium), `text-gray-400` (light)

### Spacing

Tailwind uses a consistent spacing scale:
- `p-4` = 1rem (16px)
- `m-6` = 1.5rem (24px)
- `gap-3` = 0.75rem (12px)

### Shadows

Custom shadow utilities:
- `shadow-soft`: Subtle elevation
- `shadow-medium`: Moderate elevation
- `shadow-large`: Prominent elevation

## Component Patterns

### Buttons

```jsx
// Primary button
<button className="btn btn-primary px-6 py-3">
  Click me
</button>

// Danger button with icon
<button className="btn btn-danger px-4 py-2 flex items-center gap-2">
  <TrashIcon />
  Delete
</button>

// Disabled state
<button className="btn btn-primary" disabled>
  Loading...
</button>
```

### Cards

```jsx
<div className="card shadow-soft">
  <div className="card-body">
    <h3 className="text-xl font-bold mb-4">Card Title</h3>
    <p className="text-gray-600">Card content goes here</p>
  </div>
</div>
```

### Forms

```jsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Email
    </label>
    <input type="email" className="input" placeholder="Enter email" />
  </div>
  <button className="btn btn-primary w-full">Submit</button>
</div>
```

### Badges

```jsx
<span className="badge badge-success">Active</span>
<span className="badge badge-danger">Inactive</span>
```

## Responsive Design

Tailwind uses mobile-first breakpoints:

```jsx
<div className="
  grid
  grid-cols-1       /* 1 column on mobile */
  sm:grid-cols-2    /* 2 columns on small screens (640px+) */
  lg:grid-cols-3    /* 3 columns on large screens (1024px+) */
  gap-6
">
  {/* Grid items */}
</div>
```

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Dark Mode

Currently, HausPet uses a light theme. To add dark mode support in the future:

1. Enable dark mode in `tailwind.config.js`:
```javascript
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}
```

2. Use dark mode variants:
```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

## Docker Integration

### Development Workflow

When working with Tailwind in Docker:

1. **Initial setup** (done automatically):
   ```bash
   make init
   ```

2. **Rebuild after package.json changes**:
   ```bash
   make gui-build
   ```

3. **Restart for CSS-only changes**:
   ```bash
   make gui-restart
   ```

4. **View frontend logs**:
   ```bash
   make gui-logs
   ```

### Hot Module Replacement (HMR)

Vite automatically detects changes to:
- React components (`.tsx`, `.jsx` files)
- CSS files
- Tailwind configuration

Changes are reflected in the browser without a full reload.

## Troubleshooting

### Issue: Tailwind classes not working

**Solution**: Make sure the file is included in the `content` array in `tailwind.config.js`.

### Issue: PostCSS errors on Docker startup

**Possible causes:**
1. `node_modules` out of sync
2. PostCSS config syntax error
3. Wrong Tailwind version

**Solution**:
```bash
make gui-build  # Rebuild the container
```

### Issue: Styles not updating

**Solution**:
```bash
make gui-restart  # Restart the dev server
```

### Issue: "Cannot find module 'tailwindcss'"

This means the npm packages are not installed in the Docker container.

**Solution**:
```bash
# Execute npm install inside the container
docker compose exec hauspet_gui npm install

# Or rebuild the container
make gui-build
```

## Best Practices

1. **Use utility classes directly** instead of creating custom CSS
   ```jsx
   // ✅ Good
   <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
     Click me
   </button>

   // ❌ Avoid
   <button className="custom-button">Click me</button>
   ```

2. **Extract repeated patterns** into component classes (in `index.css`)
   ```css
   @layer components {
     .btn-large {
       @apply px-6 py-3 text-lg;
     }
   }
   ```

3. **Use responsive modifiers** for mobile-first design
   ```jsx
   <div className="w-full lg:w-1/2">Responsive width</div>
   ```

4. **Leverage state variants**
   ```jsx
   <button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50">
     Interactive button
   </button>
   ```

5. **Keep consistent spacing**
   ```jsx
   // Use a consistent spacing scale
   <div className="space-y-4">  {/* 1rem gap between children */}
     <div>Item 1</div>
     <div>Item 2</div>
   </div>
   ```

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) (VS Code extension)
- [Tailwind Play](https://play.tailwindcss.com/) (Online playground)

## Migration Notes

### From inline styles to Tailwind

The HausPet frontend was migrated from inline React styles to Tailwind CSS. This provides:

- **Better performance**: Smaller CSS bundle
- **Consistency**: Unified design system
- **Maintainability**: Easier to update styles
- **Responsive design**: Built-in breakpoints
- **Developer experience**: IntelliSense support

All major components have been updated:
- ✅ Login
- ✅ Dashboard
- ✅ PetGallery
- ✅ PetDetail
- ✅ BreedList
- ✅ BreedForm
- ✅ PetAdminForm
- ✅ PetAdminList

## Support

For questions or issues related to Tailwind CSS integration:

1. Check this documentation
2. Review the [Tailwind CSS docs](https://tailwindcss.com/docs)
3. Check existing component implementations for examples
4. Open an issue in the project repository
