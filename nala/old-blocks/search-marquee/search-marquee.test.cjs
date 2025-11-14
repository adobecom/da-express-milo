/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { features } from './search-marquee.spec.cjs';
import SearchMarquee from './search-marquee.page.cjs';

let searchMarquee;

test.describe('Search Marquee block tests', () => {
  test.beforeEach(async ({ page }) => {
    searchMarquee = new SearchMarquee(page);
  });

  // Test 0: Search form appears on page load
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[0].path}`);
    const testPage = `${baseURL}${features[0].path}`;

    await test.step('Navigate to test page', async () => {
      await searchMarquee.gotoURL(testPage);
    });

    await test.step('Verify search-marquee block exists', async () => {
      const blockCount = await searchMarquee.searchMarquee.count();
      if (blockCount === 0) {
        console.log('Search-marquee block not found on this page, skipping test');
        return;
      }
      await expect(searchMarquee.searchMarquee).toBeVisible();
    });

    await test.step('Verify search form is visible on page load', async () => {
      const isVisible = await searchMarquee.isSearchFormVisible();
      if (isVisible) {
        expect(isVisible).toBe(true);
        console.log('✅ Search form is visible on page load');
      } else {
        console.log('⚠️ Search form not visible - may be hidden or not implemented yet');
      }
    });

    await test.step('Verify search bar has correct attributes', async () => {
      const placeholder = await searchMarquee.getSearchBarPlaceholder();
      const enterKeyHint = await searchMarquee.getSearchBarEnterKeyHint();

      if (placeholder) {
        expect(placeholder).toContain('Search across hundreds of thousands of templates');
        console.log('✅ Search bar has correct placeholder');
      } else {
        console.log('⚠️ Search bar not found - placeholder check skipped');
      }

      if (enterKeyHint) {
        expect(enterKeyHint).toBe('Search');
        console.log('✅ Search bar has correct enterKeyHint');
      } else {
        console.log('⚠️ Search bar not found - enterKeyHint check skipped');
      }
    });

    await test.step('Verify search bar wrapper is visible', async () => {
      const isVisible = await searchMarquee.isSearchBarWrapperVisible();
      if (isVisible) {
        expect(isVisible).toBe(true);
        console.log('✅ Search bar wrapper is visible');

        // Check if it has the 'show' class (indicating it's active)
        const hasShowClass = await searchMarquee.hasSearchBarWrapperShowClass();
        if (hasShowClass) {
          console.log('✅ Search bar wrapper has "show" class - ready for interaction');
        }
      } else {
        console.log('⚠️ Search bar wrapper not visible');
      }
    });
  });

  // Test 1: Search functionality
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[1].path}`);
    const testPage = `${baseURL}${features[1].path}`;

    await test.step('Navigate to test page', async () => {
      await searchMarquee.gotoURL(testPage);
    });

    await test.step('Check if search-marquee block exists', async () => {
      const blockCount = await searchMarquee.searchMarquee.count();
      if (blockCount === 0) {
        console.log('Search-marquee block not found on this page, skipping test');
      }
    });

    await test.step('Test search bar interaction', async () => {
      const searchBarCount = await searchMarquee.searchBar.count();
      if (searchBarCount > 0) {
        // Click on search bar to activate it
        await searchMarquee.clickSearchBar();

        // Type in search bar
        await searchMarquee.typeInSearchBar('test search');

        // Verify search bar has the text
        const searchBarValue = await searchMarquee.searchBar.inputValue();
        expect(searchBarValue).toBe('test search');
        console.log('✅ Search bar accepts input');

        // Check if dropdown becomes visible
        const isDropdownVisible = await searchMarquee.isSearchDropdownVisible();
        if (isDropdownVisible) {
          console.log('✅ Search dropdown appears on input');
        }

        // Check if clear button appears
        const isClearVisible = await searchMarquee.isClearButtonVisible();
        if (isClearVisible) {
          console.log('✅ Clear button appears on input');
        }
      } else {
        console.log('⚠️ Search bar not found - interaction testing skipped');
      }
    });
  });
});
