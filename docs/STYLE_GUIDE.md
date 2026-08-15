# EndoBone AI - Design System & Style Guide

## 🎨 Color Palette

### Primary Clinical Blue
```
Clinical Blue: #0052CC
Light: #E3F2FD
Dark: #003399
Usage: Primary CTAs, navigation active states, key actions
```

### Risk-Stratified Colors

#### High Risk (Red)
```
Primary: #DC2626
Light: #FEE2E2
Dark: #991B1B
Usage: High-risk indicators, critical alerts, severe findings
```

#### Moderate Risk (Amber)
```
Primary: #F59E0B
Light: #FEF3C7
Dark: #B45309
Usage: Moderate-risk indicators, warnings, attention needed
```

#### Low Risk (Teal)
```
Primary: #14B8A6
Light: #CCFBF1
Dark: #0D7377
Usage: Low-risk indicators, normal findings, positive states
```

### Neutral Grays
```
50: #F9FAFB - Lightest background
100: #F3F4F6
200: #E5E7EB
300: #D1D5DB
400: #9CA3AF
500: #6B7280
600: #4B5563
700: #374151
800: #1F2937
900: #111827 - Darkest text
```

---

## 🔤 Typography

### Font Stack
```
Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
Monospace: Menlo, Monaco, "Courier New", monospace
```

### Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| Caption | 12px | 16px | 400 | Metadata, legends, annotations |
| Small | 14px | 20px | 400 | Body text, labels, descriptions |
| Base | 16px | 24px | 400 | Default body text |
| Large | 18px | 28px | 400 | Introductory text |
| XL | 20px | 28px | 400 | Subheadings |
| 2XL | 24px | 32px | 600 | Section headings |
| 3XL | 30px | 36px | 700 | Page titles |
| 4XL | 36px | 40px | 700 | Large titles |
| 5XL | 48px | 56px | 700 | Hero headlines |

### Font Weights

```
Light: 300 - Secondary text, disabled states
Normal: 400 - Body copy, default
Medium: 500 - Emphasized text, labels
Semibold: 600 - Subheadings, component labels
Bold: 700 - Headings, emphasis
Extrabold: 800 - Strong emphasis
Black: 900 - Rare, extreme emphasis
```

### Usage Examples

**Heading Hierarchy:**
```jsx
// H1 - Page Title
<h1 className="text-4xl font-bold text-neutral-900">
  Pre-Surgical Planning Report
</h1>

// H2 - Section Header
<h2 className="text-2xl font-bold text-neutral-900">
  Surgical Site Overview
</h2>

// H3 - Subsection
<h3 className="text-xl font-semibold text-neutral-900">
  Risk Assessment
</h3>

// Body
<p className="text-base text-neutral-700">
  Standard body text with adequate line height for readability.
</p>

// Caption
<span className="text-xs text-neutral-600">
  Last updated: 2024-08-14
</span>
```

---

## 🎯 Spacing System

### Base Unit: 4px

```
xs: 2px (0.5rem)
sm: 4px (1rem)
md: 8px (2rem)
lg: 12px (3rem)
xl: 16px (4rem)
2xl: 24px (6rem)
3xl: 32px (8rem)
```

### Common Combinations

```
Component padding: 16px (p-4) to 24px (p-6)
Section margins: 24px to 32px (my-6 to my-8)
Gap between elements: 8px to 16px (gap-2 to gap-4)
List item spacing: 12px (space-y-3)
```

---

## 🎭 Component Patterns

### Buttons

#### Primary Button (High-Risk Action)
```jsx
<button className="px-4 py-2 rounded-lg font-medium bg-clinical-blue text-white hover:bg-clinical-blue-dark transition-colors">
  Start Assessment
</button>
```

#### Secondary Button
```jsx
<button className="px-4 py-2 rounded-lg font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors">
  View Demo
</button>
```

#### Danger Button
```jsx
<button className="px-4 py-2 rounded-lg font-medium bg-risk-red text-white hover:bg-risk-red-dark transition-colors">
  Confirm Deletion
</button>
```

### Status Badges

#### High Risk Badge
```jsx
<span className="badge-high">
  HIGH RISK
</span>
```

#### Moderate Risk Badge
```jsx
<span className="badge-moderate">
  MODERATE RISK
</span>
```

#### Low Risk Badge
```jsx
<span className="badge-low">
  LOW RISK
</span>
```

### Cards

#### Standard Card
```jsx
<div className="card">
  <h3 className="font-bold text-neutral-900 mb-4">Title</h3>
  <p className="text-neutral-600">Content goes here</p>
</div>
```

#### Interactive Card (Hover Effect)
```jsx
<div className="card-hover cursor-pointer">
  <h3 className="font-bold text-neutral-900">Interactive Title</h3>
</div>
```

### Input Fields

#### Standard Input
```jsx
<input 
  type="text" 
  placeholder="Enter value..."
  className="input-field"
/>
```

#### Input with Error
```jsx
<div>
  <label className="label">Field Name</label>
  <input 
    type="text" 
    className="input-field input-error"
  />
  <p className="text-error">This field is required</p>
</div>
```

### Data Display

#### Risk Score Display
```jsx
<div className="bg-white rounded-lg border border-neutral-200 p-6">
  <p className="text-neutral-600 mb-2">Overall Quality Risk</p>
  <div className="text-4xl font-bold text-risk-red">75%</div>
  <p className="text-sm text-neutral-600 mt-2">High Risk</p>
</div>
```

#### Biomarker Row
```jsx
<div className="flex justify-between items-center pb-3 border-b border-neutral-200">
  <div>
    <p className="text-sm font-semibold text-neutral-900">PTH</p>
    <p className="text-xs text-neutral-600">Elevated</p>
  </div>
  <div>
    <p className="text-lg font-bold text-neutral-900">85.2</p>
    <p className="text-xs text-neutral-600">pg/mL</p>
  </div>
</div>
```

### Alert/Notice Boxes

#### Critical Alert
```jsx
<div className="bg-risk-red-light border border-risk-red rounded-lg p-4">
  <p className="text-risk-red font-semibold mb-2">Critical Alert</p>
  <p className="text-sm text-risk-red">Description of the critical issue</p>
</div>
```

#### Information Box
```jsx
<div className="bg-clinical-blue-light border border-clinical-blue rounded-lg p-4">
  <p className="text-clinical-blue font-semibold mb-2">Information</p>
  <p className="text-sm text-clinical-blue">Useful information for the user</p>
</div>
```

---

## 🌐 Layout Patterns

### Main Page Layout
```jsx
<div className="flex h-screen">
  {/* Sidebar */}
  <div className="w-64 bg-white border-r border-neutral-200">
    {/* Navigation */}
  </div>
  
  {/* Main Content */}
  <div className="flex-1 overflow-auto bg-neutral-50">
    {/* Content area */}
  </div>
</div>
```

### Content Grid
```jsx
<div className="mx-auto max-w-6xl px-6 py-8">
  <div className="grid grid-cols-3 gap-6">
    {/* Three-column layout */}
  </div>
</div>
```

### Responsive Grid
```jsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Auto-adapts to screen size */}
</div>
```

---

## ✨ Shadows & Elevation

### Shadow Levels

```
xs: Subtle shadow for tertiary elements
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)

sm: Default card shadow
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1)

md: Elevated card on hover
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)

lg: Modal/dialog shadow
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)

xl: Popover/dropdown shadow
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)

2xl: Maximum elevation
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### Usage
```jsx
// Card
<div className="shadow-sm hover:shadow-md transition-shadow">

// Modal
<div className="shadow-lg">

// Dropdown
<div className="shadow-xl">
```

---

## 🎬 Animations & Transitions

### Transition Properties

```jsx
// Standard transition (all properties)
className="transition-all duration-200"

// Color only
className="transition-colors duration-200"

// Transform only
className="transition-transform duration-200"
```

### Timing Functions

```
ease-in: Starts slow, ends fast
ease-out: Starts fast, ends slow
ease-in-out: Smooth acceleration/deceleration
linear: Constant speed
```

### Duration

```
fast: 150ms - Quick micro-interactions
base: 200ms - Standard transitions
slow: 300ms - Important state changes
```

### Keyframe Animations

```jsx
// Fade in
className="animate-fade-in"

// Slide up
className="animate-slide-up"

// Soft pulse
className="animate-pulse-soft"

// Slow spin
className="animate-spin-slow"
```

---

## ♿ Accessibility Guidelines

### Color Contrast
- Text on background: Minimum 4.5:1 ratio for normal text
- UI components: Minimum 3:1 ratio
- High-risk indicators: Always pair color with icons/text

### Focus States
```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-clinical-blue focus:ring-offset-2">
  Keyboard accessible button
</button>
```

### Semantic HTML
```jsx
// Use semantic elements
<nav>Navigation</nav>
<main>Main content</main>
<section>Section</section>
<article>Article</article>
<header>Header</header>
<footer>Footer</footer>

// Proper heading hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
```

### ARIA Labels
```jsx
<button aria-label="Close dialog">
  <X size={20} />
</button>

<div role="status" aria-live="polite">
  Status message
</div>
```

---

## 📱 Responsive Design

### Breakpoints
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Mobile-First Approach
```jsx
// Start with mobile, enhance for larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

### Responsive Text
```jsx
// Text size adjusts by screen
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive heading
</h1>
```

---

## 🛠️ Custom Utility Classes

### Button Utilities
```
.btn-primary - Primary action button
.btn-secondary - Secondary action button
.btn-danger - Destructive action button
```

### Card Utilities
```
.card - Base card styling
.card-hover - Card with hover effects
```

### Badge Utilities
```
.badge-high - High-risk badge
.badge-moderate - Moderate-risk badge
.badge-low - Low-risk badge
```

### Form Utilities
```
.input-field - Standard input styling
.input-error - Error state for input
.label - Form label styling
.text-error - Error message styling
.text-muted - Muted/secondary text
```

### Layout Utilities
```
.divider - Horizontal divider line
.section-header - Section heading styling
.subsection-header - Subsection heading styling
```

---

## 📊 Data Visualization Colors

### Risk-Stratified Color Scale
```
0-20%: #14B8A6 (Low Risk - Teal)
20-50%: #10B981 (Moderate-Low - Green)
50-70%: #F59E0B (Moderate - Amber)
70-85%: #F97316 (High - Orange)
85-100%: #DC2626 (Critical - Red)
```

### Biomarker Status
```
Normal: #10B981 (Green)
Elevated: #DC2626 (Red)
Deficient: #F59E0B (Amber)
Critical: #991B1B (Dark Red)
```

---

## 🎓 Best Practices

### Do ✅
- Use semantic HTML elements
- Maintain consistent spacing (4px base unit)
- Follow color contrast requirements
- Implement keyboard navigation
- Use descriptive class names
- Test on multiple devices/browsers
- Document custom components
- Use Tailwind utility classes instead of custom CSS

### Don't ❌
- Mix custom CSS with Tailwind
- Use inline styles
- Hardcode colors (use theme values)
- Create components without documentation
- Forget accessibility requirements
- Use placeholder text instead of labels
- Create pixel-perfect designs (responsive first)
- Ignore performance implications

---

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project](https://www.a11yproject.com/)
- [Material Design System](https://material.io/design)
- [Lucide Icons](https://lucide.dev/)

---

**Last Updated**: August 15, 2026
**Version**: 1.0.0
