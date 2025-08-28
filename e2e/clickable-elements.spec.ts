import { test, expect, Page } from '@playwright/test';

test.describe('Clickable Elements Testing', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to the application
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
  });

  test('Navigation Elements - Sidebar and Header', async () => {
    console.log('Testing navigation elements...');
    
    // Test sidebar navigation items
    const sidebarItems = [
      '[data-testid="nav-dashboard"], a[href*="dashboard"]',
      '[data-testid="nav-companies"], a[href*="companies"]',
      '[data-testid="nav-map"], a[href*="map"]',
      '[data-testid="nav-analytics"], a[href*="analytics"]',
      '[data-testid="nav-market-insights"], a[href*="market"]',
      '[data-testid="nav-quotes"], a[href*="quotes"]'
    ];

    for (const selector of sidebarItems) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`Found ${count} navigation element(s) for selector: ${selector}`);
        
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          
          console.log(`  Element ${i}: visible=${isVisible}, enabled=${isEnabled}`);
          
          if (isVisible && isEnabled) {
            await element.click({ timeout: 5000 });
            await page.waitForTimeout(1000); // Wait for navigation
            console.log(`  ✓ Successfully clicked navigation element ${i}`);
          }
        }
      } else {
        console.log(`No elements found for selector: ${selector}`);
      }
    }

    // Test theme toggle if present
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Light")');
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      console.log('✓ Theme toggle clicked');
    }

    // Test user menu if present
    const userMenu = page.locator('[data-testid="user-menu"], button:has([data-testid="avatar"])');
    if (await userMenu.count() > 0) {
      await userMenu.first().click();
      console.log('✓ User menu clicked');
    }
  });

  test('Filter Controls and Interactions', async () => {
    console.log('Testing filter controls...');
    
    // Navigate to a page with filters (companies or dashboard)
    await page.goto('http://localhost:3003/companies');
    await page.waitForLoadState('networkidle');

    // Test filter dropdowns
    const filterSelectors = [
      'select[name*="technology"], [data-testid*="technology-filter"]',
      'select[name*="material"], [data-testid*="material-filter"]',
      'select[name*="location"], [data-testid*="location-filter"]',
      'input[name*="search"], [data-testid="search-input"]',
      'button:has-text("Filter"), [data-testid*="filter-button"]',
      'button:has-text("Clear"), [data-testid*="clear-button"]'
    ];

    for (const selector of filterSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`Found ${count} filter element(s) for: ${selector}`);
        
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          
          if (isVisible && isEnabled) {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            
            if (tagName === 'select') {
              // Test select dropdown
              await element.selectOption({ index: 1 });
              console.log(`  ✓ Selected option in dropdown ${i}`);
            } else if (tagName === 'input') {
              // Test input field
              await element.fill('test');
              await element.clear();
              console.log(`  ✓ Tested input field ${i}`);
            } else {
              // Test button click
              await element.click();
              console.log(`  ✓ Clicked filter button ${i}`);
            }
          }
        }
      }
    }

    // Test filter chips/tags if present
    const filterChips = page.locator('[data-testid*="filter-chip"], .filter-chip, button:has-text("×")');
    const chipCount = await filterChips.count();
    if (chipCount > 0) {
      console.log(`Found ${chipCount} filter chips`);
      // Click first few chips to test removal
      for (let i = 0; i < Math.min(chipCount, 3); i++) {
        if (await filterChips.nth(i).isVisible()) {
          await filterChips.nth(i).click();
          console.log(`  ✓ Removed filter chip ${i}`);
        }
      }
    }
  });

  test('Data Table Interactions', async () => {
    console.log('Testing data table interactions...');
    
    await page.goto('http://localhost:3003/companies');
    await page.waitForLoadState('networkidle');

    // Test table sorting
    const sortableHeaders = page.locator('th button, th[role="columnheader"], .sortable-header');
    const headerCount = await sortableHeaders.count();
    
    if (headerCount > 0) {
      console.log(`Found ${headerCount} sortable headers`);
      
      for (let i = 0; i < Math.min(headerCount, 5); i++) {
        const header = sortableHeaders.nth(i);
        if (await header.isVisible() && await header.isEnabled()) {
          await header.click();
          await page.waitForTimeout(500);
          console.log(`  ✓ Clicked sortable header ${i}`);
        }
      }
    }

    // Test pagination controls
    const paginationButtons = page.locator('[data-testid*="pagination"], .pagination button, button:has-text("Next"), button:has-text("Previous")');
    const paginationCount = await paginationButtons.count();
    
    if (paginationCount > 0) {
      console.log(`Found ${paginationCount} pagination buttons`);
      
      for (let i = 0; i < paginationCount; i++) {
        const button = paginationButtons.nth(i);
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click();
          await page.waitForTimeout(500);
          console.log(`  ✓ Clicked pagination button ${i}`);
        }
      }
    }

    // Test row actions if present
    const rowActions = page.locator('tr button, [data-testid*="row-action"], .row-action');
    const actionCount = await rowActions.count();
    
    if (actionCount > 0) {
      console.log(`Found ${actionCount} row action buttons`);
      
      // Test first few row actions
      for (let i = 0; i < Math.min(actionCount, 3); i++) {
        const action = rowActions.nth(i);
        if (await action.isVisible() && await action.isEnabled()) {
          await action.click();
          await page.waitForTimeout(500);
          console.log(`  ✓ Clicked row action ${i}`);
        }
      }
    }
  });

  test('Map Interactions and Controls', async () => {
    console.log('Testing map interactions...');
    
    await page.goto('http://localhost:3003/map');
    await page.waitForLoadState('networkidle');
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container, [data-testid="map"]', { timeout: 10000 });

    // Test map zoom controls
    const zoomControls = page.locator('.leaflet-control-zoom button, [data-testid*="zoom"]');
    const zoomCount = await zoomControls.count();
    
    if (zoomCount > 0) {
      console.log(`Found ${zoomCount} zoom controls`);
      
      for (let i = 0; i < zoomCount; i++) {
        const control = zoomControls.nth(i);
        if (await control.isVisible()) {
          await control.click();
          await page.waitForTimeout(500);
          console.log(`  ✓ Clicked zoom control ${i}`);
        }
      }
    }

    // Test map markers
    const markers = page.locator('.leaflet-marker, [data-testid*="marker"]');
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      console.log(`Found ${markerCount} map markers`);
      
      // Click first few markers
      for (let i = 0; i < Math.min(markerCount, 5); i++) {
        const marker = markers.nth(i);
        if (await marker.isVisible()) {
          await marker.click();
          await page.waitForTimeout(500);
          console.log(`  ✓ Clicked marker ${i}`);
        }
      }
    }

    // Test map layer controls if present
    const layerControls = page.locator('.leaflet-control-layers, [data-testid*="layer"]');
    if (await layerControls.count() > 0) {
      await layerControls.first().click();
      console.log('✓ Opened layer controls');
      
      // Test layer options
      const layerOptions = page.locator('.leaflet-control-layers input');
      const optionCount = await layerOptions.count();
      
      for (let i = 0; i < Math.min(optionCount, 3); i++) {
        const option = layerOptions.nth(i);
        if (await option.isVisible()) {
          await option.click();
          console.log(`  ✓ Toggled layer option ${i}`);
        }
      }
    }
  });

  test('Authentication Flows', async () => {
    console.log('Testing authentication elements...');
    
    // Test login page elements
    await page.goto('http://localhost:3003/login');
    await page.waitForLoadState('networkidle');

    const authElements = [
      'input[type="email"], [data-testid="email-input"]',
      'input[type="password"], [data-testid="password-input"]',
      'button[type="submit"], [data-testid="login-button"]',
      'a[href*="register"], [data-testid="register-link"]',
      'a[href*="forgot"], [data-testid="forgot-password-link"]',
      'button:has-text("Google"), [data-testid="google-login"]',
      'button:has-text("Bypass"), [data-testid="bypass-auth"]'
    ];

    for (const selector of authElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`Found ${count} auth element(s) for: ${selector}`);
        
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          
          if (isVisible && isEnabled) {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            
            if (tagName === 'input') {
              const type = await element.getAttribute('type');
              if (type === 'email') {
                await element.fill('test@example.com');
                await element.clear();
              } else if (type === 'password') {
                await element.fill('testpassword');
                await element.clear();
              }
              console.log(`  ✓ Tested input field ${i} (type: ${type})`);
            } else {
              // For buttons and links, just hover to test interactivity
              await element.hover();
              console.log(`  ✓ Hovered over element ${i}`);
            }
          }
        }
      }
    }

    // Test register page if accessible
    const registerLink = page.locator('a[href*="register"]');
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Test register form elements
      const registerInputs = page.locator('input[type="email"], input[type="password"], input[name*="confirm"]');
      const inputCount = await registerInputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = registerInputs.nth(i);
        if (await input.isVisible() && await input.isEnabled()) {
          await input.fill('test');
          await input.clear();
          console.log(`  ✓ Tested register input ${i}`);
        }
      }
    }
  });

  test('Export and Action Buttons', async () => {
    console.log('Testing export and action buttons...');
    
    // Navigate to pages with export functionality
    const pages = [
      '/companies',
      '/analytics',
      '/market-insights'
    ];

    for (const pagePath of pages) {
      console.log(`Testing buttons on ${pagePath}...`);
      await page.goto(`http://localhost:3003${pagePath}`);
      await page.waitForLoadState('networkidle');

      // Test export buttons
      const exportButtons = page.locator('button:has-text("Export"), [data-testid*="export"], button:has-text("Download"), button:has-text("CSV"), button:has-text("JSON")');
      const exportCount = await exportButtons.count();
      
      if (exportCount > 0) {
        console.log(`  Found ${exportCount} export buttons`);
        
        for (let i = 0; i < exportCount; i++) {
          const button = exportButtons.nth(i);
          if (await button.isVisible() && await button.isEnabled()) {
            await button.hover(); // Hover instead of click to avoid downloads
            console.log(`    ✓ Hovered over export button ${i}`);
          }
        }
      }

      // Test action buttons
      const actionButtons = page.locator('button:has-text("Apply"), button:has-text("Save"), button:has-text("Reset"), [data-testid*="action-button"]');
      const actionCount = await actionButtons.count();
      
      if (actionCount > 0) {
        console.log(`  Found ${actionCount} action buttons`);
        
        for (let i = 0; i < actionCount; i++) {
          const button = actionButtons.nth(i);
          if (await button.isVisible() && await button.isEnabled()) {
            await button.click();
            await page.waitForTimeout(500);
            console.log(`    ✓ Clicked action button ${i}`);
          }
        }
      }
    }
  });

  test('Modal and Dialog Interactions', async () => {
    console.log('Testing modal and dialog interactions...');
    
    await page.goto('http://localhost:3003/companies');
    await page.waitForLoadState('networkidle');

    // Look for buttons that might open modals
    const modalTriggers = page.locator('button:has-text("Settings"), button:has-text("Info"), button:has-text("Details"), [data-testid*="modal-trigger"]');
    const triggerCount = await modalTriggers.count();
    
    if (triggerCount > 0) {
      console.log(`Found ${triggerCount} potential modal triggers`);
      
      for (let i = 0; i < triggerCount; i++) {
        const trigger = modalTriggers.nth(i);
        
        if (await trigger.isVisible() && await trigger.isEnabled()) {
          await trigger.click();
          await page.waitForTimeout(1000);
          
          // Look for modal close buttons
          const closeButtons = page.locator('button:has-text("Close"), button:has-text("×"), [data-testid*="close"], [aria-label*="close"]');
          
          if (await closeButtons.count() > 0) {
            await closeButtons.first().click();
            console.log(`    ✓ Opened and closed modal ${i}`);
          } else {
            // Try ESC key to close modal
            await page.keyboard.press('Escape');
            console.log(`    ✓ Opened modal ${i} and pressed ESC`);
          }
          
          await page.waitForTimeout(500);
        }
      }
    }

    // Test dropdown menus
    const dropdownTriggers = page.locator('[data-testid*="dropdown"], button[aria-haspopup="true"], .dropdown-trigger');
    const dropdownCount = await dropdownTriggers.count();
    
    if (dropdownCount > 0) {
      console.log(`Found ${dropdownCount} dropdown triggers`);
      
      for (let i = 0; i < dropdownCount; i++) {
        const trigger = dropdownTriggers.nth(i);
        
        if (await trigger.isVisible() && await trigger.isEnabled()) {
          await trigger.click();
          await page.waitForTimeout(500);
          
          // Click away to close dropdown
          await page.click('body');
          console.log(`    ✓ Opened and closed dropdown ${i}`);
        }
      }
    }
  });
});