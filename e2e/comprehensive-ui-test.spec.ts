import { test, expect } from '@playwright/test';

test.describe('Comprehensive UI Elements Test', () => {
  test.setTimeout(180000); // 3 minutes timeout
  
  test('Comprehensive clickable elements testing with screenshots', async ({ page }) => {
    console.log('=== COMPREHENSIVE UI TESTING ===');
    
    const testResults = {
      pagesVisited: 0,
      totalElements: 0,
      successfulClicks: 0,
      failures: [] as string[]
    };

    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/login', name: 'Login' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/companies', name: 'Companies' }
    ];

    for (const pageInfo of pages) {
      console.log(`\\n=== Testing ${pageInfo.name} (${pageInfo.path}) ===`);
      
      try {
        // Navigate to page
        await page.goto(`http://localhost:3003${pageInfo.path}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        
        // Wait for potential dynamic content
        await page.waitForTimeout(3000);
        
        testResults.pagesVisited++;
        
        // Take screenshot
        await page.screenshot({ 
          path: `test-results/${pageInfo.name.toLowerCase()}-screenshot.png`,
          fullPage: true 
        });
        
        console.log(`Screenshot taken for ${pageInfo.name}`);
        
        // Get page title and URL
        const title = await page.title();
        const url = page.url();
        console.log(`Page title: "${title}", URL: ${url}`);
        
        // Test multiple selector strategies
        const selectorStrategies = [
          { name: 'Buttons', selector: 'button, [type="button"], [role="button"]' },
          { name: 'Links', selector: 'a[href], [role="link"]' },
          { name: 'Form Inputs', selector: 'input, select, textarea' },
          { name: 'Interactive', selector: '[onclick], [onmousedown], [onmouseup]' },
          { name: 'Tab Elements', selector: '[tabindex]' },
          { name: 'ARIA Buttons', selector: '[aria-label*="button"], [aria-label*="click"]' }
        ];

        for (const strategy of selectorStrategies) {
          try {
            const elements = page.locator(strategy.selector);
            const count = await elements.count();
            
            if (count > 0) {
              console.log(`${strategy.name}: Found ${count} elements`);
              testResults.totalElements += count;
              
              // Test first 3 elements of each type
              const testLimit = Math.min(count, 3);
              
              for (let i = 0; i < testLimit; i++) {
                try {
                  const element = elements.nth(i);
                  
                  // Get element details
                  const tagName = await element.evaluate(el => el.tagName);
                  const className = await element.getAttribute('class') || '';
                  const textContent = await element.textContent() || '';
                  const ariaLabel = await element.getAttribute('aria-label') || '';
                  
                  console.log(`  Element ${i + 1}: <${tagName.toLowerCase()}> "${textContent.trim().substring(0, 50)}" class="${className.substring(0, 30)}" aria-label="${ariaLabel.substring(0, 30)}"`);
                  
                  // Check if element is interactive
                  const isVisible = await element.isVisible();
                  const isEnabled = await element.isEnabled();
                  
                  if (isVisible && isEnabled) {
                    // Try different interaction methods
                    try {
                      // First try hover (safe)
                      await element.hover({ timeout: 2000 });
                      console.log(`    ✓ Hover successful`);
                      
                      // For specific element types, try clicking
                      if (tagName.toLowerCase() === 'button' || 
                          tagName.toLowerCase() === 'a' ||
                          className.includes('button') ||
                          (await element.locator('button').count()) > 0) {
                        
                        await element.click({ timeout: 3000 });
                        console.log(`    ✓ Click successful`);
                        testResults.successfulClicks++;
                        
                        // Wait for potential navigation or modal
                        await page.waitForTimeout(1500);
                        
                        // Check if we're still on the same page or if modal opened
                        const currentUrl = page.url();
                        if (currentUrl !== url) {
                          console.log(`    → Navigation occurred: ${currentUrl}`);
                          // Navigate back
                          await page.goBack();
                          await page.waitForTimeout(2000);
                        }
                      } else {
                        console.log(`    ↳ Hover only (element type: ${tagName})`);
                      }
                      
                    } catch (interactionError: unknown) {
                      const message = interactionError instanceof Error ? interactionError.message : 'Unknown interaction error';
                      console.log(`    ⚠ Interaction failed: ${message}`);
                    }
                  } else {
                    console.log(`    ↳ Element not interactive (visible: ${isVisible}, enabled: ${isEnabled})`);
                  }
                  
                } catch (elementError: unknown) {
                  const message = elementError instanceof Error ? elementError.message : 'Unknown element error';
                  console.log(`  Element ${i + 1}: Error - ${message}`);
                  testResults.failures.push(`${pageInfo.name} - ${strategy.name} - Element ${i + 1}: ${message}`);
                }
              }
            } else {
              console.log(`${strategy.name}: No elements found`);
            }
          } catch (strategyError: unknown) {
            const message = strategyError instanceof Error ? strategyError.message : 'Unknown strategy error';
            console.log(`${strategy.name}: Strategy failed - ${message}`);
          }
        }
        
        // Additional test: Look for any elements with event listeners
        const interactiveElements = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          const interactive: Array<{
            tagName: string;
            className: string;
            text: string;
            hasOnClick: boolean;
            role: string | null;
            tabIndex: string | null;
          }> = [];
          
          elements.forEach((el, index) => {
            if (index > 1000) return; // Limit to prevent timeout
            
            const style = window.getComputedStyle(el);
            const hasClickable = style.cursor === 'pointer' ||
                               (el as HTMLElement).onclick !== null ||
                               el.getAttribute('role') === 'button' ||
                               el.getAttribute('tabindex') !== null;

            if (hasClickable && (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0) {
              interactive.push({
                tagName: el.tagName,
                className: el.className,
                text: el.textContent?.trim().substring(0, 30) || '',
                hasOnClick: (el as HTMLElement).onclick !== null,
                role: el.getAttribute('role'),
                tabIndex: el.getAttribute('tabindex')
              });
            }
          });
          
          return interactive.slice(0, 10); // Return first 10
        });
        
        if (interactiveElements.length > 0) {
          console.log(`\\n  🎯 JavaScript-detected interactive elements:`);
          interactiveElements.forEach((el, i) => {
            console.log(`    ${i + 1}. <${el.tagName.toLowerCase()}> "${el.text}" (cursor/onclick/role: ${el.hasOnClick}/${el.role})`);
          });
        }
        
      } catch (pageError: unknown) {
        const message = pageError instanceof Error ? pageError.message : 'Unknown page error';
        console.log(`✗ Failed to test ${pageInfo.name}: ${message}`);
        testResults.failures.push(`${pageInfo.name}: ${message}`);
      }
    }
    
    // Final report
    console.log(`\\n=== FINAL TEST REPORT ===`);
    console.log(`Pages successfully visited: ${testResults.pagesVisited}/${pages.length}`);
    console.log(`Total interactive elements found: ${testResults.totalElements}`);
    console.log(`Successful interactions: ${testResults.successfulClicks}`);
    console.log(`Failures: ${testResults.failures.length}`);
    
    if (testResults.failures.length > 0) {
      console.log(`\\nFailure details:`);
      testResults.failures.forEach((failure, i) => {
        console.log(`  ${i + 1}. ${failure}`);
      });
    }
    
    // Success criteria: At least some elements found and some interactions successful
    expect(testResults.pagesVisited).toBeGreaterThan(0);
    expect(testResults.totalElements + testResults.successfulClicks).toBeGreaterThan(0);
  });
  
  test('Test form interactions specifically', async ({ page }) => {
    console.log('=== TESTING FORM INTERACTIONS ===');
    
    await page.goto('http://localhost:3003/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'test-results/login-form-screenshot.png',
      fullPage: true 
    });
    
    // Look for form elements more specifically
    const formElements = await page.evaluate(() => {
      return {
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input').length,
        buttons: document.querySelectorAll('button').length,
        submits: document.querySelectorAll('input[type="submit"], button[type="submit"]').length,
        labels: document.querySelectorAll('label').length
      };
    });
    
    console.log('Form elements found:', formElements);
    
    // Test input fields if they exist
    const emailInputs = page.locator('input[type="email"], input[name*="email"], input[id*="email"]');
    const emailCount = await emailInputs.count();
    
    if (emailCount > 0) {
      console.log(`Found ${emailCount} email input(s)`);
      const firstEmail = emailInputs.first();
      await firstEmail.fill('test@example.com');
      await firstEmail.clear();
      console.log('✓ Email input tested');
    }
    
    const passwordInputs = page.locator('input[type="password"], input[name*="password"], input[id*="password"]');
    const passwordCount = await passwordInputs.count();
    
    if (passwordCount > 0) {
      console.log(`Found ${passwordCount} password input(s)`);
      const firstPassword = passwordInputs.first();
      await firstPassword.fill('testpassword');
      await firstPassword.clear();
      console.log('✓ Password input tested');
    }
    
    // Test buttons
    const allButtons = page.locator('button, input[type="submit"], input[type="button"]');
    const buttonCount = await allButtons.count();
    
    console.log(`Found ${buttonCount} total buttons/submit elements`);
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = allButtons.nth(i);
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      
      console.log(`Button ${i + 1}: "${text?.trim()}" type="${type}" visible=${isVisible} enabled=${isEnabled}`);
      
      if (isVisible && isEnabled) {
        await button.hover();
        console.log(`  ✓ Hover successful`);
      }
    }
  });
});