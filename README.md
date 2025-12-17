# Express Milo
Official repo for adobe.com/express 

## Developing
1. Install the [Helix CLI](https://github.com/adobe/helix-cli): `sudo npm install -g @adobe/helix-cli`
1. Run `aem up` this repo's folder. (opens your browser at `http://localhost:3000`)
1. Open this repo's folder in your favorite editor and start coding.

## Testing
```sh
npm run test
```
or:
```sh
npm run test:watch
```
This will give you several options to debug tests. Note: coverage may not be accurate.

### Running a Single Test File
To run a specific test file with debugging enabled:
```sh
npx wtr --config ./web-test-runner.config.js --node-resolve --port=2000 "**/pricing.test.js" --debug
```
Replace `pricing.test.js` with your specific test file name. The `--debug` flag enables debugging capabilities.



-----
### Nala E2E UI Testing
-----

#### 1. Running Nala Tests
- Ensure you have run  `npm install` in the project root.
- You may also need to run `npx playwright install` to install all playwright browsers
- Nala tests can be executed using the following command:
  ```sh
    npm run nala <env> [options]
  ```
  ```sh
  # env: [main | stage | etc ]

  # options:
    - browser=<chrome|firefox|webkit>    # Browser to use (default: chrome)
    - device=<desktop|mobile>            # Device (default: desktop)
    - test=<.test.cjs>                   # Specific test file to run (runs all tests in the file)
    - -g, --g=<@tag>                     # Tag to filter tests by annotations ex: @test1, @ax-columns, @ax-marquee
    - mode=<headless|ui|debug|headed>    # Mode (default: headless)
    - config=<config-file>               # Configuration file (default: Playwright default)
    - project=<project-name>             # Project configuration (default: express-live-chromium)
    - milolibs=<main|stage|feat-branch|> # Milolibs?=<env> 
  ```

- Examples:

  ```sh
  - npm run nala stage @ax-columns                 # Run ax-columns block tests on express stage env on chrome browser
  - npm run nala stage @ax-columns browser=firefox # Run ax-columns block tests on express stage env on firefox browser
  - npm run nala stage milolibs=stage              # Run express tests on stage env with Milo Stage libs                                    
  ```

#### 2. Nala Help Command:
---
To view examples of how to use Nala commands with various options, you can run
```sh
npm run nala help
```

#### ⚠️ Important Note
- **Debug and UI Mode Caution**: When using `debug` or `ui` mode, it is recommended to run only a single test using annotations (e.g., `@test1`). Running multiple tests in these modes (e.g., `npm run nala stage mode=debug` or `mode=ui`) will launch a separate browser or debugger window for each test, which can quickly become resource-intensive and challenging to manage.

- **Tip**: To effectively watch or debug, focus on one test at a time to avoid opening excessive browser instances or debugger windows.

#### 3. Nala Accessiblity Testing:
---
  - Run accessibility tests using following command:

  ```sh
    - npm run a11y <env|url> [path] [options]
  ```

```sh
# env: [main | stage | branch-name | full URL]

# path: Optional relative path to append to the env or URL

# options:
  -f, --file <filePath>            # Path to a file containing multiple URLs (one per line)
  -s, --scope <scope>              # DOM scope to test (default: body)
  -t, --tags <tag1,tag2>           # WCAG tags to include (e.g., wcag2a,wcag21aa)
  -m, --max-violations <number>    # Max allowed violations before test fails (default: 0)
  -o, --output-dir <directory>     # Directory to save HTML reports (default: ./test-a11y-results)

```
- Examples:

```sh
  - npm run a11y https://adobe.com
  - npm run a11y stage /drafts/nala/blocks/ax-columns/ax-column-highlight
  - npm run a11y https://adobe.com -- -t 'wcag2a'
  - npm run a11y main -f urls.txt
```

#### 4. Nala Documentation
For detailed guides and documentation on Nala, please visit the [Nala GitHub Wiki](https://github.com/adobecom/milo/wiki/Nala#nala-introduction).

-----

## Pull Request Workflow & Labels

This project uses automated workflows for merging to stage and main branches. Understanding the label system is crucial for getting your changes deployed.

### Required Labels for Merging

#### **Ready for Review**
- **Purpose**: Indicates PR is ready for code review
- **Effect**: PR will be reviewed by team members
- **Requirement**: Must be removed before auto-merge to stage
- **Usage**: Add when PR is complete and ready for feedback

#### **Ready for Stage** 
- **Purpose**: Marks PR as ready for merge to stage environment
- **Effect**: PR will be included in next automated merge batch to stage
- **Requirements**: 
  - Must have 2+ approvals (configurable)
  - Must pass all required checks
  - Must NOT have "Ready for Review" label
- **Usage**: Add after addressing all review feedback

#### **QA Approved**
- **Purpose**: Alternative to "Ready for Stage" indicating QA has tested the changes
- **Effect**: PR will be included in next automated merge batch to stage
- **Requirements**: Same as "Ready for Stage"
- **Usage**: Add when QA team has verified functionality

#### **Ready for Main**
- **Purpose**: Indicates PR should be merged from stage to main (production)
- **Effect**: Stage-to-main PR will be auto-merged during next cycle
- **Requirements**: 
  - Must be on stage-to-main PR
  - Must have sufficient approvals
  - Must pass all checks including PSI (PageSpeed Insights)
- **Usage**: Automatically managed by workflows

#### **Zero Impact**
- **Purpose**: Marks changes as having no functional impact (docs, tests, etc.)
- **Effect**: 
  - Can be merged alongside other PRs without file conflict concerns
  - Bypasses some restrictions in batch merging
- **Usage**: Add for documentation, test, or configuration changes that don't affect functionality. Always add "Ready for QA" when reviews are complete.

#### **Do Not Merge**
- **Purpose**: Prevents PR from being auto-merged
- **Effect**: PR will be skipped by all automated merge workflows
- **Usage**: Add when PR needs to be held back for any reason

#### **Run Nala**
- **Purpose**: Triggers automated Nala test execution
- **Effect**: Runs comprehensive end-to-end test suite against PR
- **Usage**: Add when you want to run full test coverage

### Auto-Merge Process

#### **Merge to Stage Workflow**
- **Frequency**: Runs every 4 hours
- **Batch Size**: Up to 8 PRs per batch (configurable)
- **Selection Criteria**:
  - Has "Ready for Stage" OR "QA Approved" label
  - Does NOT have "Ready for Review" label
  - Has 2+ approvals
  - All checks passing
  - No file conflicts with other PRs in batch

#### **Merge to Main Workflow** 
- **Frequency**: Runs every 4 hours
- **Target**: Stage-to-main PRs only
- **Requirements**:
  - Stage-to-main PR exists
  - Has sufficient approvals
  - All checks passing (including PSI)
  - Within RCP (Release Control Period) guidelines

### Workflow Commands

#### **Manual Triggers**
You can manually trigger workflows either via the GitHub UI, or repository dispatch:

https://github.com/adobecom/da-express-milo/actions

Dispatch:

```bash
# Trigger merge to stage
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/adobecom/da-express-milo/dispatches \
  -d '{"event_type":"merge-to-stage"}'

# Trigger merge to main  
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/adobecom/da-express-milo/dispatches \
  -d '{"event_type":"merge-to-main"}'
```

### Best Practices

#### **For Developers**
1. **Start with "Ready for Review"** when PR is complete
2. **Address all feedback** before removing "Ready for Review"
3. **Add "Ready for Stage"** only when truly ready for staging
4. **Use "Zero Impact"** appropriately for non-functional changes
5. **Check file conflicts** - similar files edited in same batch may conflict

#### **For QA Team**
1. **Use "QA Approved"** instead of "Ready for Stage" always.
2. **Test on staging environment** before approving stage-to-main
3. **Consider "Run Nala"** for comprehensive test coverage

#### **For Reviewers**
1. **Remove "Ready for Review"** after thorough review
2. **Add "Do Not Merge"** if changes need to be held
3. **Verify PageSpeed impact** for performance-critical changes

### Troubleshooting Common Issues

#### **PR Not Getting Merged**
- Check required labels are present
- Verify all checks are passing
- Ensure sufficient approvals (2+)
- Check for file conflicts with other PRs
- Remove "Ready for Review" if still present

#### **Stage to Main Delays**
- Verify PageSpeed Insights checks are passing
- Check if within RCP (Release Control Period)
- Ensure stage-to-main PR has proper approvals

#### **Batch Merge Failures**
- Check workflow logs in Actions tab
- Look for file conflicts between PRs
- Verify individual PR requirements
- Check if batch size limit exceeded

-----

## AI-Powered Development Assistant

This project includes an intelligent development assistant powered by Cursor AI with specialized rules for AEM Edge Delivery Services development.

### 🤖 Cursor AI Rules System

The project contains **specialized AI rules** located in `.cursor/rules/` that provide expert guidance for:

- **Performance optimization** following AEM Three-Phase Loading principles
- **Block development** with author-first design patterns  
- **CSS variable enforcement** and design system consistency
- **Unit testing standards** based on Adobe best practices
- **Code review guidelines** for quality assurance

### 🎯 Triggering AI Assistance

#### **Always-Active Rules**
These rules are automatically applied to every query:
- **Core Web Vitals Standards** - Performance optimization guidance
- **Resource Loading Strategy** - AEM Three-Phase Loading (E-L-D) patterns
- **DOM Manipulation Best Practices** - Efficient DOM operations
- **AEM Markup Sections & Blocks** - Structure and authoring guidelines
- **Image Optimization Requirements** - Responsive image best practices
- **Event Handling Performance** - Efficient event management

#### **Triggered Rules (Use These Commands)**

##### 📝 **"Write my tests"**
Activates unit testing guidance:
```
Write my tests for the hero-marquee block
```
- Complete test file structure with proper mocking
- Async block testing patterns for AEM utilities
- Performance-critical path validation
- Coverage guidelines and anti-patterns

##### 🔍 **"Code review"**  
Activates code review and quality standards:
```
Code review this grid-marquee implementation
```
- CSS variable linting enforcement
- Block pattern compliance checking
- Performance optimization recommendations
- Accessibility and SEO validation

##### 🚀 **Performance Queries**
Activate diagnostic rules for PageSpeed issues:
```
PageSpeed score is 75, LCP is 5+ seconds
```
- Lighthouse performance troubleshooting
- CSS render-blocking diagnosis
- Resource loading optimization
- AEM transformation speed improvements

##### 🧱 **Block Development**
Get block-specific guidance:
```
Create a new pricing table block
```
- Author-first design principles
- Section metadata integration
- Progressive enhancement patterns
- Content preservation best practices

##### 🧪 **"Generate Nala tests"**
Activates E2E test generation:
```
Generate Nala tests for the grid-marquee block
```
- Cross-browser test scenarios
- Accessibility validation tests
- Visual regression test setups
- Performance and responsive testing
- Page object model patterns

**Example Generated Nala Test:**
```javascript
// Auto-generated hero-marquee.test.js
import { test, expect } from '@playwright/test';

test.describe('Hero Marquee Block', () => {
  test('should display headline and CTA correctly', async ({ page }) => {
    await page.goto('/express/');
    
    const heroBlock = page.locator('.hero-marquee');
    await expect(heroBlock).toBeVisible();
    
    const headline = heroBlock.locator('h1');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText('Adobe Express');
    
    const cta = heroBlock.locator('.cta a').first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href');
  });
  
  test('should be responsive across devices', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/express/');
    
    const heroBlock = page.locator('.hero-marquee');
    await expect(heroBlock).toBeVisible();
    
    // Desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await expect(heroBlock).toBeVisible();
  });
});
```

### 💡 Best Practices for AI Assistance

#### **Effective Prompting**
- **Be specific**: "Code review the grid-marquee ratings variant" vs "check my code"
- **Include context**: "PageSpeed 75, LCP 5s, grid-marquee with 4 cards" 
- **Use trigger phrases**: "Write my tests", "Code review", performance metrics

#### **Performance Optimization**
- Always mention specific PageSpeed/Lighthouse scores
- Include LCP timing and CWV metrics
- Specify which blocks or components are involved
- Reference the AEM Three-Phase Loading when asking about performance

#### **Block Development**  
- Describe the author experience and content structure
- Mention responsive requirements and device support
- Include accessibility and SEO considerations
- Reference existing blocks for consistency patterns

### 🔧 Rule Customization

The AI rules can be customized by editing files in `.cursor/rules/`:
- **Always-on rules**: Marked with `APPLY: EVERY QUERY`
- **Triggered rules**: Marked with specific activation phrases
- **Performance rules**: Activated by PageSpeed/performance issues
- **Testing rules**: Activated by "Write my tests" commands

-----

## Resources

### AEM and Performance Documentation
- **[AEM Edge Delivery Services](https://www.aem.live/)** - Official AEM EDS documentation
- **[Keeping it 100](https://www.aem.live/developer/keeping-it-100)** - PageSpeed optimization guide
- **[Helix Block Design](https://milo.adobe.com/blog/2022/07/05/block-design)** - Block development best practices

### Testing and Quality Assurance
- **[Unit Testing in AEM](https://experienceleague.adobe.com/docs/experience-manager-learn/getting-started-wknd-tutorial-develop/project-archetype/unit-testing.html)** - Adobe's unit testing guide
- **[Nala Testing Framework](https://github.com/adobecom/milo/wiki/Nala#nala-introduction)** - End-to-end testing documentation
- **[Web Test Runner](https://modern-web.dev/docs/test-runner/overview/)** - JavaScript testing framework

### Development Tools and Standards
- **[Adobe Experience Platform WebSDK](https://experienceleague.adobe.com/docs/experience-platform/web-sdk/home.html)** - Client-side SDK documentation
- **[Adobe Analytics](https://experienceleague.adobe.com/docs/analytics.html)** - Analytics implementation guide
- **[Adobe Target](https://experienceleague.adobe.com/docs/target.html)** - Personalization and testing platform

### Community and Support
- **[Adobecom Discussions](https://github.com/orgs/adobecom/discussions/)** - Start discussions with the larger group
- **[Adobe Developer Community](https://developer.adobe.com/community/)** - Developer forums and resources
- **[Experience League](https://experienceleague.adobe.com/)** - Adobe's learning platform

### Performance and Optimization
- **[Core Web Vitals](https://web.dev/vitals/)** - Google's performance metrics guide
- **[Lighthouse](https://developers.google.com/web/tools/lighthouse)** - Performance auditing tool
- **[PageSpeed Insights](https://pagespeed.web.dev/)** - Real-world performance analysis

### Workflow and Automation
- **[GitHub Actions](https://docs.github.com/en/actions)** - CI/CD automation documentation
- **[Husky](https://typicode.github.io/husky/)** - Git hooks for code quality
- **[Adobe Code Sync Bot](https://github.com/adobe/helix-code-sync)** - Automated deployment tooling
