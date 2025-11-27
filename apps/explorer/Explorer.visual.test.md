# Explorer Context Menu Visual Test

## Purpose
This document provides manual testing steps to verify the ContextMenu component implementation.

## Prerequisites
1. Run the application: `npm run dev`
2. Open Explorer from the Start Menu or Desktop

## Test Cases

### Test 1: Right-click on a Folder
**Steps:**
1. Navigate to the root folder (/)
2. Right-click on the "documents" folder in the file list
3. Verify the context menu appears at the cursor position
4. Verify the menu contains: Open, Rename, Delete, (separator), Explain this folder

**Expected Result:**
- Context menu appears with Win95 styling (beveled borders, grey background)
- All menu items are visible and properly formatted
- "Explain this folder" option is visible (folder-only item)

### Test 2: Right-click on a File
**Steps:**
1. Navigate to /documents
2. Right-click on "readme.txt" file
3. Verify the context menu appears at the cursor position
4. Verify the menu contains: Open, Rename, Delete (no "Explain this folder")

**Expected Result:**
- Context menu appears with Win95 styling
- "Explain this folder" option is NOT visible (folder-only item)
- Other menu items are visible

### Test 3: Right-click on Empty Space
**Steps:**
1. Navigate to an empty folder or empty area in file list
2. Right-click on the empty space (not on any item)
3. Verify the context menu appears at the cursor position
4. Verify the menu contains only: New Folder

**Expected Result:**
- Context menu appears with Win95 styling
- Only "New Folder" option is visible

### Test 4: Close Menu on Outside Click
**Steps:**
1. Right-click on any item to open the context menu
2. Click anywhere outside the menu
3. Verify the menu closes

**Expected Result:**
- Menu closes immediately when clicking outside

### Test 5: Close Menu on Menu Item Click
**Steps:**
1. Right-click on a folder to open the context menu
2. Click on "Open" menu item
3. Verify the menu closes
4. Check console for action log (e.g., "Open: documents")

**Expected Result:**
- Menu closes after clicking a menu item
- Action is logged to console (placeholder implementation)

### Test 6: Menu Hover Effect
**Steps:**
1. Right-click on any item to open the context menu
2. Hover over each menu item
3. Verify the hover effect (navy blue background, white text)

**Expected Result:**
- Menu items change to navy blue background with white text on hover
- Hover effect matches Win95 style

### Test 7: Menu Positioning
**Steps:**
1. Right-click near the bottom-right corner of the window
2. Verify the menu appears at the cursor position
3. Right-click near the top-left corner
4. Verify the menu appears at the cursor position

**Expected Result:**
- Menu always appears at the exact cursor position
- Menu may extend beyond window bounds (this is acceptable for now)

### Test 8: Menu Separator
**Steps:**
1. Right-click on a folder
2. Verify the separator line between "Delete" and "Explain this folder"
3. Check that the separator has the Win95 style (dark grey line with white line below)

**Expected Result:**
- Separator is visible and styled correctly
- Separator has 3D beveled appearance

## Win95 Styling Checklist
- [ ] Menu has beveled outset border (white top/left, dark grey bottom/right)
- [ ] Menu background is grey (#c0c0c0)
- [ ] Menu items use MS Sans Serif font at 11px
- [ ] Menu items have navy blue hover background (#000080)
- [ ] Menu items have white hover text (#ffffff)
- [ ] Separator has 3D appearance (dark grey + white lines)
- [ ] Menu has proper padding (4px horizontal, 1px vertical for items)
- [ ] Menu has minimum width of 150px
- [ ] Menu has shadow effect (z-index: 50)

## Known Limitations
- Menu actions are placeholder implementations (console.log only)
- Menu may extend beyond window bounds (no boundary detection yet)
- No keyboard navigation support yet

## Notes
- This test verifies Requirements 4.1, 4.2, 4.3, 4.4, 4.5
- Actual functionality (rename, delete, explain) will be implemented in later tasks
