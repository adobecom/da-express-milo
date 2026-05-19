import sinon from 'sinon';

export function createMockCCLibraryProvider() {
  return {
    fetchUserLibraries: sinon.stub().resolves({ libraries: [] }),
    filterWritableLibraries: sinon.stub().returns([]),
    createLibrary: sinon.stub().resolves({ library_urn: 'new-lib', name: 'New Lib' }),
    saveTheme: sinon.stub().resolves(),
    saveGradient: sinon.stub().resolves(),
    buildGradientPayload: sinon.stub().returns({}),
  };
}

export function createMockGetLibraryContext(libs = [], provider = null) {
  return sinon.stub().resolves({ libraries: libs, provider });
}
