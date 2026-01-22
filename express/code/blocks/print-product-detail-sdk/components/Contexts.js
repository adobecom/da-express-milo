import { html, createContext, useContext, useMemo, useSyncExternalStore, useEffect, useCallback, useState } from '../../../scripts/vendors/htm-preact.js';

export const StoreContext = createContext(null);

export function StoreProvider({ children, sdkStore }) {
  const state = useSyncExternalStore(
    sdkStore.subscribe.bind(sdkStore),
    sdkStore.getSnapshot.bind(sdkStore),
  );

  const actions = useMemo(() => sdkStore, [sdkStore]);

  const value = useMemo(() => ({
    state,
    actions,
    env: sdkStore.env,
    sdk: sdkStore,
  }), [state, actions, sdkStore]);

  return html`
    <${StoreContext.Provider} value=${value}>
      ${children}
    </${StoreContext.Provider}>
  `;
}

export function useStore() {
  const value = useContext(StoreContext);
  console.log('StoreContext');
  console.log(value);

  if (!value) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return value;
}

const DrawerContext = createContext(null);

export function DrawerProvider({ children }) {
  const [drawerState, setDrawerState] = useState({ open: false, type: null, payload: null });

  const openDrawer = useCallback((nextState) => {
    setDrawerState({ open: true, ...nextState });
    document.body.classList.add('disable-scroll');
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerState({ open: false, type: null, payload: null });
    document.body.classList.remove('disable-scroll');
  }, []);

  const value = useMemo(() => ({
    state: drawerState,
    openDrawer,
    closeDrawer,
  }), [drawerState, openDrawer, closeDrawer]);

  useEffect(() => () => {
    document.body.classList.remove('disable-scroll');
  }, []);

  return html`
    <${DrawerContext.Provider} value=${value}>
      ${children}
    </${DrawerContext.Provider}>
  `;
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return ctx;
}
