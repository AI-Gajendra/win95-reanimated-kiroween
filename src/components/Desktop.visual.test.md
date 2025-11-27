# Visual Regression Testing Guide

Visual regression tests for the Desktop System would require a browser automation tool like Playwright or Puppeteer to capture screenshots and compare them against baseline images.

## Setup Required

1. Install Playwright or Puppeteer:
   ```bash
   npm install --save-dev @playwright/test
   # or
   npm install --save-dev puppeteer
   ```

2. Configure visual regression testing tool (e.g., Percy, Chromatic, or custom solution)

## Test Cases to Implement

### Desktop Appearance
- Capture screenshot of desktop after boot completes
- Verify Win95 teal background color
- Verify taskbar positioning at bottom

### Taskbar Styling
- Capture screenshot of taskbar
- Verify Win95 beveled border styling
- Verify Start button appearance
- Verify system tray clock display

### Start Menu Styling
- Capture screenshot of open Start Menu
- Verify Win95 menu styling with beveled borders
- Verify sidebar with Windows 95 branding
- Verify application list formatting

### Window Chrome
- Capture screenshot of open window (Notepad)
- Verify title bar styling (navy blue background, white text)
- Verify window borders (beveled, 3D appearance)
- Verify control buttons (minimize, maximize, close)

## Example Playwright Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Desktop Visual Regression', () => {
  test('desktop appearance matches baseline', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for boot to complete
    await page.waitForTimeout(3500);
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('desktop-full.png');
  });

  test('taskbar styling matches baseline', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3500);
    
    // Capture taskbar screenshot
    const taskbar = page.locator('[aria-label="Taskbar"]');
    await expect(taskbar).toHaveScreenshot('taskbar.png');
  });

  test('start menu styling matches baseline', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3500);
    
    // Open Start Menu
    await page.click('button:has-text("Start")');
    
    // Capture Start Menu screenshot
    await expect(page).toHaveScreenshot('start-menu.png');
  });
});
```

## Running Visual Tests

```bash
# With Playwright
npx playwright test --update-snapshots  # Update baseline images
npx playwright test                      # Run visual regression tests

# With Percy (requires Percy account)
npx percy exec -- npm test
```

## Notes

- Visual regression tests are best run in CI/CD pipelines
- Baseline images should be committed to version control
- Tests may need adjustment for different screen sizes/resolutions
- Consider using a visual regression service like Percy or Chromatic for easier management
