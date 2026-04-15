import { expect } from '@esm-bundle/chai';
import { applyTaasToolbarOverrides, resolveTaasOrderBy } from '../../../express/code/blocks/template-x/taas-query-overrides.js';

describe('taas query overrides', () => {
  describe('resolveTaasOrderBy', () => {
    it('maps sort labels to orderBy values', () => {
      expect(resolveTaasOrderBy('Most Viewed')).to.equal('-remixCount');
      expect(resolveTaasOrderBy('Rare & Original')).to.equal('remixCount');
      expect(resolveTaasOrderBy('Newest to Oldest')).to.equal('-createDate');
      expect(resolveTaasOrderBy('Oldest to Newest')).to.equal('createDate');
    });

    it('supports encoded sort values used by toolbar options', () => {
      expect(resolveTaasOrderBy('&orderBy=-remixCount')).to.equal('-remixCount');
      expect(resolveTaasOrderBy('orderBy=createDate')).to.equal('createDate');
    });

    it('returns empty string for Most Relevant/blank to clear orderBy', () => {
      expect(resolveTaasOrderBy('Most Relevant')).to.equal('');
      expect(resolveTaasOrderBy('')).to.equal('');
      expect(resolveTaasOrderBy('   ')).to.equal('');
    });

    it('returns null for unknown values and undefined input', () => {
      expect(resolveTaasOrderBy(undefined)).to.equal(null);
      expect(resolveTaasOrderBy('unrecognized-sort')).to.equal(null);
    });
  });

  describe('applyTaasToolbarOverrides', () => {
    it('applies toolbar filters and encoded sort value', () => {
      const queryParams = new URLSearchParams('tasks=resume&orderBy=-createDate&license=free&behaviors=still');
      applyTaasToolbarOverrides(queryParams, {
        start: '40,10',
        filters: {
          premium: 'true',
          animated: 'false',
        },
        sort: '&orderBy=-remixCount',
      });

      expect(queryParams.get('start')).to.equal('40,10');
      expect(queryParams.get('license')).to.equal('premium');
      expect(queryParams.get('behaviors')).to.equal('still');
      expect(queryParams.get('orderBy')).to.equal('-remixCount');
    });

    it('clears orderBy when Most Relevant is selected', () => {
      const queryParams = new URLSearchParams('tasks=resume&orderBy=-createDate');
      applyTaasToolbarOverrides(queryParams, {
        sort: 'Most Relevant',
      });

      expect(queryParams.has('orderBy')).to.be.false;
    });

    it('removes explicit all filters from query', () => {
      const queryParams = new URLSearchParams('license=free&behaviors=animated');
      applyTaasToolbarOverrides(queryParams, {
        filters: {
          premium: 'all',
          animated: 'all',
        },
      });

      expect(queryParams.has('license')).to.be.false;
      expect(queryParams.has('behaviors')).to.be.false;
    });
  });
});
