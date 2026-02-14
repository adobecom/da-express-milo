/**
 * Phase 1 dev block for Color Shared UI (ShareUI).
 * Delegates to dev-color-shareui-modal.js for stub DOM and modal shell testing.
 */
import { decorateShareuiModalBlock } from './dev-color-shareui-modal.js';

export default async function decorate(block) {
  await decorateShareuiModalBlock(block);
  // any shared ui component testing can be added below but need the { append: true }
  // await decorateShareuiModalBlock(block, { append: true });
}
