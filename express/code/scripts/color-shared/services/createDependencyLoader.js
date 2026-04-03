export function createDependencyLoader() {
  const loaded = {
    api: false,
    lit: new Set(),
  };

  const loading = {
    api: null,
    lit: new Map(),
  };

  async function loadApi(dataService) {
    if (loaded.api) {
      return dataService.getCache();
    }

    if (loading.api) {
      return loading.api;
    }

    loading.api = dataService.fetchData().then((data) => {
      loaded.api = true;
      loading.api = null;
      return data;
    });

    return loading.api;
  }

  async function loadLitComponent(componentName, importPath) {
    if (loaded.lit.has(componentName)) {
      return true;
    }

    if (loading.lit.has(componentName)) {
      return loading.lit.get(componentName);
    }

    const promise = import(importPath).then(() => {
      loaded.lit.add(componentName);
      loading.lit.delete(componentName);
      return true;
    });

    loading.lit.set(componentName, promise);
    return promise;
  }

  async function ensureLitComponent(componentName) {
    if (window.customElements.get(componentName)) {
      loaded.lit.add(componentName);
      return true;
    }

    try {
      await customElements.whenDefined(componentName);
      loaded.lit.add(componentName);
      return true;
    } catch {
      return false;
    }
  }

  function isApiLoaded() {
    return loaded.api;
  }

  function isLitLoaded(componentName) {
    return loaded.lit.has(componentName) || 
           !!window.customElements.get(componentName);
  }

  return {
    loadApi,
    loadLitComponent,
    ensureLitComponent,
    isApiLoaded,
    isLitLoaded,
  };
}

export const globalDependencyLoader = createDependencyLoader();
