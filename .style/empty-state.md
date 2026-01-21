# Empty State Guidelines

## Design Principles

Empty states should be **minimal and understated**. They exist to inform, not to impress.

### Do
- Use the existing gray palette (#333, #444, #555, #666, #888, #ccc)
- Use dashed borders (`border-dashed border-[#333]`)
- Keep illustrations simple and monochromatic
- Provide helpful, concise copy
- Include a subtle CTA when there's a clear next action

### Don't
- Use brand green (#3ECF8E) — reserved for money/success states
- Add animations, glows, or floating elements
- Use decorative elements that don't serve a purpose
- Make empty states visually compete with actual content

## Structure

```tsx
<div className="flex flex-col items-center justify-center py-24 px-6">
  {/* Icon/Illustration */}
  <div className="w-24 h-24 rounded-2xl border border-dashed border-[#333] flex items-center justify-center bg-[#111]/50 mb-8">
    {/* Simple SVG icon */}
  </div>
  
  {/* Text */}
  <div className="text-center max-w-xs">
    <h3 className="text-[15px] font-medium text-[#ccc] mb-2">
      Title
    </h3>
    <p className="text-[13px] text-[#666] leading-relaxed mb-6">
      Description explaining what goes here and how to add items.
    </p>
    
    {/* Optional CTA */}
    <Link
      href="/somewhere"
      className="inline-flex items-center gap-2 px-4 py-2 text-[13px] text-[#888] hover:text-white rounded-lg border border-[#333] hover:border-[#444] bg-[#1a1a1a] hover:bg-[#222] transition-all duration-200"
    >
      Action
    </Link>
  </div>
</div>
```

## Examples

- `components/empty-states/bookmarks-empty.tsx` - Bookmarks page
- `components/profile/empty-state.tsx` - Simple inline empty state

## Color Reference

| Use | Color |
|-----|-------|
| Borders | `#333` |
| Icon strokes | `#444`, `#555` |
| Secondary text | `#666` |
| Body text | `#888` |
| Headings | `#ccc` |
| Hover text | `white` |
