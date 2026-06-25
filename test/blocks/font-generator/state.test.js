import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { getState, setState, subscribe, initFromUrl } from '../../../express/code/blocks/font-generator/state.js';

describe('font-generator/state', () => {
  let replaceStateStub;

  beforeEach(() => {
    replaceStateStub = sinon.stub(window.history, 'replaceState');
    setState({ previewText: 'Hello World', activeFilters: [], layout: 'grid', fontSize: 32 });
    replaceStateStub.resetHistory();
  });

  afterEach(() => {
    sinon.restore();
  });

  // ── getState ──────────────────────────────────────────────────────────────

  describe('getState', () => {
    it('returns default previewText', () => {
      expect(getState().previewText).to.equal('Hello World');
    });

    it('returns default activeFilters as empty array', () => {
      expect(getState().activeFilters).to.deep.equal([]);
    });

    it('returns default layout as grid', () => {
      expect(getState().layout).to.equal('grid');
    });

    it('returns default fontSize', () => {
      expect(getState().fontSize).to.equal(32);
    });

    it('returns default visibleCount of 12', () => {
      expect(getState().visibleCount).to.equal(12);
    });

    // TODO: unskip once unicodeEngine.js is merged and allFonts is populated
    it.skip('returns all fonts when no filters are active', () => {
      expect(getState().activeFonts).to.have.length(4);
    });
    it('returns a copy — direct mutation does not affect the store', () => {
      const state = getState();
      state.previewText = 'mutated';
      state.activeFilters.push('bold');
      expect(getState().previewText).to.equal('Hello World');
      expect(getState().activeFilters).to.deep.equal([]);
    });
  });

  // ── setState ──────────────────────────────────────────────────────────────

  describe('setState', () => {
    it('updates previewText', () => {
      setState({ previewText: 'Typed text' });
      expect(getState().previewText).to.equal('Typed text');
    });

    it('updates layout', () => {
      setState({ layout: 'list' });
      expect(getState().layout).to.equal('list');
    });

    it('updates fontSize', () => {
      setState({ fontSize: 32 });
      expect(getState().fontSize).to.equal(32);
    });

    it('updates visibleCount when set directly', () => {
      setState({ visibleCount: 24 });
      expect(getState().visibleCount).to.equal(24);
    });

    it('does a partial merge — unspecified keys are preserved', () => {
      setState({ previewText: 'partial' });
      expect(getState().layout).to.equal('grid');
      expect(getState().fontSize).to.equal(32);
    });

    // TODO: unskip once unicodeEngine.js is merged and allFonts is populated
    it.skip('derives activeFonts filtered by category when activeFilters changes', () => {
      setState({ activeFilters: ['bold'] });
      const { activeFonts } = getState();
      expect(activeFonts.length).to.be.greaterThan(0);
      expect(activeFonts.every((f) => f.category === 'bold')).to.be.true;
    });

    // TODO: unskip once unicodeEngine.js is merged and allFonts is populated
    it.skip('returns all fonts when activeFilters is reset to empty', () => {
      setState({ activeFilters: ['italic'] });
      setState({ activeFilters: [] });
      expect(getState().activeFonts).to.have.length(4);
    });

    it('resets visibleCount to 12 when filters change', () => {
      setState({ visibleCount: 36 });
      setState({ activeFilters: ['italic'] });
      expect(getState().visibleCount).to.equal(12);
    });

    it('does not reset visibleCount when previewText changes', () => {
      setState({ visibleCount: 24 });
      setState({ previewText: 'no reset' });
      expect(getState().visibleCount).to.equal(24);
    });

    it('does not reset visibleCount when layout changes', () => {
      setState({ visibleCount: 24 });
      setState({ layout: 'list' });
      expect(getState().visibleCount).to.equal(24);
    });

    it('does not reset visibleCount when fontSize changes', () => {
      setState({ visibleCount: 24 });
      setState({ fontSize: 48 });
      expect(getState().visibleCount).to.equal(24);
    });

    it('notifies all subscribers after update', () => {
      const cb1 = sinon.spy();
      const cb2 = sinon.spy();
      const unsub1 = subscribe(cb1);
      const unsub2 = subscribe(cb2);
      cb1.resetHistory();
      cb2.resetHistory();
      setState({ previewText: 'notify' });
      expect(cb1.calledOnce).to.be.true;
      expect(cb2.calledOnce).to.be.true;
      unsub1();
      unsub2();
    });

    it('passes full state snapshot to subscribers', () => {
      let snapshot;
      const unsub = subscribe((s) => { snapshot = s; });
      setState({ previewText: 'snap', layout: 'list' });
      expect(snapshot.previewText).to.equal('snap');
      expect(snapshot.layout).to.equal('list');
      expect(snapshot.fontSize).to.equal(32);
      unsub();
    });

    it('calls replaceState on each update', () => {
      setState({ previewText: 'once' });
      setState({ previewText: 'twice' });
      expect(replaceStateStub.callCount).to.equal(2);
    });
  });

  // ── subscribe ─────────────────────────────────────────────────────────────

  describe('subscribe', () => {
    it('calls the callback immediately with the current state', () => {
      const cb = sinon.spy();
      const unsub = subscribe(cb);
      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0].previewText).to.equal('Hello World');
      unsub();
    });

    it('calls the callback on each subsequent setState', () => {
      const cb = sinon.spy();
      const unsub = subscribe(cb);
      cb.resetHistory();
      setState({ previewText: 'a' });
      setState({ previewText: 'b' });
      expect(cb.callCount).to.equal(2);
      unsub();
    });

    it('returns a function that stops notifications when called', () => {
      const cb = sinon.spy();
      const unsub = subscribe(cb);
      cb.resetHistory();
      unsub();
      setState({ previewText: 'after unsub' });
      expect(cb.notCalled).to.be.true;
    });

    it('unsubscribing one listener does not affect others', () => {
      const cb1 = sinon.spy();
      const cb2 = sinon.spy();
      const unsub1 = subscribe(cb1);
      const unsub2 = subscribe(cb2);
      cb1.resetHistory();
      cb2.resetHistory();
      unsub1();
      setState({ previewText: 'solo' });
      expect(cb1.notCalled).to.be.true;
      expect(cb2.calledOnce).to.be.true;
      unsub2();
    });

    it('returns a safe no-op for a non-function argument', () => {
      const unsub = subscribe('not a function');
      expect(() => unsub()).to.not.throw();
    });
  });

  // ── initFromUrl ───────────────────────────────────────────────────────────

  describe('initFromUrl', () => {
    afterEach(() => {
      window.history.pushState(null, '', window.location.pathname);
    });

    it('reads previewText from the text param', () => {
      window.history.pushState(null, '', '?text=Hi+there');
      initFromUrl();
      expect(getState().previewText).to.equal('Hi there');
    });

    it('reads activeFilters as comma-separated values from the filters param', () => {
      window.history.pushState(null, '', '?filters=bold,italic');
      initFromUrl();
      expect(getState().activeFilters).to.deep.equal(['bold', 'italic']);
    });

    it('reads a single filter correctly', () => {
      window.history.pushState(null, '', '?filters=strikethrough');
      initFromUrl();
      expect(getState().activeFilters).to.deep.equal(['strikethrough']);
    });

    it('reads layout=list from the layout param', () => {
      window.history.pushState(null, '', '?layout=list');
      initFromUrl();
      expect(getState().layout).to.equal('list');
    });

    it('reads layout=grid from the layout param', () => {
      window.history.pushState(null, '', '?layout=grid');
      initFromUrl();
      expect(getState().layout).to.equal('grid');
    });

    it('reads fontSize from the size param', () => {
      window.history.pushState(null, '', '?size=36');
      initFromUrl();
      expect(getState().fontSize).to.equal(36);
    });

    it('ignores an unrecognised layout value', () => {
      window.history.pushState(null, '', '?layout=carousel');
      initFromUrl();
      expect(getState().layout).to.equal('grid');
    });

    it('ignores a non-numeric size param', () => {
      window.history.pushState(null, '', '?size=large');
      initFromUrl();
      expect(getState().fontSize).to.equal(32);
    });

    // TODO: unskip once unicodeEngine.js is merged and allFonts is populated
    it.skip('derives activeFonts from filters read in the URL', () => {
      window.history.pushState(null, '', '?filters=italic');
      initFromUrl();
      const { activeFonts } = getState();
      expect(activeFonts.every((f) => f.category === 'italic')).to.be.true;
    });

    // TODO: unskip once unicodeEngine.js is merged and allFonts is populated
    it.skip('shows all fonts when no filters param is present', () => {
      window.history.pushState(null, '', '?layout=list');
      initFromUrl();
      expect(getState().activeFonts).to.have.length(4);
    });

    it('sets visibleCount to 12 after reading URL', () => {
      window.history.pushState(null, '', '?filters=bold');
      initFromUrl();
      expect(getState().visibleCount).to.equal(12);
    });

    it('leaves unchanged keys at their current values when params are absent', () => {
      window.history.pushState(null, '', '?unrelated=true');
      initFromUrl();
      const state = getState();
      expect(state.previewText).to.equal('Hello World');
      expect(state.activeFilters).to.deep.equal([]);
      expect(state.layout).to.equal('grid');
      expect(state.fontSize).to.equal(32);
    });
  });

  // ── URL sync ──────────────────────────────────────────────────────────────

  describe('URL sync', () => {
    const getUrlArg = () => {
      const raw = replaceStateStub.firstCall.args[2];
      return new URL(String(raw));
    };

    it('writes the text param with the current previewText', () => {
      setState({ previewText: 'test text' });
      expect(getUrlArg().searchParams.get('text')).to.equal('test text');
    });

    it('writes the layout param', () => {
      setState({ layout: 'list' });
      expect(getUrlArg().searchParams.get('layout')).to.equal('list');
    });

    it('writes the size param', () => {
      setState({ fontSize: 36 });
      expect(getUrlArg().searchParams.get('size')).to.equal('36');
    });

    it('writes the filters param as comma-separated values when filters are active', () => {
      setState({ activeFilters: ['bold', 'italic'] });
      expect(getUrlArg().searchParams.get('filters')).to.equal('bold,italic');
    });

    it('omits the filters param when activeFilters is empty', () => {
      setState({ activeFilters: [] });
      expect(getUrlArg().searchParams.has('filters')).to.be.false;
    });

    it('omits the text param when previewText is empty', () => {
      setState({ previewText: '' });
      expect(getUrlArg().searchParams.has('text')).to.be.false;
    });
  });
});
