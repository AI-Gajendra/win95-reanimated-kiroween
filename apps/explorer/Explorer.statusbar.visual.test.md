# Explorer StatusBar Visual Test

## Purpose
This document provides manual testing steps to verify the StatusBar component implementation.

## Prerequisites
1. Run the application: `npm run dev`
2. Open Explorer from the Start Menu or Desktop

## Test Cases

### Test 1: Item Count Display - Empty Folder
**Steps:**
1. Navigate to an empty folder (or create a new empty folder)
2. Look at the StatusBar at the bottom of the Explorer window
3. Verify it displays "0 items"

**Expected Result:**
- StatusBar shows "0 items" in a Win95-style inset panel
- Text uses MS Sans Serif font at 11px
- Background is white with inset border

### Test 2: Item Count Display - Single Item
**Steps:**
1. Navigate to a folder with exactly one file or folder
2. Look at the StatusBar at the bottom of the Explorer window
3. Verify it displays "1 item" (singular)

**Expected Result:**
- StatusBar shows "1 item" (not "1 items")
- Proper singular form is used

### Test 3: Item Count Display - Multiple Items
**Steps:**
1. Navigate to the root folder (/) which should have multiple items
2. Look at the StatusBar at the bottom of the Explorer window
3. Count the items in the file list
4. Verify the StatusBar displays the correct count (e.g., "5 items")

**Expected Result:**
- StatusBar shows correct item count with plural form (e.g., "5 items")
- Count matches the number of visible items in the file list

### Test 4: Item Count Updates on Navigation
**Steps:**
1. Start in the root folder and note the item count
2. Navigate to a different folder (e.g., double-click "documents")
3. Verify the StatusBar updates to show the new folder's item count
4. Navigate back using the Back button
5. Verify the StatusBar updates again

**Expected Result:**
- Item count updates immediately when navigating to a new folder
- Count is always accurate for the current folder

### Test 5: Item Count Updates After Creating Folder
**Steps:**
1. Navigate to any folder and note the current item count
2. Right-click in empty space and select "New Folder"
3. Complete the folder creation (press Enter or click away)
4. Verify the StatusBar increments the item count by 1

**Expected Result:**
- Item count increases by 1 after creating a new folder
- Update happens immediately after folder creation

### Test 6: Item Count Updates After Deleting Item
**Steps:**
1. Navigate to a folder with at least one item and note the count
2. Right-click on an item and select "Delete"
3. Confirm the deletion
4. Verify the StatusBar decrements the item count by 1

**Expected Result:**
- Item count decreases by 1 after deleting an item
- Update happens immediately after deletion

### Test 7: Loading Status Display
**Steps:**
1. Navigate to a folder
2. Right-click on a folder and select "Explain this folder"
3. While the AI is processing, look at the StatusBar
4. Verify a loading indicator appears with "Loading..." text

**Expected Result:**
- Loading indicator appears in the StatusBar (spinning animation)
- "Loading..." text is displayed next to the spinner
- Loading indicator is in a separate Win95-style inset panel
- Loading indicator disappears when the operation completes

### Test 8: StatusBar Styling
**Steps:**
1. Open Explorer and examine the StatusBar at the bottom
2. Verify the Win95 styling is correct

**Expected Result:**
- StatusBar has grey background (#c0c0c0)
- StatusBar has white border on top (2px)
- Item count panel has inset border (sunken appearance)
- Loading panel (when visible) has inset border
- Text uses MS Sans Serif font at 11px
- Text color is black (#000000)
- Panels have white background

### Test 9: StatusBar Layout
**Steps:**
1. Open Explorer and examine the StatusBar layout
2. Verify the spacing and alignment

**Expected Result:**
- StatusBar spans the full width of the Explorer window
- Item count panel is on the left side
- Loading indicator (when visible) appears to the right of item count
- Proper spacing (gap) between panels
- StatusBar has consistent padding (2px horizontal, 1px vertical)

### Test 10: StatusBar Position
**Steps:**
1. Open Explorer
2. Resize the window vertically
3. Verify the StatusBar stays at the bottom

**Expected Result:**
- StatusBar is always at the bottom of the Explorer window
- StatusBar doesn't scroll with the file list
- StatusBar remains visible when scrolling through files

## Win95 Styling Checklist
- [ ] StatusBar has grey background (#c0c0c0)
- [ ] StatusBar has white top border (2px)
- [ ] Item count panel has inset border (sunken)
- [ ] Item count panel has white background
- [ ] Loading panel has inset border (sunken)
- [ ] Loading panel has white background
- [ ] Text uses MS Sans Serif font at 11px
- [ ] Text color is black (#000000)
- [ ] Proper padding and spacing
- [ ] Loading spinner has Win95-style appearance

## Requirements Validation
This test validates **Requirement 1.1**: "THE Explorer Application SHALL render inside a Window component with Win95 chrome"

The StatusBar is part of the Explorer window chrome and provides status information to the user.

## Notes
- The StatusBar updates dynamically based on the current folder contents
- The loading indicator only appears during AI operations (Explain Folder)
- The StatusBar is a non-interactive component (no click handlers)
