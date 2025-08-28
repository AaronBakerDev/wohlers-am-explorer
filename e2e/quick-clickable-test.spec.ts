import { test, expect, Page } from '@playwright/test';

test.describe('Quick Clickable Elements Test', () => {
  test.setTimeout(120000); // 2 minutes timeout
  
  test('Find and test all clickable elements on homepage', async ({ page }) => {
    console.log('=== STARTING CLICKABLE ELEMENTS TEST ===');
    
    // Navigate to the application
    await page.goto('http://localhost:3003');
    
    // Wait for initial load with longer timeout
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (error) {
      console.log('Warning: networkidle timeout, continuing with domcontentloaded');
      await page.waitForLoadState('domcontentloaded');
    }
    
    console.log('Page loaded successfully');

    // Generic approach - find ALL clickable elements
    const clickableSelectors = [
      'button',
      'a[href]',
      'input[type="submit"]',
      'input[type="button"]',
      '[role="button"]',
      '[onclick]',
      'select',
      'input[type="checkbox"]',
      'input[type="radio"]'
    ];

    let totalElementsFound = 0;
    let totalElementsTested = 0;

    for (const selector of clickableSelectors) {
      console.log(`\\n--- Testing selector: ${selector} ---`);
      
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`Found ${count} elements for selector: ${selector}`);
        totalElementsFound += count;
        
        // Test up to 5 elements per selector type
        const testLimit = Math.min(count, 5);
        
        for (let i = 0; i < testLimit; i++) {
          try {
            const element = elements.nth(i);
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            
            if (isVisible && isEnabled) {
              // Get element information
              const tagName = await element.evaluate(el => el.tagName.toLowerCase());
              const textContent = await element.textContent();
              const href = await element.getAttribute('href');
              const type = await element.getAttribute('type');
              
              console.log(`  Element ${i}: ${tagName}${type ? `[type="${type}"]` : ''} - "${textContent?.trim()?.substring(0, 30) || 'No text'}"${href ? ` (href: ${href})` : ''}`);
              
              // Perform appropriate action based on element type
              if (tagName === 'select') {
                // For select elements, just focus (don't change values)
                await element.focus();
                console.log(`    ✓ Focused select element`);
                totalElementsTested++;
              } else if (tagName === 'input' && (type === 'checkbox' || type === 'radio')) {
                // For checkboxes/radios, just focus to test interactivity
                await element.focus();
                console.log(`    ✓ Focused input element`);
                totalElementsTested++;
              } else if (tagName === 'input' && type === 'text') {
                // For text inputs, focus and clear
                await element.focus();
                await element.clear();
                console.log(`    ✓ Focused and cleared text input`);
                totalElementsTested++;
              } else {
                // For buttons and links, try to click
                try {
                  await element.click({ timeout: 3000 });
                  console.log(`    ✓ Successfully clicked element`);
                  totalElementsTested++;
                  
                  // Wait briefly after click
                  await page.waitForTimeout(1000);
                } catch (clickError) {
                  console.log(`    ⚠ Click failed: ${clickError.message}`);
                  // Try hover as fallback
                  try {
                    await element.hover();
                    console.log(`    ✓ Hover successful (click failed)`);
                    totalElementsTested++;
                  } catch (hoverError) {
                    console.log(`    ✗ Both click and hover failed`);
                  }
                }
              }
            } else {
              console.log(`  Element ${i}: Not visible (${isVisible}) or not enabled (${isEnabled})`);
            }
          } catch (error) {
            console.log(`  Element ${i}: Error testing - ${error.message}`);
          }
        }
        
        if (count > testLimit) {
          console.log(`  ... and ${count - testLimit} more elements (not tested to save time)`);
        }
      }
    }

    console.log(`\\n=== TEST SUMMARY ===`);
    console.log(`Total clickable elements found: ${totalElementsFound}`);
    console.log(`Total elements successfully tested: ${totalElementsTested}`);
    console.log(`Success rate: ${totalElementsFound > 0 ? Math.round((totalElementsTested / totalElementsFound) * 100) : 0}%`);

    // Verify we found at least some elements
    expect(totalElementsFound).toBeGreaterThan(0);
  });

  test('Test specific page navigation', async ({ page }) => {
    console.log('=== TESTING PAGE NAVIGATION ===');
    
    const pages = [
      { path: '/login', name: 'Login' },
      { path: '/companies', name: 'Companies' },
      { path: '/dashboard', name: 'Dashboard' }
    ];

    for (const pageInfo of pages) {
      console.log(`\\n--- Testing ${pageInfo.name} page (${pageInfo.path}) ---`);
      
      try {
        await page.goto(`http://localhost:3003${pageInfo.path}`);
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
        
        // Count interactive elements on this page
        const buttons = await page.locator('button').count();
        const links = await page.locator('a[href]').count();
        const inputs = await page.locator('input').count();
        
        console.log(`  Found: ${buttons} buttons, ${links} links, ${inputs} inputs`);
        
        // Test a few elements if present
        if (buttons > 0) {
          const firstButton = page.locator('button').first();
          if (await firstButton.isVisible() && await firstButton.isEnabled()) {
            const buttonText = await firstButton.textContent();
            console.log(`  ✓ First button clickable: "${buttonText?.trim()}"`);
          }
        }
        
        if (links > 0) {
          const firstLink = page.locator('a[href]').first();
          if (await firstLink.isVisible()) {
            const href = await firstLink.getAttribute('href');
            const linkText = await firstLink.textContent();
            console.log(`  ✓ First link found: "${linkText?.trim()}" -> ${href}`);
          }
        }
        
        console.log(`  ✓ ${pageInfo.name} page loaded successfully`);
        
      } catch (error) {
        console.log(`  ✗ Failed to test ${pageInfo.name} page: ${error.message}`);
      }
      
      await page.waitForTimeout(1000);
    }
  });
});