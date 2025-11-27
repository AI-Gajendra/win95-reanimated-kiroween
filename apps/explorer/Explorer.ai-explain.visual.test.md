# Explorer AI Explain Feature - Visual Test

## Test: Explain Folder Action

### Setup
1. Launch the Win95 Reanimated application
2. Open the Explorer application from the Start Menu or Desktop

### Test Steps

#### Test 1: Explain Folder via Context Menu
1. Navigate to any folder with files (e.g., `/documents`)
2. Right-click on a folder in the file list
3. Select "Explain this folder" from the context menu
4. **Expected Result:**
   - Loading indicator appears with "Analyzing folder..." message
   - After a moment, the ExplanationPanel appears on the right side
   - Panel shows:
     - Folder path
     - AI-generated description of folder contents
     - Bullet-point recommendations

#### Test 2: Close Explanation Panel
1. With an explanation panel open
2. Click the "×" button in the panel's title bar
3. **Expected Result:**
   - Panel closes smoothly
   - Explorer returns to normal view

#### Test 3: Explain Empty Folder
1. Create a new empty folder
2. Right-click on the empty folder
3. Select "Explain this folder"
4. **Expected Result:**
   - Loading indicator appears
   - Explanation panel shows appropriate message for empty folder
   - Recommendations suggest adding files

#### Test 4: Explain Folder with Multiple File Types
1. Navigate to a folder with various file types (txt, md, js, etc.)
2. Right-click on the folder
3. Select "Explain this folder"
4. **Expected Result:**
   - AI analyzes the different file types
   - Description mentions the variety of content
   - Recommendations are relevant to the file types present

#### Test 5: Error Handling
1. Simulate a network error (if using real AI provider)
2. Try to explain a folder
3. **Expected Result:**
   - Error message appears in explanation panel
   - User-friendly error message displayed
   - Recommendations suggest retry or checking connection

### Visual Verification

#### ExplanationPanel Styling
- [ ] Panel has Win95-style outset border
- [ ] Title bar is navy blue with white text
- [ ] Close button has proper Win95 button styling
- [ ] Content area has proper inset borders
- [ ] Text uses MS Sans Serif font at 11px
- [ ] Bullet points are properly formatted
- [ ] Panel is positioned on the right side of Explorer

#### Loading Indicator
- [ ] Loading spinner appears centered
- [ ] "Analyzing folder..." text is visible
- [ ] Background has semi-transparent overlay
- [ ] Loading dialog has Win95 styling

#### Integration
- [ ] Context menu shows "Explain this folder" option
- [ ] Option only appears for folders (not files)
- [ ] Clicking option triggers the explain action
- [ ] Panel overlays the file list without breaking layout

### Performance
- [ ] Loading indicator appears within 100ms of clicking
- [ ] AI response completes within 30 seconds (or times out gracefully)
- [ ] Panel opens smoothly without lag
- [ ] Closing panel is instant

### Accessibility
- [ ] Close button has proper aria-label
- [ ] Panel content is readable
- [ ] Keyboard navigation works (if implemented)

## Notes
- This feature uses the AI Engine abstraction layer
- Mock provider returns instant responses for testing
- Real AI providers may take longer but should timeout at 30 seconds
- Error handling ensures the app never crashes from AI failures
