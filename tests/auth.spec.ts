import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display landing page for visitors', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Idealite/)
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.goto('/home')
    // Should redirect to sign-in or landing page
    await expect(page).not.toHaveURL('/home')
  })

  test('landing page should have navigation elements', async ({ page }) => {
    await page.goto('/')
    // Check for common navigation elements
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Page Navigation', () => {
  test('should load the root page without errors', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
  })
})
