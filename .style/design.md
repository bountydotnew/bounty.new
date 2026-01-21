# Bounty Design System

A flat, minimal dark theme with subtle borders and clean typography.

## Color Palette

### Backgrounds
- `bg-[#0a0a0a]` - Page background (darkest)
- `bg-[#141414]` - Elevated surface / table headers
- `bg-[#191919]` - Cards, modals
- `bg-[#232323]` - Subtle elevation
- `bg-[#303030]` - Buttons, interactive elements
- `bg-[#3a3a3a]` - Button hover state

### Borders
- `border-[#2a2a2a]` - Primary border color (tables, containers)
- `border-[#232323]` - Subtle dividers

### Text
- `text-white` - Primary text, headings, values
- `text-[#888]` - Secondary text, descriptions, labels
- `text-[#666]` - Tertiary text, placeholders
- `text-[#555]` - Disabled state

### Status Colors
- `text-green-400` / `bg-green-500/10` - Success, positive change
- `text-red-400` / `bg-red-500/10` - Error, negative change

## Components

### Buttons

Primary action buttons use solid backgrounds with subtle rounding:

```tsx
// Primary button
className="h-[29px] px-3 rounded-[7px] bg-[#303030] text-[13px] text-white hover:bg-[#3a3a3a] transition-colors flex items-center gap-1.5"

// Icon-only button (e.g., dropdown trigger)
className="h-[29px] w-[29px] rounded-[7px] text-[#888] hover:text-white hover:bg-[#303030] transition-colors flex items-center justify-center"
```

Key properties:
- Height: `h-[29px]`
- Padding: `px-3`
- Border radius: `rounded-[7px]`
- Background: `bg-[#303030]`
- Font size: `text-[13px]`
- Gap between text and icon: `gap-1.5`
- Icon on the right side of text

### Tables

Tables use a single subtle border around the container with row separators:

```tsx
// Container
<div className="rounded-lg border border-[#2a2a2a] overflow-hidden">
  
  {/* Header row */}
  <div className="grid grid-cols-[...] gap-4 px-4 py-3 text-sm text-[#888]">
    <div>Column 1</div>
    <div>Column 2</div>
  </div>
  
  {/* Data row */}
  <div className="grid grid-cols-[...] gap-4 px-4 py-3 border-t border-[#2a2a2a] items-center text-sm">
    <div className="text-white font-medium">Value 1</div>
    <div className="text-white">Value 2</div>
  </div>
</div>
```

Key properties:
- Container: `rounded-lg border border-[#2a2a2a] overflow-hidden`
- Header text: `text-sm text-[#888]`
- Row padding: `px-4 py-3`
- Row separator: `border-t border-[#2a2a2a]`
- Data values: `text-white font-medium`

### Page Headers

Clean headers with icon inline, no background circles:

```tsx
<header>
  <div className="flex items-center gap-3 mb-3">
    <IconComponent className="h-8 w-8 text-white" />
    <h1 className="text-3xl font-semibold text-white">Title</h1>
  </div>
  <p className="text-[#888]">
    Description text goes here
  </p>
</header>
```

### Section Headers

Smaller section headers within a page:

```tsx
<div className="mb-4">
  <h2 className="text-base font-medium text-white">Section Title</h2>
  <p className="text-sm text-[#888]">Optional description</p>
</div>
```

### Status Badges

Small pill-shaped indicators:

```tsx
// Success/positive
<span className="px-2 py-0.5 rounded-md text-xs bg-green-500/10 text-green-400">
  Eligible
</span>

// Neutral/default
<span className="px-2 py-0.5 rounded-md text-xs bg-[#303030] text-[#888]">
  Pending
</span>

// Count badge
<span className="px-2 py-0.5 rounded-md bg-[#232323] text-xs text-[#888]">
  12
</span>
```

### Progress Bars

Simple progress indicators:

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-[#888]">Label</span>
    <span className="text-white font-medium">$1.2M</span>
  </div>
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
    <div
      className="h-full rounded-full bg-white transition-all duration-500"
      style={{ width: '75%' }}
    />
  </div>
</div>
```

### Dropdown Menus

```tsx
<DropdownMenuContent
  align="end"
  className="bg-[#191919] border-[#2a2a2a]"
>
  <DropdownMenuItem className="focus:bg-[#232323]">
    Action
  </DropdownMenuItem>
  <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-[#232323]">
    Destructive Action
  </DropdownMenuItem>
</DropdownMenuContent>
```

## Layout

### Page Container (Auth Routes)

The integrations layout provides consistent structure:

```tsx
<>
  <Header />
  <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
    {/* Horizontal border */}
    <div className="h-px w-full shrink-0 bg-[#232323]" />
    
    {/* Content with vertical borders on xl */}
    <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-[#232323] mx-auto py-4 min-w-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="relative flex flex-col pb-10 px-4 w-full min-w-0 space-y-6">
          {children}
        </div>
      </div>
    </div>
  </div>
</>
```

### Spacing

- Between major sections: `space-y-6` or `pt-8`
- Between header and content: `mb-4`
- Inside tables: `gap-4 px-4 py-3`
- Button groups: `gap-2`

## Typography

- Page title: `text-3xl font-semibold`
- Section title: `text-base font-medium`
- Body text: `text-sm`
- Small text: `text-xs`
- Mono/code: `font-mono`

## Icons

- Use Lucide React icons
- Standard size: `h-4 w-4`
- Large (in headers): `h-8 w-8`
- Button icons: `h-4 w-4`
- Color: Match text color or use `text-[#888]` for muted

## Principles

1. **Flat over dimensional** - No gradients, shadows, or 3D effects
2. **Minimal borders** - Single border around containers, not on every element
3. **Subtle hierarchy** - Use color weight, not size, to show importance
4. **Consistent spacing** - Use the spacing scale consistently
5. **Clean interactions** - Hover states are subtle background changes
