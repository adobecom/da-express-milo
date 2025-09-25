# QA Label Management Workflow Documentation

## Overview

The QA Label Management workflow automatically manages "Ready for Review" labels on pull requests and sends Slack notifications when PRs are ready for review. This ensures proper workflow visibility and keeps the team informed about PR status changes.

## Key Features

- ✅ **Automatic "Ready for Review" labeling** for non-draft PRs
- ✅ **Slack notifications** when PRs become ready for review
- ✅ **Draft PR management** - removes labels from draft PRs
- ✅ **Test mode support** with `test-ready-for-review-slack` label
- ✅ **Jira ticket integration** - extracts and links Jira tickets in notifications

## Use Cases

### 1. **Ready for Review Labeling**
- **Trigger**: PR is created or moved from draft to ready
- **Action**: Add "Ready for Review" label
- **Purpose**: Indicate PR needs review

### 2. **Draft PR Management**
- **Trigger**: PR is marked as draft
- **Action**: Remove all Ready labels
- **Purpose**: Draft PRs shouldn't have Ready labels

### 3. **Slack Notifications**
- **Trigger**: "Ready for Review" label is added to non-draft PR
- **Action**: Send formatted Slack notification
- **Purpose**: Notify team when PRs are ready for review

### 4. **Test Mode**
- **Trigger**: `test-ready-for-review-slack` label is added
- **Action**: Send test Slack notification to test channel
- **Purpose**: Test Slack integration without affecting real PRs or production channel

## Workflow Triggers

The workflow triggers on these pull request events:
- `opened` - New PR created
- `edited` - PR details modified
- `ready_for_review` - PR moved from draft to ready
- `converted_to_draft` - PR moved from ready to draft
- `labeled` - Labels added to PR
- `unlabeled` - Labels removed from PR
- `submitted` - Reviews submitted
- `synchronize` - PR updated with new commits
- `reopened` - PR reopened after being closed

## Label Logic

### Ready for Review (Default)
- **Condition**: Non-draft PR
- **Purpose**: Indicates PR needs review
- **Slack Notification**: ✅ Sent when label is added

### No Ready Labels
- **Condition**: Draft PR
- **Purpose**: Draft PRs shouldn't show readiness status
- **Slack Notification**: ❌ Not sent

### Test Mode
- **Condition**: `test-ready-for-review-slack` label present
- **Purpose**: Test Slack notification functionality
- **Slack Notification**: ✅ Sent with [TEST_MODE] prefix

## Flowcharts

### Main Workflow Flow

```mermaid
flowchart TD
    A[PR Event Triggered] --> B[Get PR Details]
    B --> C{Is Draft PR?}
    C -->|Yes| D[Remove All Ready Labels]
    C -->|No| E[Add Ready for Review Label]
    D --> F[Update Labels]
    E --> F
    F --> G{Ready for Review Added?}
    G -->|Yes| H[Send Slack Notification]
    G -->|No| I[End]
    H --> I
```

### Label Decision Logic

```mermaid
flowchart TD
    A[Current Labels] --> B[Filter Out Ready Labels]
    B --> C{PR State?}
    C -->|Draft| D[No Ready Labels]
    C -->|Ready| E[Ready for Review]
    D --> F[Set Final Labels]
    E --> F
    F --> G[End]
```

### Slack Notification Process

```mermaid
flowchart TD
    A[Ready for Review Added] --> B[Extract PR Details]
    B --> C[Extract Jira Ticket]
    C --> D[Format Slack Message]
    D --> E{Test Mode?}
    E -->|Yes| F[Add TEST_MODE Prefix]
    E -->|No| G[Standard Message]
    F --> H[Send to Slack]
    G --> H
    H --> I[End]
```

## Configuration

### Required Labels

The workflow expects these labels to exist in the repository:
- `Ready for Review` - For PRs needing review
- `test-ready-for-review-slack` - For testing Slack notifications (optional)

### Slack Integration

The workflow sends formatted Slack notifications with:
- **PR Title** - Extracted and formatted
- **Author** - GitHub username
- **Branch Info** - Source → target branch
- **Jira Ticket** - Auto-extracted and linked (if present)
- **Test Mode** - [TEST_MODE] prefix for test notifications

#### Channel Routing
- **Regular notifications** → Production Slack channel (via `SLACK_WEBHOOK_URL_PR`)
- **Test notifications** → Test Slack channel (via `SLACK_WEBHOOK_URL_PR_TEST`)
- **Test mode detection** → Uses `test-ready-for-review-slack` label

### Environment Variables

Required secrets in repository settings:
- `SLACK_WEBHOOK_URL_PR` - Production Slack webhook (main channel)
- `SLACK_WEBHOOK_URL_PR_TEST` - Test Slack webhook (test channel)

### Permissions

The workflow requires these permissions:
- `issues: write` - To manage labels
- `pull-requests: read` - To read PR details and reviews

## Examples

### Example 1: New PR
```
1. PR created → "Ready for Review" added + Slack notification sent
2. PR marked as draft → "Ready for Review" removed
3. PR marked as ready again → "Ready for Review" added + Slack notification sent
```

### Example 2: Draft PR
```
1. PR created as draft → No Ready labels, no Slack notification
2. PR marked as ready → "Ready for Review" added + Slack notification sent
3. PR marked as draft again → "Ready for Review" removed
```

### Example 3: Test Mode
```
1. Add "test-ready-for-review-slack" label → Slack notification sent to test channel with [TEST_MODE] prefix
2. Remove "test-ready-for-review-slack" label → No additional action
```

## Troubleshooting

### Common Issues

1. **Labels not updating immediately**
   - **Cause**: GitHub UI cache delay
   - **Solution**: Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)

2. **Workflow not triggering**
   - **Cause**: Missing trigger events
   - **Solution**: Check workflow triggers in `.github/workflows/qa-label-management.yml`

3. **Slack notifications not sending**
   - **Cause**: Missing or invalid SLACK_WEBHOOK_URL
   - **Solution**: Check environment variables in workflow

4. **Wrong labels applied**
   - **Cause**: Draft state detection error
   - **Solution**: Check PR draft state logic in workflow

### Debug Information

The workflow logs detailed information:
- Current labels on PR
- PR state (draft/ready)
- Test mode status
- Slack notification status
- Label changes made

## File Structure

```
.github/workflows/
└── qa-label-management.yml    # PR label management workflow

QA-LABEL-MANAGEMENT-DOCUMENTATION.md    # This documentation (root directory)
```

## Testing

### Manual Testing (Recommended)
- **Trigger**: Add `test-ready-for-review-slack` label to any PR
- **How to run**: 
  1. Go to any PR in the repository
  2. Add the `test-ready-for-review-slack` label
  3. Check Actions tab for "QA Label Management" workflow execution
  4. Verify Slack notification sent to test channel
- **Schedule**: Runs immediately when label is added
- **Webhook**: Uses test Slack webhook (`SLACK_WEBHOOK_URL_PR_TEST`)
- **Advantages**: 
  - ✅ Immediate execution
  - ✅ Safe testing with test webhook
  - ✅ No production impact

### Production Testing
- **Trigger**: Create new PR or move existing PR from draft to ready
- **Schedule**: Runs immediately
- **Webhook**: Uses production Slack webhook
- **Use case**: Final testing before deployment

## Step-by-Step Testing Guide

### 1. Test QA Label Management Workflow

#### Manual Testing
1. **Create Test PR**
   - Create a new PR or use existing one
   - Add `test-ready-for-review-slack` label

2. **Monitor Workflow**
   - Check Actions tab for "QA Label Management" workflow
   - Verify it triggers on label addition

3. **Verify Results**
   - Check for "Ready for Review" label addition
   - Verify Slack notification was sent to test channel
   - Check for [TEST_MODE] prefix in notification

### 2. Test with Different PR States

#### Test Scenarios
1. **Test with Draft PR**
   - Create draft PR
   - Verify no "Ready for Review" label is added
   - Verify no Slack notification is sent

2. **Test with Regular PR**
   - Create non-draft PR
   - Verify "Ready for Review" label is added
   - Verify Slack notification is sent

3. **Test Label Changes**
   - Add/remove labels on PR
   - Verify workflow triggers
   - Check for proper label management

#### Debug Information
- Check workflow logs for detailed execution info
- Verify environment variables are set correctly
- Test with different PR states and labels

## Maintenance

### Adding New Triggers
1. Add trigger to `on.pull_request.types` array
2. Test with appropriate PR events
3. Update documentation

### Modifying Label Logic
1. Update label decision logic in workflow
2. Test with various PR states
3. Update flowcharts and documentation

### Testing Changes
1. Use `test-ready-for-review-slack` label for safe testing
2. Test with real PR state changes (draft ↔ ready)
3. Verify Slack notifications work correctly
4. Test Jira ticket extraction and linking
