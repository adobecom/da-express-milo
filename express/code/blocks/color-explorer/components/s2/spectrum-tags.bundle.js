var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/focus-visible/dist/focus-visible.js
var require_focus_visible = __commonJS({
  "node_modules/focus-visible/dist/focus-visible.js"(exports, module) {
    (function(global, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? factory() : typeof define === "function" && define.amd ? define(factory) : factory();
    })(exports, function() {
      "use strict";
      function applyFocusVisiblePolyfill(scope) {
        var hadKeyboardEvent = true;
        var hadFocusVisibleRecently = false;
        var hadFocusVisibleRecentlyTimeout = null;
        var inputTypesAllowlist = {
          text: true,
          search: true,
          url: true,
          tel: true,
          email: true,
          password: true,
          number: true,
          date: true,
          month: true,
          week: true,
          time: true,
          datetime: true,
          "datetime-local": true
        };
        function isValidFocusTarget(el) {
          if (el && el !== document && el.nodeName !== "HTML" && el.nodeName !== "BODY" && "classList" in el && "contains" in el.classList) {
            return true;
          }
          return false;
        }
        function focusTriggersKeyboardModality(el) {
          var type = el.type;
          var tagName = el.tagName;
          if (tagName === "INPUT" && inputTypesAllowlist[type] && !el.readOnly) {
            return true;
          }
          if (tagName === "TEXTAREA" && !el.readOnly) {
            return true;
          }
          if (el.isContentEditable) {
            return true;
          }
          return false;
        }
        function addFocusVisibleClass(el) {
          if (el.classList.contains("focus-visible")) {
            return;
          }
          el.classList.add("focus-visible");
          el.setAttribute("data-focus-visible-added", "");
        }
        function removeFocusVisibleClass(el) {
          if (!el.hasAttribute("data-focus-visible-added")) {
            return;
          }
          el.classList.remove("focus-visible");
          el.removeAttribute("data-focus-visible-added");
        }
        function onKeyDown(e6) {
          if (e6.metaKey || e6.altKey || e6.ctrlKey) {
            return;
          }
          if (isValidFocusTarget(scope.activeElement)) {
            addFocusVisibleClass(scope.activeElement);
          }
          hadKeyboardEvent = true;
        }
        function onPointerDown(e6) {
          hadKeyboardEvent = false;
        }
        function onFocus(e6) {
          if (!isValidFocusTarget(e6.target)) {
            return;
          }
          if (hadKeyboardEvent || focusTriggersKeyboardModality(e6.target)) {
            addFocusVisibleClass(e6.target);
          }
        }
        function onBlur(e6) {
          if (!isValidFocusTarget(e6.target)) {
            return;
          }
          if (e6.target.classList.contains("focus-visible") || e6.target.hasAttribute("data-focus-visible-added")) {
            hadFocusVisibleRecently = true;
            window.clearTimeout(hadFocusVisibleRecentlyTimeout);
            hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
              hadFocusVisibleRecently = false;
            }, 100);
            removeFocusVisibleClass(e6.target);
          }
        }
        function onVisibilityChange(e6) {
          if (document.visibilityState === "hidden") {
            if (hadFocusVisibleRecently) {
              hadKeyboardEvent = true;
            }
            addInitialPointerMoveListeners();
          }
        }
        function addInitialPointerMoveListeners() {
          document.addEventListener("mousemove", onInitialPointerMove);
          document.addEventListener("mousedown", onInitialPointerMove);
          document.addEventListener("mouseup", onInitialPointerMove);
          document.addEventListener("pointermove", onInitialPointerMove);
          document.addEventListener("pointerdown", onInitialPointerMove);
          document.addEventListener("pointerup", onInitialPointerMove);
          document.addEventListener("touchmove", onInitialPointerMove);
          document.addEventListener("touchstart", onInitialPointerMove);
          document.addEventListener("touchend", onInitialPointerMove);
        }
        function removeInitialPointerMoveListeners() {
          document.removeEventListener("mousemove", onInitialPointerMove);
          document.removeEventListener("mousedown", onInitialPointerMove);
          document.removeEventListener("mouseup", onInitialPointerMove);
          document.removeEventListener("pointermove", onInitialPointerMove);
          document.removeEventListener("pointerdown", onInitialPointerMove);
          document.removeEventListener("pointerup", onInitialPointerMove);
          document.removeEventListener("touchmove", onInitialPointerMove);
          document.removeEventListener("touchstart", onInitialPointerMove);
          document.removeEventListener("touchend", onInitialPointerMove);
        }
        function onInitialPointerMove(e6) {
          if (e6.target.nodeName && e6.target.nodeName.toLowerCase() === "html") {
            return;
          }
          hadKeyboardEvent = false;
          removeInitialPointerMoveListeners();
        }
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("mousedown", onPointerDown, true);
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("touchstart", onPointerDown, true);
        document.addEventListener("visibilitychange", onVisibilityChange, true);
        addInitialPointerMoveListeners();
        scope.addEventListener("focus", onFocus, true);
        scope.addEventListener("blur", onBlur, true);
        if (scope.nodeType === Node.DOCUMENT_FRAGMENT_NODE && scope.host) {
          scope.host.setAttribute("data-js-focus-visible", "");
        } else if (scope.nodeType === Node.DOCUMENT_NODE) {
          document.documentElement.classList.add("js-focus-visible");
          document.documentElement.setAttribute("data-js-focus-visible", "");
        }
      }
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        window.applyFocusVisiblePolyfill = applyFocusVisiblePolyfill;
        var event;
        try {
          event = new CustomEvent("focus-visible-polyfill-ready");
        } catch (error) {
          event = document.createEvent("CustomEvent");
          event.initCustomEvent("focus-visible-polyfill-ready", false, false, {});
        }
        window.dispatchEvent(event);
      }
      if (typeof document !== "undefined") {
        applyFocusVisiblePolyfill(document);
      }
    });
  }
});

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/base/src/index.js
var src_exports = {};
__export(src_exports, {
  ElementSizes: () => m,
  INPUT_COMPONENT_PATTERN: () => INPUT_COMPONENT_PATTERN,
  INPUT_COMPONENT_TAGS: () => INPUT_COMPONENT_TAGS,
  SizedMixin: () => d,
  SpectrumElement: () => C,
  SpectrumMixin: () => v
});

// node_modules/@spectrum-web-components/core/dist/shared/base/Base.js
import { LitElement as f } from "lit";

// node_modules/@spectrum-web-components/core/dist/shared/base/version.js
var o = "1.11.0";

// node_modules/@spectrum-web-components/core/dist/shared/base/Base.js
var l = /* @__PURE__ */ new Set();
var _ = () => {
  const i5 = document.documentElement.dir === "rtl" ? document.documentElement.dir : "ltr";
  l.forEach((c6) => {
    c6.setAttribute("dir", i5);
  });
};
var E = new MutationObserver(_);
E.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["dir"]
});
var b = (i5) => typeof i5.startManagingContentDirection < "u" || i5.tagName === "SP-THEME";
function v(i5) {
  class c6 extends i5 {
    /**
     * @private
     */
    get isLTR() {
      return this.dir === "ltr";
    }
    hasVisibleFocusInTree() {
      const n6 = ((a2 = document) => {
        let t5 = a2.activeElement;
        for (; t5?.shadowRoot && t5.shadowRoot.activeElement; )
          t5 = t5.shadowRoot.activeElement;
        const s4 = t5 ? [t5] : [];
        for (; t5; ) {
          const o8 = t5.assignedSlot || t5.parentElement || t5.getRootNode()?.host;
          o8 && s4.push(o8), t5 = o8;
        }
        return s4;
      })(
        this.getRootNode()
      )[0];
      if (!n6)
        return false;
      try {
        return n6.matches(":focus-visible") || n6.matches(".focus-visible");
      } catch {
        return n6.matches(".focus-visible");
      }
    }
    connectedCallback() {
      if (!this.hasAttribute("dir")) {
        let e6 = this.assignedSlot || this.parentNode;
        for (; e6 !== document.documentElement && !b(
          e6
        ); )
          e6 = e6.assignedSlot || // step into the shadow DOM of the parent of a slotted node
          e6.parentNode || // DOM Element detected
          e6.host;
        if (this.dir = e6.dir === "rtl" ? e6.dir : this.dir || "ltr", e6 === document.documentElement)
          l.add(this);
        else {
          const { localName: n6 } = e6;
          n6.search("-") > -1 && !customElements.get(n6) ? customElements.whenDefined(n6).then(() => {
            e6.startManagingContentDirection(this);
          }) : e6.startManagingContentDirection(
            this
          );
        }
        this._dirParent = e6;
      }
      super.connectedCallback();
    }
    disconnectedCallback() {
      super.disconnectedCallback(), this._dirParent && (this._dirParent === document.documentElement ? l.delete(this) : this._dirParent.stopManagingContentDirection(
        this
      ), this.removeAttribute("dir"));
    }
  }
  return c6;
}
var _C = class _C extends v(f) {
};
_C.VERSION = o;
var C = _C;
if (true) {
  const i5 = {
    default: false,
    accessibility: false,
    api: false
  }, c6 = {
    default: false,
    low: false,
    medium: false,
    high: false,
    deprecation: false
  };
  window.__swc = {
    ...window.__swc,
    DEBUG: true,
    ignoreWarningLocalNames: {
      ...window.__swc?.ignoreWarningLocalNames || {}
    },
    ignoreWarningTypes: {
      ...i5,
      ...window.__swc?.ignoreWarningTypes || {}
    },
    ignoreWarningLevels: {
      ...c6,
      ...window.__swc?.ignoreWarningLevels || {}
    },
    issuedWarnings: /* @__PURE__ */ new Set(),
    warn: (r4, e6, n6, { type: a2 = "api", level: t5 = "default", issues: s4 } = {}) => {
      const { localName: o8 = "base" } = r4 || {}, u7 = `${o8}:${a2}:${t5}`;
      if (!window.__swc.verbose && window.__swc.issuedWarnings.has(u7) || window.__swc.ignoreWarningLocalNames[o8] || window.__swc.ignoreWarningTypes[a2] || window.__swc.ignoreWarningLevels[t5])
        return;
      window.__swc.issuedWarnings.add(u7);
      let m5 = "";
      s4 && s4.length && (s4.unshift(""), m5 = s4.join(`
    - `) + `
`);
      const w = t5 === "deprecation" ? "DEPRECATION NOTICE: " : "", h4 = r4 ? `
Inspect this issue in the follow element:` : "", g3 = (r4 ? `

` : `
`) + n6 + `
`, d6 = [];
      d6.push(
        w + e6 + `
` + m5 + h4
      ), r4 && d6.push(r4), d6.push(g3, {
        data: {
          localName: o8,
          type: a2,
          level: t5
        }
      }), console.warn(...d6);
    }
  }, window.__swc.warn(
    void 0,
    "Spectrum Web Components is in dev mode. Not recommended for production!",
    "https://opensource.adobe.com/spectrum-web-components/dev-mode/",
    { type: "default" }
  );
}

// node_modules/@spectrum-web-components/core/dist/shared/base/sizedMixin.js
import { property as z } from "lit/decorators.js";
var h = Object.defineProperty;
var u = Object.getOwnPropertyDescriptor;
var _2 = (r4, e6, i5, n6) => {
  for (var s4 = u(e6, i5), o8 = r4.length - 1, t5; o8 >= 0; o8--)
    (t5 = r4[o8]) && (s4 = t5(e6, i5, s4) || s4);
  return s4 && h(e6, i5, s4), s4;
};
var m = {
  xxs: "xxs",
  xs: "xs",
  s: "s",
  m: "m",
  l: "l",
  xl: "xl",
  xxl: "xxl"
};
function d(r4, {
  validSizes: e6 = ["s", "m", "l", "xl"],
  noDefaultSize: i5,
  defaultSize: n6 = "m"
} = {}) {
  const _s = class _s extends r4 {
    constructor() {
      super(...arguments), this._size = n6;
    }
    get size() {
      return this._size || n6;
    }
    set size(t5) {
      const l4 = i5 ? null : n6, c6 = t5 && t5.toLocaleLowerCase(), p4 = e6.includes(c6) ? c6 : l4;
      if (p4 && this.setAttribute("size", p4), this._size === p4)
        return;
      const x = this._size;
      this._size = p4, this.requestUpdate("size", x);
    }
    update(t5) {
      !this.hasAttribute("size") && !i5 && this.setAttribute("size", this.size), super.update(t5);
    }
  };
  _s.VALID_SIZES = e6;
  let s4 = _s;
  return _2([
    z({ type: String })
  ], s4.prototype, "size"), s4;
}

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/base/src/constants.js
var INPUT_COMPONENT_TAGS = ["SP-SEARCH", "SP-TEXTFIELD", "SP-NUMBER-FIELD", "SP-COMBOBOX", "SP-COLOR-FIELD"];
var INPUT_COMPONENT_PATTERN = new RegExp(`^(${INPUT_COMPONENT_TAGS.join("|")})$`);

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/base/src/index.js
__reExport(src_exports, lit_star);
import * as lit_star from "lit";

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/base/src/decorators.js
var decorators_exports = {};
__reExport(decorators_exports, decorators_star);
import * as decorators_star from "lit/decorators.js";

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/shared/src/focus-visible.js
var i = true;
try {
  document.body.querySelector(":focus-visible");
} catch (a2) {
  i = false, Promise.resolve().then(() => __toESM(require_focus_visible(), 1));
}
var FocusVisiblePolyfillMixin = (a2) => {
  var s4, t5;
  const n6 = (l4) => {
    if (l4.shadowRoot == null || l4.hasAttribute("data-js-focus-visible")) return () => {
    };
    if (self.applyFocusVisiblePolyfill) self.applyFocusVisiblePolyfill(l4.shadowRoot), l4.manageAutoFocus && l4.manageAutoFocus();
    else {
      const e6 = () => {
        self.applyFocusVisiblePolyfill && l4.shadowRoot && self.applyFocusVisiblePolyfill(l4.shadowRoot), l4.manageAutoFocus && l4.manageAutoFocus();
      };
      return self.addEventListener("focus-visible-polyfill-ready", e6, { once: true }), () => {
        self.removeEventListener("focus-visible-polyfill-ready", e6);
      };
    }
    return () => {
    };
  }, o8 = Symbol("endPolyfillCoordination");
  class c6 extends (t5 = a2, s4 = o8, t5) {
    constructor() {
      super(...arguments);
      this[s4] = null;
    }
    connectedCallback() {
      super.connectedCallback && super.connectedCallback(), i || requestAnimationFrame(() => {
        this[o8] == null && (this[o8] = n6(this));
      });
    }
    disconnectedCallback() {
      super.disconnectedCallback && super.disconnectedCallback(), i || requestAnimationFrame(() => {
        this[o8] != null && (this[o8](), this[o8] = null);
      });
    }
  }
  return c6;
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/reactive-controllers/src/FocusGroup.js
function o2(r4, e6, t5) {
  return typeof r4 === e6 ? () => r4 : typeof r4 == "function" ? r4 : t5;
}
var FocusGroupController = class {
  constructor(e6, { hostDelegatesFocus: t5, direction: n6, elementEnterAction: s4, elements: i5, focusInIndex: h4, isFocusableElement: c6, listenerScope: l4, stopKeyEventPropagation: u7 } = { elements: () => [] }) {
    this._currentIndex = -1;
    this.prevIndex = -1;
    this._direction = () => "both";
    this.directionLength = 5;
    this.hostDelegatesFocus = false;
    this.elementEnterAction = (e7) => {
    };
    this._focused = false;
    this._focusInIndex = (e7) => 0;
    this.isFocusableElement = (e7) => true;
    this._listenerScope = () => this.host;
    this.offset = 0;
    this.recentlyConnected = false;
    this.stopKeyEventPropagation = false;
    this.handleFocusin = (e7) => {
      if (!this.isEventWithinListenerScope(e7)) return;
      const t6 = e7.composedPath();
      let n7 = -1;
      t6.find((s5) => (n7 = this.elements.indexOf(s5), n7 !== -1)), this.prevIndex = this.currentIndex, this.currentIndex = n7 > -1 ? n7 : this.currentIndex, this.isRelatedTargetOrContainAnElement(e7) && this.hostContainsFocus();
    };
    this.handleClick = () => {
      var n7;
      const e7 = this.elements;
      if (!e7.length) return;
      let t6 = e7[this.currentIndex];
      this.currentIndex < 0 || ((!t6 || !this.isFocusableElement(t6)) && (this.setCurrentIndexCircularly(1), t6 = e7[this.currentIndex]), t6 && this.isFocusableElement(t6) && ((n7 = e7[this.prevIndex]) == null || n7.setAttribute("tabindex", "-1"), t6.setAttribute("tabindex", "0")));
    };
    this.handleFocusout = (e7) => {
      this.isRelatedTargetOrContainAnElement(e7) && this.hostNoLongerContainsFocus();
    };
    this.handleKeydown = (e7) => {
      if (!this.acceptsEventKey(e7.key) || e7.defaultPrevented) return;
      let t6 = 0;
      switch (this.prevIndex = this.currentIndex, e7.key) {
        case "ArrowRight":
          t6 += 1;
          break;
        case "ArrowDown":
          t6 += this.direction === "grid" ? this.directionLength : 1;
          break;
        case "ArrowLeft":
          t6 -= 1;
          break;
        case "ArrowUp":
          t6 -= this.direction === "grid" ? this.directionLength : 1;
          break;
        case "End":
          this.currentIndex = 0, t6 -= 1;
          break;
        case "Home":
          this.currentIndex = this.elements.length - 1, t6 += 1;
          break;
      }
      e7.preventDefault(), this.stopKeyEventPropagation && e7.stopPropagation(), this.direction === "grid" && this.currentIndex + t6 < 0 ? this.currentIndex = 0 : this.direction === "grid" && this.currentIndex + t6 > this.elements.length - 1 ? this.currentIndex = this.elements.length - 1 : this.setCurrentIndexCircularly(t6), this.elementEnterAction(this.elements[this.currentIndex]), this.focus();
    };
    this.mutationObserver = new MutationObserver(() => {
      this.handleItemMutation();
    }), this.hostDelegatesFocus = t5 || false, this.stopKeyEventPropagation = u7 || false, this.host = e6, this.host.addController(this), this._elements = i5, this.isFocusableElement = c6 || this.isFocusableElement, this._direction = o2(n6, "string", this._direction), this.elementEnterAction = s4 || this.elementEnterAction, this._focusInIndex = o2(h4, "number", this._focusInIndex), this._listenerScope = o2(l4, "object", this._listenerScope);
  }
  get currentIndex() {
    return this._currentIndex === -1 && (this._currentIndex = this.focusInIndex), this._currentIndex - this.offset;
  }
  set currentIndex(e6) {
    this._currentIndex = e6 + this.offset;
  }
  get direction() {
    return this._direction();
  }
  get elements() {
    return this.cachedElements || (this.cachedElements = this._elements()), this.cachedElements;
  }
  set focused(e6) {
    e6 !== this.focused && (this._focused = e6);
  }
  get focused() {
    return this._focused;
  }
  get focusInElement() {
    return this.elements[this.focusInIndex];
  }
  get focusInIndex() {
    return this._focusInIndex(this.elements);
  }
  isEventWithinListenerScope(e6) {
    return this._listenerScope() === this.host ? true : e6.composedPath().includes(this._listenerScope());
  }
  handleItemMutation() {
    if (this._currentIndex == -1 || this.elements.length <= this._elements().length) return;
    const e6 = this.elements[this.currentIndex];
    if (this.clearElementCache(), this.elements.includes(e6)) return;
    const t5 = this.currentIndex !== this.elements.length, n6 = t5 ? 1 : -1;
    t5 && this.setCurrentIndexCircularly(-1), this.setCurrentIndexCircularly(n6), this.focus();
  }
  update({ elements: e6 } = { elements: () => [] }) {
    this.unmanage(), this._elements = e6, this.clearElementCache(), this.manage();
  }
  reset() {
    var n6;
    const e6 = this.elements;
    if (!e6.length) return;
    this.setCurrentIndexCircularly(this.focusInIndex - this.currentIndex);
    let t5 = e6[this.currentIndex];
    this.currentIndex < 0 || ((!t5 || !this.isFocusableElement(t5)) && (this.setCurrentIndexCircularly(1), t5 = e6[this.currentIndex]), t5 && this.isFocusableElement(t5) && ((n6 = e6[this.prevIndex]) == null || n6.setAttribute("tabindex", "-1"), t5.setAttribute("tabindex", "0")));
  }
  focusOnItem(e6, t5) {
    var i5;
    const n6 = this.elements || [], s4 = !e6 || !this.isFocusableElement(e6) ? -1 : n6.indexOf(e6);
    s4 > -1 && (this.currentIndex = s4, (i5 = n6[this.prevIndex]) == null || i5.setAttribute("tabindex", "-1")), this.focus(t5);
  }
  focus(e6) {
    var s4;
    const t5 = this.elements;
    if (!t5.length) return;
    let n6 = t5[this.currentIndex];
    (!n6 || !this.isFocusableElement(n6)) && (this.setCurrentIndexCircularly(1), n6 = t5[this.currentIndex]), n6 && this.isFocusableElement(n6) && ((!this.hostDelegatesFocus || t5[this.prevIndex] !== n6) && ((s4 = t5[this.prevIndex]) == null || s4.setAttribute("tabindex", "-1")), n6.tabIndex = 0, n6.focus(e6), this.hostDelegatesFocus && !this.focused && this.hostContainsFocus());
  }
  clearElementCache(e6 = 0) {
    this.mutationObserver.disconnect(), delete this.cachedElements, this.offset = e6, requestAnimationFrame(() => {
      this.elements.forEach((t5) => {
        this.mutationObserver.observe(t5, { attributes: true });
      });
    });
  }
  setCurrentIndexCircularly(e6) {
    const { length: t5 } = this.elements;
    let n6 = t5;
    this.prevIndex = this.currentIndex;
    let s4 = (t5 + this.currentIndex + e6) % t5;
    for (; n6 && this.elements[s4] && !this.isFocusableElement(this.elements[s4]); ) s4 = (t5 + s4 + e6) % t5, n6 -= 1;
    this.currentIndex = s4;
  }
  hostContainsFocus() {
    this.host.addEventListener("focusout", this.handleFocusout), this.host.addEventListener("keydown", this.handleKeydown), this.focused = true;
  }
  hostNoLongerContainsFocus() {
    this.host.addEventListener("focusin", this.handleFocusin), this.host.removeEventListener("focusout", this.handleFocusout), this.host.removeEventListener("keydown", this.handleKeydown), this.focused = false;
  }
  isRelatedTargetOrContainAnElement(e6) {
    const t5 = e6.relatedTarget, n6 = this.elements.includes(t5), s4 = this.elements.some((i5) => i5.contains(t5));
    return !(n6 || s4);
  }
  acceptsEventKey(e6) {
    if (e6 === "End" || e6 === "Home") return true;
    switch (this.direction) {
      case "horizontal":
        return e6 === "ArrowLeft" || e6 === "ArrowRight";
      case "vertical":
        return e6 === "ArrowUp" || e6 === "ArrowDown";
      case "both":
      case "grid":
        return e6.startsWith("Arrow");
    }
  }
  manage() {
    this.addEventListeners();
  }
  unmanage() {
    this.removeEventListeners();
  }
  addEventListeners() {
    this.host.addEventListener("focusin", this.handleFocusin), this.host.addEventListener("click", this.handleClick);
  }
  removeEventListeners() {
    this.host.removeEventListener("focusin", this.handleFocusin), this.host.removeEventListener("focusout", this.handleFocusout), this.host.removeEventListener("keydown", this.handleKeydown), this.host.removeEventListener("click", this.handleClick);
  }
  hostConnected() {
    this.recentlyConnected = true, this.addEventListeners();
  }
  hostDisconnected() {
    this.mutationObserver.disconnect(), this.removeEventListeners();
  }
  hostUpdated() {
    this.recentlyConnected && (this.recentlyConnected = false, this.elements.forEach((e6) => {
      this.mutationObserver.observe(e6, { attributes: true });
    }));
  }
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/reactive-controllers/src/RovingTabindex.js
var RovingTabindexController = class extends FocusGroupController {
  constructor() {
    super(...arguments);
    this.managed = true;
    this.manageIndexesAnimationFrame = 0;
  }
  set focused(e6) {
    e6 !== this.focused && (super.focused = e6, this.manageTabindexes());
  }
  get focused() {
    return super.focused;
  }
  clearElementCache(e6 = 0) {
    cancelAnimationFrame(this.manageIndexesAnimationFrame), super.clearElementCache(e6), this.managed && (this.manageIndexesAnimationFrame = requestAnimationFrame(() => this.manageTabindexes()));
  }
  manageTabindexes() {
    this.focused && !this.hostDelegatesFocus ? this.updateTabindexes(() => ({ tabIndex: -1 })) : this.updateTabindexes((e6) => ({ removeTabIndex: e6.contains(this.focusInElement) && e6 !== this.focusInElement, tabIndex: e6 === this.focusInElement ? 0 : -1 }));
  }
  updateTabindexes(e6) {
    this.elements.forEach((a2) => {
      const { tabIndex: n6, removeTabIndex: s4 } = e6(a2);
      if (!s4) {
        this.focused ? a2 !== this.elements[this.currentIndex] && (a2.tabIndex = n6) : a2.tabIndex = n6;
        return;
      }
      const t5 = a2;
      t5.requestUpdate && t5.requestUpdate();
    });
  }
  manage() {
    this.managed = true, this.manageTabindexes(), super.manage();
  }
  unmanage() {
    this.managed = false, this.updateTabindexes(() => ({ tabIndex: 0 })), super.unmanage();
  }
  hostUpdated() {
    super.hostUpdated(), this.host.hasUpdated || this.manageTabindexes();
  }
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/base/src/directives.js
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { until } from "lit/directives/until.js";
import { live } from "lit/directives/live.js";
import { when } from "lit/directives/when.js";
import { join } from "lit/directives/join.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { createRef, ref } from "lit/directives/ref.js";

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/shared/src/like-anchor.js
var u2 = Object.defineProperty;
var f2 = Object.getOwnPropertyDescriptor;
var n = (s4, r4, p4, i5) => {
  for (var t5 = i5 > 1 ? void 0 : i5 ? f2(r4, p4) : r4, a2 = s4.length - 1, l4; a2 >= 0; a2--) (l4 = s4[a2]) && (t5 = (i5 ? l4(r4, p4, t5) : l4(t5)) || t5);
  return i5 && t5 && u2(r4, p4, t5), t5;
};
function LikeAnchor(s4) {
  class r4 extends s4 {
    renderAnchor({ id: i5, className: t5, ariaHidden: a2, labelledby: l4, tabindex: d6, anchorContent: g3 = src_exports.html`<slot></slot>` }) {
      return src_exports.html`<a
                    id=${i5}
                    class=${ifDefined(t5)}
                    href=${ifDefined(this.href)}
                    download=${ifDefined(this.download)}
                    target=${ifDefined(this.target)}
                    aria-label=${ifDefined(this.label)}
                    aria-labelledby=${ifDefined(l4)}
                    aria-hidden=${ifDefined(a2 ? "true" : void 0)}
                    tabindex=${ifDefined(d6)}
                    referrerpolicy=${ifDefined(this.referrerpolicy)}
                    rel=${ifDefined(this.rel)}
                >${g3}</a>`;
    }
  }
  return n([(0, decorators_exports.property)()], r4.prototype, "download", 2), n([(0, decorators_exports.property)()], r4.prototype, "label", 2), n([(0, decorators_exports.property)()], r4.prototype, "href", 2), n([(0, decorators_exports.property)()], r4.prototype, "target", 2), n([(0, decorators_exports.property)()], r4.prototype, "referrerpolicy", 2), n([(0, decorators_exports.property)()], r4.prototype, "rel", 2), r4;
}

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/shared/src/focusable.js
var d2 = Object.defineProperty;
var b2 = Object.getOwnPropertyDescriptor;
var n2 = (s4, a2, e6, t5) => {
  for (var i5 = t5 > 1 ? void 0 : t5 ? b2(a2, e6) : a2, o8 = s4.length - 1, r4; o8 >= 0; o8--) (r4 = s4[o8]) && (i5 = (t5 ? r4(a2, e6, i5) : r4(i5)) || i5);
  return t5 && i5 && d2(a2, e6, i5), i5;
};
function u3() {
  return new Promise((s4) => requestAnimationFrame(() => s4()));
}
var Focusable = class extends FocusVisiblePolyfillMixin(C) {
  constructor() {
    super(...arguments);
    this.disabled = false;
    this.autofocus = false;
    this._tabIndex = 0;
    this.manipulatingTabindex = false;
    this.autofocusReady = Promise.resolve();
  }
  get tabIndex() {
    if (this.focusElement === this) {
      const t5 = this.hasAttribute("tabindex") ? Number(this.getAttribute("tabindex")) : NaN;
      return isNaN(t5) ? -1 : t5;
    }
    const e6 = parseFloat(this.hasAttribute("tabindex") && this.getAttribute("tabindex") || "0");
    return this.disabled || e6 < 0 ? -1 : this.focusElement ? this._tabIndex : e6;
  }
  set tabIndex(e6) {
    var t5;
    if (this.manipulatingTabindex) {
      this.manipulatingTabindex = false;
      return;
    }
    if (this.focusElement === this) {
      if (this.disabled) this._tabIndex = e6;
      else if (e6 !== this._tabIndex) {
        this._tabIndex = e6;
        const i5 = "" + e6;
        this.manipulatingTabindex = true, this.setAttribute("tabindex", i5);
      }
      return;
    }
    if (e6 === -1 ? this.addEventListener("pointerdown", this.onPointerdownManagementOfTabIndex) : (this.manipulatingTabindex = true, this.removeEventListener("pointerdown", this.onPointerdownManagementOfTabIndex)), e6 === -1 || this.disabled) {
      if (this.manipulatingTabindex = true, this.setAttribute("tabindex", "-1"), this.removeAttribute("focusable"), this.selfManageFocusElement) return;
      e6 !== -1 ? (this._tabIndex = e6, this.manageFocusElementTabindex(e6)) : (t5 = this.focusElement) == null || t5.removeAttribute("tabindex");
      return;
    }
    this.setAttribute("focusable", ""), this.hasAttribute("tabindex") ? this.removeAttribute("tabindex") : this.manipulatingTabindex = false, this._tabIndex = e6, this.manageFocusElementTabindex(e6);
  }
  onPointerdownManagementOfTabIndex() {
    this.tabIndex === -1 && setTimeout(() => {
      this.tabIndex = 0, this.focus({ preventScroll: true }), this.tabIndex = -1;
    });
  }
  async manageFocusElementTabindex(e6) {
    this.focusElement || await this.updateComplete, e6 === null ? this.focusElement.removeAttribute("tabindex") : this.focusElement !== this && (this.focusElement.tabIndex = e6);
  }
  get focusElement() {
    throw new Error("Must implement focusElement getter!");
  }
  get selfManageFocusElement() {
    return false;
  }
  focus(e6) {
    this.disabled || !this.focusElement || (this.focusElement !== this ? this.focusElement.focus(e6) : HTMLElement.prototype.focus.apply(this, [e6]));
  }
  blur() {
    const e6 = this.focusElement || this;
    e6 !== this ? e6.blur() : HTMLElement.prototype.blur.apply(this);
  }
  click() {
    if (this.disabled) return;
    const e6 = this.focusElement || this;
    e6 !== this ? e6.click() : HTMLElement.prototype.click.apply(this);
  }
  manageAutoFocus() {
    this.autofocus && (this.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab" })), this.focusElement.focus());
  }
  firstUpdated(e6) {
    super.firstUpdated(e6), (!this.hasAttribute("tabindex") || this.getAttribute("tabindex") !== "-1") && this.setAttribute("focusable", "");
  }
  update(e6) {
    e6.has("disabled") && this.handleDisabledChanged(this.disabled, e6.get("disabled")), super.update(e6);
  }
  updated(e6) {
    super.updated(e6), e6.has("disabled") && this.disabled && this.blur();
  }
  async handleDisabledChanged(e6, t5) {
    const i5 = () => this.focusElement !== this && typeof this.focusElement.disabled != "undefined";
    e6 ? (this.manipulatingTabindex = true, this.setAttribute("tabindex", "-1"), await this.updateComplete, i5() ? this.focusElement.disabled = true : this.setAttribute("aria-disabled", "true")) : t5 && (this.manipulatingTabindex = true, this.focusElement === this ? this.setAttribute("tabindex", "" + this._tabIndex) : this.removeAttribute("tabindex"), await this.updateComplete, i5() ? this.focusElement.disabled = false : this.removeAttribute("aria-disabled"));
  }
  async getUpdateComplete() {
    const e6 = await super.getUpdateComplete();
    return await this.autofocusReady, e6;
  }
  connectedCallback() {
    super.connectedCallback(), this.autofocus && (this.autofocusReady = new Promise(async (e6) => {
      await u3(), await u3(), e6();
    }), this.updateComplete.then(() => {
      this.manageAutoFocus();
    }));
  }
};
n2([(0, decorators_exports.property)({ type: Boolean, reflect: true })], Focusable.prototype, "disabled", 2), n2([(0, decorators_exports.property)({ type: Boolean })], Focusable.prototype, "autofocus", 2), n2([(0, decorators_exports.property)({ type: Number })], Focusable.prototype, "tabIndex", 1);

// node_modules/@spectrum-web-components/core/dist/shared/observe-slot-text.js
import { property as m2, queryAssignedNodes as g } from "lit/decorators.js";

// node_modules/@spectrum-web-components/core/dist/node_modules/@lit-labs/observers/mutation-controller.js
var a = class {
  constructor(t5, { target: s4, config: e6, callback: i5, skipInitial: h4 }) {
    this.t = /* @__PURE__ */ new Set(), this.o = false, this.i = false, this.h = t5, s4 !== null && this.t.add(s4 ?? t5), this.l = e6, this.o = h4 ?? this.o, this.callback = i5, window.MutationObserver ? (this.u = new MutationObserver((o8) => {
      this.handleChanges(o8), this.h.requestUpdate();
    }), t5.addController(this)) : console.warn("MutationController error: browser does not support MutationObserver.");
  }
  handleChanges(t5) {
    this.value = this.callback?.(t5, this.u);
  }
  hostConnected() {
    for (const t5 of this.t) this.observe(t5);
  }
  hostDisconnected() {
    this.disconnect();
  }
  async hostUpdated() {
    const t5 = this.u.takeRecords();
    (t5.length || !this.o && this.i) && this.handleChanges(t5), this.i = false;
  }
  observe(t5) {
    this.t.add(t5), this.u.observe(t5, this.l), this.i = true, this.h.requestUpdate();
  }
  disconnect() {
    this.u.disconnect();
  }
};

// node_modules/@spectrum-web-components/core/dist/shared/observe-slot-text.js
var b3 = Object.defineProperty;
var p = (d6, n6, i5, u7) => {
  for (var t5 = void 0, r4 = d6.length - 1, o8; r4 >= 0; r4--)
    (o8 = d6[r4]) && (t5 = o8(n6, i5, t5) || t5);
  return t5 && b3(n6, i5, t5), t5;
};
var f3 = Symbol("assignedNodes");
function N(d6, n6, i5 = []) {
  var u7, t5;
  const r4 = (c6) => (e6) => c6.matches(e6);
  class o8 extends (t5 = d6, u7 = f3, t5) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...e6) {
      super(...e6), this.slotHasContent = false, new a(this, {
        config: {
          characterData: true,
          subtree: true
        },
        callback: (l4) => {
          for (const s4 of l4)
            if (s4.type === "characterData") {
              this.manageTextObservedSlot();
              return;
            }
        }
      });
    }
    manageTextObservedSlot() {
      if (!this[f3])
        return;
      const e6 = [...this[f3]].filter(
        (l4) => {
          const s4 = l4;
          return s4.tagName ? !i5.some(r4(s4)) : s4.textContent ? s4.textContent.trim() : false;
        }
      );
      this.slotHasContent = e6.length > 0;
    }
    update(e6) {
      if (!this.hasUpdated) {
        const { childNodes: l4 } = this, s4 = [...l4].filter((h4) => {
          const a2 = h4;
          return a2.tagName ? i5.some(
            r4(a2)
          ) ? false : (
            // This pass happens at element upgrade and before slot rendering.
            // Confirm it would exisit in a targeted slot if there was one supplied.
            n6 ? a2.getAttribute("slot") === n6 : !a2.hasAttribute("slot")
          ) : a2.textContent ? a2.textContent.trim() : false;
        });
        this.slotHasContent = s4.length > 0;
      }
      super.update(e6);
    }
    firstUpdated(e6) {
      super.firstUpdated(e6), this.updateComplete.then(() => {
        this.manageTextObservedSlot();
      });
    }
  }
  return p([
    m2({ type: Boolean, attribute: false })
  ], o8.prototype, "slotHasContent"), p([
    g({
      slot: n6,
      flatten: true
    })
  ], o8.prototype, u7), o8;
}

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/button/src/button-base.css.js
var e = src_exports.css`
    :host{vertical-align:top;--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-100);--spectrum-icon-size:var(--spectrum-workflow-icon-size-100);display:inline-flex}:host([dir]){-webkit-appearance:none}:host([disabled]){pointer-events:none;cursor:auto}#button{position:absolute;inset:0}::slotted(sp-overlay),::slotted(sp-tooltip){position:absolute}:host:after,::slotted(*){pointer-events:none}slot[name=icon]::slotted(svg),slot[name=icon]::slotted(img){fill:currentColor;stroke:currentColor;block-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-100));inline-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-100))}[icon-only]+#label{display:contents}:host([size=xs]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-50);--spectrum-icon-size:var(--spectrum-workflow-icon-size-50)}:host([size=s]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-75);--spectrum-icon-size:var(--spectrum-workflow-icon-size-75)}:host([size=l]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-200);--spectrum-icon-size:var(--spectrum-workflow-icon-size-200)}:host([size=xl]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-300);--spectrum-icon-size:var(--spectrum-workflow-icon-size-300)}:host([size=xxl]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-400);--spectrum-icon-size:var(--spectrum-workflow-icon-size-400)}
`;
var button_base_css_default = e;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/button/src/ButtonBase.js
var u4 = Object.defineProperty;
var d3 = Object.getOwnPropertyDescriptor;
var s2 = (n6, i5, e6, t5) => {
  for (var r4 = t5 > 1 ? void 0 : t5 ? d3(i5, e6) : i5, a2 = n6.length - 1, l4; a2 >= 0; a2--) (l4 = n6[a2]) && (r4 = (t5 ? l4(i5, e6, r4) : l4(r4)) || r4);
  return t5 && r4 && u4(i5, e6, r4), r4;
};
var ButtonBase = class extends N(LikeAnchor(Focusable), "", ["sp-overlay,sp-tooltip"]) {
  constructor() {
    super();
    this.active = false;
    this.type = "button";
    this.proxyFocus = this.proxyFocus.bind(this), this.addEventListener("click", this.handleClickCapture, { capture: true });
  }
  static get styles() {
    return [button_base_css_default];
  }
  get focusElement() {
    return this;
  }
  get hasLabel() {
    return this.slotHasContent;
  }
  get buttonContent() {
    return [src_exports.html`
                <slot name="icon" ?icon-only=${!this.hasLabel}></slot>
            `, src_exports.html`
                <span id="label">
                    <slot @slotchange=${this.manageTextObservedSlot}></slot>
                </span>
            `];
  }
  handleClickCapture(e6) {
    if (this.disabled) return e6.preventDefault(), e6.stopImmediatePropagation(), false;
    this.shouldProxyClick(e6);
  }
  proxyFocus() {
    this.focus();
  }
  shouldProxyClick(e6) {
    let t5 = false;
    if (e6 && (e6.metaKey || e6.ctrlKey || e6.shiftKey || e6.altKey)) return false;
    if (this.anchorElement) this.anchorElement.click(), t5 = true;
    else if (this.type !== "button") {
      const r4 = document.createElement("button");
      r4.type = this.type, this.insertAdjacentElement("afterend", r4), r4.click(), r4.remove(), t5 = true;
    }
    return t5;
  }
  renderAnchor() {
    return src_exports.html`
            ${this.buttonContent}
            ${super.renderAnchor({ id: "button", ariaHidden: true, className: "button anchor", tabindex: -1 })}
        `;
  }
  renderButton() {
    return src_exports.html`
            ${this.buttonContent}
        `;
  }
  render() {
    return this.href && this.href.length > 0 ? this.renderAnchor() : this.renderButton();
  }
  handleKeydown(e6) {
    const { code: t5 } = e6;
    switch (t5) {
      case "Space":
        e6.preventDefault(), typeof this.href == "undefined" && (this.addEventListener("keyup", this.handleKeyup), this.active = true);
        break;
      default:
        break;
    }
  }
  handleKeypress(e6) {
    const { code: t5 } = e6;
    switch (t5) {
      case "Enter":
      case "NumpadEnter":
        this.click();
        break;
      default:
        break;
    }
  }
  handleKeyup(e6) {
    const { code: t5 } = e6;
    switch (t5) {
      case "Space":
        this.removeEventListener("keyup", this.handleKeyup), this.active = false, this.click();
        break;
      default:
        break;
    }
  }
  manageAnchor() {
    this.href && this.href.length > 0 ? (!this.hasAttribute("role") || this.getAttribute("role") === "button") && this.setAttribute("role", "link") : (!this.hasAttribute("role") || this.getAttribute("role") === "link") && this.setAttribute("role", "button");
  }
  firstUpdated(e6) {
    super.firstUpdated(e6), this.hasAttribute("tabindex") || this.setAttribute("tabindex", "0"), this.manageAnchor(), this.addEventListener("keydown", this.handleKeydown), this.addEventListener("keypress", this.handleKeypress);
  }
  updated(e6) {
    super.updated(e6), e6.has("href") && this.manageAnchor(), e6.has("label") && (this.label ? this.setAttribute("aria-label", this.label) : this.removeAttribute("aria-label")), this.anchorElement && (this.anchorElement.tabIndex = -1, this.anchorElement.hasAttribute("aria-hidden") || this.anchorElement.setAttribute("aria-hidden", "true"), this.anchorElement.addEventListener("focus", this.proxyFocus));
  }
};
s2([(0, decorators_exports.property)({ type: Boolean, reflect: true })], ButtonBase.prototype, "active", 2), s2([(0, decorators_exports.property)({ type: String })], ButtonBase.prototype, "type", 2), s2([(0, decorators_exports.query)(".anchor")], ButtonBase.prototype, "anchorElement", 2);

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/button/src/StyledButton.js
var StyledButton = class extends ButtonBase {
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/clear-button/src/clear-button.css.js
var t = src_exports.css`
    :host{--spectrum-clear-button-background-color:var(--system-clear-button-background-color);--spectrum-clear-button-background-color-hover:var(--system-clear-button-background-color-hover);--spectrum-clear-button-background-color-down:var(--system-clear-button-background-color-down);--spectrum-clear-button-background-color-key-focus:var(--system-clear-button-background-color-key-focus)}:host([static-color=white]){--spectrum-clear-button-background-color-hover:var(--system-clear-button-static-white-background-color-hover);--spectrum-clear-button-background-color-down:var(--system-clear-button-static-white-background-color-down);--spectrum-clear-button-background-color-key-focus:var(--system-clear-button-static-white-background-color-key-focus)}:host{--spectrum-clear-button-height:var(--spectrum-component-height-100);--spectrum-clear-button-width:var(--spectrum-component-height-100);--spectrum-clear-button-padding:var(--spectrum-in-field-button-edge-to-fill);--spectrum-clear-button-icon-color:var(--spectrum-neutral-content-color-default);--spectrum-clear-button-icon-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-clear-button-icon-color-down:var(--spectrum-neutral-content-color-down);--spectrum-clear-button-icon-color-key-focus:var(--spectrum-neutral-content-color-key-focus);box-sizing:border-box;block-size:var(--mod-clear-button-height,var(--spectrum-clear-button-height));inline-size:var(--mod-clear-button-width,var(--spectrum-clear-button-width));background-color:var(--mod-clear-button-background-color,transparent);padding:var(--mod-clear-button-padding,var(--spectrum-clear-button-padding));color:var(--mod-clear-button-icon-color,var(--spectrum-clear-button-icon-color));border:none;border-radius:100%;margin:0}:host([size=s]){--spectrum-clear-button-height:var(--spectrum-component-height-75);--spectrum-clear-button-width:var(--spectrum-component-height-75)}:host([size=l]){--spectrum-clear-button-height:var(--spectrum-component-height-200);--spectrum-clear-button-width:var(--spectrum-component-height-200)}:host([size=xl]){--spectrum-clear-button-height:var(--spectrum-component-height-300);--spectrum-clear-button-width:var(--spectrum-component-height-300)}:host([quiet]){--mod-clear-button-background-color:transparent;--mod-clear-button-background-color-hover:transparent;--mod-clear-button-background-color-down:transparent;--mod-clear-button-background-color-key-focus:transparent}:host([static-color=white]){--mod-clear-button-icon-color:var(--spectrum-white);--mod-clear-button-icon-color-hover:var(--spectrum-white);--mod-clear-button-icon-color-down:var(--spectrum-white);--mod-clear-button-icon-color-key-focus:var(--spectrum-white);--mod-clear-button-icon-color-disabled:var(--spectrum-disabled-static-white-content-color);--mod-clear-button-background-color:transparent}:host(:disabled),:host([disabled]){--mod-clear-button-icon-color:var(--mod-clear-button-icon-color-disabled,var(--spectrum-disabled-content-color));--mod-clear-button-icon-color-hover:var(--spectrum-disabled-content-color);--mod-clear-button-icon-color-down:var(--spectrum-disabled-content-color);--mod-clear-button-background-color:var(--mod-clear-button-background-color-disabled,transparent)}:host(:not(:disabled)),:host(:not([disabled])){cursor:pointer}.icon{margin-block:0;margin-inline:auto}@media (hover:hover){:host(:hover:not(:disabled)),:host(:hover:not([disabled])){color:var(--highcontrast-clear-button-icon-color-hover,var(--mod-clear-button-icon-color-hover,var(--spectrum-clear-button-icon-color-hover)))}:host(:hover:not(:disabled)) .fill,:host(:hover:not([disabled])) .fill{background-color:var(--mod-clear-button-background-color-hover,var(--spectrum-clear-button-background-color-hover))}}:host(:is(:active,[active]):not(:disabled)),:host(:is(:active,[active]):not([disabled])){color:var(--mod-clear-button-icon-color-down,var(--spectrum-clear-button-icon-color-down))}:host(:is(:active,[active]):not(:disabled)),:host(:is(:active,[active]):not([disabled])) .fill{background-color:var(--mod-clear-button-background-color-down,var(--spectrum-clear-button-background-color-down))}:host(:not(:disabled):focus-visible),:host(:not([disabled]):focus-visible),:host(:not(:disabled):focus-within),:host(:not([disabled]):focus-within){color:var(--mod-clear-button-icon-color-key-focus,var(--spectrum-clear-button-icon-color-key-focus))}:host(:not(:disabled):focus-visible) .fill,:host(:not([disabled]):focus-visible) .fill,:host(:not(:disabled):focus-within) .fill,:host(:not([disabled]):focus-within) .fill{background-color:var(--mod-clear-button-background-color-key-focus,var(--spectrum-clear-button-background-color-key-focus))}.icon{color:inherit}.fill{background-color:var(--mod-clear-button-background-color,var(--spectrum-clear-button-background-color));border-radius:100%;justify-content:center;align-items:center;block-size:100%;inline-size:100%;display:flex}:host([variant=overBackground]:focus-visible),:host([static-color=white]:focus-visible){outline:none}@media (forced-colors:active){:host(:not(:disabled)),:host(:not([disabled])){--highcontrast-clear-button-icon-color-hover:Highlight}}
`;
var clear_button_css_default = t;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/reactive-controllers/src/SystemContextResolution.js
var systemResolverUpdatedSymbol = Symbol("system resolver updated");
var SystemResolutionController = class {
  constructor(e6) {
    this.system = "spectrum";
    this.host = e6, this.host.addController(this);
  }
  hostConnected() {
    this.resolveSystem();
  }
  hostDisconnected() {
    var e6;
    (e6 = this.unsubscribe) == null || e6.call(this);
  }
  resolveSystem() {
    const e6 = new CustomEvent("sp-system-context", { bubbles: true, composed: true, detail: { callback: (t5, s4) => {
      const o8 = this.system;
      this.system = t5, this.unsubscribe = s4, this.host.requestUpdate(systemResolverUpdatedSymbol, o8);
    } }, cancelable: true });
    this.host.dispatchEvent(e6);
  }
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icon/src/icon.css.js
var i2 = src_exports.css`
    :host{--spectrum-icon-inline-size:var(--mod-icon-inline-size,var(--mod-icon-size,var(--spectrum-icon-size)));--spectrum-icon-block-size:var(--mod-icon-block-size,var(--mod-icon-size,var(--spectrum-icon-size)));inline-size:var(--spectrum-icon-inline-size);block-size:var(--spectrum-icon-block-size);color:var(--mod-icon-color,inherit);fill:currentColor;pointer-events:none;display:inline-block}@media (forced-colors:active){:host{forced-color-adjust:auto}}:host{--spectrum-icon-size:var(--spectrum-workflow-icon-size-100)}:host([size=xxs]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-xxs)}:host([size=xs]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-50)}:host([size=s]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-75)}:host([size=l]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-200)}:host([size=xl]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-300)}:host([size=xxl]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-xxl)}#container{height:100%}img,svg,::slotted(*){vertical-align:top;width:100%;height:100%;color:inherit}@media (forced-colors:active){img,svg,::slotted(*){forced-color-adjust:auto}}:host(:not(:root)){overflow:hidden}
`;
var icon_css_default = i2;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icon/src/IconBase.js
var c3 = Object.defineProperty;
var m3 = Object.getOwnPropertyDescriptor;
var l3 = (i5, r4, e6, s4) => {
  for (var t5 = s4 > 1 ? void 0 : s4 ? m3(r4, e6) : r4, o8 = i5.length - 1, u7; o8 >= 0; o8--) (u7 = i5[o8]) && (t5 = (s4 ? u7(r4, e6, t5) : u7(t5)) || t5);
  return s4 && t5 && c3(r4, e6, t5), t5;
};
var IconBase = class extends C {
  constructor() {
    super(...arguments);
    this.unsubscribeSystemContext = null;
    this.spectrumVersion = 1;
    this.label = "";
    this.systemResolver = new SystemResolutionController(this);
  }
  static get styles() {
    return [icon_css_default];
  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.unsubscribeSystemContext && (this.unsubscribeSystemContext(), this.unsubscribeSystemContext = null);
  }
  update(e6) {
    e6.has("label") && (this.label ? this.removeAttribute("aria-hidden") : this.setAttribute("aria-hidden", "true")), e6.has(systemResolverUpdatedSymbol) && (this.spectrumVersion = this.systemResolver.system === "spectrum-two" ? 2 : 1), super.update(e6);
  }
  render() {
    return src_exports.html`
            <slot></slot>
        `;
  }
};
l3([(0, decorators_exports.state)()], IconBase.prototype, "spectrumVersion", 2), l3([(0, decorators_exports.property)({ reflect: true })], IconBase.prototype, "label", 2), l3([(0, decorators_exports.property)({ reflect: true })], IconBase.prototype, "size", 2);

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/custom-tag.js
var t2;
var tag = function(e6, ...a2) {
  return t2 ? t2(e6, ...a2) : a2.reduce((r4, p4, l4) => r4 + p4 + e6[l4 + 1], e6[0]);
};
var setCustomTemplateLiteralTag = (e6) => {
  t2 = e6;
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/icons-s2/Cross75.js
var Cross75Icon = ({ width: t5 = 24, height: e6 = 24, hidden: r4 = false, title: l4 = "Cross75" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 8 8"
    aria-hidden=${r4 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label="${l4}"
    width="${t5}"
    height="${e6}"
  >
    <path
      d="m5.188 4 2.14-2.14A.84.84 0 1 0 6.141.672L4 2.812 1.86.672A.84.84 0 0 0 .672 1.86L2.812 4 .672 6.14A.84.84 0 1 0 1.86 7.328L4 5.188l2.14 2.14A.84.84 0 1 0 7.328 6.14z"
    />
  </svg>`;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/icons/Cross75.js
var Cross75Icon2 = ({ width: t5 = 24, height: e6 = 24, hidden: r4 = false, title: l4 = "Cross75" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 8 8"
    aria-hidden=${r4 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label="${l4}"
    width="${t5}"
    height="${e6}"
  >
    <path
      d="m5.188 4 2.14-2.14A.84.84 0 1 0 6.141.672L4 2.812 1.86.672A.84.84 0 0 0 .672 1.86L2.812 4 .672 6.14A.84.84 0 1 0 1.86 7.328L4 5.188l2.14 2.14A.84.84 0 1 0 7.328 6.14z"
    />
  </svg>`;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross75.js
var IconCross75 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(src_exports.html), this.spectrumVersion === 2 ? Cross75Icon({ hidden: !this.label, title: this.label }) : Cross75Icon2({ hidden: !this.label, title: this.label });
  }
};

// node_modules/@spectrum-web-components/core/dist/shared/base/define-element.js
function o7(e6, t5) {
  window.__swc && window.__swc.DEBUG && customElements.get(e6) && window.__swc.warn(
    void 0,
    `Attempted to redefine <${e6}>. This usually indicates that multiple versions of the same web component were loaded onto a single page.`,
    "https://opensource.adobe.com/spectrum-web-components/registry-conflicts"
  ), customElements.define(e6, t5);
}

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross75.js
o7("sp-icon-cross75", IconCross75);

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/icons-s2/Cross100.js
var Cross100Icon = ({ width: t5 = 24, height: e6 = 24, hidden: r4 = false, title: a2 = "Cross100" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 8 8"
    aria-hidden=${r4 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label="${a2}"
    width="${t5}"
    height="${e6}"
  >
    <path
      d="m5.238 4 2.456-2.457A.875.875 0 1 0 6.456.306L4 2.763 1.543.306A.875.875 0 0 0 .306 1.544L2.763 4 .306 6.457a.875.875 0 1 0 1.238 1.237L4 5.237l2.456 2.457a.875.875 0 1 0 1.238-1.237z"
    />
  </svg>`;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/icons/Cross100.js
var Cross100Icon2 = ({ width: t5 = 24, height: e6 = 24, hidden: r4 = false, title: a2 = "Cross100" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 8 8"
    aria-hidden=${r4 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label="${a2}"
    width="${t5}"
    height="${e6}"
  >
    <path
      d="m5.238 4 2.456-2.457A.875.875 0 1 0 6.456.306L4 2.763 1.543.306A.875.875 0 0 0 .306 1.544L2.763 4 .306 6.457a.875.875 0 1 0 1.238 1.237L4 5.237l2.456 2.457a.875.875 0 1 0 1.238-1.237z"
    />
  </svg>`;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross100.js
var IconCross100 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(src_exports.html), this.spectrumVersion === 2 ? Cross100Icon({ hidden: !this.label, title: this.label }) : Cross100Icon2({ hidden: !this.label, title: this.label });
  }
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross100.js
o7("sp-icon-cross100", IconCross100);

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/icons-s2/Cross200.js
var Cross200Icon = ({ width: t5 = 24, height: e6 = 24, hidden: a2 = false, title: r4 = "Cross200" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 10"
    aria-hidden=${a2 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label="${r4}"
    width="${t5}"
    height="${e6}"
  >
    <path
      d="m6.29 5 2.922-2.922a.911.911 0 0 0-1.29-1.29L5 3.712 2.078.789a.911.911 0 0 0-1.29 1.289L3.712 5 .79 7.922a.911.911 0 1 0 1.289 1.29L5 6.288 7.923 9.21a.911.911 0 0 0 1.289-1.289z"
    />
  </svg>`;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/icons/Cross200.js
var Cross200Icon2 = ({ width: t5 = 24, height: e6 = 24, hidden: a2 = false, title: r4 = "Cross200" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 10"
    aria-hidden=${a2 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label="${r4}"
    width="${t5}"
    height="${e6}"
  >
    <path
      d="m6.29 5 2.922-2.922a.911.911 0 0 0-1.29-1.29L5 3.712 2.078.789a.911.911 0 0 0-1.29 1.289L3.712 5 .79 7.922a.911.911 0 1 0 1.289 1.29L5 6.288 7.923 9.21a.911.911 0 0 0 1.289-1.289z"
    />
  </svg>`;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross200.js
var IconCross200 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(src_exports.html), this.spectrumVersion === 2 ? Cross200Icon({ hidden: !this.label, title: this.label }) : Cross200Icon2({ hidden: !this.label, title: this.label });
  }
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross200.js
o7("sp-icon-cross200", IconCross200);

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/icons-s2/Cross300.js
var Cross300Icon = ({ width: t5 = 24, height: e6 = 24, hidden: a2 = false, title: r4 = "Cross300" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    aria-hidden=${a2 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label="${r4}"
    width="${t5}"
    height="${e6}"
  >
    <path
      d="m7.344 6 3.395-3.396a.95.95 0 0 0-1.344-1.342L6 4.657 2.604 1.262a.95.95 0 0 0-1.342 1.342L4.657 6 1.262 9.396a.95.95 0 0 0 1.343 1.343L6 7.344l3.395 3.395a.95.95 0 0 0 1.344-1.344z"
    />
  </svg>`;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/icons/Cross300.js
var Cross300Icon2 = ({ width: t5 = 24, height: e6 = 24, hidden: a2 = false, title: r4 = "Cross300" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    aria-hidden=${a2 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label="${r4}"
    width="${t5}"
    height="${e6}"
  >
    <path
      d="m7.344 6 3.395-3.396a.95.95 0 0 0-1.344-1.342L6 4.657 2.604 1.262a.95.95 0 0 0-1.342 1.342L4.657 6 1.262 9.396a.95.95 0 0 0 1.343 1.343L6 7.344l3.395 3.395a.95.95 0 0 0 1.344-1.344z"
    />
  </svg>`;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross300.js
var IconCross300 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(src_exports.html), this.spectrumVersion === 2 ? Cross300Icon({ hidden: !this.label, title: this.label }) : Cross300Icon2({ hidden: !this.label, title: this.label });
  }
};

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross300.js
o7("sp-icon-cross300", IconCross300);

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/icon/src/spectrum-icon-cross.css.js
var c4 = src_exports.css`
    .spectrum-UIIcon-Cross75{--spectrum-icon-size:var(--spectrum-cross-icon-size-75)}.spectrum-UIIcon-Cross100{--spectrum-icon-size:var(--spectrum-cross-icon-size-100)}.spectrum-UIIcon-Cross200{--spectrum-icon-size:var(--spectrum-cross-icon-size-200)}.spectrum-UIIcon-Cross300{--spectrum-icon-size:var(--spectrum-cross-icon-size-300)}.spectrum-UIIcon-Cross400{--spectrum-icon-size:var(--spectrum-cross-icon-size-400)}.spectrum-UIIcon-Cross500{--spectrum-icon-size:var(--spectrum-cross-icon-size-500)}.spectrum-UIIcon-Cross600{--spectrum-icon-size:var(--spectrum-cross-icon-size-600)}
`;
var spectrum_icon_cross_css_default = c4;

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/button/src/ClearButton.js
var d4 = Object.defineProperty;
var u5 = Object.getOwnPropertyDescriptor;
var r = (c6, s4, t5, o8) => {
  for (var e6 = o8 > 1 ? void 0 : o8 ? u5(s4, t5) : s4, a2 = c6.length - 1, l4; a2 >= 0; a2--) (l4 = c6[a2]) && (e6 = (o8 ? l4(s4, t5, e6) : l4(e6)) || e6);
  return o8 && e6 && d4(s4, t5, e6), e6;
};
var v2 = { s: () => src_exports.html`
        <sp-icon-cross75
            slot="icon"
            class="icon spectrum-UIIcon-Cross75"
        ></sp-icon-cross75>
    `, m: () => src_exports.html`
        <sp-icon-cross100
            slot="icon"
            class="icon spectrum-UIIcon-Cross100"
        ></sp-icon-cross100>
    `, l: () => src_exports.html`
        <sp-icon-cross200
            slot="icon"
            class="icon spectrum-UIIcon-Cross200"
        ></sp-icon-cross200>
    `, xl: () => src_exports.html`
        <sp-icon-cross300
            slot="icon"
            class="icon spectrum-UIIcon-Cross300"
        ></sp-icon-cross300>
    ` };
var ClearButton = class extends d(StyledButton, { noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.quiet = false;
  }
  static get styles() {
    return [...super.styles, clear_button_css_default, spectrum_icon_cross_css_default];
  }
  set variant(t5) {
    const o8 = this._variant, e6 = this.staticColor;
    if (t5 !== "overBackground") {
      this.removeAttribute("variant"), this._variant = void 0, this.staticColor = void 0;
      return;
    }
    this.setAttribute("variant", t5), this._variant = t5, this.staticColor = "white", this.requestUpdate("variant", o8), this.requestUpdate("staticColor", e6);
  }
  get variant() {
    return this._variant;
  }
  get buttonContent() {
    return [v2[this.size]()];
  }
  render() {
    return src_exports.html`
            <div class="fill">${super.render()}</div>
        `;
  }
  connectedCallback() {
    super.connectedCallback();
  }
};
r([(0, decorators_exports.property)()], ClearButton.prototype, "label", 2), r([(0, decorators_exports.property)({ type: Boolean, reflect: true })], ClearButton.prototype, "quiet", 2), r([(0, decorators_exports.property)({ reflect: true })], ClearButton.prototype, "variant", 1), r([(0, decorators_exports.property)({ reflect: true, attribute: "static-color" })], ClearButton.prototype, "staticColor", 2);

// node_modules/@spectrum-web-components/tags/node_modules/@spectrum-web-components/button/sp-clear-button.js
o7("sp-clear-button", ClearButton);

// node_modules/@spectrum-web-components/tags/src/tag.css.js
var t3 = src_exports.css`
    :host{--spectrum-avatar-opacity-disabled:.3;--spectrum-tag-animation-duration:var(--spectrum-animation-duration-100);--spectrum-tag-border-width:var(--spectrum-border-width-100);--spectrum-tag-focus-ring-thickness:var(--spectrum-focus-indicator-thickness);--spectrum-tag-focus-ring-gap:var(--spectrum-focus-indicator-gap);--spectrum-tag-focus-ring-color:var(--spectrum-focus-indicator-color);--spectrum-tag-label-line-height:var(--spectrum-line-height-100);--spectrum-tag-label-font-weight:var(--spectrum-regular-font-weight);--spectrum-tag-background-color-selected:var(--spectrum-neutral-background-color-selected-default);--spectrum-tag-background-color-selected-hover:var(--spectrum-neutral-background-color-selected-hover);--spectrum-tag-background-color-selected-active:var(--spectrum-neutral-background-color-selected-down);--spectrum-tag-background-color-selected-focus:var(--spectrum-neutral-background-color-selected-key-focus);--spectrum-tag-border-color-invalid:var(--spectrum-negative-color-900);--spectrum-tag-border-color-invalid-hover:var(--spectrum-negative-color-1000);--spectrum-tag-border-color-invalid-active:var(--spectrum-negative-color-1100);--spectrum-tag-border-color-invalid-focus:var(--spectrum-negative-color-1000);--spectrum-tag-content-color-invalid:var(--spectrum-negative-content-color-default);--spectrum-tag-content-color-invalid-hover:var(--spectrum-negative-content-color-hover);--spectrum-tag-content-color-invalid-active:var(--spectrum-negative-content-color-down);--spectrum-tag-content-color-invalid-focus:var(--spectrum-negative-content-color-key-focus);--spectrum-tag-border-color-invalid-selected:var(--spectrum-negative-background-color-default);--spectrum-tag-border-color-invalid-selected-hover:var(--spectrum-negative-background-color-hover);--spectrum-tag-border-color-invalid-selected-focus:var(--spectrum-negative-background-color-down);--spectrum-tag-border-color-invalid-selected-active:var(--spectrum-negative-background-color-key-focus);--spectrum-tag-background-color-invalid-selected:var(--spectrum-negative-background-color-default);--spectrum-tag-background-color-invalid-selected-hover:var(--spectrum-negative-background-color-hover);--spectrum-tag-background-color-invalid-selected-active:var(--spectrum-negative-background-color-down);--spectrum-tag-background-color-invalid-selected-focus:var(--spectrum-negative-background-color-key-focus);--spectrum-tag-content-color-invalid-selected:var(--spectrum-white);--spectrum-tag-border-color-emphasized:var(--spectrum-accent-background-color-default);--spectrum-tag-border-color-emphasized-hover:var(--spectrum-accent-background-color-hover);--spectrum-tag-border-color-emphasized-active:var(--spectrum-accent-background-color-down);--spectrum-tag-border-color-emphasized-focus:var(--spectrum-accent-background-color-key-focus);--spectrum-tag-background-color-emphasized:var(--spectrum-accent-background-color-default);--spectrum-tag-background-color-emphasized-hover:var(--spectrum-accent-background-color-hover);--spectrum-tag-background-color-emphasized-active:var(--spectrum-accent-background-color-down);--spectrum-tag-background-color-emphasized-focus:var(--spectrum-accent-background-color-key-focus);--spectrum-tag-content-color-emphasized:var(--spectrum-white);--spectrum-tag-content-color-disabled:var(--spectrum-disabled-content-color)}:host,:host{--spectrum-tag-height:var(--spectrum-component-height-100);--spectrum-tag-font-size:var(--spectrum-font-size-100);--spectrum-tag-icon-size:var(--spectrum-workflow-icon-size-100);--spectrum-tag-clear-button-spacing-inline-start:var(--spectrum-text-to-visual-100);--spectrum-tag-clear-button-spacing-block:var(--spectrum-tag-top-to-cross-icon-medium);--spectrum-tag-icon-spacing-block-start:var(--spectrum-component-top-to-workflow-icon-100);--spectrum-tag-icon-spacing-block-end:var(--spectrum-component-top-to-workflow-icon-100);--spectrum-tag-icon-spacing-inline-end:var(--spectrum-text-to-visual-100);--spectrum-tag-avatar-spacing-block-start:var(--spectrum-tag-top-to-avatar-medium);--spectrum-tag-avatar-spacing-block-end:var(--spectrum-tag-top-to-avatar-medium);--spectrum-tag-avatar-spacing-inline-end:var(--spectrum-text-to-visual-100);--spectrum-tag-label-spacing-block:var(--spectrum-component-top-to-text-100);--spectrum-tag-corner-radius:var(--spectrum-tag-size-medium-corner-radius);--spectrum-tag-spacing-inline-start:var(--spectrum-tag-size-medium-spacing-inline-start);--spectrum-tag-label-spacing-inline-end:var(--spectrum-tag-size-medium-label-spacing-inline-end);--spectrum-tag-clear-button-spacing-inline-end:var(--spectrum-tag-size-medium-clear-button-spacing-inline-end)}:host([size=s]){--spectrum-tag-height:var(--spectrum-component-height-75);--spectrum-tag-font-size:var(--spectrum-font-size-75);--spectrum-tag-icon-size:var(--spectrum-workflow-icon-size-75);--spectrum-tag-clear-button-spacing-inline-start:var(--spectrum-text-to-visual-75);--spectrum-tag-clear-button-spacing-block:var(--spectrum-tag-top-to-cross-icon-small);--spectrum-tag-icon-spacing-block-start:var(--spectrum-component-top-to-workflow-icon-75);--spectrum-tag-icon-spacing-block-end:var(--spectrum-component-top-to-workflow-icon-75);--spectrum-tag-icon-spacing-inline-end:var(--spectrum-text-to-visual-75);--spectrum-tag-avatar-spacing-block-start:var(--spectrum-tag-top-to-avatar-small);--spectrum-tag-avatar-spacing-block-end:var(--spectrum-tag-top-to-avatar-small);--spectrum-tag-avatar-spacing-inline-end:var(--spectrum-text-to-visual-75);--spectrum-tag-label-spacing-block:var(--spectrum-component-top-to-text-75);--spectrum-tag-corner-radius:var(--spectrum-tag-size-small-corner-radius);--spectrum-tag-spacing-inline-start:var(--spectrum-tag-size-small-spacing-inline-start);--spectrum-tag-label-spacing-inline-end:var(--spectrum-tag-size-small-label-spacing-inline-end);--spectrum-tag-clear-button-spacing-inline-end:var(--spectrum-tag-size-small-clear-button-spacing-inline-end)}:host([size=l]){--spectrum-tag-height:var(--spectrum-component-height-200);--spectrum-tag-font-size:var(--spectrum-font-size-200);--spectrum-tag-icon-size:var(--spectrum-workflow-icon-size-200);--spectrum-tag-clear-button-spacing-inline-start:var(--spectrum-text-to-visual-200);--spectrum-tag-clear-button-spacing-block:var(--spectrum-tag-top-to-cross-icon-large);--spectrum-tag-icon-spacing-block-start:var(--spectrum-component-top-to-workflow-icon-200);--spectrum-tag-icon-spacing-block-end:var(--spectrum-component-top-to-workflow-icon-200);--spectrum-tag-icon-spacing-inline-end:var(--spectrum-text-to-visual-200);--spectrum-tag-avatar-spacing-block-start:var(--spectrum-tag-top-to-avatar-large);--spectrum-tag-avatar-spacing-block-end:var(--spectrum-tag-top-to-avatar-large);--spectrum-tag-avatar-spacing-inline-end:var(--spectrum-text-to-visual-200);--spectrum-tag-label-spacing-block:var(--spectrum-component-top-to-text-200);--spectrum-tag-corner-radius:var(--spectrum-tag-size-large-corner-radius);--spectrum-tag-spacing-inline-start:var(--spectrum-tag-size-large-spacing-inline-start);--spectrum-tag-label-spacing-inline-end:var(--spectrum-tag-size-large-label-spacing-inline-end);--spectrum-tag-clear-button-spacing-inline-end:var(--spectrum-tag-size-large-clear-button-spacing-inline-end)}:host{border-color:var(--highcontrast-tag-border-color,var(--mod-tag-border-color,var(--spectrum-tag-border-color)));background-color:var(--highcontrast-tag-background-color,var(--mod-tag-background-color,var(--spectrum-tag-background-color)));color:var(--highcontrast-tag-content-color,var(--mod-tag-content-color,var(--spectrum-tag-content-color)));border-radius:var(--mod-tag-corner-radius,var(--spectrum-tag-corner-radius));border-width:var(--mod-tag-border-width,var(--spectrum-tag-border-width));block-size:var(--mod-tag-height,var(--spectrum-tag-height));box-sizing:border-box;vertical-align:bottom;-webkit-user-select:none;user-select:none;max-inline-size:100%;transition:border-color var(--mod-tag-animation-duration,var(--spectrum-tag-animation-duration))ease-in-out,color var(--mod-tag-animation-duration,var(--spectrum-tag-animation-duration))ease-in-out,box-shadow var(--mod-tag-animation-duration,var(--spectrum-tag-animation-duration))ease-in-out,background-color var(--mod-tag-animation-duration,var(--spectrum-tag-animation-duration))ease-in-out;border-style:solid;outline:none;align-items:center;padding-inline-start:calc(var(--mod-tag-spacing-inline-start,var(--spectrum-tag-spacing-inline-start)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));padding-inline-end:0;display:inline-flex;position:relative}::slotted([slot=icon]){block-size:var(--mod-tag-icon-size,var(--spectrum-tag-icon-size));inline-size:var(--mod-tag-icon-size,var(--spectrum-tag-icon-size));flex-shrink:0;margin-block-start:calc(var(--mod-tag-icon-spacing-block-start,var(--spectrum-tag-icon-spacing-block-start)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));margin-block-end:calc(var(--mod-tag-icon-spacing-block-end,var(--spectrum-tag-icon-spacing-block-end)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));margin-inline-end:var(--mod-tag-icon-spacing-inline-end,var(--spectrum-tag-icon-spacing-inline-end))}::slotted([slot=avatar]){margin-block-start:calc(var(--mod-tag-avatar-spacing-block-start,var(--spectrum-tag-avatar-spacing-block-start)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));margin-block-end:calc(var(--mod-tag-avatar-spacing-block-end,var(--spectrum-tag-avatar-spacing-block-end)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));margin-inline-end:var(--mod-tag-avatar-spacing-inline-end,var(--spectrum-tag-avatar-spacing-inline-end))}.clear-button{--mod-clear-button-width:fit-content;--spectrum-clearbutton-fill-size:fit-content;--spectrum-clearbutton-fill-background-color:transparent;box-sizing:border-box;color:currentColor;margin-inline-start:calc(var(--mod-tag-clear-button-spacing-inline-start,var(--spectrum-tag-clear-button-spacing-inline-start)) + var(--mod-tag-label-spacing-inline-end,var(--spectrum-tag-label-spacing-inline-end))*-1);margin-inline-end:calc(var(--mod-tag-clear-button-spacing-inline-end,var(--spectrum-tag-clear-button-spacing-inline-end)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));padding-block-start:calc(var(--mod-tag-clear-button-spacing-block,var(--spectrum-tag-clear-button-spacing-block)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));padding-block-end:calc(var(--mod-tag-clear-button-spacing-block,var(--spectrum-tag-clear-button-spacing-block)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)))}.clear-button .spectrum-ClearButton-fill{background-color:var(--mod-clearbutton-fill-background-color,var(--spectrum-clearbutton-fill-background-color));inline-size:var(--mod-clearbutton-fill-size,var(--spectrum-clearbutton-fill-size));block-size:var(--mod-clearbutton-fill-size,var(--spectrum-clearbutton-fill-size))}.label{box-sizing:border-box;block-size:100%;line-height:var(--mod-tag-label-line-height,var(--spectrum-tag-label-line-height));font-weight:var(--mod-tag-label-font-weight,var(--spectrum-tag-label-font-weight));font-size:var(--mod-tag-font-size,var(--spectrum-tag-font-size));cursor:default;white-space:nowrap;text-overflow:ellipsis;flex:auto;margin-inline-end:calc(var(--mod-tag-label-spacing-inline-end,var(--spectrum-tag-label-spacing-inline-end)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));padding-block-start:calc(var(--mod-tag-label-spacing-block,var(--spectrum-tag-label-spacing-block)) - var(--mod-tag-border-width,var(--spectrum-tag-border-width)));overflow:hidden}:host(:is(:active,[active])){border-color:var(--highcontrast-tag-border-color-active,var(--mod-tag-border-color-active,var(--spectrum-tag-border-color-active)));background-color:var(--highcontrast-tag-background-color-active,var(--mod-tag-background-color-active,var(--spectrum-tag-background-color-active)));color:var(--highcontrast-tag-content-color-active,var(--mod-tag-content-color-active,var(--spectrum-tag-content-color-active)))}:host([focused]),:host(:focus-visible){border-color:var(--highcontrast-tag-border-color-focus,var(--mod-tag-border-color-focus,var(--spectrum-tag-border-color-focus)));background-color:var(--highcontrast-tag-background-color-focus,var(--mod-tag-background-color-focus,var(--spectrum-tag-background-color-focus)));color:var(--highcontrast-tag-content-color-focus,var(--mod-tag-content-color-focus,var(--spectrum-tag-content-color-focus)))}:host([focused]):after,:host(:focus-visible):after{content:"";border-color:var(--highcontrast-tag-focus-ring-color,var(--mod-tag-focus-ring-color,var(--spectrum-tag-focus-ring-color)));border-radius:calc(var(--mod-tag-corner-radius,var(--spectrum-tag-corner-radius)) + var(--mod-tag-focus-ring-gap,var(--spectrum-tag-focus-ring-gap)) + var(--mod-tag-border-width,var(--spectrum-tag-border-width)));border-width:var(--mod-tag-focus-ring-thickness,var(--spectrum-tag-focus-ring-thickness));pointer-events:none;border-style:solid;display:inline-block;position:absolute;inset-block-start:calc(var(--mod-tag-focus-ring-gap,var(--spectrum-tag-focus-ring-gap))*-1 - var(--mod-tag-border-width,var(--spectrum-tag-border-width)) - var(--mod-tag-focus-ring-thickness,var(--spectrum-tag-focus-ring-thickness)));inset-block-end:calc(var(--mod-tag-focus-ring-gap,var(--spectrum-tag-focus-ring-gap))*-1 - var(--mod-tag-border-width,var(--spectrum-tag-border-width)) - var(--mod-tag-focus-ring-thickness,var(--spectrum-tag-focus-ring-thickness)));inset-inline-start:calc(var(--mod-tag-focus-ring-gap,var(--spectrum-tag-focus-ring-gap))*-1 - var(--mod-tag-border-width,var(--spectrum-tag-border-width)) - var(--mod-tag-focus-ring-thickness,var(--spectrum-tag-focus-ring-thickness)));inset-inline-end:calc(var(--mod-tag-focus-ring-gap,var(--spectrum-tag-focus-ring-gap))*-1 - var(--mod-tag-border-width,var(--spectrum-tag-border-width)) - var(--mod-tag-focus-ring-thickness,var(--spectrum-tag-focus-ring-thickness)))}:host([selected]){border-color:var(--highcontrast-tag-border-color-selected,var(--mod-tag-border-color-selected,var(--spectrum-tag-border-color-selected)));background-color:var(--highcontrast-tag-background-color-selected,var(--mod-tag-background-color-selected,var(--spectrum-tag-background-color-selected)));color:var(--highcontrast-tag-content-color-selected,var(--mod-tag-content-color-selected,var(--spectrum-tag-content-color-selected)))}:host([selected]:is(:active,[active])){border-color:var(--highcontrast-tag-border-color-selected-active,var(--mod-tag-border-color-selected-active,var(--spectrum-tag-border-color-selected-active)));background-color:var(--highcontrast-tag-background-color-selected-active,var(--mod-tag-background-color-selected-active,var(--spectrum-tag-background-color-selected-active)))}:host([selected][focused]),:host([selected]:focus-visible){border-color:var(--highcontrast-tag-border-color-selected-focus,var(--mod-tag-border-color-selected-focus,var(--spectrum-tag-border-color-selected-focus)));background-color:var(--highcontrast-tag-background-color-selected-focus,var(--mod-tag-background-color-selected-focus,var(--spectrum-tag-background-color-selected-focus)))}:host([invalid]){border-color:var(--highcontrast-tag-border-color-invalid,var(--mod-tag-border-color-invalid,var(--spectrum-tag-border-color-invalid)));color:var(--highcontrast-tag-content-color-invalid,var(--mod-tag-content-color-invalid,var(--spectrum-tag-content-color-invalid)))}:host([invalid]:is(:active,[active])){border-color:var(--highcontrast-tag-border-color-invalid-active,var(--mod-tag-border-color-invalid-active,var(--spectrum-tag-border-color-invalid-active)));color:var(--highcontrast-tag-content-color-invalid-active,var(--mod-tag-content-color-invalid-active,var(--spectrum-tag-content-color-invalid-active)))}:host([invalid][focused]),:host([invalid]:focus-visible){border-color:var(--highcontrast-tag-border-color-invalid-focus,var(--mod-tag-border-color-invalid-focus,var(--spectrum-tag-border-color-invalid-focus)));color:var(--highcontrast-tag-content-color-invalid-focus,var(--mod-tag-content-color-invalid-focus,var(--spectrum-tag-content-color-invalid-focus)))}:host([invalid][selected]){border-color:var(--highcontrast-tag-border-color-invalid-selected,var(--mod-tag-border-color-invalid-selected,var(--spectrum-tag-border-color-invalid-selected)));background-color:var(--highcontrast-tag-background-color-invalid-selected,var(--mod-tag-background-color-invalid-selected,var(--spectrum-tag-background-color-invalid-selected)));color:var(--highcontrast-tag-content-color-invalid-selected,var(--mod-tag-content-color-invalid-selected,var(--spectrum-tag-content-color-invalid-selected)))}:host([invalid][selected]:is(:active,[active])){border-color:var(--highcontrast-tag-border-color-invalid-selected-active,var(--mod-tag-border-color-invalid-selected-active,var(--spectrum-tag-border-color-invalid-selected-active)));background-color:var(--highcontrast-tag-background-color-invalid-selected-active,var(--mod-tag-background-color-invalid-selected-active,var(--spectrum-tag-background-color-invalid-selected-active)))}:host([invalid][selected][focused]),:host([invalid][selected]:focus-visible){border-color:var(--highcontrast-tag-border-color-invalid-selected-focus,var(--mod-tag-border-color-invalid-selected-focus,var(--spectrum-tag-border-color-invalid-selected-focus)));background-color:var(--highcontrast-tag-background-color-invalid-selected-focus,var(--mod-tag-background-color-invalid-selected-focus,var(--spectrum-tag-background-color-invalid-selected-focus)))}:host([emphasized]){border-color:var(--highcontrast-tag-border-color-emphasized,var(--mod-tag-border-color-emphasized,var(--spectrum-tag-border-color-emphasized)));background-color:var(--highcontrast-tag-background-color-emphasized,var(--mod-tag-background-color-emphasized,var(--spectrum-tag-background-color-emphasized)));color:var(--highcontrast-tag-content-color-emphasized,var(--mod-tag-content-color-emphasized,var(--spectrum-tag-content-color-emphasized)))}@media (hover:hover){:host(:hover){border-color:var(--highcontrast-tag-border-color-hover,var(--mod-tag-border-color-hover,var(--spectrum-tag-border-color-hover)));background-color:var(--highcontrast-tag-background-color-hover,var(--mod-tag-background-color-hover,var(--spectrum-tag-background-color-hover)));color:var(--highcontrast-tag-content-color-hover,var(--mod-tag-content-color-hover,var(--spectrum-tag-content-color-hover)))}:host([selected]:hover){border-color:var(--highcontrast-tag-border-color-selected-hover,var(--mod-tag-border-color-selected-hover,var(--spectrum-tag-border-color-selected-hover)));background-color:var(--highcontrast-tag-background-color-selected-hover,var(--mod-tag-background-color-selected-hover,var(--spectrum-tag-background-color-selected-hover)));color:var(--highcontrast-tag-content-color-selected,var(--mod-tag-content-color-selected,var(--spectrum-tag-content-color-selected)))}:host([invalid]:hover){border-color:var(--highcontrast-tag-border-color-invalid-hover,var(--mod-tag-border-color-invalid-hover,var(--spectrum-tag-border-color-invalid-hover)));color:var(--highcontrast-tag-content-color-invalid-hover,var(--mod-tag-content-color-invalid-hover,var(--spectrum-tag-content-color-invalid-hover)))}:host([invalid][selected]:hover){border-color:var(--highcontrast-tag-border-color-invalid-selected-hover,var(--mod-tag-border-color-invalid-selected-hover,var(--spectrum-tag-border-color-invalid-selected-hover)));background-color:var(--highcontrast-tag-background-color-invalid-selected-hover,var(--mod-tag-background-color-invalid-selected-hover,var(--spectrum-tag-background-color-invalid-selected-hover)));color:var(--highcontrast-tag-content-color-invalid-selected,var(--mod-tag-content-color-invalid-selected,var(--spectrum-tag-content-color-invalid-selected)))}:host([emphasized]:hover){border-color:var(--highcontrast-tag-border-color-emphasized-hover,var(--mod-tag-border-color-emphasized-hover,var(--spectrum-tag-border-color-emphasized-hover)));background-color:var(--highcontrast-tag-background-color-emphasized-hover,var(--mod-tag-background-color-emphasized-hover,var(--spectrum-tag-background-color-emphasized-hover)));color:var(--highcontrast-tag-content-color-emphasized,var(--mod-tag-content-color-emphasized,var(--spectrum-tag-content-color-emphasized)))}}:host([emphasized]:is(:active,[active])){border-color:var(--highcontrast-tag-border-color-emphasized-active,var(--mod-tag-border-color-emphasized-active,var(--spectrum-tag-border-color-emphasized-active)));background-color:var(--highcontrast-tag-background-color-emphasized-active,var(--mod-tag-background-color-emphasized-active,var(--spectrum-tag-background-color-emphasized-active)))}:host([emphasized][focused]),:host([emphasized]:focus-visible){border-color:var(--highcontrast-tag-border-color-emphasized-focus,var(--mod-tag-border-color-emphasized-focus,var(--spectrum-tag-border-color-emphasized-focus)));background-color:var(--highcontrast-tag-background-color-emphasized-focus,var(--mod-tag-background-color-emphasized-focus,var(--spectrum-tag-background-color-emphasized-focus)))}:host([disabled]){border-color:var(--highcontrast-tag-border-color-disabled,var(--mod-tag-border-color-disabled,var(--spectrum-tag-border-color-disabled)));background-color:var(--highcontrast-tag-background-color-disabled,var(--mod-tag-background-color-disabled,var(--spectrum-tag-background-color-disabled)));color:var(--highcontrast-tag-content-color-disabled,var(--mod-tag-content-color-disabled,var(--spectrum-tag-content-color-disabled)));pointer-events:none}:host([disabled]) ::slotted([slot=avatar]){opacity:var(--mod-avatar-opacity-disabled,var(--spectrum-avatar-opacity-disabled))}@media (forced-colors:active){:host{--highcontrast-tag-border-color:ButtonText;--highcontrast-tag-border-color-hover:ButtonText;--highcontrast-tag-border-color-active:ButtonText;--highcontrast-tag-border-color-focus:Highlight;--highcontrast-tag-background-color:ButtonFace;--highcontrast-tag-background-color-hover:ButtonFace;--highcontrast-tag-background-color-active:ButtonFace;--highcontrast-tag-background-color-focus:ButtonFace;--highcontrast-tag-content-color:ButtonText;--highcontrast-tag-content-color-hover:ButtonText;--highcontrast-tag-content-color-active:ButtonText;--highcontrast-tag-content-color-focus:ButtonText;--highcontrast-tag-focus-ring-color:Highlight;forced-color-adjust:none}:host([selected]){--highcontrast-tag-border-color-selected:Highlight;--highcontrast-tag-border-color-selected-hover:Highlight;--highcontrast-tag-border-color-selected-active:Highlight;--highcontrast-tag-border-color-selected-focus:Highlight;--highcontrast-tag-background-color-selected:Highlight;--highcontrast-tag-background-color-selected-hover:Highlight;--highcontrast-tag-background-color-selected-active:Highlight;--highcontrast-tag-background-color-selected-focus:Highlight;--highcontrast-tag-content-color-selected:HighlightText}:host([disabled]){--highcontrast-tag-border-color-disabled:GrayText;--highcontrast-tag-background-color-disabled:ButtonFace;--highcontrast-tag-content-color-disabled:GrayText}:host([invalid]){--highcontrast-tag-border-color-invalid:Highlight;--highcontrast-tag-border-color-invalid-hover:Highlight;--highcontrast-tag-border-color-invalid-active:Highlight;--highcontrast-tag-border-color-invalid-focus:Highlight;--highcontrast-tag-content-color-invalid:CanvasText;--highcontrast-tag-content-color-invalid-hover:CanvasText;--highcontrast-tag-content-color-invalid-active:CanvasText;--highcontrast-tag-content-color-invalid-focus:CanvasText}:host([invalid][selected]){--highcontrast-tag-border-color-invalid-selected:Highlight;--highcontrast-tag-border-color-invalid-selected-hover:Highlight;--highcontrast-tag-border-color-invalid-selected-focus:Highlight;--highcontrast-tag-border-color-invalid-selected-active:Highlight;--highcontrast-tag-background-color-invalid-selected:Highlight;--highcontrast-tag-background-color-invalid-selected-hover:Highlight;--highcontrast-tag-background-color-invalid-selected-active:Highlight;--highcontrast-tag-background-color-invalid-selected-focus:Highlight;--highcontrast-tag-content-color-invalid-selected:HighlightText}:host([emphasized]){--highcontrast-tag-border-color-emphasized:Highlight;--highcontrast-tag-border-color-emphasized-hover:Highlight;--highcontrast-tag-border-color-emphasized-active:Highlight;--highcontrast-tag-border-color-emphasized-focus:Highlight;--highcontrast-tag-background-color-emphasized:ButtonFace;--highcontrast-tag-background-color-emphasized-hover:ButtonFace;--highcontrast-tag-background-color-emphasized-active:ButtonFace;--highcontrast-tag-background-color-emphasized-focus:ButtonFace;--highcontrast-tag-content-color-emphasized:CanvasText}}:host{--spectrum-tag-background-color:var(--system-tag-background-color);--spectrum-tag-background-color-hover:var(--system-tag-background-color-hover);--spectrum-tag-background-color-active:var(--system-tag-background-color-active);--spectrum-tag-background-color-focus:var(--system-tag-background-color-focus);--spectrum-tag-size-small-corner-radius:var(--system-tag-size-small-corner-radius);--spectrum-tag-size-medium-corner-radius:var(--system-tag-size-medium-corner-radius);--spectrum-tag-size-large-corner-radius:var(--system-tag-size-large-corner-radius);--spectrum-tag-border-color:var(--system-tag-border-color);--spectrum-tag-border-color-hover:var(--system-tag-border-color-hover);--spectrum-tag-border-color-active:var(--system-tag-border-color-active);--spectrum-tag-border-color-focus:var(--system-tag-border-color-focus);--spectrum-tag-content-color:var(--system-tag-content-color);--spectrum-tag-content-color-hover:var(--system-tag-content-color-hover);--spectrum-tag-content-color-active:var(--system-tag-content-color-active);--spectrum-tag-content-color-focus:var(--system-tag-content-color-focus);--spectrum-tag-content-color-selected:var(--system-tag-content-color-selected);--spectrum-tag-border-color-selected:var(--system-tag-border-color-selected);--spectrum-tag-border-color-selected-hover:var(--system-tag-border-color-selected-hover);--spectrum-tag-border-color-selected-active:var(--system-tag-border-color-selected-active);--spectrum-tag-border-color-selected-focus:var(--system-tag-border-color-selected-focus);--spectrum-tag-border-color-disabled:var(--system-tag-border-color-disabled);--spectrum-tag-background-color-disabled:var(--system-tag-background-color-disabled);--spectrum-tag-size-small-spacing-inline-start:var(--system-tag-size-small-spacing-inline-start);--spectrum-tag-size-small-label-spacing-inline-end:var(--system-tag-size-small-label-spacing-inline-end);--spectrum-tag-size-small-clear-button-spacing-inline-end:var(--system-tag-size-small-clear-button-spacing-inline-end);--spectrum-tag-size-medium-spacing-inline-start:var(--system-tag-size-medium-spacing-inline-start);--spectrum-tag-size-medium-label-spacing-inline-end:var(--system-tag-size-medium-label-spacing-inline-end);--spectrum-tag-size-medium-clear-button-spacing-inline-end:var(--system-tag-size-medium-clear-button-spacing-inline-end);--spectrum-tag-size-large-spacing-inline-start:var(--system-tag-size-large-spacing-inline-start);--spectrum-tag-size-large-label-spacing-inline-end:var(--system-tag-size-large-label-spacing-inline-end);--spectrum-tag-size-large-clear-button-spacing-inline-end:var(--system-tag-size-large-clear-button-spacing-inline-end)}:host([invalid]) .clear-button{--spectrum-clearbutton-medium-icon-color:var(--spectrum-tag-icon-color-error-key-focus,var(--spectrum-red-600));--spectrum-clearbutton-medium-icon-color-hover:var(--spectrum-clearbutton-medium-icon-color);--spectrum-clearbutton-medium-icon-color-down:var(--spectrum-tag-deletable-icon-color-error-down,var(--spectrum-red-700))}:host([invalid]):hover .clear-button,:host([invalid]:is(:active,[active])) .clear-button{--spectrum-clearbutton-medium-icon-color:var(--spectrum-tag-icon-color-error-hover,var(--spectrum-red-600));--spectrum-clearbutton-medium-icon-color-hover:var(--spectrum-clearbutton-medium-icon-color);--spectrum-clearbutton-medium-icon-color-down:var(--spectrum-tag-deletable-icon-color-error-down,var(--spectrum-red-700))}:host([size=xs]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-50)}:host([size=s]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-75)}:host([size=m]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-100)}:host([size=l]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-200)}:host([size=xl]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-300)}:host([size=xxl]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-400)}
`;
var tag_css_default = t3;

// node_modules/@spectrum-web-components/tags/src/Tag.js
var u6 = Object.defineProperty;
var p3 = Object.getOwnPropertyDescriptor;
var r3 = (l4, i5, e6, s4) => {
  for (var t5 = s4 > 1 ? void 0 : s4 ? p3(i5, e6) : i5, a2 = l4.length - 1, o8; a2 >= 0; a2--) (o8 = l4[a2]) && (t5 = (s4 ? o8(i5, e6, t5) : o8(t5)) || t5);
  return s4 && t5 && u6(i5, e6, t5), t5;
};
var Tag = class extends d(C, { validSizes: ["s", "m", "l"], noDefaultSize: true }) {
  constructor() {
    super();
    this.deletable = false;
    this.disabled = false;
    this.readonly = false;
    this.handleFocusin = () => {
      this.addEventListener("focusout", this.handleFocusout), this.addEventListener("keydown", this.handleKeydown);
    };
    this.handleFocusout = () => {
      this.removeEventListener("keydown", this.handleKeydown), this.removeEventListener("focusout", this.handleFocusout);
    };
    this.handleKeydown = (e6) => {
      if (!this.deletable || this.disabled) return;
      const { code: s4 } = e6;
      switch (s4) {
        case "Backspace":
        case "Space":
        case "Delete":
          this.delete();
        default:
          return;
      }
    };
    this.addEventListener("focusin", this.handleFocusin);
  }
  static get styles() {
    return [tag_css_default];
  }
  delete() {
    this.readonly || !this.dispatchEvent(new Event("delete", { bubbles: true, cancelable: true, composed: true })) || this.remove();
  }
  render() {
    return src_exports.html`
            <slot name="avatar"></slot>
            <slot name="icon"></slot>
            <span class="label"><slot></slot></span>
            ${this.deletable ? src_exports.html`
                      <sp-clear-button
                          class="clear-button"
                          ?disabled=${this.disabled}
                          label="Remove"
                          size="s"
                          tabindex="-1"
                          @click=${this.delete}
                      ></sp-clear-button>
                  ` : src_exports.nothing}
        `;
  }
  firstUpdated(e6) {
    super.firstUpdated(e6), this.hasAttribute("role") || this.setAttribute("role", "listitem"), this.deletable && this.setAttribute("tabindex", "0");
  }
  updated(e6) {
    super.updated(e6), e6.has("disabled") && (this.disabled ? this.setAttribute("aria-disabled", "true") : this.removeAttribute("aria-disabled"));
  }
};
r3([(0, decorators_exports.property)({ type: Boolean, reflect: true })], Tag.prototype, "deletable", 2), r3([(0, decorators_exports.property)({ type: Boolean, reflect: true })], Tag.prototype, "disabled", 2), r3([(0, decorators_exports.property)({ type: Boolean, reflect: true })], Tag.prototype, "readonly", 2);

// node_modules/@spectrum-web-components/tags/src/tags.css.js
var t4 = src_exports.css`
    :host{--spectrum-tag-group-item-margin-block:var(--spectrum-spacing-75);--spectrum-tag-group-item-margin-inline:var(--spectrum-spacing-75);flex-wrap:wrap;margin:0;padding:0;list-style:none;display:inline-flex}::slotted(*){margin-block:var(--mod-tag-group-item-margin-block,var(--spectrum-tag-group-item-margin-block));margin-inline:var(--mod-tag-group-item-margin-inline,var(--spectrum-tag-group-item-margin-inline))}:host{--mod-clear-button-width:fit-content;margin:0;padding:0;list-style:none;display:inline-flex}
`;
var tags_css_default = t4;

// node_modules/@spectrum-web-components/tags/src/Tags.js
var g2 = Object.defineProperty;
var f4 = Object.getOwnPropertyDescriptor;
var h3 = (r4, n6, e6, t5) => {
  for (var s4 = t5 > 1 ? void 0 : t5 ? f4(n6, e6) : n6, o8 = r4.length - 1, i5; o8 >= 0; o8--) (i5 = r4[o8]) && (s4 = (t5 ? i5(n6, e6, s4) : i5(s4)) || s4);
  return t5 && s4 && g2(n6, e6, s4), s4;
};
var Tags = class extends FocusVisiblePolyfillMixin(C) {
  constructor() {
    super();
    this.rovingTabindexController = new RovingTabindexController(this, { focusInIndex: (e6) => e6.findIndex((t5) => !t5.disabled && t5.deletable), elements: () => this.tags, isFocusableElement: (e6) => !e6.disabled && e6.deletable });
    this.handleFocusin = () => {
      this.addEventListener("focusout", this.handleFocusout), this.addEventListener("keydown", this.handleKeydown);
    };
    this.handleKeydown = (e6) => {
      const { code: t5 } = e6;
      if (t5 !== "PageUp" && t5 !== "PageDown") return;
      const s4 = (d6, c6) => d6[(d6.length + c6) % d6.length], o8 = [...this.getRootNode().querySelectorAll("sp-tags")];
      if (o8.length < 2) return;
      e6.preventDefault();
      const i5 = o8.indexOf(this), u7 = t5 === "PageUp" ? -1 : 1;
      let l4 = i5 + u7, a2 = s4(o8, l4);
      for (; !a2.tags.length; ) l4 += u7, a2 = s4(o8, l4);
      a2.focus();
    };
    this.handleFocusout = () => {
      this.removeEventListener("keydown", this.handleKeydown), this.removeEventListener("focusout", this.handleFocusout);
    };
    this.addEventListener("focusin", this.handleFocusin);
  }
  static get styles() {
    return [tags_css_default];
  }
  get tags() {
    return this.defaultNodes.filter((e6) => e6 instanceof Tag);
  }
  focus() {
    this.rovingTabindexController.focus();
  }
  handleSlotchange() {
    this.rovingTabindexController.clearElementCache();
  }
  render() {
    return src_exports.html`
            <slot @slotchange=${this.handleSlotchange}></slot>
        `;
  }
  firstUpdated() {
    this.hasAttribute("role") || this.setAttribute("role", "list"), this.hasAttribute("aria-label") || this.setAttribute("aria-label", "Tags");
  }
};
h3([(0, decorators_exports.queryAssignedNodes)()], Tags.prototype, "defaultNodes", 2);

// node_modules/@spectrum-web-components/tags/sp-tags.js
o7("sp-tags", Tags);

// node_modules/@spectrum-web-components/tags/sp-tag.js
o7("sp-tag", Tag);
