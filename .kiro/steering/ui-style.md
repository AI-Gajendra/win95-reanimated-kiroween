---
inclusion: always
---

# UI Style Guide for Win95 Reanimated

This steering document ensures all generated UI code matches Windows 95 aesthetics and interaction patterns.

## Color Palette

Use these exact colors throughout the application:

- **Window Background**: `#c0c0c0` (classic grey)
- **Window Border Dark**: `#808080` (dark grey for shadows)
- **Window Border Light**: `#ffffff` (white for highlights)
- **Title Bar Active**: `#000080` (navy blue)
- **Title Bar Inactive**: `#808080` (grey)
- **Title Bar Text**: `#ffffff` (white)
- **Button Face**: `#c0c0c0` (same as window background)
- **Text**: `#000000` (black)
- **Desktop Background**: `#008080` (teal) or `#c0c0c0` (grey)
- **Selection Highlight**: `#000080` (navy blue)
- **Selection Text**: `#ffffff` (white)

## Typography

- **System Font**: Use `'MS Sans Serif', 'Microsoft Sans Serif', sans-serif` as the primary font stack
- **Monospace Font**: Use `'Courier New', 'Courier', monospace` for code and text editors
- **Font Size**: Default to `11px` or `12px` for body text
- **Font Weight**: Use normal weight; avoid bold except for emphasis

## Beveled Borders

All UI elements should use the classic 3D beveled appearance:

### Outset (Raised) Borders
Used for buttons, window chrome, and raised panels:
```css
border-top: 2px solid #ffffff;
border-left: 2px solid #ffffff;
border-bottom: 2px solid #808080;
border-right: 2px solid #808080;
```

### Inset (Sunken) Borders
Used for text inputs, text areas, and sunken panels:
```css
border-top: 2px solid #808080;
border-left: 2px solid #808080;
border-bottom: 2px solid #ffffff;
border-right: 2px solid #ffffff;
```

### Tailwind Utility Classes
Create custom Tailwind classes for reusability:
```css
.win95-outset {
  @apply border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-600;
}

.win95-inset {
  @apply border-t-2 border-l-2 border-gray-600 border-b-2 border-r-2 border-white;
}
```

## Window Chrome

All application windows must include:

1. **Title Bar**
   - Height: `24px` to `28px`
   - Background: Navy blue (`#000080`) when active, grey when inactive
   - Text: White, left-aligned with 4-8px padding
   - Icon: 16x16px app icon on the left
   - Controls: Minimize, Maximize, Close buttons on the right

2. **Window Border**
   - 2-4px beveled border around entire window
   - Use outset style for raised appearance

3. **Content Area**
   - Grey background (`#c0c0c0`)
   - Padding: 4-8px from window edges

## Buttons

- **Default State**: Outset border, grey background
- **Hover State**: No change (Win95 didn't have hover effects)
- **Pressed State**: Inset border, content shifts 1px down and right
- **Disabled State**: Grey text, no border change
- **Padding**: 4-8px horizontal, 2-4px vertical
- **Min Width**: 75px for standard buttons

## Text Inputs and Text Areas

- **Border**: Inset (sunken) style
- **Background**: White (`#ffffff`)
- **Text**: Black
- **Padding**: 2-4px
- **Focus**: Add a 1px dotted outline inside the border

## Menus

- **Menu Bar**: Grey background, items in a horizontal row
- **Menu Items**: 
  - Padding: 4-8px horizontal, 2-4px vertical
  - Hover: Navy blue background, white text
  - Separator: 1px grey line with white line below
- **Keyboard Shortcuts**: Right-aligned, grey text

## Dialogs and Message Boxes

- **Layout**: Centered on screen
- **Border**: Thick beveled border (4px)
- **Title Bar**: Same as windows
- **Content**: 
  - Icon on left (32x32px)
  - Message text in center
  - Buttons at bottom right
- **Button Layout**: OK, Cancel, etc. in horizontal row with 4-8px spacing

## Icons

- **Size**: 16x16px for small icons, 32x32px for large icons
- **Style**: Pixelated, low-color (16-color palette preferred)
- **Common Icons**:
  - Folder: Yellow folder icon
  - Text File: White page with lines
  - Notepad: Notepad with blue header
  - Computer: Grey computer monitor

## Scrollbars

- **Width**: 16px
- **Track**: Grey with inset border
- **Thumb**: Grey with outset border
- **Arrows**: Grey buttons with black arrow glyphs
- **Style**: Chunky, pixelated appearance

## Taskbar

- **Height**: 28-32px
- **Position**: Fixed at bottom of screen
- **Background**: Grey (`#c0c0c0`)
- **Border**: Outset on top edge only
- **Start Button**: 
  - Windows logo icon
  - Text: "Start"
  - Outset border, pressed state when menu open
- **Window Buttons**: 
  - Inset border
  - Max width: 150px
  - Text truncated with ellipsis
- **System Tray**: 
  - Right-aligned
  - Clock display
  - Inset border around clock

## Interaction Patterns

### Focus Indicators
- Dotted outline inside the element (1px dotted black)
- No modern glow or shadow effects

### Selection
- Navy blue background (`#000080`)
- White text
- No rounded corners

### Drag and Drop
- Show outline of dragged element
- No smooth animations
- Snap to grid if applicable

### Resize
- Show resize cursor on window edges
- No smooth transitions
- Update size on mouse move

## Animations

**AVOID** modern animations. Windows 95 had minimal animation:
- Window minimize: Simple shrink to taskbar (optional)
- Menu open: Instant appearance, no fade
- No transitions, no easing functions
- No smooth scrolling

## Accessibility

While maintaining Win95 aesthetics:
- Ensure sufficient color contrast (already met by Win95 palette)
- Support keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Provide ARIA labels for screen readers
- Support Windows keyboard shortcuts (Alt+F4, Alt+Tab, etc.)

## Common Mistakes to Avoid

❌ **Don't use**:
- Rounded corners
- Drop shadows
- Gradients (except title bar gradient if desired)
- Smooth transitions or animations
- Modern flat design
- Hover effects (except menu items)
- Custom fonts (stick to system fonts)

✅ **Do use**:
- Sharp corners (0px border-radius)
- Beveled borders everywhere
- Solid colors from the palette
- Instant state changes
- Classic 3D appearance
- System fonts only

## Code Example

```tsx
// Good: Win95-style button
<button className="
  px-4 py-1
  bg-gray-300
  border-t-2 border-l-2 border-white
  border-b-2 border-r-2 border-gray-600
  active:border-t-2 active:border-l-2 active:border-gray-600
  active:border-b-2 active:border-r-2 active:border-white
  font-['MS_Sans_Serif']
  text-black
  min-w-[75px]
">
  OK
</button>

// Bad: Modern button
<button className="
  px-6 py-2
  bg-blue-500 hover:bg-blue-600
  rounded-lg shadow-lg
  transition-all duration-200
  text-white font-semibold
">
  OK
</button>
```

## Testing Checklist

Before committing UI code, verify:
- [ ] All colors match the Win95 palette
- [ ] All borders are beveled (no flat borders)
- [ ] No rounded corners anywhere
- [ ] No smooth animations or transitions
- [ ] System fonts are used
- [ ] Buttons have proper pressed state
- [ ] Windows have proper chrome (title bar, borders)
- [ ] Focus indicators are dotted outlines
- [ ] Selection uses navy blue background

---

**Remember**: The goal is to make users feel like they've traveled back to 1995. Every pixel should scream "Windows 95"!
