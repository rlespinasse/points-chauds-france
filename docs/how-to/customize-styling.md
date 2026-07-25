# How to Customize Styling

This guide shows how to style your layers — colors, transparency, line widths, and more.

## Quick Changes

All styling happens in `src/config.ts` under the `styles` object.

### Change Layer Color

```typescript
styles: {
  communes: {
    color: '#ef4444',      // Changed to red
    fill: true,
    fillColor: '#fca5a5',  // Light red
    fillOpacity: 0.2,
  },
},
```

### Change Transparency

```typescript
styles: {
  communes: {
    opacity: 0.3,        // Make outlines faint
    fillOpacity: 0.05,   // Make fill very transparent
  },
},
```

### Change Line Weight

```typescript
styles: {
  communes: {
    weight: 2,   // Thicker outline (1 = thin, 3 = thick)
  },
},
```

## Color Picker

Use a color picker to find hex colors: https://htmlcolorcodes.com/

Common colors:
- Red: `#ef4444`
- Blue: `#3b82f6`
- Green: `#10b981`
- Gray: `#6b7280`
- Purple: `#8b5cf6`

## For Points (vs Polygons)

If your layer is points (not polygons), use `radius` instead of `weight`:

```typescript
styles: {
  museums: {
    radius: 8,           // Point size
    color: '#dc2626',    // Outline
    fillColor: '#ef4444', // Fill
    fillOpacity: 0.8,
  },
},
```

## See Also

- Full styling reference: `docs/reference/config-api.md`
- Complete example: `src/config.ts`

*Note: Advanced styling (gradients, patterns, animations) requires editing CSS or using custom scripts. Ask Claude Code for help.*
