# Explorer CRUD Operations Visual Test

## Purpose
This document provides manual testing steps to verify the Create, Rename, and Delete operations in the Explorer application.

## Prerequisites
1. Run the application: `npm run dev`
2. Open Explorer from the Start Menu or Desktop
3. Navigate to a test folder (e.g., /documents)

## Test Cases

### Test 1: Create New Folder
**Steps:**
1. Navigate to /documents
2. Right-click on empty space in the file list
3. Click "New Folder" from the context menu
4. Verify a new folder appears with name "New Folder"
5. Verify the folder is immediately in rename mode (text input visible)
6. Type a new name (e.g., "Test Folder")
7. Press Enter to confirm

**Expected Result:**
- New folder is created with default name "New Folder"
- Folder immediately enters rename mode
- Text input is focused and text is selected
- Pressing Enter saves the new name
- Folder appears in the file list with the new name

### Test 2: Create Multiple New Folders
**Steps:**
1. Right-click on empty space and create a new folder
2. Press Escape to cancel rename (keep default name)
3. Right-click on empty space and create another new folder
4. Verify the second folder is named "New Folder (1)"
5. Create a third folder
6. Verify the third folder is named "New Folder (2)"

**Expected Result:**
- Each new folder gets a unique name with incrementing counter
- No naming conflicts occur
- All folders are visible in the file list

### Test 3: Rename Folder via Context Menu
**Steps:**
1. Right-click on an existing folder
2. Click "Rename" from the context menu
3. Verify the folder name becomes an editable text input
4. Verify the current name is pre-filled and selected
5. Type a new name (e.g., "Renamed Folder")
6. Press Enter to confirm

**Expected Result:**
- Folder enters rename mode
- Text input is focused with current name selected
- Pressing Enter saves the new name
- Folder appears with the new name in the file list

### Test 4: Cancel Rename with Escape
**Steps:**
1. Right-click on a folder and select "Rename"
2. Type a new name but don't press Enter
3. Press Escape
4. Verify the rename is cancelled and original name is kept

**Expected Result:**
- Pressing Escape cancels the rename operation
- Original folder name is preserved
- Rename mode exits

### Test 5: Cancel Rename with Blur
**Steps:**
1. Right-click on a folder and select "Rename"
2. Type a new name but don't press Enter
3. Click outside the text input (on another item or empty space)
4. Verify the rename is saved with the new name

**Expected Result:**
- Clicking outside (blur) saves the rename
- Folder appears with the new name

### Test 6: Rename with Empty Name
**Steps:**
1. Right-click on a folder and select "Rename"
2. Delete all text (make it empty)
3. Press Enter
4. Verify the rename is cancelled and original name is kept

**Expected Result:**
- Empty names are not allowed
- Original folder name is preserved
- Rename mode exits

### Test 7: Rename with Same Name
**Steps:**
1. Right-click on a folder and select "Rename"
2. Don't change the name
3. Press Enter
4. Verify the rename operation completes without error

**Expected Result:**
- Renaming to the same name is allowed
- No error occurs
- Rename mode exits

### Test 8: Delete Folder with Confirmation
**Steps:**
1. Right-click on a folder
2. Click "Delete" from the context menu
3. Verify a confirmation dialog appears
4. Verify the dialog shows the folder name
5. Click "Yes" to confirm

**Expected Result:**
- Confirmation dialog appears with Win95 styling
- Dialog shows message: "Are you sure you want to delete [folder name]?"
- Dialog has warning icon (⚠️)
- Clicking "Yes" deletes the folder
- Folder is removed from the file list

### Test 9: Cancel Delete Operation
**Steps:**
1. Right-click on a folder
2. Click "Delete" from the context menu
3. Verify the confirmation dialog appears
4. Click "No" to cancel

**Expected Result:**
- Confirmation dialog appears
- Clicking "No" cancels the delete operation
- Folder remains in the file list
- Dialog closes

### Test 10: Delete Folder with Files
**Steps:**
1. Create a new folder
2. Navigate into the folder
3. Create some files (if possible) or subfolders
4. Navigate back to parent
5. Right-click on the folder and select "Delete"
6. Confirm the deletion

**Expected Result:**
- Folder and all its contents are deleted
- No error occurs
- Folder is removed from the file list

### Test 11: Rename in List View
**Steps:**
1. Ensure view mode is "list" (click view toggle if needed)
2. Right-click on a folder and select "Rename"
3. Verify the text input appears inline in the list
4. Type a new name and press Enter

**Expected Result:**
- Text input appears inline in the list view
- Input has Win95 inset styling
- Rename works correctly in list view

### Test 12: Rename in Icon View
**Steps:**
1. Click the view mode toggle to switch to "icon" view
2. Right-click on a folder and select "Rename"
3. Verify the text input appears below the icon
4. Type a new name and press Enter

**Expected Result:**
- Text input appears below the folder icon
- Input has Win95 inset styling
- Rename works correctly in icon view

## Win95 Styling Checklist

### Confirmation Dialog
- [ ] Dialog has beveled outset border
- [ ] Dialog has grey background (#c0c0c0)
- [ ] Title bar is navy blue (#000080) with white text
- [ ] Dialog is centered on screen
- [ ] Dialog has semi-transparent black overlay behind it
- [ ] Warning icon (⚠️) is visible
- [ ] Message text uses MS Sans Serif font at 11px
- [ ] Buttons have Win95 outset styling
- [ ] Buttons have minimum width of 75px
- [ ] "No" button has focus by default

### Rename Input
- [ ] Input has Win95 inset border (sunken appearance)
- [ ] Input has white background
- [ ] Input uses MS Sans Serif font at 11px
- [ ] Input text is black
- [ ] Input is focused when entering rename mode
- [ ] Input text is selected when entering rename mode

## Error Handling

### Test 13: Rename to Existing Name
**Steps:**
1. Create two folders: "Folder A" and "Folder B"
2. Right-click on "Folder A" and select "Rename"
3. Type "Folder B" (the name of the existing folder)
4. Press Enter

**Expected Result:**
- Error is logged to console (error dialog will be added in task 11)
- Rename operation fails
- Original folder name is preserved

### Test 14: Delete Root Folder
**Steps:**
1. Navigate to root (/)
2. Try to delete the root folder (if possible via context menu)

**Expected Result:**
- Root folder cannot be deleted
- Error is logged to console
- Root folder remains

## Requirements Coverage
- ✅ Requirement 8.1: New Folder menu item
- ✅ Requirement 8.2: Create folder with default name
- ✅ Requirement 8.3: Enter rename mode immediately
- ✅ Requirement 8.4: Call VFS createFolder
- ✅ Requirement 8.5: Refresh file list
- ✅ Requirement 9.1: Rename menu item
- ✅ Requirement 9.2: Inline text input with current name
- ✅ Requirement 9.3: Enter to confirm rename
- ✅ Requirement 9.4: Escape to cancel
- ✅ Requirement 9.5: Error handling (console log, dialog in task 11)
- ✅ Requirement 10.1: Delete menu item with confirmation
- ✅ Requirement 10.2: Confirmation dialog with item name
- ✅ Requirement 10.3: Call VFS delete on confirmation
- ✅ Requirement 10.4: Refresh file list after deletion
- ✅ Requirement 10.5: Error handling (console log, dialog in task 11)

## Known Limitations
- Error dialogs are not yet implemented (will be added in task 11)
- Errors are currently logged to console only
- No validation for special characters in folder names
- No undo functionality

## Notes
- This test verifies the implementation of task 7 (CRUD operations)
- Error dialogs will be implemented in task 11
- All core CRUD functionality is working as specified
