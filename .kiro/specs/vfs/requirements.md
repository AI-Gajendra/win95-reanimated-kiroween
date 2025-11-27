# Virtual File System (VFS) Requirements

## Introduction

The Virtual File System (VFS) provides an in-memory file and folder structure for Win95 Reanimated. It simulates a file system with support for basic CRUD operations, enabling applications like Notepad and Explorer to store and retrieve documents without requiring actual disk access.

## Glossary

- **VFS**: Virtual File System - an in-memory data structure that simulates a hierarchical file system
- **File Node**: A data structure representing a file with content, metadata, and path
- **Folder Node**: A data structure representing a directory that can contain files and subfolders
- **Path**: A string representing the location of a file or folder in the hierarchy (e.g., "/documents/notes.txt")
- **Root Folder**: The top-level folder in the VFS hierarchy, represented by "/"
- **File System Tree**: The hierarchical structure of folders and files in the VFS

## Requirements

### Requirement 1

**User Story:** As a developer, I want to initialize the VFS with a default folder structure, so that users have a familiar starting point

#### Acceptance Criteria

1. WHEN the VFS initializes, THE VFS SHALL create a root folder at path "/"
2. THE VFS SHALL create default folders including "/documents", "/pictures", and "/programs"
3. THE VFS SHALL create sample files in the documents folder including "readme.txt" and "notes.txt"
4. THE VFS SHALL populate sample files with placeholder content
5. THE VFS SHALL store all nodes in an in-memory data structure accessible by path

### Requirement 2

**User Story:** As an application, I want to read folder contents, so that I can display files and subfolders to users

#### Acceptance Criteria

1. THE VFS SHALL expose a readFolder function that accepts a folder path string
2. WHEN readFolder is called with a valid folder path, THE VFS SHALL return an array of FileSystemItem objects for all direct children
3. THE returned array SHALL include both files and subfolders in the specified folder
4. THE FileSystemItem objects SHALL include properties: id, name, path, type, size, modifiedAt, and icon
5. IF the folder path does not exist, THE VFS SHALL throw a "Folder not found" error

### Requirement 3

**User Story:** As an application, I want to read file contents, so that I can display or process file data

#### Acceptance Criteria

1. THE VFS SHALL expose a readFile function that accepts a file path string
2. WHEN readFile is called with a valid file path, THE VFS SHALL return the file content as a string
3. THE VFS SHALL return file metadata including size, modifiedAt, and createdAt
4. IF the file path does not exist, THE VFS SHALL throw a "File not found" error
5. IF the path points to a folder instead of a file, THE VFS SHALL throw an "Invalid file path" error

### Requirement 4

**User Story:** As an application, I want to write file contents, so that I can save user data

#### Acceptance Criteria

1. THE VFS SHALL expose a writeFile function that accepts a file path string and content string
2. WHEN writeFile is called with a new file path, THE VFS SHALL create a new file node with the provided content
3. WHEN writeFile is called with an existing file path, THE VFS SHALL update the file content and modifiedAt timestamp
4. THE VFS SHALL automatically create parent folders if they do not exist
5. THE VFS SHALL calculate and store the file size based on content length

### Requirement 5

**User Story:** As an application, I want to create folders, so that users can organize their files

#### Acceptance Criteria

1. THE VFS SHALL expose a createFolder function that accepts a folder path string
2. WHEN createFolder is called with a new path, THE VFS SHALL create a new folder node at that path
3. THE VFS SHALL set the folder's createdAt and modifiedAt timestamps to the current time
4. IF the folder already exists, THE VFS SHALL throw a "Folder already exists" error
5. THE VFS SHALL automatically create parent folders if they do not exist

### Requirement 6

**User Story:** As an application, I want to delete files and folders, so that users can remove unwanted content

#### Acceptance Criteria

1. THE VFS SHALL expose a deleteItem function that accepts a path string
2. WHEN deleteItem is called with a file path, THE VFS SHALL remove the file node from the tree
3. WHEN deleteItem is called with a folder path, THE VFS SHALL remove the folder and all its contents recursively
4. IF the path does not exist, THE VFS SHALL throw an "Item not found" error
5. THE VFS SHALL update the parent folder's modifiedAt timestamp after deletion

### Requirement 7

**User Story:** As an application, I want to rename files and folders, so that users can organize their content

#### Acceptance Criteria

1. THE VFS SHALL expose a renameItem function that accepts an old path string and a new name string
2. WHEN renameItem is called, THE VFS SHALL update the item's name and path
3. IF the item has children (folder), THE VFS SHALL update all child paths recursively
4. IF the new name conflicts with an existing item in the same folder, THE VFS SHALL throw a "Name already exists" error
5. THE VFS SHALL update the item's modifiedAt timestamp after renaming

### Requirement 8

**User Story:** As an application, I want to check if a path exists, so that I can validate user input

#### Acceptance Criteria

1. THE VFS SHALL expose an exists function that accepts a path string
2. WHEN exists is called, THE VFS SHALL return true if the path points to a file or folder
3. WHEN exists is called with a non-existent path, THE VFS SHALL return false
4. THE exists function SHALL NOT throw errors for invalid paths
5. THE exists function SHALL handle both file and folder paths

### Requirement 9

**User Story:** As an application, I want to get item metadata, so that I can display file information

#### Acceptance Criteria

1. THE VFS SHALL expose a getMetadata function that accepts a path string
2. WHEN getMetadata is called, THE VFS SHALL return an object with properties: name, path, type, size, createdAt, modifiedAt
3. IF the path does not exist, THE VFS SHALL throw an "Item not found" error
4. THE metadata SHALL include accurate size information (0 for folders, content length for files)
5. THE metadata SHALL include ISO timestamp strings for createdAt and modifiedAt

### Requirement 10

**User Story:** As an application, I want to move files and folders, so that users can reorganize their content

#### Acceptance Criteria

1. THE VFS SHALL expose a moveItem function that accepts a source path string and destination path string
2. WHEN moveItem is called, THE VFS SHALL move the item to the new location
3. IF the item is a folder, THE VFS SHALL update all child paths recursively
4. IF the destination path already contains an item with the same name, THE VFS SHALL throw a "Destination already exists" error
5. THE VFS SHALL update modifiedAt timestamps for both source and destination parent folders

### Requirement 11

**User Story:** As a developer, I want the VFS to persist data to localStorage, so that user data survives page refreshes

#### Acceptance Criteria

1. WHEN the VFS modifies the file system tree, THE VFS SHALL serialize the tree to JSON
2. THE VFS SHALL store the serialized tree in localStorage with key "vfs-data"
3. WHEN the VFS initializes, THE VFS SHALL attempt to load data from localStorage
4. IF localStorage data exists, THE VFS SHALL deserialize and use it instead of creating default structure
5. IF localStorage is unavailable or data is corrupted, THE VFS SHALL fall back to default initialization

### Requirement 12

**User Story:** As a developer, I want the VFS to emit events for file system changes, so that UI components can react to updates

#### Acceptance Criteria

1. THE VFS SHALL emit a "fileCreated" event when a new file is created
2. THE VFS SHALL emit a "fileModified" event when a file's content is updated
3. THE VFS SHALL emit a "fileDeleted" event when a file is deleted
4. THE VFS SHALL emit a "folderCreated" event when a new folder is created
5. THE VFS SHALL emit a "folderDeleted" event when a folder is deleted
6. THE VFS SHALL include the affected path in all event payloads
