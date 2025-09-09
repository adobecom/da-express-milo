import {
  getLocalConfigs,
  isWithinRCP,
  pulls
} from './helpers.js';

const { addLabels, addFiles, getChecks, getReviews } = pulls;

// Run from the root of the project for local testing: node --env-file=.env .github/workflows/merge-to-stage.js
const PR_TITLE = '[Release] Stage to Main';
const SEEN = {};
const REQUIRED_APPROVALS = process.env.REQUIRED_APPROVALS ? Number(process.env.REQUIRED_APPROVALS) : 2;
const MAX_MERGES = process.env.MAX_PRS_PER_BATCH ? Number(process.env.MAX_PRS_PER_BATCH) : 8;
let existingPRCount = 0;
const STAGE = 'stage';
const PROD = 'main';
const LABELS = {
  readyForStage: 'Ready for Stage',
  readyForReview: 'Ready for Review',
  zeroImpact: 'zero-impact',
  qaApproved: 'QA Approved',
};

// Check configuration
const CHECK_CONFIG = {
  // Checks that can be ignored (will not block merge)
  ignoreChecks: [
    'merge-to-stage',  // Always ignore the merge check itself
    'aem-psi-check',   // Ignore AEM PSI check as it won't pass for a while
  ]
};

let github;
let owner;
let repo;

// Initialize body with PR template
let body = `## Summary

This is an automated merge of the following PRs to stage:

## Changes in this release

<!-- List of PRs will be added here -->

## Test URLs

| Environment | URL |
|-------------|-----|
| **Before**  | https://main--da-express-milo--adobecom.aem.page/express/ |
| **After**   | https://stage--da-express-milo--adobecom.aem.page/express/?martech=off |

## Verification Steps

Please verify:
1. All PRs listed above have been properly merged
2. The stage environment is accessible and functioning
3. No unexpected changes are present

## Potential Regressions

The following URLs should be tested:
- https://stage--da-express-milo--adobecom.aem.live/express/?martech=off

## Additional Notes

This PR was automatically created by the merge-to-stage workflow.
`;

const isZeroImpact = (labels) => labels.includes(LABELS.zeroImpact);

const hasFailingChecks = (checks) => {
  // Filter out ignored checks
  const relevantChecks = checks.filter(check => !CHECK_CONFIG.ignoreChecks.includes(check.name));
  
  // Check if any remaining checks are failing or in progress
  return relevantChecks.some(check => 
    check.conclusion === 'failure' || check.conclusion === 'in_progress'
  );
};

const commentOnPR = async (comment, prNumber) => {
  console.log(comment); // Logs for debugging the action.
  const { data: comments } = await github.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  const dayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  const hasRecentComment = comments
    .filter(({ created_at }) => new Date(created_at) > dayAgo)
    .some(({ body }) => body === comment);
  if (hasRecentComment) return console.log('Comment exists for', prNumber);

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: comment,
  });
};

const getPRs = async () => {
  let prs = await github.rest.pulls
    .list({ owner, repo, state: 'open', per_page: 100, base: STAGE })
    .then(({ data }) => data);
  await Promise.all(prs.map((pr) => addLabels({ pr, github, owner, repo })));
  
  // Filter PRs that have Ready for Stage OR QA Approved but not Ready for Review
  prs = prs.filter((pr) => 
    (pr.labels.includes(LABELS.readyForStage) || pr.labels.includes(LABELS.qaApproved)) && 
    !pr.labels.includes(LABELS.readyForReview)
  );

  await Promise.all([
    ...prs.map((pr) => addFiles({ pr, github, owner, repo })),
    ...prs.map((pr) => getChecks({ pr, github, owner, repo })),
    ...prs.map((pr) => getReviews({ pr, github, owner, repo })),
  ]);

  prs = prs.filter(({ checks, reviews, number, title }) => {
    if (hasFailingChecks(checks)) {
      commentOnPR(`Skipped merging ${number}: ${title} due to failing or running checks`, number);
      return false;
    }

    const approvals = reviews.filter(({ state }) => state === 'APPROVED');
    if (approvals.length < REQUIRED_APPROVALS) {
      commentOnPR(
        `Skipped merging ${number}: ${title} due to insufficient approvals. Required: ${REQUIRED_APPROVALS} approvals`,
        number,
      );
      return false;
    }

    return true;
  });

  return prs.reverse().reduce(
    (categorizedPRs, pr) => {
      if (isZeroImpact(pr.labels)) {
        categorizedPRs.zeroImpactPRs.push(pr);
      } else {
        categorizedPRs.normalPRs.push(pr);
      }
      return categorizedPRs;
    },
    { zeroImpactPRs: [], normalPRs: [] },
  );
};

const merge = async ({ prs, type }) => {
  console.log(`Merging ${prs.length || 0} ${type} PRs that are ready... `);

  for await (const { number, files, html_url, title } of prs) {
    try {
      if (mergeLimitExceeded()) return;
      const fileOverlap = files.find((file) => SEEN[file]);
      if (fileOverlap) {
        commentOnPR(
          `Skipped ${number}: "${title}" due to file "${fileOverlap}" overlap. Merging will be attempted in the next batch`,
          number,
        );
        continue;
      }
      if (type !== LABELS.zeroImpact) {
        files.forEach((file) => (SEEN[file] = true));
      }

      console.log(`Attempting to merge PR #${number}: ${title}`);
      if (process.env.LOCAL_RUN !== 'true') {
        await github.rest.pulls.merge({
          owner,
          repo,
          pull_number: number,
          merge_method: 'squash',
        });
        console.log(`Successfully merged PR #${number}`);
      } else {
        console.log(`[LOCAL MODE] Would merge PR #${number}`);
      }
      existingPRCount++;
      console.log(`Current number of PRs merged: ${existingPRCount}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      files.forEach((file) => (SEEN[file] = false));
      commentOnPR(`Error merging ${number}: ${title} ${error.message}`, number);
      console.error(`Error merging PR #${number}:`, error);
    }
  }
};

const getStageToMainPR = () => github.rest.pulls
  .list({ owner, repo, state: 'open', base: PROD })
  .then(({ data } = {}) => data.find(({ title } = {}) => title === PR_TITLE))
  .then((pr) => pr && addLabels({ pr, github, owner, repo }))
  .then((pr) => pr && addFiles({ pr, github, owner, repo }))
  .then((pr) => {
    if (pr) {
      console.log(`Found existing Stage to Main PR #${pr.number}: ${pr.html_url}`);
      console.log(`PR State: ${pr.state}, Mergeable: ${pr.mergeable}, Mergeable State: ${pr.mergeable_state}`);
    }
    pr?.files.forEach((file) => (SEEN[file] = true));
    return pr;
  });

const mergeLimitExceeded = () => MAX_MERGES - existingPRCount < 0;

const openStageToMainPR = async () => {
  const { data: comparisonData } = await github.rest.repos.compareCommits({
    owner,
    repo,
    base: PROD,
    head: STAGE,
  });

  // Add all PRs to the body
  const prList = [];
  for (const commit of comparisonData.commits) {
    const { data: pullRequestData } = await github.rest.repos.listPullRequestsAssociatedWithCommit({
      owner,
      repo,
      commit_sha: commit.sha,
    });

    for (const pr of pullRequestData) {
      if (!prList.includes(pr.html_url)) {
        prList.push(pr.html_url);
        // Get PR details
        const { data: prDetails } = await github.rest.pulls.get({
          owner,
          repo,
          pull_number: pr.number,
        });
        
        // Add PR to the list with title and author
        body = body.replace(
          '<!-- List of PRs will be added here -->',
          `- [${prDetails.title}](${pr.html_url}) by @${prDetails.user.login}\n<!-- List of PRs will be added here -->`
        );
      }
    }
  }

  try {
    if (process.env.LOCAL_RUN === 'true') {
      console.log('[LOCAL MODE] Would create stage-to-main PR with body:', body);
      return;
    }

    const { data: { html_url, number } } = await github.rest.pulls.create({
      owner,
      repo,
      title: PR_TITLE,
      head: STAGE,
      base: PROD,
      body,
    });

    console.log(`Created Stage to Main PR: ${html_url}`);
  } catch (error) {
    if (error.message.includes('No commits between main and stage')) {
      return console.log('No new commits, no stage->main PR opened');
    }
    throw error;
  }
};

const main = async (params) => {
  github = params.github;
  owner = params.context.repo.owner;
  repo = params.context.repo.repo;
  
  console.log(`Running in ${process.env.LOCAL_RUN === 'true' ? 'LOCAL PREVIEW' : 'LIVE'} mode`);
  if (process.env.LOCAL_RUN === 'true') {
    console.log('⚠️  LOCAL PREVIEW MODE: No actual changes will be made');
  } else {
    console.log('⚠️  LIVE MODE: This will make actual changes to the repository');
  }
  
  if (isWithinRCP({ offset: process.env.STAGE_RCP_OFFSET_DAYS || 2, excludeShortRCP: true })) {
    return console.log('Stopped, within RCP period.');
  }

  try {
    const stageToMainPR = await getStageToMainPR();
    if (stageToMainPR) {
      const message = `Stage to Main PR #${stageToMainPR.number} is still open. Skipping merge to stage until it is resolved.`;
      console.log(message);
      
      // Add a comment to the PR if it's been more than 24 hours since the last comment
      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: stageToMainPR.number,
      });
      
      const dayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
      const hasRecentComment = comments
        .filter(({ created_at }) => new Date(created_at) > dayAgo)
        .some(({ body }) => body.includes('Skipping merge to stage'));
      
      if (!hasRecentComment) {
        await commentOnPR(message, stageToMainPR.number);
      }
    }

    if (mergeLimitExceeded()) {
      return console.log(`Maximum number of '${MAX_MERGES}' PRs already merged. Stopping execution`);
    }

    console.log('\nFetching PRs ready for stage...');
    const { zeroImpactPRs, normalPRs } = await getPRs();
    console.log(`Found ${zeroImpactPRs.length} zero-impact PRs and ${normalPRs.length} normal PRs ready for stage`);
    
    if (zeroImpactPRs.length > 0) {
      console.log('\nZero-impact PRs that would be merged:');
      zeroImpactPRs.forEach(pr => console.log(`- #${pr.number}: ${pr.title}`));
    }
    
    if (normalPRs.length > 0) {
      console.log('\nNormal PRs that would be merged:');
      normalPRs.forEach(pr => console.log(`- #${pr.number}: ${pr.title}`));
    }

    if (stageToMainPR) {
      console.log('\n⚠️  Skipping merge due to existing stage-to-main PR');
      return;
    }
    
    await merge({ prs: zeroImpactPRs, type: LABELS.zeroImpact });
    await merge({ prs: normalPRs, type: 'normal' });

    console.log(`\nTotal PRs processed: ${existingPRCount}`);
    if (existingPRCount > 0) {
      console.log('Creating stage-to-main PR...');
      await openStageToMainPR();
    } else {
      console.log('No PRs were merged, skipping stage-to-main PR creation');
    }
  } catch (error) {
    console.error('Error in merge-to-stage:', error);
  }
};

if (process.env.LOCAL_RUN) {
  const { github, context } = getLocalConfigs();
  main({
    github,
    context,
  });
}

export default main; 
