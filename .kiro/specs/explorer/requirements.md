# Explorer Application Requirements

## Introduction

The Explorer Application is a Win95-style file manager with AI augmentation capabilities. It provides a dual-pane interface for navigating the Virtual File System (VFS) and includes AI-powered features for folder analysis and organization recommendations.

## Glossary

- **Explorer Application**: A file management application that mimics Windows 95 Explorer with added AI capabilities
- **VFS**: Virtual File System - an in-memory file and folder structure for demo purposes
- **Folder Tree**: A hierarchical tree view displaying the folder structure in the left pane
- **File List**: A list or grid view displaying files and folders in the right pane
- **Context Menu**: A right-click menu providing actions for files and folders
- **Explain Folder Action**: An AI-powered feature that analyzes folder contents and provides natural language explanations
- **AI Engine**: The core service that provides folder analysis and recommendation capabilities

## Requirements

### Requirement 1

**User Story:** As a user, I want to see a Win95-style Explorer window with dual panes, so that I can navigate the file system efficiently

#### Acceptance Criteria

1. WHEN the Explorer Application opens, THE Explorer Application SHALL render inside a Window component with Win95 chrome
2. THE Explorer Application SHALL display "Explorer" as the window title with a folder icon
3. THE Explorer Application SHALL render a toolbar with navigation buttons including Back, Forward, and Up
4. THE Explorer Application SHALL display a left pane containing the Folder Tree component
5. THE Explorer Application SHALL display a right pane containing the File List component
6. THE Explorer Application SHALL render a vertical splitter between the two panes allowing resize

### Requirement 2

**User Story:** As a user, I want to navigate folders using the folder tree, so that I can browse the file system hierarchy

#### Acceptance Criteria

1. WHEN the Explorer Application initializes, THE Folder Tree SHALL display the root folder and its immediate children
2. THE Folder Tree SHALL render folders with expand/collapse icons (+ and - symbols)
3. WHEN the user clicks a folder's expand icon, THE Folder Tree SHALL load and display that folder's children
4. WHEN the user clicks a folder's collapse icon, THE Folder Tree SHALL hide that folder's children
5. WHEN the user clicks a folder name, THE Explorer Application SHALL update the File List to show that folder's contents

### Requirement 3

**User Story:** As a user, I want to see files and folders in the file list, so that I can view the contents of the current directory

#### Acceptance Criteria

1. WHEN the Explorer Application displays a folder, THE File List SHALL render all files and subfolders in that folder
2. THE File List SHALL display each item with an icon, name, size, and modified date
3. THE File List SHALL use folder icons for directories and appropriate file type icons for files
4. THE File List SHALL support both list view and icon view display modes
5. WHEN the user double-clicks a folder in the File List, THE Explorer Application SHALL navigate into that folder

### Requirement 4

**User Story:** As a user, I want to right-click on folders to access actions, so that I can perform operations on folders

#### Acceptance Criteria

1. WHEN the user right-clicks a folder in the File List, THE Explorer Application SHALL display a Context Menu at the cursor position
2. THE Context Menu SHALL include options for "Open", "Rename", "Delete", and "Explain this folder"
3. THE Context Menu SHALL use Win95-style menu appearance with beveled borders
4. WHEN the user clicks outside the Context Menu, THE Explorer Application SHALL close the menu
5. WHEN the user clicks a menu item, THE Explorer Application SHALL execute the corresponding action and close the menu

### Requirement 5

**User Story:** As a user, I want to use the "Explain this folder" AI action, so that I can understand the purpose and contents of a folder

#### Acceptance Criteria

1. WHEN the user selects "Explain this folder" from the Context Menu, THE Explorer Application SHALL gather the folder's filenames and sample content
2. THE Explorer Application SHALL invoke the AI Engine explainFolder function with the folder data
3. WHEN the AI Engine returns an explanation, THE Explorer Application SHALL display the result in an Explanation Panel within the Explorer window
4. THE Explanation Panel SHALL show a natural language description of the folder contents
5. THE Explanation Panel SHALL include bullet-point recommendations such as "These look like notes" or "Maybe group these into categories X and Y"

### Requirement 6

**User Story:** As a user, I want to navigate using toolbar buttons, so that I can move through my browsing history

#### Acceptance Criteria

1. WHEN the user clicks the Back button, THE Explorer Application SHALL navigate to the previously viewed folder
2. WHEN the user clicks the Forward button, THE Explorer Application SHALL navigate to the next folder in the history
3. WHEN the user clicks the Up button, THE Explorer Application SHALL navigate to the parent folder of the current folder
4. THE Explorer Application SHALL disable the Back button when no previous history exists
5. THE Explorer Application SHALL disable the Forward button when no forward history exists

### Requirement 7

**User Story:** As a user, I want to see the current folder path, so that I know my location in the file system

#### Acceptance Criteria

1. THE Explorer Application SHALL display an address bar showing the current folder path
2. THE address bar SHALL use forward slashes to separate path components (e.g., "/documents/notes")
3. WHEN the user navigates to a different folder, THE Explorer Application SHALL update the address bar text
4. THE address bar SHALL use Win95-style inset border styling
5. THE Explorer Application SHALL allow the user to type a path in the address bar and press Enter to navigate

### Requirement 8

**User Story:** As a user, I want to create new folders, so that I can organize my files

#### Acceptance Criteria

1. WHEN the user right-clicks in empty space in the File List, THE Explorer Application SHALL display a Context Menu with a "New Folder" option
2. WHEN the user selects "New Folder", THE Explorer Application SHALL create a new folder with a default name "New Folder"
3. THE Explorer Application SHALL enter rename mode for the new folder immediately
4. THE Explorer Application SHALL call VFS createFolder function to persist the new folder
5. THE Explorer Application SHALL refresh the File List to show the new folder

### Requirement 9

**User Story:** As a user, I want to rename files and folders, so that I can organize my content meaningfully

#### Acceptance Criteria

1. WHEN the user selects "Rename" from the Context Menu, THE Explorer Application SHALL enter rename mode for the selected item
2. THE Explorer Application SHALL display an inline text input with the current name pre-filled
3. WHEN the user presses Enter, THE Explorer Application SHALL call VFS rename function with the new name
4. WHEN the user presses Escape, THE Explorer Application SHALL cancel rename mode without changes
5. IF the rename operation fails, THE Explorer Application SHALL display an error message in a Win95-style dialog

### Requirement 10

**User Story:** As a user, I want to delete files and folders, so that I can remove unwanted content

#### Acceptance Criteria

1. WHEN the user selects "Delete" from the Context Menu, THE Explorer Application SHALL display a Win95-style confirmation dialog
2. THE confirmation dialog SHALL ask "Are you sure you want to delete [item name]?"
3. WHEN the user confirms deletion, THE Explorer Application SHALL call VFS delete function to remove the item
4. THE Explorer Application SHALL refresh the File List to reflect the deletion
5. IF the deletion fails, THE Explorer Application SHALL display an error message in a Win95-style dialog

### Requirement 11

**User Story:** As a developer, I want Explorer to integrate with the AI Engine through a clean interface, so that AI features are maintainable and testable

#### Acceptance Criteria

1. THE Explorer Application SHALL import AI functions only from the core/ai-engine/aiClient module
2. THE Explorer Application SHALL NOT contain embedded AI logic or direct API calls
3. WHEN calling AI Engine functions, THE Explorer Application SHALL handle promise rejection with user-friendly error messages
4. THE Explorer Application SHALL display a loading indicator during AI operations
5. THE Explorer Application SHALL implement a timeout of 30 seconds for AI operations

### Requirement 12

**User Story:** As a user, I want keyboard shortcuts for common actions, so that I can work efficiently

#### Acceptance Criteria

1. WHEN the user presses F5, THE Explorer Application SHALL refresh the current folder view
2. WHEN the user presses Backspace, THE Explorer Application SHALL navigate to the parent folder
3. WHEN the user presses Alt+Left, THE Explorer Application SHALL navigate back in history
4. WHEN the user presses Alt+Right, THE Explorer Application SHALL navigate forward in history
5. WHEN the user presses Delete, THE Explorer Application SHALL delete the selected item after confirmation
