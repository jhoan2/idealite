import { test, expect } from '@playwright/test';

/**
 * This test captures the CURRENT behavior of the editor.
 * We will run this against the NEW /notes route later to 
 * ensure the user experience remains identical.
 */
test.describe('Editor Baseline Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This assumes you have a way to bypass auth or a test user.
    // For now, we just navigate to the workspace.
    await page.goto('/workspace');
  });

  test('can type and trigger auto-save', async ({ page }) => {
    // 1. Find the editor (ProseMirror/Tiptap uses .tiptap class)
    const editor = page.locator('.tiptap').first();
    await editor.waitFor();

    // 2. Type some content
    await editor.fill('Testing baseline editor functionality.');
    
    // 3. Verify the saving indicator appears (current behavior)
    // We expect this to CHANGE in the new version (it will be background sync)
    const savingIndicator = page.locator('text=Saving...');
    await expect(savingIndicator).toBeVisible();
    
    // 4. Verify it eventually says "Saved" or the icon changes
    const savedIndicator = page.locator('.lucide-file-check');
    await expect(savedIndicator).toBeVisible({ timeout: 10000 });
  });

  test('markdown shortcuts work', async ({ page }) => {
    const editor = page.locator('.tiptap').first();
    await editor.focus();

    // Type "# " and it should turn into an H1
    await page.keyboard.type('# Heading 1');
    await page.keyboard.press('Enter');

    const h1 = editor.locator('h1');
    await expect(h1).toHaveText('Heading 1');
  });

  test('mention menu [[ appears', async ({ page }) => {
    const editor = page.locator('.tiptap').first();
    await editor.focus();

    await page.keyboard.type('[[ ');
    
    // Check if the suggestion list appears
    const suggestionList = page.locator('.mention-list, [role="listbox"]'); 
    // Adjust selector based on your actual MentionList.tsx output
    await expect(suggestionList).toBeVisible();
  });
});
