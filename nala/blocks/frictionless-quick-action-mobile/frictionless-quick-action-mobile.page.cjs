function observeHostInteractions() {
  window.nalaMobileInputs = [];
  window.nalaMobileVideoEvents = [];
  document.addEventListener('change', (event) => {
    if (event.target.matches('.frictionless-quick-action-mobile input[type="file"]')) {
      window.nalaMobileInputs.push(Array.from(event.target.files));
    }
  }, true);
  ['playing', 'timeupdate', 'ended', 'error'].forEach((type) => {
    document.addEventListener(type, (event) => {
      if (event.target.matches('.frictionless-quick-action-mobile .animation-container video')) {
        window.nalaMobileVideoEvents.push({
          type, trusted: event.isTrusted, time: event.target.currentTime,
        });
      }
    }, true);
  });
}

// Only the external processing SDK is simulated; host modules, media and events stay real.
function installProcessingSDK() {
  const state = { initializations: [], warmups: [], calls: [] };
  window.nalaProcessingSDK = state;
  const mount = (container) => {
    const parent = document.getElementById(container.parentElementId);
    if (!parent) throw new Error(`SDK parent missing: ${container.parentElementId}`);
    if (!parent.querySelector('.nala-sdk-stub')) {
      const marker = document.createElement('div');
      marker.className = 'nala-sdk-stub';
      marker.textContent = 'Simulated external processing';
      parent.append(marker);
    }
  };
  const quickAction = {
    warmup: (action, mode, container) => {
      state.warmups.push({ action, mode, container });
      mount(container);
    },
  };
  ['cropImage', 'captionVideo', 'mergeVideos', 'generateQRCode', 'trimVideo'].forEach((method) => {
    quickAction[method] = (documentConfig, app, exports, container) => {
      state.calls.push({
        method, documentConfig, app, exports, container,
      });
      mount(container);
    };
  });
  window.CCEverywhere = {
    initialize: async (hostInfo, configParams, authOption) => {
      state.initializations.push({ hostInfo, configParams, auth: authOption() });
      return { quickAction };
    },
  };
}

class FrictionlessQuickActionMobile {
  constructor(page, selector = '.frictionless-quick-action-mobile') {
    this.page = page;
    this.block = page.locator(selector);
    this.heading = this.block.locator('h1');
    this.upload = this.block.locator('#mobile-fqa-upload');
    this.input = this.block.locator('input[type="file"]');
    this.intro = this.block.locator('.animation-container video');
    this.combobox = this.block.getByRole('combobox');
    this.toast = this.block.locator('.error-toast:not(.hide)');
    this.dialog = page.getByRole('dialog');
    this.preview = this.dialog.locator('video');
    this.closePicker = this.dialog.locator('.vqap-close-btn');
  }

  async installSDKStub() {
    await this.page.addInitScript(observeHostInteractions);
    await this.page.route(/\/sdk\/1p\/v4\/CCEverywhere\.js(?:\?.*)?$/, (route) => route.fulfill({
      contentType: 'application/javascript',
      body: `(${installProcessingSDK.toString()})();`,
    }));
  }

  async chooseFiles(files) {
    const chooserPromise = this.page.waitForEvent('filechooser');
    await this.upload.click();
    const chooser = await chooserPromise;
    await chooser.setFiles(files);
    return chooser.isMultiple();
  }

  async sdkState() {
    return this.page.evaluate(async () => {
      const state = window.nalaProcessingSDK || { initializations: [], warmups: [], calls: [] };
      const serializeAsset = async (asset) => {
        if (!(asset.data instanceof File)) return asset;
        const file = asset.data;
        const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        return {
          ...asset,
          data: {
            name: file.name,
            type: file.type,
            size: file.size,
            sha256: Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(''),
            originalSelection: window.nalaMobileInputs.some((files) => files.includes(file)),
          },
        };
      };
      const calls = await Promise.all(state.calls.map(async (call) => {
        const documentConfig = { ...call.documentConfig };
        if (documentConfig.asset) documentConfig.asset = await serializeAsset(documentConfig.asset);
        if (documentConfig.assets) {
          documentConfig.assets = await Promise.all(documentConfig.assets.map(serializeAsset));
        }
        return {
          method: call.method,
          documentConfig,
          app: {
            metaData: call.app.metaData,
            analyticsData: call.app.analyticsData,
            receiveQuickActionErrors: call.app.receiveQuickActionErrors,
            callbacks: Object.keys(call.app.callbacks).sort(),
          },
          exports: call.exports,
          container: call.container,
        };
      }));
      return { initializations: state.initializations, warmups: state.warmups, calls };
    });
  }

  async invokeSDKCallback(name, argument) {
    return this.page.evaluate(({ callbackName, value }) => {
      const { calls } = window.nalaProcessingSDK;
      return calls[calls.length - 1].app.callbacks[callbackName](value);
    }, { callbackName: name, value: argument });
  }

  async introPlayback() {
    return this.intro.evaluate((video) => ({
      ended: video.ended,
      duration: video.duration,
      currentTime: video.currentTime,
      width: video.videoWidth,
      loop: video.loop,
      muted: video.muted,
      autoplay: video.autoplay,
      playsInline: video.playsInline,
      error: video.error?.code || null,
      events: window.nalaMobileVideoEvents,
    }));
  }
}

module.exports = FrictionlessQuickActionMobile;
