var ef = { exports: {} }, pa = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var sd;
function nv() {
  if (sd) return pa;
  sd = 1;
  var f = Symbol.for("react.transitional.element"), y = Symbol.for("react.fragment");
  function r(s, M, z) {
    var x = null;
    if (z !== void 0 && (x = "" + z), M.key !== void 0 && (x = "" + M.key), "key" in M) {
      z = {};
      for (var q in M)
        q !== "key" && (z[q] = M[q]);
    } else z = M;
    return M = z.ref, {
      $$typeof: f,
      type: s,
      key: x,
      ref: M !== void 0 ? M : null,
      props: z
    };
  }
  return pa.Fragment = y, pa.jsx = r, pa.jsxs = r, pa;
}
var od;
function cv() {
  return od || (od = 1, ef.exports = nv()), ef.exports;
}
var E = cv(), uf = { exports: {} }, L = {};
/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var rd;
function iv() {
  if (rd) return L;
  rd = 1;
  var f = Symbol.for("react.transitional.element"), y = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), s = Symbol.for("react.strict_mode"), M = Symbol.for("react.profiler"), z = Symbol.for("react.consumer"), x = Symbol.for("react.context"), q = Symbol.for("react.forward_ref"), _ = Symbol.for("react.suspense"), T = Symbol.for("react.memo"), C = Symbol.for("react.lazy"), J = Symbol.iterator;
  function $(d) {
    return d === null || typeof d != "object" ? null : (d = J && d[J] || d["@@iterator"], typeof d == "function" ? d : null);
  }
  var vl = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, El = Object.assign, kl = {};
  function Hl(d, O, H) {
    this.props = d, this.context = O, this.refs = kl, this.updater = H || vl;
  }
  Hl.prototype.isReactComponent = {}, Hl.prototype.setState = function(d, O) {
    if (typeof d != "object" && typeof d != "function" && d != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, d, O, "setState");
  }, Hl.prototype.forceUpdate = function(d) {
    this.updater.enqueueForceUpdate(this, d, "forceUpdate");
  };
  function Ot() {
  }
  Ot.prototype = Hl.prototype;
  function St(d, O, H) {
    this.props = d, this.context = O, this.refs = kl, this.updater = H || vl;
  }
  var bl = St.prototype = new Ot();
  bl.constructor = St, El(bl, Hl.prototype), bl.isPureReactComponent = !0;
  var Vl = Array.isArray, I = { H: null, A: null, T: null, S: null, V: null }, Xl = Object.prototype.hasOwnProperty;
  function Cl(d, O, H, U, Y, P) {
    return H = P.ref, {
      $$typeof: f,
      type: d,
      key: O,
      ref: H !== void 0 ? H : null,
      props: P
    };
  }
  function Ql(d, O) {
    return Cl(
      d.type,
      O,
      void 0,
      void 0,
      void 0,
      d.props
    );
  }
  function bt(d) {
    return typeof d == "object" && d !== null && d.$$typeof === f;
  }
  function Ce(d) {
    var O = { "=": "=0", ":": "=2" };
    return "$" + d.replace(/[=:]/g, function(H) {
      return O[H];
    });
  }
  var _t = /\/+/g;
  function jl(d, O) {
    return typeof d == "object" && d !== null && d.key != null ? Ce("" + d.key) : O.toString(36);
  }
  function ve() {
  }
  function ye(d) {
    switch (d.status) {
      case "fulfilled":
        return d.value;
      case "rejected":
        throw d.reason;
      default:
        switch (typeof d.status == "string" ? d.then(ve, ve) : (d.status = "pending", d.then(
          function(O) {
            d.status === "pending" && (d.status = "fulfilled", d.value = O);
          },
          function(O) {
            d.status === "pending" && (d.status = "rejected", d.reason = O);
          }
        )), d.status) {
          case "fulfilled":
            return d.value;
          case "rejected":
            throw d.reason;
        }
    }
    throw d;
  }
  function Bl(d, O, H, U, Y) {
    var P = typeof d;
    (P === "undefined" || P === "boolean") && (d = null);
    var V = !1;
    if (d === null) V = !0;
    else
      switch (P) {
        case "bigint":
        case "string":
        case "number":
          V = !0;
          break;
        case "object":
          switch (d.$$typeof) {
            case f:
            case y:
              V = !0;
              break;
            case C:
              return V = d._init, Bl(
                V(d._payload),
                O,
                H,
                U,
                Y
              );
          }
      }
    if (V)
      return Y = Y(d), V = U === "" ? "." + jl(d, 0) : U, Vl(Y) ? (H = "", V != null && (H = V.replace(_t, "$&/") + "/"), Bl(Y, O, H, "", function(Vt) {
        return Vt;
      })) : Y != null && (bt(Y) && (Y = Ql(
        Y,
        H + (Y.key == null || d && d.key === Y.key ? "" : ("" + Y.key).replace(
          _t,
          "$&/"
        ) + "/") + V
      )), O.push(Y)), 1;
    V = 0;
    var Wl = U === "" ? "." : U + ":";
    if (Vl(d))
      for (var rl = 0; rl < d.length; rl++)
        U = d[rl], P = Wl + jl(U, rl), V += Bl(
          U,
          O,
          H,
          P,
          Y
        );
    else if (rl = $(d), typeof rl == "function")
      for (d = rl.call(d), rl = 0; !(U = d.next()).done; )
        U = U.value, P = Wl + jl(U, rl++), V += Bl(
          U,
          O,
          H,
          P,
          Y
        );
    else if (P === "object") {
      if (typeof d.then == "function")
        return Bl(
          ye(d),
          O,
          H,
          U,
          Y
        );
      throw O = String(d), Error(
        "Objects are not valid as a React child (found: " + (O === "[object Object]" ? "object with keys {" + Object.keys(d).join(", ") + "}" : O) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return V;
  }
  function A(d, O, H) {
    if (d == null) return d;
    var U = [], Y = 0;
    return Bl(d, U, "", "", function(P) {
      return O.call(H, P, Y++);
    }), U;
  }
  function N(d) {
    if (d._status === -1) {
      var O = d._result;
      O = O(), O.then(
        function(H) {
          (d._status === 0 || d._status === -1) && (d._status = 1, d._result = H);
        },
        function(H) {
          (d._status === 0 || d._status === -1) && (d._status = 2, d._result = H);
        }
      ), d._status === -1 && (d._status = 0, d._result = O);
    }
    if (d._status === 1) return d._result.default;
    throw d._result;
  }
  var Q = typeof reportError == "function" ? reportError : function(d) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var O = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof d == "object" && d !== null && typeof d.message == "string" ? String(d.message) : String(d),
        error: d
      });
      if (!window.dispatchEvent(O)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", d);
      return;
    }
    console.error(d);
  };
  function fl() {
  }
  return L.Children = {
    map: A,
    forEach: function(d, O, H) {
      A(
        d,
        function() {
          O.apply(this, arguments);
        },
        H
      );
    },
    count: function(d) {
      var O = 0;
      return A(d, function() {
        O++;
      }), O;
    },
    toArray: function(d) {
      return A(d, function(O) {
        return O;
      }) || [];
    },
    only: function(d) {
      if (!bt(d))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return d;
    }
  }, L.Component = Hl, L.Fragment = r, L.Profiler = M, L.PureComponent = St, L.StrictMode = s, L.Suspense = _, L.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = I, L.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(d) {
      return I.H.useMemoCache(d);
    }
  }, L.cache = function(d) {
    return function() {
      return d.apply(null, arguments);
    };
  }, L.cloneElement = function(d, O, H) {
    if (d == null)
      throw Error(
        "The argument must be a React element, but you passed " + d + "."
      );
    var U = El({}, d.props), Y = d.key, P = void 0;
    if (O != null)
      for (V in O.ref !== void 0 && (P = void 0), O.key !== void 0 && (Y = "" + O.key), O)
        !Xl.call(O, V) || V === "key" || V === "__self" || V === "__source" || V === "ref" && O.ref === void 0 || (U[V] = O[V]);
    var V = arguments.length - 2;
    if (V === 1) U.children = H;
    else if (1 < V) {
      for (var Wl = Array(V), rl = 0; rl < V; rl++)
        Wl[rl] = arguments[rl + 2];
      U.children = Wl;
    }
    return Cl(d.type, Y, void 0, void 0, P, U);
  }, L.createContext = function(d) {
    return d = {
      $$typeof: x,
      _currentValue: d,
      _currentValue2: d,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, d.Provider = d, d.Consumer = {
      $$typeof: z,
      _context: d
    }, d;
  }, L.createElement = function(d, O, H) {
    var U, Y = {}, P = null;
    if (O != null)
      for (U in O.key !== void 0 && (P = "" + O.key), O)
        Xl.call(O, U) && U !== "key" && U !== "__self" && U !== "__source" && (Y[U] = O[U]);
    var V = arguments.length - 2;
    if (V === 1) Y.children = H;
    else if (1 < V) {
      for (var Wl = Array(V), rl = 0; rl < V; rl++)
        Wl[rl] = arguments[rl + 2];
      Y.children = Wl;
    }
    if (d && d.defaultProps)
      for (U in V = d.defaultProps, V)
        Y[U] === void 0 && (Y[U] = V[U]);
    return Cl(d, P, void 0, void 0, null, Y);
  }, L.createRef = function() {
    return { current: null };
  }, L.forwardRef = function(d) {
    return { $$typeof: q, render: d };
  }, L.isValidElement = bt, L.lazy = function(d) {
    return {
      $$typeof: C,
      _payload: { _status: -1, _result: d },
      _init: N
    };
  }, L.memo = function(d, O) {
    return {
      $$typeof: T,
      type: d,
      compare: O === void 0 ? null : O
    };
  }, L.startTransition = function(d) {
    var O = I.T, H = {};
    I.T = H;
    try {
      var U = d(), Y = I.S;
      Y !== null && Y(H, U), typeof U == "object" && U !== null && typeof U.then == "function" && U.then(fl, Q);
    } catch (P) {
      Q(P);
    } finally {
      I.T = O;
    }
  }, L.unstable_useCacheRefresh = function() {
    return I.H.useCacheRefresh();
  }, L.use = function(d) {
    return I.H.use(d);
  }, L.useActionState = function(d, O, H) {
    return I.H.useActionState(d, O, H);
  }, L.useCallback = function(d, O) {
    return I.H.useCallback(d, O);
  }, L.useContext = function(d) {
    return I.H.useContext(d);
  }, L.useDebugValue = function() {
  }, L.useDeferredValue = function(d, O) {
    return I.H.useDeferredValue(d, O);
  }, L.useEffect = function(d, O, H) {
    var U = I.H;
    if (typeof H == "function")
      throw Error(
        "useEffect CRUD overload is not enabled in this build of React."
      );
    return U.useEffect(d, O);
  }, L.useId = function() {
    return I.H.useId();
  }, L.useImperativeHandle = function(d, O, H) {
    return I.H.useImperativeHandle(d, O, H);
  }, L.useInsertionEffect = function(d, O) {
    return I.H.useInsertionEffect(d, O);
  }, L.useLayoutEffect = function(d, O) {
    return I.H.useLayoutEffect(d, O);
  }, L.useMemo = function(d, O) {
    return I.H.useMemo(d, O);
  }, L.useOptimistic = function(d, O) {
    return I.H.useOptimistic(d, O);
  }, L.useReducer = function(d, O, H) {
    return I.H.useReducer(d, O, H);
  }, L.useRef = function(d) {
    return I.H.useRef(d);
  }, L.useState = function(d) {
    return I.H.useState(d);
  }, L.useSyncExternalStore = function(d, O, H) {
    return I.H.useSyncExternalStore(
      d,
      O,
      H
    );
  }, L.useTransition = function() {
    return I.H.useTransition();
  }, L.version = "19.1.0", L;
}
var dd;
function rf() {
  return dd || (dd = 1, uf.exports = iv()), uf.exports;
}
var tl = rf(), af = { exports: {} }, Ea = {}, nf = { exports: {} }, cf = {};
/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var hd;
function fv() {
  return hd || (hd = 1, function(f) {
    function y(A, N) {
      var Q = A.length;
      A.push(N);
      l: for (; 0 < Q; ) {
        var fl = Q - 1 >>> 1, d = A[fl];
        if (0 < M(d, N))
          A[fl] = N, A[Q] = d, Q = fl;
        else break l;
      }
    }
    function r(A) {
      return A.length === 0 ? null : A[0];
    }
    function s(A) {
      if (A.length === 0) return null;
      var N = A[0], Q = A.pop();
      if (Q !== N) {
        A[0] = Q;
        l: for (var fl = 0, d = A.length, O = d >>> 1; fl < O; ) {
          var H = 2 * (fl + 1) - 1, U = A[H], Y = H + 1, P = A[Y];
          if (0 > M(U, Q))
            Y < d && 0 > M(P, U) ? (A[fl] = P, A[Y] = Q, fl = Y) : (A[fl] = U, A[H] = Q, fl = H);
          else if (Y < d && 0 > M(P, Q))
            A[fl] = P, A[Y] = Q, fl = Y;
          else break l;
        }
      }
      return N;
    }
    function M(A, N) {
      var Q = A.sortIndex - N.sortIndex;
      return Q !== 0 ? Q : A.id - N.id;
    }
    if (f.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
      var z = performance;
      f.unstable_now = function() {
        return z.now();
      };
    } else {
      var x = Date, q = x.now();
      f.unstable_now = function() {
        return x.now() - q;
      };
    }
    var _ = [], T = [], C = 1, J = null, $ = 3, vl = !1, El = !1, kl = !1, Hl = !1, Ot = typeof setTimeout == "function" ? setTimeout : null, St = typeof clearTimeout == "function" ? clearTimeout : null, bl = typeof setImmediate < "u" ? setImmediate : null;
    function Vl(A) {
      for (var N = r(T); N !== null; ) {
        if (N.callback === null) s(T);
        else if (N.startTime <= A)
          s(T), N.sortIndex = N.expirationTime, y(_, N);
        else break;
        N = r(T);
      }
    }
    function I(A) {
      if (kl = !1, Vl(A), !El)
        if (r(_) !== null)
          El = !0, Xl || (Xl = !0, jl());
        else {
          var N = r(T);
          N !== null && Bl(I, N.startTime - A);
        }
    }
    var Xl = !1, Cl = -1, Ql = 5, bt = -1;
    function Ce() {
      return Hl ? !0 : !(f.unstable_now() - bt < Ql);
    }
    function _t() {
      if (Hl = !1, Xl) {
        var A = f.unstable_now();
        bt = A;
        var N = !0;
        try {
          l: {
            El = !1, kl && (kl = !1, St(Cl), Cl = -1), vl = !0;
            var Q = $;
            try {
              t: {
                for (Vl(A), J = r(_); J !== null && !(J.expirationTime > A && Ce()); ) {
                  var fl = J.callback;
                  if (typeof fl == "function") {
                    J.callback = null, $ = J.priorityLevel;
                    var d = fl(
                      J.expirationTime <= A
                    );
                    if (A = f.unstable_now(), typeof d == "function") {
                      J.callback = d, Vl(A), N = !0;
                      break t;
                    }
                    J === r(_) && s(_), Vl(A);
                  } else s(_);
                  J = r(_);
                }
                if (J !== null) N = !0;
                else {
                  var O = r(T);
                  O !== null && Bl(
                    I,
                    O.startTime - A
                  ), N = !1;
                }
              }
              break l;
            } finally {
              J = null, $ = Q, vl = !1;
            }
            N = void 0;
          }
        } finally {
          N ? jl() : Xl = !1;
        }
      }
    }
    var jl;
    if (typeof bl == "function")
      jl = function() {
        bl(_t);
      };
    else if (typeof MessageChannel < "u") {
      var ve = new MessageChannel(), ye = ve.port2;
      ve.port1.onmessage = _t, jl = function() {
        ye.postMessage(null);
      };
    } else
      jl = function() {
        Ot(_t, 0);
      };
    function Bl(A, N) {
      Cl = Ot(function() {
        A(f.unstable_now());
      }, N);
    }
    f.unstable_IdlePriority = 5, f.unstable_ImmediatePriority = 1, f.unstable_LowPriority = 4, f.unstable_NormalPriority = 3, f.unstable_Profiling = null, f.unstable_UserBlockingPriority = 2, f.unstable_cancelCallback = function(A) {
      A.callback = null;
    }, f.unstable_forceFrameRate = function(A) {
      0 > A || 125 < A ? console.error(
        "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
      ) : Ql = 0 < A ? Math.floor(1e3 / A) : 5;
    }, f.unstable_getCurrentPriorityLevel = function() {
      return $;
    }, f.unstable_next = function(A) {
      switch ($) {
        case 1:
        case 2:
        case 3:
          var N = 3;
          break;
        default:
          N = $;
      }
      var Q = $;
      $ = N;
      try {
        return A();
      } finally {
        $ = Q;
      }
    }, f.unstable_requestPaint = function() {
      Hl = !0;
    }, f.unstable_runWithPriority = function(A, N) {
      switch (A) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          A = 3;
      }
      var Q = $;
      $ = A;
      try {
        return N();
      } finally {
        $ = Q;
      }
    }, f.unstable_scheduleCallback = function(A, N, Q) {
      var fl = f.unstable_now();
      switch (typeof Q == "object" && Q !== null ? (Q = Q.delay, Q = typeof Q == "number" && 0 < Q ? fl + Q : fl) : Q = fl, A) {
        case 1:
          var d = -1;
          break;
        case 2:
          d = 250;
          break;
        case 5:
          d = 1073741823;
          break;
        case 4:
          d = 1e4;
          break;
        default:
          d = 5e3;
      }
      return d = Q + d, A = {
        id: C++,
        callback: N,
        priorityLevel: A,
        startTime: Q,
        expirationTime: d,
        sortIndex: -1
      }, Q > fl ? (A.sortIndex = Q, y(T, A), r(_) === null && A === r(T) && (kl ? (St(Cl), Cl = -1) : kl = !0, Bl(I, Q - fl))) : (A.sortIndex = d, y(_, A), El || vl || (El = !0, Xl || (Xl = !0, jl()))), A;
    }, f.unstable_shouldYield = Ce, f.unstable_wrapCallback = function(A) {
      var N = $;
      return function() {
        var Q = $;
        $ = N;
        try {
          return A.apply(this, arguments);
        } finally {
          $ = Q;
        }
      };
    };
  }(cf)), cf;
}
var vd;
function sv() {
  return vd || (vd = 1, nf.exports = fv()), nf.exports;
}
var ff = { exports: {} }, Gl = {};
/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var yd;
function ov() {
  if (yd) return Gl;
  yd = 1;
  var f = rf();
  function y(_) {
    var T = "https://react.dev/errors/" + _;
    if (1 < arguments.length) {
      T += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var C = 2; C < arguments.length; C++)
        T += "&args[]=" + encodeURIComponent(arguments[C]);
    }
    return "Minified React error #" + _ + "; visit " + T + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function r() {
  }
  var s = {
    d: {
      f: r,
      r: function() {
        throw Error(y(522));
      },
      D: r,
      C: r,
      L: r,
      m: r,
      X: r,
      S: r,
      M: r
    },
    p: 0,
    findDOMNode: null
  }, M = Symbol.for("react.portal");
  function z(_, T, C) {
    var J = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: M,
      key: J == null ? null : "" + J,
      children: _,
      containerInfo: T,
      implementation: C
    };
  }
  var x = f.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function q(_, T) {
    if (_ === "font") return "";
    if (typeof T == "string")
      return T === "use-credentials" ? T : "";
  }
  return Gl.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = s, Gl.createPortal = function(_, T) {
    var C = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!T || T.nodeType !== 1 && T.nodeType !== 9 && T.nodeType !== 11)
      throw Error(y(299));
    return z(_, T, null, C);
  }, Gl.flushSync = function(_) {
    var T = x.T, C = s.p;
    try {
      if (x.T = null, s.p = 2, _) return _();
    } finally {
      x.T = T, s.p = C, s.d.f();
    }
  }, Gl.preconnect = function(_, T) {
    typeof _ == "string" && (T ? (T = T.crossOrigin, T = typeof T == "string" ? T === "use-credentials" ? T : "" : void 0) : T = null, s.d.C(_, T));
  }, Gl.prefetchDNS = function(_) {
    typeof _ == "string" && s.d.D(_);
  }, Gl.preinit = function(_, T) {
    if (typeof _ == "string" && T && typeof T.as == "string") {
      var C = T.as, J = q(C, T.crossOrigin), $ = typeof T.integrity == "string" ? T.integrity : void 0, vl = typeof T.fetchPriority == "string" ? T.fetchPriority : void 0;
      C === "style" ? s.d.S(
        _,
        typeof T.precedence == "string" ? T.precedence : void 0,
        {
          crossOrigin: J,
          integrity: $,
          fetchPriority: vl
        }
      ) : C === "script" && s.d.X(_, {
        crossOrigin: J,
        integrity: $,
        fetchPriority: vl,
        nonce: typeof T.nonce == "string" ? T.nonce : void 0
      });
    }
  }, Gl.preinitModule = function(_, T) {
    if (typeof _ == "string")
      if (typeof T == "object" && T !== null) {
        if (T.as == null || T.as === "script") {
          var C = q(
            T.as,
            T.crossOrigin
          );
          s.d.M(_, {
            crossOrigin: C,
            integrity: typeof T.integrity == "string" ? T.integrity : void 0,
            nonce: typeof T.nonce == "string" ? T.nonce : void 0
          });
        }
      } else T == null && s.d.M(_);
  }, Gl.preload = function(_, T) {
    if (typeof _ == "string" && typeof T == "object" && T !== null && typeof T.as == "string") {
      var C = T.as, J = q(C, T.crossOrigin);
      s.d.L(_, C, {
        crossOrigin: J,
        integrity: typeof T.integrity == "string" ? T.integrity : void 0,
        nonce: typeof T.nonce == "string" ? T.nonce : void 0,
        type: typeof T.type == "string" ? T.type : void 0,
        fetchPriority: typeof T.fetchPriority == "string" ? T.fetchPriority : void 0,
        referrerPolicy: typeof T.referrerPolicy == "string" ? T.referrerPolicy : void 0,
        imageSrcSet: typeof T.imageSrcSet == "string" ? T.imageSrcSet : void 0,
        imageSizes: typeof T.imageSizes == "string" ? T.imageSizes : void 0,
        media: typeof T.media == "string" ? T.media : void 0
      });
    }
  }, Gl.preloadModule = function(_, T) {
    if (typeof _ == "string")
      if (T) {
        var C = q(T.as, T.crossOrigin);
        s.d.m(_, {
          as: typeof T.as == "string" && T.as !== "script" ? T.as : void 0,
          crossOrigin: C,
          integrity: typeof T.integrity == "string" ? T.integrity : void 0
        });
      } else s.d.m(_);
  }, Gl.requestFormReset = function(_) {
    s.d.r(_);
  }, Gl.unstable_batchedUpdates = function(_, T) {
    return _(T);
  }, Gl.useFormState = function(_, T, C) {
    return x.H.useFormState(_, T, C);
  }, Gl.useFormStatus = function() {
    return x.H.useHostTransitionStatus();
  }, Gl.version = "19.1.0", Gl;
}
var md;
function rv() {
  if (md) return ff.exports;
  md = 1;
  function f() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(f);
      } catch (y) {
        console.error(y);
      }
  }
  return f(), ff.exports = ov(), ff.exports;
}
var gd;
function dv() {
  if (gd) return Ea;
  gd = 1;
  /**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var f = sv(), y = rf(), r = rv();
  function s(l) {
    var t = "https://react.dev/errors/" + l;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var e = 2; e < arguments.length; e++)
        t += "&args[]=" + encodeURIComponent(arguments[e]);
    }
    return "Minified React error #" + l + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function M(l) {
    return !(!l || l.nodeType !== 1 && l.nodeType !== 9 && l.nodeType !== 11);
  }
  function z(l) {
    var t = l, e = l;
    if (l.alternate) for (; t.return; ) t = t.return;
    else {
      l = t;
      do
        t = l, (t.flags & 4098) !== 0 && (e = t.return), l = t.return;
      while (l);
    }
    return t.tag === 3 ? e : null;
  }
  function x(l) {
    if (l.tag === 13) {
      var t = l.memoizedState;
      if (t === null && (l = l.alternate, l !== null && (t = l.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function q(l) {
    if (z(l) !== l)
      throw Error(s(188));
  }
  function _(l) {
    var t = l.alternate;
    if (!t) {
      if (t = z(l), t === null) throw Error(s(188));
      return t !== l ? null : l;
    }
    for (var e = l, u = t; ; ) {
      var a = e.return;
      if (a === null) break;
      var n = a.alternate;
      if (n === null) {
        if (u = a.return, u !== null) {
          e = u;
          continue;
        }
        break;
      }
      if (a.child === n.child) {
        for (n = a.child; n; ) {
          if (n === e) return q(a), l;
          if (n === u) return q(a), t;
          n = n.sibling;
        }
        throw Error(s(188));
      }
      if (e.return !== u.return) e = a, u = n;
      else {
        for (var c = !1, i = a.child; i; ) {
          if (i === e) {
            c = !0, e = a, u = n;
            break;
          }
          if (i === u) {
            c = !0, u = a, e = n;
            break;
          }
          i = i.sibling;
        }
        if (!c) {
          for (i = n.child; i; ) {
            if (i === e) {
              c = !0, e = n, u = a;
              break;
            }
            if (i === u) {
              c = !0, u = n, e = a;
              break;
            }
            i = i.sibling;
          }
          if (!c) throw Error(s(189));
        }
      }
      if (e.alternate !== u) throw Error(s(190));
    }
    if (e.tag !== 3) throw Error(s(188));
    return e.stateNode.current === e ? l : t;
  }
  function T(l) {
    var t = l.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return l;
    for (l = l.child; l !== null; ) {
      if (t = T(l), t !== null) return t;
      l = l.sibling;
    }
    return null;
  }
  var C = Object.assign, J = Symbol.for("react.element"), $ = Symbol.for("react.transitional.element"), vl = Symbol.for("react.portal"), El = Symbol.for("react.fragment"), kl = Symbol.for("react.strict_mode"), Hl = Symbol.for("react.profiler"), Ot = Symbol.for("react.provider"), St = Symbol.for("react.consumer"), bl = Symbol.for("react.context"), Vl = Symbol.for("react.forward_ref"), I = Symbol.for("react.suspense"), Xl = Symbol.for("react.suspense_list"), Cl = Symbol.for("react.memo"), Ql = Symbol.for("react.lazy"), bt = Symbol.for("react.activity"), Ce = Symbol.for("react.memo_cache_sentinel"), _t = Symbol.iterator;
  function jl(l) {
    return l === null || typeof l != "object" ? null : (l = _t && l[_t] || l["@@iterator"], typeof l == "function" ? l : null);
  }
  var ve = Symbol.for("react.client.reference");
  function ye(l) {
    if (l == null) return null;
    if (typeof l == "function")
      return l.$$typeof === ve ? null : l.displayName || l.name || null;
    if (typeof l == "string") return l;
    switch (l) {
      case El:
        return "Fragment";
      case Hl:
        return "Profiler";
      case kl:
        return "StrictMode";
      case I:
        return "Suspense";
      case Xl:
        return "SuspenseList";
      case bt:
        return "Activity";
    }
    if (typeof l == "object")
      switch (l.$$typeof) {
        case vl:
          return "Portal";
        case bl:
          return (l.displayName || "Context") + ".Provider";
        case St:
          return (l._context.displayName || "Context") + ".Consumer";
        case Vl:
          var t = l.render;
          return l = l.displayName, l || (l = t.displayName || t.name || "", l = l !== "" ? "ForwardRef(" + l + ")" : "ForwardRef"), l;
        case Cl:
          return t = l.displayName || null, t !== null ? t : ye(l.type) || "Memo";
        case Ql:
          t = l._payload, l = l._init;
          try {
            return ye(l(t));
          } catch {
          }
      }
    return null;
  }
  var Bl = Array.isArray, A = y.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, N = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, Q = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, fl = [], d = -1;
  function O(l) {
    return { current: l };
  }
  function H(l) {
    0 > d || (l.current = fl[d], fl[d] = null, d--);
  }
  function U(l, t) {
    d++, fl[d] = l.current, l.current = t;
  }
  var Y = O(null), P = O(null), V = O(null), Wl = O(null);
  function rl(l, t) {
    switch (U(V, t), U(P, l), U(Y, null), t.nodeType) {
      case 9:
      case 11:
        l = (l = t.documentElement) && (l = l.namespaceURI) ? qr(l) : 0;
        break;
      default:
        if (l = t.tagName, t = t.namespaceURI)
          t = qr(t), l = Yr(t, l);
        else
          switch (l) {
            case "svg":
              l = 1;
              break;
            case "math":
              l = 2;
              break;
            default:
              l = 0;
          }
    }
    H(Y), U(Y, l);
  }
  function Vt() {
    H(Y), H(P), H(V);
  }
  function Qn(l) {
    l.memoizedState !== null && U(Wl, l);
    var t = Y.current, e = Yr(t, l.type);
    t !== e && (U(P, l), U(Y, e));
  }
  function Da(l) {
    P.current === l && (H(Y), H(P)), Wl.current === l && (H(Wl), ma._currentValue = Q);
  }
  var Zn = Object.prototype.hasOwnProperty, Vn = f.unstable_scheduleCallback, Ln = f.unstable_cancelCallback, qd = f.unstable_shouldYield, Yd = f.unstable_requestPaint, Tt = f.unstable_now, Gd = f.unstable_getCurrentPriorityLevel, mf = f.unstable_ImmediatePriority, gf = f.unstable_UserBlockingPriority, Ra = f.unstable_NormalPriority, Xd = f.unstable_LowPriority, Sf = f.unstable_IdlePriority, Qd = f.log, Zd = f.unstable_setDisableYieldValue, Du = null, Fl = null;
  function Lt(l) {
    if (typeof Qd == "function" && Zd(l), Fl && typeof Fl.setStrictMode == "function")
      try {
        Fl.setStrictMode(Du, l);
      } catch {
      }
  }
  var Il = Math.clz32 ? Math.clz32 : Kd, Vd = Math.log, Ld = Math.LN2;
  function Kd(l) {
    return l >>>= 0, l === 0 ? 32 : 31 - (Vd(l) / Ld | 0) | 0;
  }
  var Oa = 256, _a = 4194304;
  function me(l) {
    var t = l & 42;
    if (t !== 0) return t;
    switch (l & -l) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return l & 4194048;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return l & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return l;
    }
  }
  function Ma(l, t, e) {
    var u = l.pendingLanes;
    if (u === 0) return 0;
    var a = 0, n = l.suspendedLanes, c = l.pingedLanes;
    l = l.warmLanes;
    var i = u & 134217727;
    return i !== 0 ? (u = i & ~n, u !== 0 ? a = me(u) : (c &= i, c !== 0 ? a = me(c) : e || (e = i & ~l, e !== 0 && (a = me(e))))) : (i = u & ~n, i !== 0 ? a = me(i) : c !== 0 ? a = me(c) : e || (e = u & ~l, e !== 0 && (a = me(e)))), a === 0 ? 0 : t !== 0 && t !== a && (t & n) === 0 && (n = a & -a, e = t & -t, n >= e || n === 32 && (e & 4194048) !== 0) ? t : a;
  }
  function Ru(l, t) {
    return (l.pendingLanes & ~(l.suspendedLanes & ~l.pingedLanes) & t) === 0;
  }
  function Jd(l, t) {
    switch (l) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return t + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function bf() {
    var l = Oa;
    return Oa <<= 1, (Oa & 4194048) === 0 && (Oa = 256), l;
  }
  function Tf() {
    var l = _a;
    return _a <<= 1, (_a & 62914560) === 0 && (_a = 4194304), l;
  }
  function Kn(l) {
    for (var t = [], e = 0; 31 > e; e++) t.push(l);
    return t;
  }
  function Ou(l, t) {
    l.pendingLanes |= t, t !== 268435456 && (l.suspendedLanes = 0, l.pingedLanes = 0, l.warmLanes = 0);
  }
  function wd(l, t, e, u, a, n) {
    var c = l.pendingLanes;
    l.pendingLanes = e, l.suspendedLanes = 0, l.pingedLanes = 0, l.warmLanes = 0, l.expiredLanes &= e, l.entangledLanes &= e, l.errorRecoveryDisabledLanes &= e, l.shellSuspendCounter = 0;
    var i = l.entanglements, o = l.expirationTimes, g = l.hiddenUpdates;
    for (e = c & ~e; 0 < e; ) {
      var p = 31 - Il(e), R = 1 << p;
      i[p] = 0, o[p] = -1;
      var S = g[p];
      if (S !== null)
        for (g[p] = null, p = 0; p < S.length; p++) {
          var b = S[p];
          b !== null && (b.lane &= -536870913);
        }
      e &= ~R;
    }
    u !== 0 && pf(l, u, 0), n !== 0 && a === 0 && l.tag !== 0 && (l.suspendedLanes |= n & ~(c & ~t));
  }
  function pf(l, t, e) {
    l.pendingLanes |= t, l.suspendedLanes &= ~t;
    var u = 31 - Il(t);
    l.entangledLanes |= t, l.entanglements[u] = l.entanglements[u] | 1073741824 | e & 4194090;
  }
  function Ef(l, t) {
    var e = l.entangledLanes |= t;
    for (l = l.entanglements; e; ) {
      var u = 31 - Il(e), a = 1 << u;
      a & t | l[u] & t && (l[u] |= t), e &= ~a;
    }
  }
  function Jn(l) {
    switch (l) {
      case 2:
        l = 1;
        break;
      case 8:
        l = 4;
        break;
      case 32:
        l = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        l = 128;
        break;
      case 268435456:
        l = 134217728;
        break;
      default:
        l = 0;
    }
    return l;
  }
  function wn(l) {
    return l &= -l, 2 < l ? 8 < l ? (l & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function Af() {
    var l = N.p;
    return l !== 0 ? l : (l = window.event, l === void 0 ? 32 : ud(l.type));
  }
  function $d(l, t) {
    var e = N.p;
    try {
      return N.p = l, t();
    } finally {
      N.p = e;
    }
  }
  var Kt = Math.random().toString(36).slice(2), ql = "__reactFiber$" + Kt, Ll = "__reactProps$" + Kt, je = "__reactContainer$" + Kt, $n = "__reactEvents$" + Kt, kd = "__reactListeners$" + Kt, Wd = "__reactHandles$" + Kt, Df = "__reactResources$" + Kt, _u = "__reactMarker$" + Kt;
  function kn(l) {
    delete l[ql], delete l[Ll], delete l[$n], delete l[kd], delete l[Wd];
  }
  function Be(l) {
    var t = l[ql];
    if (t) return t;
    for (var e = l.parentNode; e; ) {
      if (t = e[je] || e[ql]) {
        if (e = t.alternate, t.child !== null || e !== null && e.child !== null)
          for (l = Zr(l); l !== null; ) {
            if (e = l[ql]) return e;
            l = Zr(l);
          }
        return t;
      }
      l = e, e = l.parentNode;
    }
    return null;
  }
  function qe(l) {
    if (l = l[ql] || l[je]) {
      var t = l.tag;
      if (t === 5 || t === 6 || t === 13 || t === 26 || t === 27 || t === 3)
        return l;
    }
    return null;
  }
  function Mu(l) {
    var t = l.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return l.stateNode;
    throw Error(s(33));
  }
  function Ye(l) {
    var t = l[Df];
    return t || (t = l[Df] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), t;
  }
  function Rl(l) {
    l[_u] = !0;
  }
  var Rf = /* @__PURE__ */ new Set(), Of = {};
  function ge(l, t) {
    Ge(l, t), Ge(l + "Capture", t);
  }
  function Ge(l, t) {
    for (Of[l] = t, l = 0; l < t.length; l++)
      Rf.add(t[l]);
  }
  var Fd = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ), _f = {}, Mf = {};
  function Id(l) {
    return Zn.call(Mf, l) ? !0 : Zn.call(_f, l) ? !1 : Fd.test(l) ? Mf[l] = !0 : (_f[l] = !0, !1);
  }
  function za(l, t, e) {
    if (Id(t))
      if (e === null) l.removeAttribute(t);
      else {
        switch (typeof e) {
          case "undefined":
          case "function":
          case "symbol":
            l.removeAttribute(t);
            return;
          case "boolean":
            var u = t.toLowerCase().slice(0, 5);
            if (u !== "data-" && u !== "aria-") {
              l.removeAttribute(t);
              return;
            }
        }
        l.setAttribute(t, "" + e);
      }
  }
  function Ua(l, t, e) {
    if (e === null) l.removeAttribute(t);
    else {
      switch (typeof e) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          l.removeAttribute(t);
          return;
      }
      l.setAttribute(t, "" + e);
    }
  }
  function Mt(l, t, e, u) {
    if (u === null) l.removeAttribute(e);
    else {
      switch (typeof u) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          l.removeAttribute(e);
          return;
      }
      l.setAttributeNS(t, e, "" + u);
    }
  }
  var Wn, zf;
  function Xe(l) {
    if (Wn === void 0)
      try {
        throw Error();
      } catch (e) {
        var t = e.stack.trim().match(/\n( *(at )?)/);
        Wn = t && t[1] || "", zf = -1 < e.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
    return `
` + Wn + l + zf;
  }
  var Fn = !1;
  function In(l, t) {
    if (!l || Fn) return "";
    Fn = !0;
    var e = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var u = {
        DetermineComponentFrameRoot: function() {
          try {
            if (t) {
              var R = function() {
                throw Error();
              };
              if (Object.defineProperty(R.prototype, "props", {
                set: function() {
                  throw Error();
                }
              }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(R, []);
                } catch (b) {
                  var S = b;
                }
                Reflect.construct(l, [], R);
              } else {
                try {
                  R.call();
                } catch (b) {
                  S = b;
                }
                l.call(R.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (b) {
                S = b;
              }
              (R = l()) && typeof R.catch == "function" && R.catch(function() {
              });
            }
          } catch (b) {
            if (b && S && typeof b.stack == "string")
              return [b.stack, S.stack];
          }
          return [null, null];
        }
      };
      u.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var a = Object.getOwnPropertyDescriptor(
        u.DetermineComponentFrameRoot,
        "name"
      );
      a && a.configurable && Object.defineProperty(
        u.DetermineComponentFrameRoot,
        "name",
        { value: "DetermineComponentFrameRoot" }
      );
      var n = u.DetermineComponentFrameRoot(), c = n[0], i = n[1];
      if (c && i) {
        var o = c.split(`
`), g = i.split(`
`);
        for (a = u = 0; u < o.length && !o[u].includes("DetermineComponentFrameRoot"); )
          u++;
        for (; a < g.length && !g[a].includes(
          "DetermineComponentFrameRoot"
        ); )
          a++;
        if (u === o.length || a === g.length)
          for (u = o.length - 1, a = g.length - 1; 1 <= u && 0 <= a && o[u] !== g[a]; )
            a--;
        for (; 1 <= u && 0 <= a; u--, a--)
          if (o[u] !== g[a]) {
            if (u !== 1 || a !== 1)
              do
                if (u--, a--, 0 > a || o[u] !== g[a]) {
                  var p = `
` + o[u].replace(" at new ", " at ");
                  return l.displayName && p.includes("<anonymous>") && (p = p.replace("<anonymous>", l.displayName)), p;
                }
              while (1 <= u && 0 <= a);
            break;
          }
      }
    } finally {
      Fn = !1, Error.prepareStackTrace = e;
    }
    return (e = l ? l.displayName || l.name : "") ? Xe(e) : "";
  }
  function Pd(l) {
    switch (l.tag) {
      case 26:
      case 27:
      case 5:
        return Xe(l.type);
      case 16:
        return Xe("Lazy");
      case 13:
        return Xe("Suspense");
      case 19:
        return Xe("SuspenseList");
      case 0:
      case 15:
        return In(l.type, !1);
      case 11:
        return In(l.type.render, !1);
      case 1:
        return In(l.type, !0);
      case 31:
        return Xe("Activity");
      default:
        return "";
    }
  }
  function Uf(l) {
    try {
      var t = "";
      do
        t += Pd(l), l = l.return;
      while (l);
      return t;
    } catch (e) {
      return `
Error generating stack: ` + e.message + `
` + e.stack;
    }
  }
  function ct(l) {
    switch (typeof l) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return l;
      case "object":
        return l;
      default:
        return "";
    }
  }
  function Nf(l) {
    var t = l.type;
    return (l = l.nodeName) && l.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function lh(l) {
    var t = Nf(l) ? "checked" : "value", e = Object.getOwnPropertyDescriptor(
      l.constructor.prototype,
      t
    ), u = "" + l[t];
    if (!l.hasOwnProperty(t) && typeof e < "u" && typeof e.get == "function" && typeof e.set == "function") {
      var a = e.get, n = e.set;
      return Object.defineProperty(l, t, {
        configurable: !0,
        get: function() {
          return a.call(this);
        },
        set: function(c) {
          u = "" + c, n.call(this, c);
        }
      }), Object.defineProperty(l, t, {
        enumerable: e.enumerable
      }), {
        getValue: function() {
          return u;
        },
        setValue: function(c) {
          u = "" + c;
        },
        stopTracking: function() {
          l._valueTracker = null, delete l[t];
        }
      };
    }
  }
  function Na(l) {
    l._valueTracker || (l._valueTracker = lh(l));
  }
  function xf(l) {
    if (!l) return !1;
    var t = l._valueTracker;
    if (!t) return !0;
    var e = t.getValue(), u = "";
    return l && (u = Nf(l) ? l.checked ? "true" : "false" : l.value), l = u, l !== e ? (t.setValue(l), !0) : !1;
  }
  function xa(l) {
    if (l = l || (typeof document < "u" ? document : void 0), typeof l > "u") return null;
    try {
      return l.activeElement || l.body;
    } catch {
      return l.body;
    }
  }
  var th = /[\n"\\]/g;
  function it(l) {
    return l.replace(
      th,
      function(t) {
        return "\\" + t.charCodeAt(0).toString(16) + " ";
      }
    );
  }
  function Pn(l, t, e, u, a, n, c, i) {
    l.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? l.type = c : l.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && l.value === "" || l.value != t) && (l.value = "" + ct(t)) : l.value !== "" + ct(t) && (l.value = "" + ct(t)) : c !== "submit" && c !== "reset" || l.removeAttribute("value"), t != null ? lc(l, c, ct(t)) : e != null ? lc(l, c, ct(e)) : u != null && l.removeAttribute("value"), a == null && n != null && (l.defaultChecked = !!n), a != null && (l.checked = a && typeof a != "function" && typeof a != "symbol"), i != null && typeof i != "function" && typeof i != "symbol" && typeof i != "boolean" ? l.name = "" + ct(i) : l.removeAttribute("name");
  }
  function Hf(l, t, e, u, a, n, c, i) {
    if (n != null && typeof n != "function" && typeof n != "symbol" && typeof n != "boolean" && (l.type = n), t != null || e != null) {
      if (!(n !== "submit" && n !== "reset" || t != null))
        return;
      e = e != null ? "" + ct(e) : "", t = t != null ? "" + ct(t) : e, i || t === l.value || (l.value = t), l.defaultValue = t;
    }
    u = u ?? a, u = typeof u != "function" && typeof u != "symbol" && !!u, l.checked = i ? l.checked : !!u, l.defaultChecked = !!u, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (l.name = c);
  }
  function lc(l, t, e) {
    t === "number" && xa(l.ownerDocument) === l || l.defaultValue === "" + e || (l.defaultValue = "" + e);
  }
  function Qe(l, t, e, u) {
    if (l = l.options, t) {
      t = {};
      for (var a = 0; a < e.length; a++)
        t["$" + e[a]] = !0;
      for (e = 0; e < l.length; e++)
        a = t.hasOwnProperty("$" + l[e].value), l[e].selected !== a && (l[e].selected = a), a && u && (l[e].defaultSelected = !0);
    } else {
      for (e = "" + ct(e), t = null, a = 0; a < l.length; a++) {
        if (l[a].value === e) {
          l[a].selected = !0, u && (l[a].defaultSelected = !0);
          return;
        }
        t !== null || l[a].disabled || (t = l[a]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function Cf(l, t, e) {
    if (t != null && (t = "" + ct(t), t !== l.value && (l.value = t), e == null)) {
      l.defaultValue !== t && (l.defaultValue = t);
      return;
    }
    l.defaultValue = e != null ? "" + ct(e) : "";
  }
  function jf(l, t, e, u) {
    if (t == null) {
      if (u != null) {
        if (e != null) throw Error(s(92));
        if (Bl(u)) {
          if (1 < u.length) throw Error(s(93));
          u = u[0];
        }
        e = u;
      }
      e == null && (e = ""), t = e;
    }
    e = ct(t), l.defaultValue = e, u = l.textContent, u === e && u !== "" && u !== null && (l.value = u);
  }
  function Ze(l, t) {
    if (t) {
      var e = l.firstChild;
      if (e && e === l.lastChild && e.nodeType === 3) {
        e.nodeValue = t;
        return;
      }
    }
    l.textContent = t;
  }
  var eh = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  );
  function Bf(l, t, e) {
    var u = t.indexOf("--") === 0;
    e == null || typeof e == "boolean" || e === "" ? u ? l.setProperty(t, "") : t === "float" ? l.cssFloat = "" : l[t] = "" : u ? l.setProperty(t, e) : typeof e != "number" || e === 0 || eh.has(t) ? t === "float" ? l.cssFloat = e : l[t] = ("" + e).trim() : l[t] = e + "px";
  }
  function qf(l, t, e) {
    if (t != null && typeof t != "object")
      throw Error(s(62));
    if (l = l.style, e != null) {
      for (var u in e)
        !e.hasOwnProperty(u) || t != null && t.hasOwnProperty(u) || (u.indexOf("--") === 0 ? l.setProperty(u, "") : u === "float" ? l.cssFloat = "" : l[u] = "");
      for (var a in t)
        u = t[a], t.hasOwnProperty(a) && e[a] !== u && Bf(l, a, u);
    } else
      for (var n in t)
        t.hasOwnProperty(n) && Bf(l, n, t[n]);
  }
  function tc(l) {
    if (l.indexOf("-") === -1) return !1;
    switch (l) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var uh = /* @__PURE__ */ new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]), ah = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function Ha(l) {
    return ah.test("" + l) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : l;
  }
  var ec = null;
  function uc(l) {
    return l = l.target || l.srcElement || window, l.correspondingUseElement && (l = l.correspondingUseElement), l.nodeType === 3 ? l.parentNode : l;
  }
  var Ve = null, Le = null;
  function Yf(l) {
    var t = qe(l);
    if (t && (l = t.stateNode)) {
      var e = l[Ll] || null;
      l: switch (l = t.stateNode, t.type) {
        case "input":
          if (Pn(
            l,
            e.value,
            e.defaultValue,
            e.defaultValue,
            e.checked,
            e.defaultChecked,
            e.type,
            e.name
          ), t = e.name, e.type === "radio" && t != null) {
            for (e = l; e.parentNode; ) e = e.parentNode;
            for (e = e.querySelectorAll(
              'input[name="' + it(
                "" + t
              ) + '"][type="radio"]'
            ), t = 0; t < e.length; t++) {
              var u = e[t];
              if (u !== l && u.form === l.form) {
                var a = u[Ll] || null;
                if (!a) throw Error(s(90));
                Pn(
                  u,
                  a.value,
                  a.defaultValue,
                  a.defaultValue,
                  a.checked,
                  a.defaultChecked,
                  a.type,
                  a.name
                );
              }
            }
            for (t = 0; t < e.length; t++)
              u = e[t], u.form === l.form && xf(u);
          }
          break l;
        case "textarea":
          Cf(l, e.value, e.defaultValue);
          break l;
        case "select":
          t = e.value, t != null && Qe(l, !!e.multiple, t, !1);
      }
    }
  }
  var ac = !1;
  function Gf(l, t, e) {
    if (ac) return l(t, e);
    ac = !0;
    try {
      var u = l(t);
      return u;
    } finally {
      if (ac = !1, (Ve !== null || Le !== null) && (bn(), Ve && (t = Ve, l = Le, Le = Ve = null, Yf(t), l)))
        for (t = 0; t < l.length; t++) Yf(l[t]);
    }
  }
  function zu(l, t) {
    var e = l.stateNode;
    if (e === null) return null;
    var u = e[Ll] || null;
    if (u === null) return null;
    e = u[t];
    l: switch (t) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (u = !u.disabled) || (l = l.type, u = !(l === "button" || l === "input" || l === "select" || l === "textarea")), l = !u;
        break l;
      default:
        l = !1;
    }
    if (l) return null;
    if (e && typeof e != "function")
      throw Error(
        s(231, t, typeof e)
      );
    return e;
  }
  var zt = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), nc = !1;
  if (zt)
    try {
      var Uu = {};
      Object.defineProperty(Uu, "passive", {
        get: function() {
          nc = !0;
        }
      }), window.addEventListener("test", Uu, Uu), window.removeEventListener("test", Uu, Uu);
    } catch {
      nc = !1;
    }
  var Jt = null, cc = null, Ca = null;
  function Xf() {
    if (Ca) return Ca;
    var l, t = cc, e = t.length, u, a = "value" in Jt ? Jt.value : Jt.textContent, n = a.length;
    for (l = 0; l < e && t[l] === a[l]; l++) ;
    var c = e - l;
    for (u = 1; u <= c && t[e - u] === a[n - u]; u++) ;
    return Ca = a.slice(l, 1 < u ? 1 - u : void 0);
  }
  function ja(l) {
    var t = l.keyCode;
    return "charCode" in l ? (l = l.charCode, l === 0 && t === 13 && (l = 13)) : l = t, l === 10 && (l = 13), 32 <= l || l === 13 ? l : 0;
  }
  function Ba() {
    return !0;
  }
  function Qf() {
    return !1;
  }
  function Kl(l) {
    function t(e, u, a, n, c) {
      this._reactName = e, this._targetInst = a, this.type = u, this.nativeEvent = n, this.target = c, this.currentTarget = null;
      for (var i in l)
        l.hasOwnProperty(i) && (e = l[i], this[i] = e ? e(n) : n[i]);
      return this.isDefaultPrevented = (n.defaultPrevented != null ? n.defaultPrevented : n.returnValue === !1) ? Ba : Qf, this.isPropagationStopped = Qf, this;
    }
    return C(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var e = this.nativeEvent;
        e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Ba);
      },
      stopPropagation: function() {
        var e = this.nativeEvent;
        e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Ba);
      },
      persist: function() {
      },
      isPersistent: Ba
    }), t;
  }
  var Se = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(l) {
      return l.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, qa = Kl(Se), Nu = C({}, Se, { view: 0, detail: 0 }), nh = Kl(Nu), ic, fc, xu, Ya = C({}, Nu, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: oc,
    button: 0,
    buttons: 0,
    relatedTarget: function(l) {
      return l.relatedTarget === void 0 ? l.fromElement === l.srcElement ? l.toElement : l.fromElement : l.relatedTarget;
    },
    movementX: function(l) {
      return "movementX" in l ? l.movementX : (l !== xu && (xu && l.type === "mousemove" ? (ic = l.screenX - xu.screenX, fc = l.screenY - xu.screenY) : fc = ic = 0, xu = l), ic);
    },
    movementY: function(l) {
      return "movementY" in l ? l.movementY : fc;
    }
  }), Zf = Kl(Ya), ch = C({}, Ya, { dataTransfer: 0 }), ih = Kl(ch), fh = C({}, Nu, { relatedTarget: 0 }), sc = Kl(fh), sh = C({}, Se, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), oh = Kl(sh), rh = C({}, Se, {
    clipboardData: function(l) {
      return "clipboardData" in l ? l.clipboardData : window.clipboardData;
    }
  }), dh = Kl(rh), hh = C({}, Se, { data: 0 }), Vf = Kl(hh), vh = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, yh = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, mh = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function gh(l) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(l) : (l = mh[l]) ? !!t[l] : !1;
  }
  function oc() {
    return gh;
  }
  var Sh = C({}, Nu, {
    key: function(l) {
      if (l.key) {
        var t = vh[l.key] || l.key;
        if (t !== "Unidentified") return t;
      }
      return l.type === "keypress" ? (l = ja(l), l === 13 ? "Enter" : String.fromCharCode(l)) : l.type === "keydown" || l.type === "keyup" ? yh[l.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: oc,
    charCode: function(l) {
      return l.type === "keypress" ? ja(l) : 0;
    },
    keyCode: function(l) {
      return l.type === "keydown" || l.type === "keyup" ? l.keyCode : 0;
    },
    which: function(l) {
      return l.type === "keypress" ? ja(l) : l.type === "keydown" || l.type === "keyup" ? l.keyCode : 0;
    }
  }), bh = Kl(Sh), Th = C({}, Ya, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }), Lf = Kl(Th), ph = C({}, Nu, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: oc
  }), Eh = Kl(ph), Ah = C({}, Se, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), Dh = Kl(Ah), Rh = C({}, Ya, {
    deltaX: function(l) {
      return "deltaX" in l ? l.deltaX : "wheelDeltaX" in l ? -l.wheelDeltaX : 0;
    },
    deltaY: function(l) {
      return "deltaY" in l ? l.deltaY : "wheelDeltaY" in l ? -l.wheelDeltaY : "wheelDelta" in l ? -l.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Oh = Kl(Rh), _h = C({}, Se, {
    newState: 0,
    oldState: 0
  }), Mh = Kl(_h), zh = [9, 13, 27, 32], rc = zt && "CompositionEvent" in window, Hu = null;
  zt && "documentMode" in document && (Hu = document.documentMode);
  var Uh = zt && "TextEvent" in window && !Hu, Kf = zt && (!rc || Hu && 8 < Hu && 11 >= Hu), Jf = " ", wf = !1;
  function $f(l, t) {
    switch (l) {
      case "keyup":
        return zh.indexOf(t.keyCode) !== -1;
      case "keydown":
        return t.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function kf(l) {
    return l = l.detail, typeof l == "object" && "data" in l ? l.data : null;
  }
  var Ke = !1;
  function Nh(l, t) {
    switch (l) {
      case "compositionend":
        return kf(t);
      case "keypress":
        return t.which !== 32 ? null : (wf = !0, Jf);
      case "textInput":
        return l = t.data, l === Jf && wf ? null : l;
      default:
        return null;
    }
  }
  function xh(l, t) {
    if (Ke)
      return l === "compositionend" || !rc && $f(l, t) ? (l = Xf(), Ca = cc = Jt = null, Ke = !1, l) : null;
    switch (l) {
      case "paste":
        return null;
      case "keypress":
        if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
          if (t.char && 1 < t.char.length)
            return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case "compositionend":
        return Kf && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var Hh = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0
  };
  function Wf(l) {
    var t = l && l.nodeName && l.nodeName.toLowerCase();
    return t === "input" ? !!Hh[l.type] : t === "textarea";
  }
  function Ff(l, t, e, u) {
    Ve ? Le ? Le.push(u) : Le = [u] : Ve = u, t = Rn(t, "onChange"), 0 < t.length && (e = new qa(
      "onChange",
      "change",
      null,
      e,
      u
    ), l.push({ event: e, listeners: t }));
  }
  var Cu = null, ju = null;
  function Ch(l) {
    xr(l, 0);
  }
  function Ga(l) {
    var t = Mu(l);
    if (xf(t)) return l;
  }
  function If(l, t) {
    if (l === "change") return t;
  }
  var Pf = !1;
  if (zt) {
    var dc;
    if (zt) {
      var hc = "oninput" in document;
      if (!hc) {
        var ls = document.createElement("div");
        ls.setAttribute("oninput", "return;"), hc = typeof ls.oninput == "function";
      }
      dc = hc;
    } else dc = !1;
    Pf = dc && (!document.documentMode || 9 < document.documentMode);
  }
  function ts() {
    Cu && (Cu.detachEvent("onpropertychange", es), ju = Cu = null);
  }
  function es(l) {
    if (l.propertyName === "value" && Ga(ju)) {
      var t = [];
      Ff(
        t,
        ju,
        l,
        uc(l)
      ), Gf(Ch, t);
    }
  }
  function jh(l, t, e) {
    l === "focusin" ? (ts(), Cu = t, ju = e, Cu.attachEvent("onpropertychange", es)) : l === "focusout" && ts();
  }
  function Bh(l) {
    if (l === "selectionchange" || l === "keyup" || l === "keydown")
      return Ga(ju);
  }
  function qh(l, t) {
    if (l === "click") return Ga(t);
  }
  function Yh(l, t) {
    if (l === "input" || l === "change")
      return Ga(t);
  }
  function Gh(l, t) {
    return l === t && (l !== 0 || 1 / l === 1 / t) || l !== l && t !== t;
  }
  var Pl = typeof Object.is == "function" ? Object.is : Gh;
  function Bu(l, t) {
    if (Pl(l, t)) return !0;
    if (typeof l != "object" || l === null || typeof t != "object" || t === null)
      return !1;
    var e = Object.keys(l), u = Object.keys(t);
    if (e.length !== u.length) return !1;
    for (u = 0; u < e.length; u++) {
      var a = e[u];
      if (!Zn.call(t, a) || !Pl(l[a], t[a]))
        return !1;
    }
    return !0;
  }
  function us(l) {
    for (; l && l.firstChild; ) l = l.firstChild;
    return l;
  }
  function as(l, t) {
    var e = us(l);
    l = 0;
    for (var u; e; ) {
      if (e.nodeType === 3) {
        if (u = l + e.textContent.length, l <= t && u >= t)
          return { node: e, offset: t - l };
        l = u;
      }
      l: {
        for (; e; ) {
          if (e.nextSibling) {
            e = e.nextSibling;
            break l;
          }
          e = e.parentNode;
        }
        e = void 0;
      }
      e = us(e);
    }
  }
  function ns(l, t) {
    return l && t ? l === t ? !0 : l && l.nodeType === 3 ? !1 : t && t.nodeType === 3 ? ns(l, t.parentNode) : "contains" in l ? l.contains(t) : l.compareDocumentPosition ? !!(l.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function cs(l) {
    l = l != null && l.ownerDocument != null && l.ownerDocument.defaultView != null ? l.ownerDocument.defaultView : window;
    for (var t = xa(l.document); t instanceof l.HTMLIFrameElement; ) {
      try {
        var e = typeof t.contentWindow.location.href == "string";
      } catch {
        e = !1;
      }
      if (e) l = t.contentWindow;
      else break;
      t = xa(l.document);
    }
    return t;
  }
  function vc(l) {
    var t = l && l.nodeName && l.nodeName.toLowerCase();
    return t && (t === "input" && (l.type === "text" || l.type === "search" || l.type === "tel" || l.type === "url" || l.type === "password") || t === "textarea" || l.contentEditable === "true");
  }
  var Xh = zt && "documentMode" in document && 11 >= document.documentMode, Je = null, yc = null, qu = null, mc = !1;
  function is(l, t, e) {
    var u = e.window === e ? e.document : e.nodeType === 9 ? e : e.ownerDocument;
    mc || Je == null || Je !== xa(u) || (u = Je, "selectionStart" in u && vc(u) ? u = { start: u.selectionStart, end: u.selectionEnd } : (u = (u.ownerDocument && u.ownerDocument.defaultView || window).getSelection(), u = {
      anchorNode: u.anchorNode,
      anchorOffset: u.anchorOffset,
      focusNode: u.focusNode,
      focusOffset: u.focusOffset
    }), qu && Bu(qu, u) || (qu = u, u = Rn(yc, "onSelect"), 0 < u.length && (t = new qa(
      "onSelect",
      "select",
      null,
      t,
      e
    ), l.push({ event: t, listeners: u }), t.target = Je)));
  }
  function be(l, t) {
    var e = {};
    return e[l.toLowerCase()] = t.toLowerCase(), e["Webkit" + l] = "webkit" + t, e["Moz" + l] = "moz" + t, e;
  }
  var we = {
    animationend: be("Animation", "AnimationEnd"),
    animationiteration: be("Animation", "AnimationIteration"),
    animationstart: be("Animation", "AnimationStart"),
    transitionrun: be("Transition", "TransitionRun"),
    transitionstart: be("Transition", "TransitionStart"),
    transitioncancel: be("Transition", "TransitionCancel"),
    transitionend: be("Transition", "TransitionEnd")
  }, gc = {}, fs = {};
  zt && (fs = document.createElement("div").style, "AnimationEvent" in window || (delete we.animationend.animation, delete we.animationiteration.animation, delete we.animationstart.animation), "TransitionEvent" in window || delete we.transitionend.transition);
  function Te(l) {
    if (gc[l]) return gc[l];
    if (!we[l]) return l;
    var t = we[l], e;
    for (e in t)
      if (t.hasOwnProperty(e) && e in fs)
        return gc[l] = t[e];
    return l;
  }
  var ss = Te("animationend"), os = Te("animationiteration"), rs = Te("animationstart"), Qh = Te("transitionrun"), Zh = Te("transitionstart"), Vh = Te("transitioncancel"), ds = Te("transitionend"), hs = /* @__PURE__ */ new Map(), Sc = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
    " "
  );
  Sc.push("scrollEnd");
  function yt(l, t) {
    hs.set(l, t), ge(t, [l]);
  }
  var vs = /* @__PURE__ */ new WeakMap();
  function ft(l, t) {
    if (typeof l == "object" && l !== null) {
      var e = vs.get(l);
      return e !== void 0 ? e : (t = {
        value: l,
        source: t,
        stack: Uf(t)
      }, vs.set(l, t), t);
    }
    return {
      value: l,
      source: t,
      stack: Uf(t)
    };
  }
  var st = [], $e = 0, bc = 0;
  function Xa() {
    for (var l = $e, t = bc = $e = 0; t < l; ) {
      var e = st[t];
      st[t++] = null;
      var u = st[t];
      st[t++] = null;
      var a = st[t];
      st[t++] = null;
      var n = st[t];
      if (st[t++] = null, u !== null && a !== null) {
        var c = u.pending;
        c === null ? a.next = a : (a.next = c.next, c.next = a), u.pending = a;
      }
      n !== 0 && ys(e, a, n);
    }
  }
  function Qa(l, t, e, u) {
    st[$e++] = l, st[$e++] = t, st[$e++] = e, st[$e++] = u, bc |= u, l.lanes |= u, l = l.alternate, l !== null && (l.lanes |= u);
  }
  function Tc(l, t, e, u) {
    return Qa(l, t, e, u), Za(l);
  }
  function ke(l, t) {
    return Qa(l, null, null, t), Za(l);
  }
  function ys(l, t, e) {
    l.lanes |= e;
    var u = l.alternate;
    u !== null && (u.lanes |= e);
    for (var a = !1, n = l.return; n !== null; )
      n.childLanes |= e, u = n.alternate, u !== null && (u.childLanes |= e), n.tag === 22 && (l = n.stateNode, l === null || l._visibility & 1 || (a = !0)), l = n, n = n.return;
    return l.tag === 3 ? (n = l.stateNode, a && t !== null && (a = 31 - Il(e), l = n.hiddenUpdates, u = l[a], u === null ? l[a] = [t] : u.push(t), t.lane = e | 536870912), n) : null;
  }
  function Za(l) {
    if (50 < fa)
      throw fa = 0, Oi = null, Error(s(185));
    for (var t = l.return; t !== null; )
      l = t, t = l.return;
    return l.tag === 3 ? l.stateNode : null;
  }
  var We = {};
  function Lh(l, t, e, u) {
    this.tag = l, this.key = e, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = u, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function lt(l, t, e, u) {
    return new Lh(l, t, e, u);
  }
  function pc(l) {
    return l = l.prototype, !(!l || !l.isReactComponent);
  }
  function Ut(l, t) {
    var e = l.alternate;
    return e === null ? (e = lt(
      l.tag,
      t,
      l.key,
      l.mode
    ), e.elementType = l.elementType, e.type = l.type, e.stateNode = l.stateNode, e.alternate = l, l.alternate = e) : (e.pendingProps = t, e.type = l.type, e.flags = 0, e.subtreeFlags = 0, e.deletions = null), e.flags = l.flags & 65011712, e.childLanes = l.childLanes, e.lanes = l.lanes, e.child = l.child, e.memoizedProps = l.memoizedProps, e.memoizedState = l.memoizedState, e.updateQueue = l.updateQueue, t = l.dependencies, e.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, e.sibling = l.sibling, e.index = l.index, e.ref = l.ref, e.refCleanup = l.refCleanup, e;
  }
  function ms(l, t) {
    l.flags &= 65011714;
    var e = l.alternate;
    return e === null ? (l.childLanes = 0, l.lanes = t, l.child = null, l.subtreeFlags = 0, l.memoizedProps = null, l.memoizedState = null, l.updateQueue = null, l.dependencies = null, l.stateNode = null) : (l.childLanes = e.childLanes, l.lanes = e.lanes, l.child = e.child, l.subtreeFlags = 0, l.deletions = null, l.memoizedProps = e.memoizedProps, l.memoizedState = e.memoizedState, l.updateQueue = e.updateQueue, l.type = e.type, t = e.dependencies, l.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), l;
  }
  function Va(l, t, e, u, a, n) {
    var c = 0;
    if (u = l, typeof l == "function") pc(l) && (c = 1);
    else if (typeof l == "string")
      c = J0(
        l,
        e,
        Y.current
      ) ? 26 : l === "html" || l === "head" || l === "body" ? 27 : 5;
    else
      l: switch (l) {
        case bt:
          return l = lt(31, e, t, a), l.elementType = bt, l.lanes = n, l;
        case El:
          return pe(e.children, a, n, t);
        case kl:
          c = 8, a |= 24;
          break;
        case Hl:
          return l = lt(12, e, t, a | 2), l.elementType = Hl, l.lanes = n, l;
        case I:
          return l = lt(13, e, t, a), l.elementType = I, l.lanes = n, l;
        case Xl:
          return l = lt(19, e, t, a), l.elementType = Xl, l.lanes = n, l;
        default:
          if (typeof l == "object" && l !== null)
            switch (l.$$typeof) {
              case Ot:
              case bl:
                c = 10;
                break l;
              case St:
                c = 9;
                break l;
              case Vl:
                c = 11;
                break l;
              case Cl:
                c = 14;
                break l;
              case Ql:
                c = 16, u = null;
                break l;
            }
          c = 29, e = Error(
            s(130, l === null ? "null" : typeof l, "")
          ), u = null;
      }
    return t = lt(c, e, t, a), t.elementType = l, t.type = u, t.lanes = n, t;
  }
  function pe(l, t, e, u) {
    return l = lt(7, l, u, t), l.lanes = e, l;
  }
  function Ec(l, t, e) {
    return l = lt(6, l, null, t), l.lanes = e, l;
  }
  function Ac(l, t, e) {
    return t = lt(
      4,
      l.children !== null ? l.children : [],
      l.key,
      t
    ), t.lanes = e, t.stateNode = {
      containerInfo: l.containerInfo,
      pendingChildren: null,
      implementation: l.implementation
    }, t;
  }
  var Fe = [], Ie = 0, La = null, Ka = 0, ot = [], rt = 0, Ee = null, Nt = 1, xt = "";
  function Ae(l, t) {
    Fe[Ie++] = Ka, Fe[Ie++] = La, La = l, Ka = t;
  }
  function gs(l, t, e) {
    ot[rt++] = Nt, ot[rt++] = xt, ot[rt++] = Ee, Ee = l;
    var u = Nt;
    l = xt;
    var a = 32 - Il(u) - 1;
    u &= ~(1 << a), e += 1;
    var n = 32 - Il(t) + a;
    if (30 < n) {
      var c = a - a % 5;
      n = (u & (1 << c) - 1).toString(32), u >>= c, a -= c, Nt = 1 << 32 - Il(t) + a | e << a | u, xt = n + l;
    } else
      Nt = 1 << n | e << a | u, xt = l;
  }
  function Dc(l) {
    l.return !== null && (Ae(l, 1), gs(l, 1, 0));
  }
  function Rc(l) {
    for (; l === La; )
      La = Fe[--Ie], Fe[Ie] = null, Ka = Fe[--Ie], Fe[Ie] = null;
    for (; l === Ee; )
      Ee = ot[--rt], ot[rt] = null, xt = ot[--rt], ot[rt] = null, Nt = ot[--rt], ot[rt] = null;
  }
  var Zl = null, yl = null, el = !1, De = null, pt = !1, Oc = Error(s(519));
  function Re(l) {
    var t = Error(s(418, ""));
    throw Xu(ft(t, l)), Oc;
  }
  function Ss(l) {
    var t = l.stateNode, e = l.type, u = l.memoizedProps;
    switch (t[ql] = l, t[Ll] = u, e) {
      case "dialog":
        W("cancel", t), W("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        W("load", t);
        break;
      case "video":
      case "audio":
        for (e = 0; e < oa.length; e++)
          W(oa[e], t);
        break;
      case "source":
        W("error", t);
        break;
      case "img":
      case "image":
      case "link":
        W("error", t), W("load", t);
        break;
      case "details":
        W("toggle", t);
        break;
      case "input":
        W("invalid", t), Hf(
          t,
          u.value,
          u.defaultValue,
          u.checked,
          u.defaultChecked,
          u.type,
          u.name,
          !0
        ), Na(t);
        break;
      case "select":
        W("invalid", t);
        break;
      case "textarea":
        W("invalid", t), jf(t, u.value, u.defaultValue, u.children), Na(t);
    }
    e = u.children, typeof e != "string" && typeof e != "number" && typeof e != "bigint" || t.textContent === "" + e || u.suppressHydrationWarning === !0 || Br(t.textContent, e) ? (u.popover != null && (W("beforetoggle", t), W("toggle", t)), u.onScroll != null && W("scroll", t), u.onScrollEnd != null && W("scrollend", t), u.onClick != null && (t.onclick = On), t = !0) : t = !1, t || Re(l);
  }
  function bs(l) {
    for (Zl = l.return; Zl; )
      switch (Zl.tag) {
        case 5:
        case 13:
          pt = !1;
          return;
        case 27:
        case 3:
          pt = !0;
          return;
        default:
          Zl = Zl.return;
      }
  }
  function Yu(l) {
    if (l !== Zl) return !1;
    if (!el) return bs(l), el = !0, !1;
    var t = l.tag, e;
    if ((e = t !== 3 && t !== 27) && ((e = t === 5) && (e = l.type, e = !(e !== "form" && e !== "button") || Zi(l.type, l.memoizedProps)), e = !e), e && yl && Re(l), bs(l), t === 13) {
      if (l = l.memoizedState, l = l !== null ? l.dehydrated : null, !l) throw Error(s(317));
      l: {
        for (l = l.nextSibling, t = 0; l; ) {
          if (l.nodeType === 8)
            if (e = l.data, e === "/$") {
              if (t === 0) {
                yl = gt(l.nextSibling);
                break l;
              }
              t--;
            } else
              e !== "$" && e !== "$!" && e !== "$?" || t++;
          l = l.nextSibling;
        }
        yl = null;
      }
    } else
      t === 27 ? (t = yl, fe(l.type) ? (l = Ji, Ji = null, yl = l) : yl = t) : yl = Zl ? gt(l.stateNode.nextSibling) : null;
    return !0;
  }
  function Gu() {
    yl = Zl = null, el = !1;
  }
  function Ts() {
    var l = De;
    return l !== null && ($l === null ? $l = l : $l.push.apply(
      $l,
      l
    ), De = null), l;
  }
  function Xu(l) {
    De === null ? De = [l] : De.push(l);
  }
  var _c = O(null), Oe = null, Ht = null;
  function wt(l, t, e) {
    U(_c, t._currentValue), t._currentValue = e;
  }
  function Ct(l) {
    l._currentValue = _c.current, H(_c);
  }
  function Mc(l, t, e) {
    for (; l !== null; ) {
      var u = l.alternate;
      if ((l.childLanes & t) !== t ? (l.childLanes |= t, u !== null && (u.childLanes |= t)) : u !== null && (u.childLanes & t) !== t && (u.childLanes |= t), l === e) break;
      l = l.return;
    }
  }
  function zc(l, t, e, u) {
    var a = l.child;
    for (a !== null && (a.return = l); a !== null; ) {
      var n = a.dependencies;
      if (n !== null) {
        var c = a.child;
        n = n.firstContext;
        l: for (; n !== null; ) {
          var i = n;
          n = a;
          for (var o = 0; o < t.length; o++)
            if (i.context === t[o]) {
              n.lanes |= e, i = n.alternate, i !== null && (i.lanes |= e), Mc(
                n.return,
                e,
                l
              ), u || (c = null);
              break l;
            }
          n = i.next;
        }
      } else if (a.tag === 18) {
        if (c = a.return, c === null) throw Error(s(341));
        c.lanes |= e, n = c.alternate, n !== null && (n.lanes |= e), Mc(c, e, l), c = null;
      } else c = a.child;
      if (c !== null) c.return = a;
      else
        for (c = a; c !== null; ) {
          if (c === l) {
            c = null;
            break;
          }
          if (a = c.sibling, a !== null) {
            a.return = c.return, c = a;
            break;
          }
          c = c.return;
        }
      a = c;
    }
  }
  function Qu(l, t, e, u) {
    l = null;
    for (var a = t, n = !1; a !== null; ) {
      if (!n) {
        if ((a.flags & 524288) !== 0) n = !0;
        else if ((a.flags & 262144) !== 0) break;
      }
      if (a.tag === 10) {
        var c = a.alternate;
        if (c === null) throw Error(s(387));
        if (c = c.memoizedProps, c !== null) {
          var i = a.type;
          Pl(a.pendingProps.value, c.value) || (l !== null ? l.push(i) : l = [i]);
        }
      } else if (a === Wl.current) {
        if (c = a.alternate, c === null) throw Error(s(387));
        c.memoizedState.memoizedState !== a.memoizedState.memoizedState && (l !== null ? l.push(ma) : l = [ma]);
      }
      a = a.return;
    }
    l !== null && zc(
      t,
      l,
      e,
      u
    ), t.flags |= 262144;
  }
  function Ja(l) {
    for (l = l.firstContext; l !== null; ) {
      if (!Pl(
        l.context._currentValue,
        l.memoizedValue
      ))
        return !0;
      l = l.next;
    }
    return !1;
  }
  function _e(l) {
    Oe = l, Ht = null, l = l.dependencies, l !== null && (l.firstContext = null);
  }
  function Yl(l) {
    return ps(Oe, l);
  }
  function wa(l, t) {
    return Oe === null && _e(l), ps(l, t);
  }
  function ps(l, t) {
    var e = t._currentValue;
    if (t = { context: t, memoizedValue: e, next: null }, Ht === null) {
      if (l === null) throw Error(s(308));
      Ht = t, l.dependencies = { lanes: 0, firstContext: t }, l.flags |= 524288;
    } else Ht = Ht.next = t;
    return e;
  }
  var Kh = typeof AbortController < "u" ? AbortController : function() {
    var l = [], t = this.signal = {
      aborted: !1,
      addEventListener: function(e, u) {
        l.push(u);
      }
    };
    this.abort = function() {
      t.aborted = !0, l.forEach(function(e) {
        return e();
      });
    };
  }, Jh = f.unstable_scheduleCallback, wh = f.unstable_NormalPriority, Al = {
    $$typeof: bl,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function Uc() {
    return {
      controller: new Kh(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function Zu(l) {
    l.refCount--, l.refCount === 0 && Jh(wh, function() {
      l.controller.abort();
    });
  }
  var Vu = null, Nc = 0, Pe = 0, lu = null;
  function $h(l, t) {
    if (Vu === null) {
      var e = Vu = [];
      Nc = 0, Pe = Hi(), lu = {
        status: "pending",
        value: void 0,
        then: function(u) {
          e.push(u);
        }
      };
    }
    return Nc++, t.then(Es, Es), t;
  }
  function Es() {
    if (--Nc === 0 && Vu !== null) {
      lu !== null && (lu.status = "fulfilled");
      var l = Vu;
      Vu = null, Pe = 0, lu = null;
      for (var t = 0; t < l.length; t++) (0, l[t])();
    }
  }
  function kh(l, t) {
    var e = [], u = {
      status: "pending",
      value: null,
      reason: null,
      then: function(a) {
        e.push(a);
      }
    };
    return l.then(
      function() {
        u.status = "fulfilled", u.value = t;
        for (var a = 0; a < e.length; a++) (0, e[a])(t);
      },
      function(a) {
        for (u.status = "rejected", u.reason = a, a = 0; a < e.length; a++)
          (0, e[a])(void 0);
      }
    ), u;
  }
  var As = A.S;
  A.S = function(l, t) {
    typeof t == "object" && t !== null && typeof t.then == "function" && $h(l, t), As !== null && As(l, t);
  };
  var Me = O(null);
  function xc() {
    var l = Me.current;
    return l !== null ? l : ol.pooledCache;
  }
  function $a(l, t) {
    t === null ? U(Me, Me.current) : U(Me, t.pool);
  }
  function Ds() {
    var l = xc();
    return l === null ? null : { parent: Al._currentValue, pool: l };
  }
  var Lu = Error(s(460)), Rs = Error(s(474)), ka = Error(s(542)), Hc = { then: function() {
  } };
  function Os(l) {
    return l = l.status, l === "fulfilled" || l === "rejected";
  }
  function Wa() {
  }
  function _s(l, t, e) {
    switch (e = l[e], e === void 0 ? l.push(t) : e !== t && (t.then(Wa, Wa), t = e), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw l = t.reason, zs(l), l;
      default:
        if (typeof t.status == "string") t.then(Wa, Wa);
        else {
          if (l = ol, l !== null && 100 < l.shellSuspendCounter)
            throw Error(s(482));
          l = t, l.status = "pending", l.then(
            function(u) {
              if (t.status === "pending") {
                var a = t;
                a.status = "fulfilled", a.value = u;
              }
            },
            function(u) {
              if (t.status === "pending") {
                var a = t;
                a.status = "rejected", a.reason = u;
              }
            }
          );
        }
        switch (t.status) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw l = t.reason, zs(l), l;
        }
        throw Ku = t, Lu;
    }
  }
  var Ku = null;
  function Ms() {
    if (Ku === null) throw Error(s(459));
    var l = Ku;
    return Ku = null, l;
  }
  function zs(l) {
    if (l === Lu || l === ka)
      throw Error(s(483));
  }
  var $t = !1;
  function Cc(l) {
    l.updateQueue = {
      baseState: l.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null
    };
  }
  function jc(l, t) {
    l = l.updateQueue, t.updateQueue === l && (t.updateQueue = {
      baseState: l.baseState,
      firstBaseUpdate: l.firstBaseUpdate,
      lastBaseUpdate: l.lastBaseUpdate,
      shared: l.shared,
      callbacks: null
    });
  }
  function kt(l) {
    return { lane: l, tag: 0, payload: null, callback: null, next: null };
  }
  function Wt(l, t, e) {
    var u = l.updateQueue;
    if (u === null) return null;
    if (u = u.shared, (ul & 2) !== 0) {
      var a = u.pending;
      return a === null ? t.next = t : (t.next = a.next, a.next = t), u.pending = t, t = Za(l), ys(l, null, e), t;
    }
    return Qa(l, u, t, e), Za(l);
  }
  function Ju(l, t, e) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (e & 4194048) !== 0)) {
      var u = t.lanes;
      u &= l.pendingLanes, e |= u, t.lanes = e, Ef(l, e);
    }
  }
  function Bc(l, t) {
    var e = l.updateQueue, u = l.alternate;
    if (u !== null && (u = u.updateQueue, e === u)) {
      var a = null, n = null;
      if (e = e.firstBaseUpdate, e !== null) {
        do {
          var c = {
            lane: e.lane,
            tag: e.tag,
            payload: e.payload,
            callback: null,
            next: null
          };
          n === null ? a = n = c : n = n.next = c, e = e.next;
        } while (e !== null);
        n === null ? a = n = t : n = n.next = t;
      } else a = n = t;
      e = {
        baseState: u.baseState,
        firstBaseUpdate: a,
        lastBaseUpdate: n,
        shared: u.shared,
        callbacks: u.callbacks
      }, l.updateQueue = e;
      return;
    }
    l = e.lastBaseUpdate, l === null ? e.firstBaseUpdate = t : l.next = t, e.lastBaseUpdate = t;
  }
  var qc = !1;
  function wu() {
    if (qc) {
      var l = lu;
      if (l !== null) throw l;
    }
  }
  function $u(l, t, e, u) {
    qc = !1;
    var a = l.updateQueue;
    $t = !1;
    var n = a.firstBaseUpdate, c = a.lastBaseUpdate, i = a.shared.pending;
    if (i !== null) {
      a.shared.pending = null;
      var o = i, g = o.next;
      o.next = null, c === null ? n = g : c.next = g, c = o;
      var p = l.alternate;
      p !== null && (p = p.updateQueue, i = p.lastBaseUpdate, i !== c && (i === null ? p.firstBaseUpdate = g : i.next = g, p.lastBaseUpdate = o));
    }
    if (n !== null) {
      var R = a.baseState;
      c = 0, p = g = o = null, i = n;
      do {
        var S = i.lane & -536870913, b = S !== i.lane;
        if (b ? (F & S) === S : (u & S) === S) {
          S !== 0 && S === Pe && (qc = !0), p !== null && (p = p.next = {
            lane: 0,
            tag: i.tag,
            payload: i.payload,
            callback: null,
            next: null
          });
          l: {
            var Z = l, G = i;
            S = t;
            var il = e;
            switch (G.tag) {
              case 1:
                if (Z = G.payload, typeof Z == "function") {
                  R = Z.call(il, R, S);
                  break l;
                }
                R = Z;
                break l;
              case 3:
                Z.flags = Z.flags & -65537 | 128;
              case 0:
                if (Z = G.payload, S = typeof Z == "function" ? Z.call(il, R, S) : Z, S == null) break l;
                R = C({}, R, S);
                break l;
              case 2:
                $t = !0;
            }
          }
          S = i.callback, S !== null && (l.flags |= 64, b && (l.flags |= 8192), b = a.callbacks, b === null ? a.callbacks = [S] : b.push(S));
        } else
          b = {
            lane: S,
            tag: i.tag,
            payload: i.payload,
            callback: i.callback,
            next: null
          }, p === null ? (g = p = b, o = R) : p = p.next = b, c |= S;
        if (i = i.next, i === null) {
          if (i = a.shared.pending, i === null)
            break;
          b = i, i = b.next, b.next = null, a.lastBaseUpdate = b, a.shared.pending = null;
        }
      } while (!0);
      p === null && (o = R), a.baseState = o, a.firstBaseUpdate = g, a.lastBaseUpdate = p, n === null && (a.shared.lanes = 0), ae |= c, l.lanes = c, l.memoizedState = R;
    }
  }
  function Us(l, t) {
    if (typeof l != "function")
      throw Error(s(191, l));
    l.call(t);
  }
  function Ns(l, t) {
    var e = l.callbacks;
    if (e !== null)
      for (l.callbacks = null, l = 0; l < e.length; l++)
        Us(e[l], t);
  }
  var tu = O(null), Fa = O(0);
  function xs(l, t) {
    l = Qt, U(Fa, l), U(tu, t), Qt = l | t.baseLanes;
  }
  function Yc() {
    U(Fa, Qt), U(tu, tu.current);
  }
  function Gc() {
    Qt = Fa.current, H(tu), H(Fa);
  }
  var Ft = 0, K = null, nl = null, Tl = null, Ia = !1, eu = !1, ze = !1, Pa = 0, ku = 0, uu = null, Wh = 0;
  function gl() {
    throw Error(s(321));
  }
  function Xc(l, t) {
    if (t === null) return !1;
    for (var e = 0; e < t.length && e < l.length; e++)
      if (!Pl(l[e], t[e])) return !1;
    return !0;
  }
  function Qc(l, t, e, u, a, n) {
    return Ft = n, K = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, A.H = l === null || l.memoizedState === null ? mo : go, ze = !1, n = e(u, a), ze = !1, eu && (n = Cs(
      t,
      e,
      u,
      a
    )), Hs(l), n;
  }
  function Hs(l) {
    A.H = nn;
    var t = nl !== null && nl.next !== null;
    if (Ft = 0, Tl = nl = K = null, Ia = !1, ku = 0, uu = null, t) throw Error(s(300));
    l === null || Ol || (l = l.dependencies, l !== null && Ja(l) && (Ol = !0));
  }
  function Cs(l, t, e, u) {
    K = l;
    var a = 0;
    do {
      if (eu && (uu = null), ku = 0, eu = !1, 25 <= a) throw Error(s(301));
      if (a += 1, Tl = nl = null, l.updateQueue != null) {
        var n = l.updateQueue;
        n.lastEffect = null, n.events = null, n.stores = null, n.memoCache != null && (n.memoCache.index = 0);
      }
      A.H = u0, n = t(e, u);
    } while (eu);
    return n;
  }
  function Fh() {
    var l = A.H, t = l.useState()[0];
    return t = typeof t.then == "function" ? Wu(t) : t, l = l.useState()[0], (nl !== null ? nl.memoizedState : null) !== l && (K.flags |= 1024), t;
  }
  function Zc() {
    var l = Pa !== 0;
    return Pa = 0, l;
  }
  function Vc(l, t, e) {
    t.updateQueue = l.updateQueue, t.flags &= -2053, l.lanes &= ~e;
  }
  function Lc(l) {
    if (Ia) {
      for (l = l.memoizedState; l !== null; ) {
        var t = l.queue;
        t !== null && (t.pending = null), l = l.next;
      }
      Ia = !1;
    }
    Ft = 0, Tl = nl = K = null, eu = !1, ku = Pa = 0, uu = null;
  }
  function Jl() {
    var l = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return Tl === null ? K.memoizedState = Tl = l : Tl = Tl.next = l, Tl;
  }
  function pl() {
    if (nl === null) {
      var l = K.alternate;
      l = l !== null ? l.memoizedState : null;
    } else l = nl.next;
    var t = Tl === null ? K.memoizedState : Tl.next;
    if (t !== null)
      Tl = t, nl = l;
    else {
      if (l === null)
        throw K.alternate === null ? Error(s(467)) : Error(s(310));
      nl = l, l = {
        memoizedState: nl.memoizedState,
        baseState: nl.baseState,
        baseQueue: nl.baseQueue,
        queue: nl.queue,
        next: null
      }, Tl === null ? K.memoizedState = Tl = l : Tl = Tl.next = l;
    }
    return Tl;
  }
  function Kc() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function Wu(l) {
    var t = ku;
    return ku += 1, uu === null && (uu = []), l = _s(uu, l, t), t = K, (Tl === null ? t.memoizedState : Tl.next) === null && (t = t.alternate, A.H = t === null || t.memoizedState === null ? mo : go), l;
  }
  function ln(l) {
    if (l !== null && typeof l == "object") {
      if (typeof l.then == "function") return Wu(l);
      if (l.$$typeof === bl) return Yl(l);
    }
    throw Error(s(438, String(l)));
  }
  function Jc(l) {
    var t = null, e = K.updateQueue;
    if (e !== null && (t = e.memoCache), t == null) {
      var u = K.alternate;
      u !== null && (u = u.updateQueue, u !== null && (u = u.memoCache, u != null && (t = {
        data: u.data.map(function(a) {
          return a.slice();
        }),
        index: 0
      })));
    }
    if (t == null && (t = { data: [], index: 0 }), e === null && (e = Kc(), K.updateQueue = e), e.memoCache = t, e = t.data[t.index], e === void 0)
      for (e = t.data[t.index] = Array(l), u = 0; u < l; u++)
        e[u] = Ce;
    return t.index++, e;
  }
  function jt(l, t) {
    return typeof t == "function" ? t(l) : t;
  }
  function tn(l) {
    var t = pl();
    return wc(t, nl, l);
  }
  function wc(l, t, e) {
    var u = l.queue;
    if (u === null) throw Error(s(311));
    u.lastRenderedReducer = e;
    var a = l.baseQueue, n = u.pending;
    if (n !== null) {
      if (a !== null) {
        var c = a.next;
        a.next = n.next, n.next = c;
      }
      t.baseQueue = a = n, u.pending = null;
    }
    if (n = l.baseState, a === null) l.memoizedState = n;
    else {
      t = a.next;
      var i = c = null, o = null, g = t, p = !1;
      do {
        var R = g.lane & -536870913;
        if (R !== g.lane ? (F & R) === R : (Ft & R) === R) {
          var S = g.revertLane;
          if (S === 0)
            o !== null && (o = o.next = {
              lane: 0,
              revertLane: 0,
              action: g.action,
              hasEagerState: g.hasEagerState,
              eagerState: g.eagerState,
              next: null
            }), R === Pe && (p = !0);
          else if ((Ft & S) === S) {
            g = g.next, S === Pe && (p = !0);
            continue;
          } else
            R = {
              lane: 0,
              revertLane: g.revertLane,
              action: g.action,
              hasEagerState: g.hasEagerState,
              eagerState: g.eagerState,
              next: null
            }, o === null ? (i = o = R, c = n) : o = o.next = R, K.lanes |= S, ae |= S;
          R = g.action, ze && e(n, R), n = g.hasEagerState ? g.eagerState : e(n, R);
        } else
          S = {
            lane: R,
            revertLane: g.revertLane,
            action: g.action,
            hasEagerState: g.hasEagerState,
            eagerState: g.eagerState,
            next: null
          }, o === null ? (i = o = S, c = n) : o = o.next = S, K.lanes |= R, ae |= R;
        g = g.next;
      } while (g !== null && g !== t);
      if (o === null ? c = n : o.next = i, !Pl(n, l.memoizedState) && (Ol = !0, p && (e = lu, e !== null)))
        throw e;
      l.memoizedState = n, l.baseState = c, l.baseQueue = o, u.lastRenderedState = n;
    }
    return a === null && (u.lanes = 0), [l.memoizedState, u.dispatch];
  }
  function $c(l) {
    var t = pl(), e = t.queue;
    if (e === null) throw Error(s(311));
    e.lastRenderedReducer = l;
    var u = e.dispatch, a = e.pending, n = t.memoizedState;
    if (a !== null) {
      e.pending = null;
      var c = a = a.next;
      do
        n = l(n, c.action), c = c.next;
      while (c !== a);
      Pl(n, t.memoizedState) || (Ol = !0), t.memoizedState = n, t.baseQueue === null && (t.baseState = n), e.lastRenderedState = n;
    }
    return [n, u];
  }
  function js(l, t, e) {
    var u = K, a = pl(), n = el;
    if (n) {
      if (e === void 0) throw Error(s(407));
      e = e();
    } else e = t();
    var c = !Pl(
      (nl || a).memoizedState,
      e
    );
    c && (a.memoizedState = e, Ol = !0), a = a.queue;
    var i = Ys.bind(null, u, a, l);
    if (Fu(2048, 8, i, [l]), a.getSnapshot !== t || c || Tl !== null && Tl.memoizedState.tag & 1) {
      if (u.flags |= 2048, au(
        9,
        en(),
        qs.bind(
          null,
          u,
          a,
          e,
          t
        ),
        null
      ), ol === null) throw Error(s(349));
      n || (Ft & 124) !== 0 || Bs(u, t, e);
    }
    return e;
  }
  function Bs(l, t, e) {
    l.flags |= 16384, l = { getSnapshot: t, value: e }, t = K.updateQueue, t === null ? (t = Kc(), K.updateQueue = t, t.stores = [l]) : (e = t.stores, e === null ? t.stores = [l] : e.push(l));
  }
  function qs(l, t, e, u) {
    t.value = e, t.getSnapshot = u, Gs(t) && Xs(l);
  }
  function Ys(l, t, e) {
    return e(function() {
      Gs(t) && Xs(l);
    });
  }
  function Gs(l) {
    var t = l.getSnapshot;
    l = l.value;
    try {
      var e = t();
      return !Pl(l, e);
    } catch {
      return !0;
    }
  }
  function Xs(l) {
    var t = ke(l, 2);
    t !== null && nt(t, l, 2);
  }
  function kc(l) {
    var t = Jl();
    if (typeof l == "function") {
      var e = l;
      if (l = e(), ze) {
        Lt(!0);
        try {
          e();
        } finally {
          Lt(!1);
        }
      }
    }
    return t.memoizedState = t.baseState = l, t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: jt,
      lastRenderedState: l
    }, t;
  }
  function Qs(l, t, e, u) {
    return l.baseState = e, wc(
      l,
      nl,
      typeof u == "function" ? u : jt
    );
  }
  function Ih(l, t, e, u, a) {
    if (an(l)) throw Error(s(485));
    if (l = t.action, l !== null) {
      var n = {
        payload: a,
        action: l,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function(c) {
          n.listeners.push(c);
        }
      };
      A.T !== null ? e(!0) : n.isTransition = !1, u(n), e = t.pending, e === null ? (n.next = t.pending = n, Zs(t, n)) : (n.next = e.next, t.pending = e.next = n);
    }
  }
  function Zs(l, t) {
    var e = t.action, u = t.payload, a = l.state;
    if (t.isTransition) {
      var n = A.T, c = {};
      A.T = c;
      try {
        var i = e(a, u), o = A.S;
        o !== null && o(c, i), Vs(l, t, i);
      } catch (g) {
        Wc(l, t, g);
      } finally {
        A.T = n;
      }
    } else
      try {
        n = e(a, u), Vs(l, t, n);
      } catch (g) {
        Wc(l, t, g);
      }
  }
  function Vs(l, t, e) {
    e !== null && typeof e == "object" && typeof e.then == "function" ? e.then(
      function(u) {
        Ls(l, t, u);
      },
      function(u) {
        return Wc(l, t, u);
      }
    ) : Ls(l, t, e);
  }
  function Ls(l, t, e) {
    t.status = "fulfilled", t.value = e, Ks(t), l.state = e, t = l.pending, t !== null && (e = t.next, e === t ? l.pending = null : (e = e.next, t.next = e, Zs(l, e)));
  }
  function Wc(l, t, e) {
    var u = l.pending;
    if (l.pending = null, u !== null) {
      u = u.next;
      do
        t.status = "rejected", t.reason = e, Ks(t), t = t.next;
      while (t !== u);
    }
    l.action = null;
  }
  function Ks(l) {
    l = l.listeners;
    for (var t = 0; t < l.length; t++) (0, l[t])();
  }
  function Js(l, t) {
    return t;
  }
  function ws(l, t) {
    if (el) {
      var e = ol.formState;
      if (e !== null) {
        l: {
          var u = K;
          if (el) {
            if (yl) {
              t: {
                for (var a = yl, n = pt; a.nodeType !== 8; ) {
                  if (!n) {
                    a = null;
                    break t;
                  }
                  if (a = gt(
                    a.nextSibling
                  ), a === null) {
                    a = null;
                    break t;
                  }
                }
                n = a.data, a = n === "F!" || n === "F" ? a : null;
              }
              if (a) {
                yl = gt(
                  a.nextSibling
                ), u = a.data === "F!";
                break l;
              }
            }
            Re(u);
          }
          u = !1;
        }
        u && (t = e[0]);
      }
    }
    return e = Jl(), e.memoizedState = e.baseState = t, u = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Js,
      lastRenderedState: t
    }, e.queue = u, e = ho.bind(
      null,
      K,
      u
    ), u.dispatch = e, u = kc(!1), n = ti.bind(
      null,
      K,
      !1,
      u.queue
    ), u = Jl(), a = {
      state: t,
      dispatch: null,
      action: l,
      pending: null
    }, u.queue = a, e = Ih.bind(
      null,
      K,
      a,
      n,
      e
    ), a.dispatch = e, u.memoizedState = l, [t, e, !1];
  }
  function $s(l) {
    var t = pl();
    return ks(t, nl, l);
  }
  function ks(l, t, e) {
    if (t = wc(
      l,
      t,
      Js
    )[0], l = tn(jt)[0], typeof t == "object" && t !== null && typeof t.then == "function")
      try {
        var u = Wu(t);
      } catch (c) {
        throw c === Lu ? ka : c;
      }
    else u = t;
    t = pl();
    var a = t.queue, n = a.dispatch;
    return e !== t.memoizedState && (K.flags |= 2048, au(
      9,
      en(),
      Ph.bind(null, a, e),
      null
    )), [u, n, l];
  }
  function Ph(l, t) {
    l.action = t;
  }
  function Ws(l) {
    var t = pl(), e = nl;
    if (e !== null)
      return ks(t, e, l);
    pl(), t = t.memoizedState, e = pl();
    var u = e.queue.dispatch;
    return e.memoizedState = l, [t, u, !1];
  }
  function au(l, t, e, u) {
    return l = { tag: l, create: e, deps: u, inst: t, next: null }, t = K.updateQueue, t === null && (t = Kc(), K.updateQueue = t), e = t.lastEffect, e === null ? t.lastEffect = l.next = l : (u = e.next, e.next = l, l.next = u, t.lastEffect = l), l;
  }
  function en() {
    return { destroy: void 0, resource: void 0 };
  }
  function Fs() {
    return pl().memoizedState;
  }
  function un(l, t, e, u) {
    var a = Jl();
    u = u === void 0 ? null : u, K.flags |= l, a.memoizedState = au(
      1 | t,
      en(),
      e,
      u
    );
  }
  function Fu(l, t, e, u) {
    var a = pl();
    u = u === void 0 ? null : u;
    var n = a.memoizedState.inst;
    nl !== null && u !== null && Xc(u, nl.memoizedState.deps) ? a.memoizedState = au(t, n, e, u) : (K.flags |= l, a.memoizedState = au(
      1 | t,
      n,
      e,
      u
    ));
  }
  function Is(l, t) {
    un(8390656, 8, l, t);
  }
  function Ps(l, t) {
    Fu(2048, 8, l, t);
  }
  function lo(l, t) {
    return Fu(4, 2, l, t);
  }
  function to(l, t) {
    return Fu(4, 4, l, t);
  }
  function eo(l, t) {
    if (typeof t == "function") {
      l = l();
      var e = t(l);
      return function() {
        typeof e == "function" ? e() : t(null);
      };
    }
    if (t != null)
      return l = l(), t.current = l, function() {
        t.current = null;
      };
  }
  function uo(l, t, e) {
    e = e != null ? e.concat([l]) : null, Fu(4, 4, eo.bind(null, t, l), e);
  }
  function Fc() {
  }
  function ao(l, t) {
    var e = pl();
    t = t === void 0 ? null : t;
    var u = e.memoizedState;
    return t !== null && Xc(t, u[1]) ? u[0] : (e.memoizedState = [l, t], l);
  }
  function no(l, t) {
    var e = pl();
    t = t === void 0 ? null : t;
    var u = e.memoizedState;
    if (t !== null && Xc(t, u[1]))
      return u[0];
    if (u = l(), ze) {
      Lt(!0);
      try {
        l();
      } finally {
        Lt(!1);
      }
    }
    return e.memoizedState = [u, t], u;
  }
  function Ic(l, t, e) {
    return e === void 0 || (Ft & 1073741824) !== 0 ? l.memoizedState = t : (l.memoizedState = e, l = sr(), K.lanes |= l, ae |= l, e);
  }
  function co(l, t, e, u) {
    return Pl(e, t) ? e : tu.current !== null ? (l = Ic(l, e, u), Pl(l, t) || (Ol = !0), l) : (Ft & 42) === 0 ? (Ol = !0, l.memoizedState = e) : (l = sr(), K.lanes |= l, ae |= l, t);
  }
  function io(l, t, e, u, a) {
    var n = N.p;
    N.p = n !== 0 && 8 > n ? n : 8;
    var c = A.T, i = {};
    A.T = i, ti(l, !1, t, e);
    try {
      var o = a(), g = A.S;
      if (g !== null && g(i, o), o !== null && typeof o == "object" && typeof o.then == "function") {
        var p = kh(
          o,
          u
        );
        Iu(
          l,
          t,
          p,
          at(l)
        );
      } else
        Iu(
          l,
          t,
          u,
          at(l)
        );
    } catch (R) {
      Iu(
        l,
        t,
        { then: function() {
        }, status: "rejected", reason: R },
        at()
      );
    } finally {
      N.p = n, A.T = c;
    }
  }
  function l0() {
  }
  function Pc(l, t, e, u) {
    if (l.tag !== 5) throw Error(s(476));
    var a = fo(l).queue;
    io(
      l,
      a,
      t,
      Q,
      e === null ? l0 : function() {
        return so(l), e(u);
      }
    );
  }
  function fo(l) {
    var t = l.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: Q,
      baseState: Q,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: jt,
        lastRenderedState: Q
      },
      next: null
    };
    var e = {};
    return t.next = {
      memoizedState: e,
      baseState: e,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: jt,
        lastRenderedState: e
      },
      next: null
    }, l.memoizedState = t, l = l.alternate, l !== null && (l.memoizedState = t), t;
  }
  function so(l) {
    var t = fo(l).next.queue;
    Iu(l, t, {}, at());
  }
  function li() {
    return Yl(ma);
  }
  function oo() {
    return pl().memoizedState;
  }
  function ro() {
    return pl().memoizedState;
  }
  function t0(l) {
    for (var t = l.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var e = at();
          l = kt(e);
          var u = Wt(t, l, e);
          u !== null && (nt(u, t, e), Ju(u, t, e)), t = { cache: Uc() }, l.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function e0(l, t, e) {
    var u = at();
    e = {
      lane: u,
      revertLane: 0,
      action: e,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, an(l) ? vo(t, e) : (e = Tc(l, t, e, u), e !== null && (nt(e, l, u), yo(e, t, u)));
  }
  function ho(l, t, e) {
    var u = at();
    Iu(l, t, e, u);
  }
  function Iu(l, t, e, u) {
    var a = {
      lane: u,
      revertLane: 0,
      action: e,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (an(l)) vo(t, a);
    else {
      var n = l.alternate;
      if (l.lanes === 0 && (n === null || n.lanes === 0) && (n = t.lastRenderedReducer, n !== null))
        try {
          var c = t.lastRenderedState, i = n(c, e);
          if (a.hasEagerState = !0, a.eagerState = i, Pl(i, c))
            return Qa(l, t, a, 0), ol === null && Xa(), !1;
        } catch {
        } finally {
        }
      if (e = Tc(l, t, a, u), e !== null)
        return nt(e, l, u), yo(e, t, u), !0;
    }
    return !1;
  }
  function ti(l, t, e, u) {
    if (u = {
      lane: 2,
      revertLane: Hi(),
      action: u,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, an(l)) {
      if (t) throw Error(s(479));
    } else
      t = Tc(
        l,
        e,
        u,
        2
      ), t !== null && nt(t, l, 2);
  }
  function an(l) {
    var t = l.alternate;
    return l === K || t !== null && t === K;
  }
  function vo(l, t) {
    eu = Ia = !0;
    var e = l.pending;
    e === null ? t.next = t : (t.next = e.next, e.next = t), l.pending = t;
  }
  function yo(l, t, e) {
    if ((e & 4194048) !== 0) {
      var u = t.lanes;
      u &= l.pendingLanes, e |= u, t.lanes = e, Ef(l, e);
    }
  }
  var nn = {
    readContext: Yl,
    use: ln,
    useCallback: gl,
    useContext: gl,
    useEffect: gl,
    useImperativeHandle: gl,
    useLayoutEffect: gl,
    useInsertionEffect: gl,
    useMemo: gl,
    useReducer: gl,
    useRef: gl,
    useState: gl,
    useDebugValue: gl,
    useDeferredValue: gl,
    useTransition: gl,
    useSyncExternalStore: gl,
    useId: gl,
    useHostTransitionStatus: gl,
    useFormState: gl,
    useActionState: gl,
    useOptimistic: gl,
    useMemoCache: gl,
    useCacheRefresh: gl
  }, mo = {
    readContext: Yl,
    use: ln,
    useCallback: function(l, t) {
      return Jl().memoizedState = [
        l,
        t === void 0 ? null : t
      ], l;
    },
    useContext: Yl,
    useEffect: Is,
    useImperativeHandle: function(l, t, e) {
      e = e != null ? e.concat([l]) : null, un(
        4194308,
        4,
        eo.bind(null, t, l),
        e
      );
    },
    useLayoutEffect: function(l, t) {
      return un(4194308, 4, l, t);
    },
    useInsertionEffect: function(l, t) {
      un(4, 2, l, t);
    },
    useMemo: function(l, t) {
      var e = Jl();
      t = t === void 0 ? null : t;
      var u = l();
      if (ze) {
        Lt(!0);
        try {
          l();
        } finally {
          Lt(!1);
        }
      }
      return e.memoizedState = [u, t], u;
    },
    useReducer: function(l, t, e) {
      var u = Jl();
      if (e !== void 0) {
        var a = e(t);
        if (ze) {
          Lt(!0);
          try {
            e(t);
          } finally {
            Lt(!1);
          }
        }
      } else a = t;
      return u.memoizedState = u.baseState = a, l = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: l,
        lastRenderedState: a
      }, u.queue = l, l = l.dispatch = e0.bind(
        null,
        K,
        l
      ), [u.memoizedState, l];
    },
    useRef: function(l) {
      var t = Jl();
      return l = { current: l }, t.memoizedState = l;
    },
    useState: function(l) {
      l = kc(l);
      var t = l.queue, e = ho.bind(null, K, t);
      return t.dispatch = e, [l.memoizedState, e];
    },
    useDebugValue: Fc,
    useDeferredValue: function(l, t) {
      var e = Jl();
      return Ic(e, l, t);
    },
    useTransition: function() {
      var l = kc(!1);
      return l = io.bind(
        null,
        K,
        l.queue,
        !0,
        !1
      ), Jl().memoizedState = l, [!1, l];
    },
    useSyncExternalStore: function(l, t, e) {
      var u = K, a = Jl();
      if (el) {
        if (e === void 0)
          throw Error(s(407));
        e = e();
      } else {
        if (e = t(), ol === null)
          throw Error(s(349));
        (F & 124) !== 0 || Bs(u, t, e);
      }
      a.memoizedState = e;
      var n = { value: e, getSnapshot: t };
      return a.queue = n, Is(Ys.bind(null, u, n, l), [
        l
      ]), u.flags |= 2048, au(
        9,
        en(),
        qs.bind(
          null,
          u,
          n,
          e,
          t
        ),
        null
      ), e;
    },
    useId: function() {
      var l = Jl(), t = ol.identifierPrefix;
      if (el) {
        var e = xt, u = Nt;
        e = (u & ~(1 << 32 - Il(u) - 1)).toString(32) + e, t = "«" + t + "R" + e, e = Pa++, 0 < e && (t += "H" + e.toString(32)), t += "»";
      } else
        e = Wh++, t = "«" + t + "r" + e.toString(32) + "»";
      return l.memoizedState = t;
    },
    useHostTransitionStatus: li,
    useFormState: ws,
    useActionState: ws,
    useOptimistic: function(l) {
      var t = Jl();
      t.memoizedState = t.baseState = l;
      var e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = e, t = ti.bind(
        null,
        K,
        !0,
        e
      ), e.dispatch = t, [l, t];
    },
    useMemoCache: Jc,
    useCacheRefresh: function() {
      return Jl().memoizedState = t0.bind(
        null,
        K
      );
    }
  }, go = {
    readContext: Yl,
    use: ln,
    useCallback: ao,
    useContext: Yl,
    useEffect: Ps,
    useImperativeHandle: uo,
    useInsertionEffect: lo,
    useLayoutEffect: to,
    useMemo: no,
    useReducer: tn,
    useRef: Fs,
    useState: function() {
      return tn(jt);
    },
    useDebugValue: Fc,
    useDeferredValue: function(l, t) {
      var e = pl();
      return co(
        e,
        nl.memoizedState,
        l,
        t
      );
    },
    useTransition: function() {
      var l = tn(jt)[0], t = pl().memoizedState;
      return [
        typeof l == "boolean" ? l : Wu(l),
        t
      ];
    },
    useSyncExternalStore: js,
    useId: oo,
    useHostTransitionStatus: li,
    useFormState: $s,
    useActionState: $s,
    useOptimistic: function(l, t) {
      var e = pl();
      return Qs(e, nl, l, t);
    },
    useMemoCache: Jc,
    useCacheRefresh: ro
  }, u0 = {
    readContext: Yl,
    use: ln,
    useCallback: ao,
    useContext: Yl,
    useEffect: Ps,
    useImperativeHandle: uo,
    useInsertionEffect: lo,
    useLayoutEffect: to,
    useMemo: no,
    useReducer: $c,
    useRef: Fs,
    useState: function() {
      return $c(jt);
    },
    useDebugValue: Fc,
    useDeferredValue: function(l, t) {
      var e = pl();
      return nl === null ? Ic(e, l, t) : co(
        e,
        nl.memoizedState,
        l,
        t
      );
    },
    useTransition: function() {
      var l = $c(jt)[0], t = pl().memoizedState;
      return [
        typeof l == "boolean" ? l : Wu(l),
        t
      ];
    },
    useSyncExternalStore: js,
    useId: oo,
    useHostTransitionStatus: li,
    useFormState: Ws,
    useActionState: Ws,
    useOptimistic: function(l, t) {
      var e = pl();
      return nl !== null ? Qs(e, nl, l, t) : (e.baseState = l, [l, e.queue.dispatch]);
    },
    useMemoCache: Jc,
    useCacheRefresh: ro
  }, nu = null, Pu = 0;
  function cn(l) {
    var t = Pu;
    return Pu += 1, nu === null && (nu = []), _s(nu, l, t);
  }
  function la(l, t) {
    t = t.props.ref, l.ref = t !== void 0 ? t : null;
  }
  function fn(l, t) {
    throw t.$$typeof === J ? Error(s(525)) : (l = Object.prototype.toString.call(t), Error(
      s(
        31,
        l === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : l
      )
    ));
  }
  function So(l) {
    var t = l._init;
    return t(l._payload);
  }
  function bo(l) {
    function t(v, h) {
      if (l) {
        var m = v.deletions;
        m === null ? (v.deletions = [h], v.flags |= 16) : m.push(h);
      }
    }
    function e(v, h) {
      if (!l) return null;
      for (; h !== null; )
        t(v, h), h = h.sibling;
      return null;
    }
    function u(v) {
      for (var h = /* @__PURE__ */ new Map(); v !== null; )
        v.key !== null ? h.set(v.key, v) : h.set(v.index, v), v = v.sibling;
      return h;
    }
    function a(v, h) {
      return v = Ut(v, h), v.index = 0, v.sibling = null, v;
    }
    function n(v, h, m) {
      return v.index = m, l ? (m = v.alternate, m !== null ? (m = m.index, m < h ? (v.flags |= 67108866, h) : m) : (v.flags |= 67108866, h)) : (v.flags |= 1048576, h);
    }
    function c(v) {
      return l && v.alternate === null && (v.flags |= 67108866), v;
    }
    function i(v, h, m, D) {
      return h === null || h.tag !== 6 ? (h = Ec(m, v.mode, D), h.return = v, h) : (h = a(h, m), h.return = v, h);
    }
    function o(v, h, m, D) {
      var j = m.type;
      return j === El ? p(
        v,
        h,
        m.props.children,
        D,
        m.key
      ) : h !== null && (h.elementType === j || typeof j == "object" && j !== null && j.$$typeof === Ql && So(j) === h.type) ? (h = a(h, m.props), la(h, m), h.return = v, h) : (h = Va(
        m.type,
        m.key,
        m.props,
        null,
        v.mode,
        D
      ), la(h, m), h.return = v, h);
    }
    function g(v, h, m, D) {
      return h === null || h.tag !== 4 || h.stateNode.containerInfo !== m.containerInfo || h.stateNode.implementation !== m.implementation ? (h = Ac(m, v.mode, D), h.return = v, h) : (h = a(h, m.children || []), h.return = v, h);
    }
    function p(v, h, m, D, j) {
      return h === null || h.tag !== 7 ? (h = pe(
        m,
        v.mode,
        D,
        j
      ), h.return = v, h) : (h = a(h, m), h.return = v, h);
    }
    function R(v, h, m) {
      if (typeof h == "string" && h !== "" || typeof h == "number" || typeof h == "bigint")
        return h = Ec(
          "" + h,
          v.mode,
          m
        ), h.return = v, h;
      if (typeof h == "object" && h !== null) {
        switch (h.$$typeof) {
          case $:
            return m = Va(
              h.type,
              h.key,
              h.props,
              null,
              v.mode,
              m
            ), la(m, h), m.return = v, m;
          case vl:
            return h = Ac(
              h,
              v.mode,
              m
            ), h.return = v, h;
          case Ql:
            var D = h._init;
            return h = D(h._payload), R(v, h, m);
        }
        if (Bl(h) || jl(h))
          return h = pe(
            h,
            v.mode,
            m,
            null
          ), h.return = v, h;
        if (typeof h.then == "function")
          return R(v, cn(h), m);
        if (h.$$typeof === bl)
          return R(
            v,
            wa(v, h),
            m
          );
        fn(v, h);
      }
      return null;
    }
    function S(v, h, m, D) {
      var j = h !== null ? h.key : null;
      if (typeof m == "string" && m !== "" || typeof m == "number" || typeof m == "bigint")
        return j !== null ? null : i(v, h, "" + m, D);
      if (typeof m == "object" && m !== null) {
        switch (m.$$typeof) {
          case $:
            return m.key === j ? o(v, h, m, D) : null;
          case vl:
            return m.key === j ? g(v, h, m, D) : null;
          case Ql:
            return j = m._init, m = j(m._payload), S(v, h, m, D);
        }
        if (Bl(m) || jl(m))
          return j !== null ? null : p(v, h, m, D, null);
        if (typeof m.then == "function")
          return S(
            v,
            h,
            cn(m),
            D
          );
        if (m.$$typeof === bl)
          return S(
            v,
            h,
            wa(v, m),
            D
          );
        fn(v, m);
      }
      return null;
    }
    function b(v, h, m, D, j) {
      if (typeof D == "string" && D !== "" || typeof D == "number" || typeof D == "bigint")
        return v = v.get(m) || null, i(h, v, "" + D, j);
      if (typeof D == "object" && D !== null) {
        switch (D.$$typeof) {
          case $:
            return v = v.get(
              D.key === null ? m : D.key
            ) || null, o(h, v, D, j);
          case vl:
            return v = v.get(
              D.key === null ? m : D.key
            ) || null, g(h, v, D, j);
          case Ql:
            var w = D._init;
            return D = w(D._payload), b(
              v,
              h,
              m,
              D,
              j
            );
        }
        if (Bl(D) || jl(D))
          return v = v.get(m) || null, p(h, v, D, j, null);
        if (typeof D.then == "function")
          return b(
            v,
            h,
            m,
            cn(D),
            j
          );
        if (D.$$typeof === bl)
          return b(
            v,
            h,
            m,
            wa(h, D),
            j
          );
        fn(h, D);
      }
      return null;
    }
    function Z(v, h, m, D) {
      for (var j = null, w = null, B = h, X = h = 0, Ml = null; B !== null && X < m.length; X++) {
        B.index > X ? (Ml = B, B = null) : Ml = B.sibling;
        var ll = S(
          v,
          B,
          m[X],
          D
        );
        if (ll === null) {
          B === null && (B = Ml);
          break;
        }
        l && B && ll.alternate === null && t(v, B), h = n(ll, h, X), w === null ? j = ll : w.sibling = ll, w = ll, B = Ml;
      }
      if (X === m.length)
        return e(v, B), el && Ae(v, X), j;
      if (B === null) {
        for (; X < m.length; X++)
          B = R(v, m[X], D), B !== null && (h = n(
            B,
            h,
            X
          ), w === null ? j = B : w.sibling = B, w = B);
        return el && Ae(v, X), j;
      }
      for (B = u(B); X < m.length; X++)
        Ml = b(
          B,
          v,
          X,
          m[X],
          D
        ), Ml !== null && (l && Ml.alternate !== null && B.delete(
          Ml.key === null ? X : Ml.key
        ), h = n(
          Ml,
          h,
          X
        ), w === null ? j = Ml : w.sibling = Ml, w = Ml);
      return l && B.forEach(function(he) {
        return t(v, he);
      }), el && Ae(v, X), j;
    }
    function G(v, h, m, D) {
      if (m == null) throw Error(s(151));
      for (var j = null, w = null, B = h, X = h = 0, Ml = null, ll = m.next(); B !== null && !ll.done; X++, ll = m.next()) {
        B.index > X ? (Ml = B, B = null) : Ml = B.sibling;
        var he = S(v, B, ll.value, D);
        if (he === null) {
          B === null && (B = Ml);
          break;
        }
        l && B && he.alternate === null && t(v, B), h = n(he, h, X), w === null ? j = he : w.sibling = he, w = he, B = Ml;
      }
      if (ll.done)
        return e(v, B), el && Ae(v, X), j;
      if (B === null) {
        for (; !ll.done; X++, ll = m.next())
          ll = R(v, ll.value, D), ll !== null && (h = n(ll, h, X), w === null ? j = ll : w.sibling = ll, w = ll);
        return el && Ae(v, X), j;
      }
      for (B = u(B); !ll.done; X++, ll = m.next())
        ll = b(B, v, X, ll.value, D), ll !== null && (l && ll.alternate !== null && B.delete(ll.key === null ? X : ll.key), h = n(ll, h, X), w === null ? j = ll : w.sibling = ll, w = ll);
      return l && B.forEach(function(av) {
        return t(v, av);
      }), el && Ae(v, X), j;
    }
    function il(v, h, m, D) {
      if (typeof m == "object" && m !== null && m.type === El && m.key === null && (m = m.props.children), typeof m == "object" && m !== null) {
        switch (m.$$typeof) {
          case $:
            l: {
              for (var j = m.key; h !== null; ) {
                if (h.key === j) {
                  if (j = m.type, j === El) {
                    if (h.tag === 7) {
                      e(
                        v,
                        h.sibling
                      ), D = a(
                        h,
                        m.props.children
                      ), D.return = v, v = D;
                      break l;
                    }
                  } else if (h.elementType === j || typeof j == "object" && j !== null && j.$$typeof === Ql && So(j) === h.type) {
                    e(
                      v,
                      h.sibling
                    ), D = a(h, m.props), la(D, m), D.return = v, v = D;
                    break l;
                  }
                  e(v, h);
                  break;
                } else t(v, h);
                h = h.sibling;
              }
              m.type === El ? (D = pe(
                m.props.children,
                v.mode,
                D,
                m.key
              ), D.return = v, v = D) : (D = Va(
                m.type,
                m.key,
                m.props,
                null,
                v.mode,
                D
              ), la(D, m), D.return = v, v = D);
            }
            return c(v);
          case vl:
            l: {
              for (j = m.key; h !== null; ) {
                if (h.key === j)
                  if (h.tag === 4 && h.stateNode.containerInfo === m.containerInfo && h.stateNode.implementation === m.implementation) {
                    e(
                      v,
                      h.sibling
                    ), D = a(h, m.children || []), D.return = v, v = D;
                    break l;
                  } else {
                    e(v, h);
                    break;
                  }
                else t(v, h);
                h = h.sibling;
              }
              D = Ac(m, v.mode, D), D.return = v, v = D;
            }
            return c(v);
          case Ql:
            return j = m._init, m = j(m._payload), il(
              v,
              h,
              m,
              D
            );
        }
        if (Bl(m))
          return Z(
            v,
            h,
            m,
            D
          );
        if (jl(m)) {
          if (j = jl(m), typeof j != "function") throw Error(s(150));
          return m = j.call(m), G(
            v,
            h,
            m,
            D
          );
        }
        if (typeof m.then == "function")
          return il(
            v,
            h,
            cn(m),
            D
          );
        if (m.$$typeof === bl)
          return il(
            v,
            h,
            wa(v, m),
            D
          );
        fn(v, m);
      }
      return typeof m == "string" && m !== "" || typeof m == "number" || typeof m == "bigint" ? (m = "" + m, h !== null && h.tag === 6 ? (e(v, h.sibling), D = a(h, m), D.return = v, v = D) : (e(v, h), D = Ec(m, v.mode, D), D.return = v, v = D), c(v)) : e(v, h);
    }
    return function(v, h, m, D) {
      try {
        Pu = 0;
        var j = il(
          v,
          h,
          m,
          D
        );
        return nu = null, j;
      } catch (B) {
        if (B === Lu || B === ka) throw B;
        var w = lt(29, B, null, v.mode);
        return w.lanes = D, w.return = v, w;
      } finally {
      }
    };
  }
  var cu = bo(!0), To = bo(!1), dt = O(null), Et = null;
  function It(l) {
    var t = l.alternate;
    U(Dl, Dl.current & 1), U(dt, l), Et === null && (t === null || tu.current !== null || t.memoizedState !== null) && (Et = l);
  }
  function po(l) {
    if (l.tag === 22) {
      if (U(Dl, Dl.current), U(dt, l), Et === null) {
        var t = l.alternate;
        t !== null && t.memoizedState !== null && (Et = l);
      }
    } else Pt();
  }
  function Pt() {
    U(Dl, Dl.current), U(dt, dt.current);
  }
  function Bt(l) {
    H(dt), Et === l && (Et = null), H(Dl);
  }
  var Dl = O(0);
  function sn(l) {
    for (var t = l; t !== null; ) {
      if (t.tag === 13) {
        var e = t.memoizedState;
        if (e !== null && (e = e.dehydrated, e === null || e.data === "$?" || Ki(e)))
          return t;
      } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        t.child.return = t, t = t.child;
        continue;
      }
      if (t === l) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === l) return null;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
    return null;
  }
  function ei(l, t, e, u) {
    t = l.memoizedState, e = e(u, t), e = e == null ? t : C({}, t, e), l.memoizedState = e, l.lanes === 0 && (l.updateQueue.baseState = e);
  }
  var ui = {
    enqueueSetState: function(l, t, e) {
      l = l._reactInternals;
      var u = at(), a = kt(u);
      a.payload = t, e != null && (a.callback = e), t = Wt(l, a, u), t !== null && (nt(t, l, u), Ju(t, l, u));
    },
    enqueueReplaceState: function(l, t, e) {
      l = l._reactInternals;
      var u = at(), a = kt(u);
      a.tag = 1, a.payload = t, e != null && (a.callback = e), t = Wt(l, a, u), t !== null && (nt(t, l, u), Ju(t, l, u));
    },
    enqueueForceUpdate: function(l, t) {
      l = l._reactInternals;
      var e = at(), u = kt(e);
      u.tag = 2, t != null && (u.callback = t), t = Wt(l, u, e), t !== null && (nt(t, l, e), Ju(t, l, e));
    }
  };
  function Eo(l, t, e, u, a, n, c) {
    return l = l.stateNode, typeof l.shouldComponentUpdate == "function" ? l.shouldComponentUpdate(u, n, c) : t.prototype && t.prototype.isPureReactComponent ? !Bu(e, u) || !Bu(a, n) : !0;
  }
  function Ao(l, t, e, u) {
    l = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(e, u), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(e, u), t.state !== l && ui.enqueueReplaceState(t, t.state, null);
  }
  function Ue(l, t) {
    var e = t;
    if ("ref" in t) {
      e = {};
      for (var u in t)
        u !== "ref" && (e[u] = t[u]);
    }
    if (l = l.defaultProps) {
      e === t && (e = C({}, e));
      for (var a in l)
        e[a] === void 0 && (e[a] = l[a]);
    }
    return e;
  }
  var on = typeof reportError == "function" ? reportError : function(l) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var t = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof l == "object" && l !== null && typeof l.message == "string" ? String(l.message) : String(l),
        error: l
      });
      if (!window.dispatchEvent(t)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", l);
      return;
    }
    console.error(l);
  };
  function Do(l) {
    on(l);
  }
  function Ro(l) {
    console.error(l);
  }
  function Oo(l) {
    on(l);
  }
  function rn(l, t) {
    try {
      var e = l.onUncaughtError;
      e(t.value, { componentStack: t.stack });
    } catch (u) {
      setTimeout(function() {
        throw u;
      });
    }
  }
  function _o(l, t, e) {
    try {
      var u = l.onCaughtError;
      u(e.value, {
        componentStack: e.stack,
        errorBoundary: t.tag === 1 ? t.stateNode : null
      });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function ai(l, t, e) {
    return e = kt(e), e.tag = 3, e.payload = { element: null }, e.callback = function() {
      rn(l, t);
    }, e;
  }
  function Mo(l) {
    return l = kt(l), l.tag = 3, l;
  }
  function zo(l, t, e, u) {
    var a = e.type.getDerivedStateFromError;
    if (typeof a == "function") {
      var n = u.value;
      l.payload = function() {
        return a(n);
      }, l.callback = function() {
        _o(t, e, u);
      };
    }
    var c = e.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (l.callback = function() {
      _o(t, e, u), typeof a != "function" && (ne === null ? ne = /* @__PURE__ */ new Set([this]) : ne.add(this));
      var i = u.stack;
      this.componentDidCatch(u.value, {
        componentStack: i !== null ? i : ""
      });
    });
  }
  function a0(l, t, e, u, a) {
    if (e.flags |= 32768, u !== null && typeof u == "object" && typeof u.then == "function") {
      if (t = e.alternate, t !== null && Qu(
        t,
        e,
        a,
        !0
      ), e = dt.current, e !== null) {
        switch (e.tag) {
          case 13:
            return Et === null ? Mi() : e.alternate === null && ml === 0 && (ml = 3), e.flags &= -257, e.flags |= 65536, e.lanes = a, u === Hc ? e.flags |= 16384 : (t = e.updateQueue, t === null ? e.updateQueue = /* @__PURE__ */ new Set([u]) : t.add(u), Ui(l, u, a)), !1;
          case 22:
            return e.flags |= 65536, u === Hc ? e.flags |= 16384 : (t = e.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([u])
            }, e.updateQueue = t) : (e = t.retryQueue, e === null ? t.retryQueue = /* @__PURE__ */ new Set([u]) : e.add(u)), Ui(l, u, a)), !1;
        }
        throw Error(s(435, e.tag));
      }
      return Ui(l, u, a), Mi(), !1;
    }
    if (el)
      return t = dt.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = a, u !== Oc && (l = Error(s(422), { cause: u }), Xu(ft(l, e)))) : (u !== Oc && (t = Error(s(423), {
        cause: u
      }), Xu(
        ft(t, e)
      )), l = l.current.alternate, l.flags |= 65536, a &= -a, l.lanes |= a, u = ft(u, e), a = ai(
        l.stateNode,
        u,
        a
      ), Bc(l, a), ml !== 4 && (ml = 2)), !1;
    var n = Error(s(520), { cause: u });
    if (n = ft(n, e), ia === null ? ia = [n] : ia.push(n), ml !== 4 && (ml = 2), t === null) return !0;
    u = ft(u, e), e = t;
    do {
      switch (e.tag) {
        case 3:
          return e.flags |= 65536, l = a & -a, e.lanes |= l, l = ai(e.stateNode, u, l), Bc(e, l), !1;
        case 1:
          if (t = e.type, n = e.stateNode, (e.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || n !== null && typeof n.componentDidCatch == "function" && (ne === null || !ne.has(n))))
            return e.flags |= 65536, a &= -a, e.lanes |= a, a = Mo(a), zo(
              a,
              l,
              e,
              u
            ), Bc(e, a), !1;
      }
      e = e.return;
    } while (e !== null);
    return !1;
  }
  var Uo = Error(s(461)), Ol = !1;
  function Ul(l, t, e, u) {
    t.child = l === null ? To(t, null, e, u) : cu(
      t,
      l.child,
      e,
      u
    );
  }
  function No(l, t, e, u, a) {
    e = e.render;
    var n = t.ref;
    if ("ref" in u) {
      var c = {};
      for (var i in u)
        i !== "ref" && (c[i] = u[i]);
    } else c = u;
    return _e(t), u = Qc(
      l,
      t,
      e,
      c,
      n,
      a
    ), i = Zc(), l !== null && !Ol ? (Vc(l, t, a), qt(l, t, a)) : (el && i && Dc(t), t.flags |= 1, Ul(l, t, u, a), t.child);
  }
  function xo(l, t, e, u, a) {
    if (l === null) {
      var n = e.type;
      return typeof n == "function" && !pc(n) && n.defaultProps === void 0 && e.compare === null ? (t.tag = 15, t.type = n, Ho(
        l,
        t,
        n,
        u,
        a
      )) : (l = Va(
        e.type,
        null,
        u,
        t,
        t.mode,
        a
      ), l.ref = t.ref, l.return = t, t.child = l);
    }
    if (n = l.child, !di(l, a)) {
      var c = n.memoizedProps;
      if (e = e.compare, e = e !== null ? e : Bu, e(c, u) && l.ref === t.ref)
        return qt(l, t, a);
    }
    return t.flags |= 1, l = Ut(n, u), l.ref = t.ref, l.return = t, t.child = l;
  }
  function Ho(l, t, e, u, a) {
    if (l !== null) {
      var n = l.memoizedProps;
      if (Bu(n, u) && l.ref === t.ref)
        if (Ol = !1, t.pendingProps = u = n, di(l, a))
          (l.flags & 131072) !== 0 && (Ol = !0);
        else
          return t.lanes = l.lanes, qt(l, t, a);
    }
    return ni(
      l,
      t,
      e,
      u,
      a
    );
  }
  function Co(l, t, e) {
    var u = t.pendingProps, a = u.children, n = l !== null ? l.memoizedState : null;
    if (u.mode === "hidden") {
      if ((t.flags & 128) !== 0) {
        if (u = n !== null ? n.baseLanes | e : e, l !== null) {
          for (a = t.child = l.child, n = 0; a !== null; )
            n = n | a.lanes | a.childLanes, a = a.sibling;
          t.childLanes = n & ~u;
        } else t.childLanes = 0, t.child = null;
        return jo(
          l,
          t,
          u,
          e
        );
      }
      if ((e & 536870912) !== 0)
        t.memoizedState = { baseLanes: 0, cachePool: null }, l !== null && $a(
          t,
          n !== null ? n.cachePool : null
        ), n !== null ? xs(t, n) : Yc(), po(t);
      else
        return t.lanes = t.childLanes = 536870912, jo(
          l,
          t,
          n !== null ? n.baseLanes | e : e,
          e
        );
    } else
      n !== null ? ($a(t, n.cachePool), xs(t, n), Pt(), t.memoizedState = null) : (l !== null && $a(t, null), Yc(), Pt());
    return Ul(l, t, a, e), t.child;
  }
  function jo(l, t, e, u) {
    var a = xc();
    return a = a === null ? null : { parent: Al._currentValue, pool: a }, t.memoizedState = {
      baseLanes: e,
      cachePool: a
    }, l !== null && $a(t, null), Yc(), po(t), l !== null && Qu(l, t, u, !0), null;
  }
  function dn(l, t) {
    var e = t.ref;
    if (e === null)
      l !== null && l.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof e != "function" && typeof e != "object")
        throw Error(s(284));
      (l === null || l.ref !== e) && (t.flags |= 4194816);
    }
  }
  function ni(l, t, e, u, a) {
    return _e(t), e = Qc(
      l,
      t,
      e,
      u,
      void 0,
      a
    ), u = Zc(), l !== null && !Ol ? (Vc(l, t, a), qt(l, t, a)) : (el && u && Dc(t), t.flags |= 1, Ul(l, t, e, a), t.child);
  }
  function Bo(l, t, e, u, a, n) {
    return _e(t), t.updateQueue = null, e = Cs(
      t,
      u,
      e,
      a
    ), Hs(l), u = Zc(), l !== null && !Ol ? (Vc(l, t, n), qt(l, t, n)) : (el && u && Dc(t), t.flags |= 1, Ul(l, t, e, n), t.child);
  }
  function qo(l, t, e, u, a) {
    if (_e(t), t.stateNode === null) {
      var n = We, c = e.contextType;
      typeof c == "object" && c !== null && (n = Yl(c)), n = new e(u, n), t.memoizedState = n.state !== null && n.state !== void 0 ? n.state : null, n.updater = ui, t.stateNode = n, n._reactInternals = t, n = t.stateNode, n.props = u, n.state = t.memoizedState, n.refs = {}, Cc(t), c = e.contextType, n.context = typeof c == "object" && c !== null ? Yl(c) : We, n.state = t.memoizedState, c = e.getDerivedStateFromProps, typeof c == "function" && (ei(
        t,
        e,
        c,
        u
      ), n.state = t.memoizedState), typeof e.getDerivedStateFromProps == "function" || typeof n.getSnapshotBeforeUpdate == "function" || typeof n.UNSAFE_componentWillMount != "function" && typeof n.componentWillMount != "function" || (c = n.state, typeof n.componentWillMount == "function" && n.componentWillMount(), typeof n.UNSAFE_componentWillMount == "function" && n.UNSAFE_componentWillMount(), c !== n.state && ui.enqueueReplaceState(n, n.state, null), $u(t, u, n, a), wu(), n.state = t.memoizedState), typeof n.componentDidMount == "function" && (t.flags |= 4194308), u = !0;
    } else if (l === null) {
      n = t.stateNode;
      var i = t.memoizedProps, o = Ue(e, i);
      n.props = o;
      var g = n.context, p = e.contextType;
      c = We, typeof p == "object" && p !== null && (c = Yl(p));
      var R = e.getDerivedStateFromProps;
      p = typeof R == "function" || typeof n.getSnapshotBeforeUpdate == "function", i = t.pendingProps !== i, p || typeof n.UNSAFE_componentWillReceiveProps != "function" && typeof n.componentWillReceiveProps != "function" || (i || g !== c) && Ao(
        t,
        n,
        u,
        c
      ), $t = !1;
      var S = t.memoizedState;
      n.state = S, $u(t, u, n, a), wu(), g = t.memoizedState, i || S !== g || $t ? (typeof R == "function" && (ei(
        t,
        e,
        R,
        u
      ), g = t.memoizedState), (o = $t || Eo(
        t,
        e,
        o,
        u,
        S,
        g,
        c
      )) ? (p || typeof n.UNSAFE_componentWillMount != "function" && typeof n.componentWillMount != "function" || (typeof n.componentWillMount == "function" && n.componentWillMount(), typeof n.UNSAFE_componentWillMount == "function" && n.UNSAFE_componentWillMount()), typeof n.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof n.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = u, t.memoizedState = g), n.props = u, n.state = g, n.context = c, u = o) : (typeof n.componentDidMount == "function" && (t.flags |= 4194308), u = !1);
    } else {
      n = t.stateNode, jc(l, t), c = t.memoizedProps, p = Ue(e, c), n.props = p, R = t.pendingProps, S = n.context, g = e.contextType, o = We, typeof g == "object" && g !== null && (o = Yl(g)), i = e.getDerivedStateFromProps, (g = typeof i == "function" || typeof n.getSnapshotBeforeUpdate == "function") || typeof n.UNSAFE_componentWillReceiveProps != "function" && typeof n.componentWillReceiveProps != "function" || (c !== R || S !== o) && Ao(
        t,
        n,
        u,
        o
      ), $t = !1, S = t.memoizedState, n.state = S, $u(t, u, n, a), wu();
      var b = t.memoizedState;
      c !== R || S !== b || $t || l !== null && l.dependencies !== null && Ja(l.dependencies) ? (typeof i == "function" && (ei(
        t,
        e,
        i,
        u
      ), b = t.memoizedState), (p = $t || Eo(
        t,
        e,
        p,
        u,
        S,
        b,
        o
      ) || l !== null && l.dependencies !== null && Ja(l.dependencies)) ? (g || typeof n.UNSAFE_componentWillUpdate != "function" && typeof n.componentWillUpdate != "function" || (typeof n.componentWillUpdate == "function" && n.componentWillUpdate(u, b, o), typeof n.UNSAFE_componentWillUpdate == "function" && n.UNSAFE_componentWillUpdate(
        u,
        b,
        o
      )), typeof n.componentDidUpdate == "function" && (t.flags |= 4), typeof n.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof n.componentDidUpdate != "function" || c === l.memoizedProps && S === l.memoizedState || (t.flags |= 4), typeof n.getSnapshotBeforeUpdate != "function" || c === l.memoizedProps && S === l.memoizedState || (t.flags |= 1024), t.memoizedProps = u, t.memoizedState = b), n.props = u, n.state = b, n.context = o, u = p) : (typeof n.componentDidUpdate != "function" || c === l.memoizedProps && S === l.memoizedState || (t.flags |= 4), typeof n.getSnapshotBeforeUpdate != "function" || c === l.memoizedProps && S === l.memoizedState || (t.flags |= 1024), u = !1);
    }
    return n = u, dn(l, t), u = (t.flags & 128) !== 0, n || u ? (n = t.stateNode, e = u && typeof e.getDerivedStateFromError != "function" ? null : n.render(), t.flags |= 1, l !== null && u ? (t.child = cu(
      t,
      l.child,
      null,
      a
    ), t.child = cu(
      t,
      null,
      e,
      a
    )) : Ul(l, t, e, a), t.memoizedState = n.state, l = t.child) : l = qt(
      l,
      t,
      a
    ), l;
  }
  function Yo(l, t, e, u) {
    return Gu(), t.flags |= 256, Ul(l, t, e, u), t.child;
  }
  var ci = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function ii(l) {
    return { baseLanes: l, cachePool: Ds() };
  }
  function fi(l, t, e) {
    return l = l !== null ? l.childLanes & ~e : 0, t && (l |= ht), l;
  }
  function Go(l, t, e) {
    var u = t.pendingProps, a = !1, n = (t.flags & 128) !== 0, c;
    if ((c = n) || (c = l !== null && l.memoizedState === null ? !1 : (Dl.current & 2) !== 0), c && (a = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, l === null) {
      if (el) {
        if (a ? It(t) : Pt(), el) {
          var i = yl, o;
          if (o = i) {
            l: {
              for (o = i, i = pt; o.nodeType !== 8; ) {
                if (!i) {
                  i = null;
                  break l;
                }
                if (o = gt(
                  o.nextSibling
                ), o === null) {
                  i = null;
                  break l;
                }
              }
              i = o;
            }
            i !== null ? (t.memoizedState = {
              dehydrated: i,
              treeContext: Ee !== null ? { id: Nt, overflow: xt } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, o = lt(
              18,
              null,
              null,
              0
            ), o.stateNode = i, o.return = t, t.child = o, Zl = t, yl = null, o = !0) : o = !1;
          }
          o || Re(t);
        }
        if (i = t.memoizedState, i !== null && (i = i.dehydrated, i !== null))
          return Ki(i) ? t.lanes = 32 : t.lanes = 536870912, null;
        Bt(t);
      }
      return i = u.children, u = u.fallback, a ? (Pt(), a = t.mode, i = hn(
        { mode: "hidden", children: i },
        a
      ), u = pe(
        u,
        a,
        e,
        null
      ), i.return = t, u.return = t, i.sibling = u, t.child = i, a = t.child, a.memoizedState = ii(e), a.childLanes = fi(
        l,
        c,
        e
      ), t.memoizedState = ci, u) : (It(t), si(t, i));
    }
    if (o = l.memoizedState, o !== null && (i = o.dehydrated, i !== null)) {
      if (n)
        t.flags & 256 ? (It(t), t.flags &= -257, t = oi(
          l,
          t,
          e
        )) : t.memoizedState !== null ? (Pt(), t.child = l.child, t.flags |= 128, t = null) : (Pt(), a = u.fallback, i = t.mode, u = hn(
          { mode: "visible", children: u.children },
          i
        ), a = pe(
          a,
          i,
          e,
          null
        ), a.flags |= 2, u.return = t, a.return = t, u.sibling = a, t.child = u, cu(
          t,
          l.child,
          null,
          e
        ), u = t.child, u.memoizedState = ii(e), u.childLanes = fi(
          l,
          c,
          e
        ), t.memoizedState = ci, t = a);
      else if (It(t), Ki(i)) {
        if (c = i.nextSibling && i.nextSibling.dataset, c) var g = c.dgst;
        c = g, u = Error(s(419)), u.stack = "", u.digest = c, Xu({ value: u, source: null, stack: null }), t = oi(
          l,
          t,
          e
        );
      } else if (Ol || Qu(l, t, e, !1), c = (e & l.childLanes) !== 0, Ol || c) {
        if (c = ol, c !== null && (u = e & -e, u = (u & 42) !== 0 ? 1 : Jn(u), u = (u & (c.suspendedLanes | e)) !== 0 ? 0 : u, u !== 0 && u !== o.retryLane))
          throw o.retryLane = u, ke(l, u), nt(c, l, u), Uo;
        i.data === "$?" || Mi(), t = oi(
          l,
          t,
          e
        );
      } else
        i.data === "$?" ? (t.flags |= 192, t.child = l.child, t = null) : (l = o.treeContext, yl = gt(
          i.nextSibling
        ), Zl = t, el = !0, De = null, pt = !1, l !== null && (ot[rt++] = Nt, ot[rt++] = xt, ot[rt++] = Ee, Nt = l.id, xt = l.overflow, Ee = t), t = si(
          t,
          u.children
        ), t.flags |= 4096);
      return t;
    }
    return a ? (Pt(), a = u.fallback, i = t.mode, o = l.child, g = o.sibling, u = Ut(o, {
      mode: "hidden",
      children: u.children
    }), u.subtreeFlags = o.subtreeFlags & 65011712, g !== null ? a = Ut(g, a) : (a = pe(
      a,
      i,
      e,
      null
    ), a.flags |= 2), a.return = t, u.return = t, u.sibling = a, t.child = u, u = a, a = t.child, i = l.child.memoizedState, i === null ? i = ii(e) : (o = i.cachePool, o !== null ? (g = Al._currentValue, o = o.parent !== g ? { parent: g, pool: g } : o) : o = Ds(), i = {
      baseLanes: i.baseLanes | e,
      cachePool: o
    }), a.memoizedState = i, a.childLanes = fi(
      l,
      c,
      e
    ), t.memoizedState = ci, u) : (It(t), e = l.child, l = e.sibling, e = Ut(e, {
      mode: "visible",
      children: u.children
    }), e.return = t, e.sibling = null, l !== null && (c = t.deletions, c === null ? (t.deletions = [l], t.flags |= 16) : c.push(l)), t.child = e, t.memoizedState = null, e);
  }
  function si(l, t) {
    return t = hn(
      { mode: "visible", children: t },
      l.mode
    ), t.return = l, l.child = t;
  }
  function hn(l, t) {
    return l = lt(22, l, null, t), l.lanes = 0, l.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }, l;
  }
  function oi(l, t, e) {
    return cu(t, l.child, null, e), l = si(
      t,
      t.pendingProps.children
    ), l.flags |= 2, t.memoizedState = null, l;
  }
  function Xo(l, t, e) {
    l.lanes |= t;
    var u = l.alternate;
    u !== null && (u.lanes |= t), Mc(l.return, t, e);
  }
  function ri(l, t, e, u, a) {
    var n = l.memoizedState;
    n === null ? l.memoizedState = {
      isBackwards: t,
      rendering: null,
      renderingStartTime: 0,
      last: u,
      tail: e,
      tailMode: a
    } : (n.isBackwards = t, n.rendering = null, n.renderingStartTime = 0, n.last = u, n.tail = e, n.tailMode = a);
  }
  function Qo(l, t, e) {
    var u = t.pendingProps, a = u.revealOrder, n = u.tail;
    if (Ul(l, t, u.children, e), u = Dl.current, (u & 2) !== 0)
      u = u & 1 | 2, t.flags |= 128;
    else {
      if (l !== null && (l.flags & 128) !== 0)
        l: for (l = t.child; l !== null; ) {
          if (l.tag === 13)
            l.memoizedState !== null && Xo(l, e, t);
          else if (l.tag === 19)
            Xo(l, e, t);
          else if (l.child !== null) {
            l.child.return = l, l = l.child;
            continue;
          }
          if (l === t) break l;
          for (; l.sibling === null; ) {
            if (l.return === null || l.return === t)
              break l;
            l = l.return;
          }
          l.sibling.return = l.return, l = l.sibling;
        }
      u &= 1;
    }
    switch (U(Dl, u), a) {
      case "forwards":
        for (e = t.child, a = null; e !== null; )
          l = e.alternate, l !== null && sn(l) === null && (a = e), e = e.sibling;
        e = a, e === null ? (a = t.child, t.child = null) : (a = e.sibling, e.sibling = null), ri(
          t,
          !1,
          a,
          e,
          n
        );
        break;
      case "backwards":
        for (e = null, a = t.child, t.child = null; a !== null; ) {
          if (l = a.alternate, l !== null && sn(l) === null) {
            t.child = a;
            break;
          }
          l = a.sibling, a.sibling = e, e = a, a = l;
        }
        ri(
          t,
          !0,
          e,
          null,
          n
        );
        break;
      case "together":
        ri(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function qt(l, t, e) {
    if (l !== null && (t.dependencies = l.dependencies), ae |= t.lanes, (e & t.childLanes) === 0)
      if (l !== null) {
        if (Qu(
          l,
          t,
          e,
          !1
        ), (e & t.childLanes) === 0)
          return null;
      } else return null;
    if (l !== null && t.child !== l.child)
      throw Error(s(153));
    if (t.child !== null) {
      for (l = t.child, e = Ut(l, l.pendingProps), t.child = e, e.return = t; l.sibling !== null; )
        l = l.sibling, e = e.sibling = Ut(l, l.pendingProps), e.return = t;
      e.sibling = null;
    }
    return t.child;
  }
  function di(l, t) {
    return (l.lanes & t) !== 0 ? !0 : (l = l.dependencies, !!(l !== null && Ja(l)));
  }
  function n0(l, t, e) {
    switch (t.tag) {
      case 3:
        rl(t, t.stateNode.containerInfo), wt(t, Al, l.memoizedState.cache), Gu();
        break;
      case 27:
      case 5:
        Qn(t);
        break;
      case 4:
        rl(t, t.stateNode.containerInfo);
        break;
      case 10:
        wt(
          t,
          t.type,
          t.memoizedProps.value
        );
        break;
      case 13:
        var u = t.memoizedState;
        if (u !== null)
          return u.dehydrated !== null ? (It(t), t.flags |= 128, null) : (e & t.child.childLanes) !== 0 ? Go(l, t, e) : (It(t), l = qt(
            l,
            t,
            e
          ), l !== null ? l.sibling : null);
        It(t);
        break;
      case 19:
        var a = (l.flags & 128) !== 0;
        if (u = (e & t.childLanes) !== 0, u || (Qu(
          l,
          t,
          e,
          !1
        ), u = (e & t.childLanes) !== 0), a) {
          if (u)
            return Qo(
              l,
              t,
              e
            );
          t.flags |= 128;
        }
        if (a = t.memoizedState, a !== null && (a.rendering = null, a.tail = null, a.lastEffect = null), U(Dl, Dl.current), u) break;
        return null;
      case 22:
      case 23:
        return t.lanes = 0, Co(l, t, e);
      case 24:
        wt(t, Al, l.memoizedState.cache);
    }
    return qt(l, t, e);
  }
  function Zo(l, t, e) {
    if (l !== null)
      if (l.memoizedProps !== t.pendingProps)
        Ol = !0;
      else {
        if (!di(l, e) && (t.flags & 128) === 0)
          return Ol = !1, n0(
            l,
            t,
            e
          );
        Ol = (l.flags & 131072) !== 0;
      }
    else
      Ol = !1, el && (t.flags & 1048576) !== 0 && gs(t, Ka, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        l: {
          l = t.pendingProps;
          var u = t.elementType, a = u._init;
          if (u = a(u._payload), t.type = u, typeof u == "function")
            pc(u) ? (l = Ue(u, l), t.tag = 1, t = qo(
              null,
              t,
              u,
              l,
              e
            )) : (t.tag = 0, t = ni(
              null,
              t,
              u,
              l,
              e
            ));
          else {
            if (u != null) {
              if (a = u.$$typeof, a === Vl) {
                t.tag = 11, t = No(
                  null,
                  t,
                  u,
                  l,
                  e
                );
                break l;
              } else if (a === Cl) {
                t.tag = 14, t = xo(
                  null,
                  t,
                  u,
                  l,
                  e
                );
                break l;
              }
            }
            throw t = ye(u) || u, Error(s(306, t, ""));
          }
        }
        return t;
      case 0:
        return ni(
          l,
          t,
          t.type,
          t.pendingProps,
          e
        );
      case 1:
        return u = t.type, a = Ue(
          u,
          t.pendingProps
        ), qo(
          l,
          t,
          u,
          a,
          e
        );
      case 3:
        l: {
          if (rl(
            t,
            t.stateNode.containerInfo
          ), l === null) throw Error(s(387));
          u = t.pendingProps;
          var n = t.memoizedState;
          a = n.element, jc(l, t), $u(t, u, null, e);
          var c = t.memoizedState;
          if (u = c.cache, wt(t, Al, u), u !== n.cache && zc(
            t,
            [Al],
            e,
            !0
          ), wu(), u = c.element, n.isDehydrated)
            if (n = {
              element: u,
              isDehydrated: !1,
              cache: c.cache
            }, t.updateQueue.baseState = n, t.memoizedState = n, t.flags & 256) {
              t = Yo(
                l,
                t,
                u,
                e
              );
              break l;
            } else if (u !== a) {
              a = ft(
                Error(s(424)),
                t
              ), Xu(a), t = Yo(
                l,
                t,
                u,
                e
              );
              break l;
            } else {
              switch (l = t.stateNode.containerInfo, l.nodeType) {
                case 9:
                  l = l.body;
                  break;
                default:
                  l = l.nodeName === "HTML" ? l.ownerDocument.body : l;
              }
              for (yl = gt(l.firstChild), Zl = t, el = !0, De = null, pt = !0, e = To(
                t,
                null,
                u,
                e
              ), t.child = e; e; )
                e.flags = e.flags & -3 | 4096, e = e.sibling;
            }
          else {
            if (Gu(), u === a) {
              t = qt(
                l,
                t,
                e
              );
              break l;
            }
            Ul(
              l,
              t,
              u,
              e
            );
          }
          t = t.child;
        }
        return t;
      case 26:
        return dn(l, t), l === null ? (e = Jr(
          t.type,
          null,
          t.pendingProps,
          null
        )) ? t.memoizedState = e : el || (e = t.type, l = t.pendingProps, u = _n(
          V.current
        ).createElement(e), u[ql] = t, u[Ll] = l, xl(u, e, l), Rl(u), t.stateNode = u) : t.memoizedState = Jr(
          t.type,
          l.memoizedProps,
          t.pendingProps,
          l.memoizedState
        ), null;
      case 27:
        return Qn(t), l === null && el && (u = t.stateNode = Vr(
          t.type,
          t.pendingProps,
          V.current
        ), Zl = t, pt = !0, a = yl, fe(t.type) ? (Ji = a, yl = gt(
          u.firstChild
        )) : yl = a), Ul(
          l,
          t,
          t.pendingProps.children,
          e
        ), dn(l, t), l === null && (t.flags |= 4194304), t.child;
      case 5:
        return l === null && el && ((a = u = yl) && (u = H0(
          u,
          t.type,
          t.pendingProps,
          pt
        ), u !== null ? (t.stateNode = u, Zl = t, yl = gt(
          u.firstChild
        ), pt = !1, a = !0) : a = !1), a || Re(t)), Qn(t), a = t.type, n = t.pendingProps, c = l !== null ? l.memoizedProps : null, u = n.children, Zi(a, n) ? u = null : c !== null && Zi(a, c) && (t.flags |= 32), t.memoizedState !== null && (a = Qc(
          l,
          t,
          Fh,
          null,
          null,
          e
        ), ma._currentValue = a), dn(l, t), Ul(l, t, u, e), t.child;
      case 6:
        return l === null && el && ((l = e = yl) && (e = C0(
          e,
          t.pendingProps,
          pt
        ), e !== null ? (t.stateNode = e, Zl = t, yl = null, l = !0) : l = !1), l || Re(t)), null;
      case 13:
        return Go(l, t, e);
      case 4:
        return rl(
          t,
          t.stateNode.containerInfo
        ), u = t.pendingProps, l === null ? t.child = cu(
          t,
          null,
          u,
          e
        ) : Ul(
          l,
          t,
          u,
          e
        ), t.child;
      case 11:
        return No(
          l,
          t,
          t.type,
          t.pendingProps,
          e
        );
      case 7:
        return Ul(
          l,
          t,
          t.pendingProps,
          e
        ), t.child;
      case 8:
        return Ul(
          l,
          t,
          t.pendingProps.children,
          e
        ), t.child;
      case 12:
        return Ul(
          l,
          t,
          t.pendingProps.children,
          e
        ), t.child;
      case 10:
        return u = t.pendingProps, wt(t, t.type, u.value), Ul(
          l,
          t,
          u.children,
          e
        ), t.child;
      case 9:
        return a = t.type._context, u = t.pendingProps.children, _e(t), a = Yl(a), u = u(a), t.flags |= 1, Ul(l, t, u, e), t.child;
      case 14:
        return xo(
          l,
          t,
          t.type,
          t.pendingProps,
          e
        );
      case 15:
        return Ho(
          l,
          t,
          t.type,
          t.pendingProps,
          e
        );
      case 19:
        return Qo(l, t, e);
      case 31:
        return u = t.pendingProps, e = t.mode, u = {
          mode: u.mode,
          children: u.children
        }, l === null ? (e = hn(
          u,
          e
        ), e.ref = t.ref, t.child = e, e.return = t, t = e) : (e = Ut(l.child, u), e.ref = t.ref, t.child = e, e.return = t, t = e), t;
      case 22:
        return Co(l, t, e);
      case 24:
        return _e(t), u = Yl(Al), l === null ? (a = xc(), a === null && (a = ol, n = Uc(), a.pooledCache = n, n.refCount++, n !== null && (a.pooledCacheLanes |= e), a = n), t.memoizedState = {
          parent: u,
          cache: a
        }, Cc(t), wt(t, Al, a)) : ((l.lanes & e) !== 0 && (jc(l, t), $u(t, null, null, e), wu()), a = l.memoizedState, n = t.memoizedState, a.parent !== u ? (a = { parent: u, cache: u }, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), wt(t, Al, u)) : (u = n.cache, wt(t, Al, u), u !== a.cache && zc(
          t,
          [Al],
          e,
          !0
        ))), Ul(
          l,
          t,
          t.pendingProps.children,
          e
        ), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(s(156, t.tag));
  }
  function Yt(l) {
    l.flags |= 4;
  }
  function Vo(l, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0)
      l.flags &= -16777217;
    else if (l.flags |= 16777216, !Fr(t)) {
      if (t = dt.current, t !== null && ((F & 4194048) === F ? Et !== null : (F & 62914560) !== F && (F & 536870912) === 0 || t !== Et))
        throw Ku = Hc, Rs;
      l.flags |= 8192;
    }
  }
  function vn(l, t) {
    t !== null && (l.flags |= 4), l.flags & 16384 && (t = l.tag !== 22 ? Tf() : 536870912, l.lanes |= t, ou |= t);
  }
  function ta(l, t) {
    if (!el)
      switch (l.tailMode) {
        case "hidden":
          t = l.tail;
          for (var e = null; t !== null; )
            t.alternate !== null && (e = t), t = t.sibling;
          e === null ? l.tail = null : e.sibling = null;
          break;
        case "collapsed":
          e = l.tail;
          for (var u = null; e !== null; )
            e.alternate !== null && (u = e), e = e.sibling;
          u === null ? t || l.tail === null ? l.tail = null : l.tail.sibling = null : u.sibling = null;
      }
  }
  function hl(l) {
    var t = l.alternate !== null && l.alternate.child === l.child, e = 0, u = 0;
    if (t)
      for (var a = l.child; a !== null; )
        e |= a.lanes | a.childLanes, u |= a.subtreeFlags & 65011712, u |= a.flags & 65011712, a.return = l, a = a.sibling;
    else
      for (a = l.child; a !== null; )
        e |= a.lanes | a.childLanes, u |= a.subtreeFlags, u |= a.flags, a.return = l, a = a.sibling;
    return l.subtreeFlags |= u, l.childLanes = e, t;
  }
  function c0(l, t, e) {
    var u = t.pendingProps;
    switch (Rc(t), t.tag) {
      case 31:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return hl(t), null;
      case 1:
        return hl(t), null;
      case 3:
        return e = t.stateNode, u = null, l !== null && (u = l.memoizedState.cache), t.memoizedState.cache !== u && (t.flags |= 2048), Ct(Al), Vt(), e.pendingContext && (e.context = e.pendingContext, e.pendingContext = null), (l === null || l.child === null) && (Yu(t) ? Yt(t) : l === null || l.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, Ts())), hl(t), null;
      case 26:
        return e = t.memoizedState, l === null ? (Yt(t), e !== null ? (hl(t), Vo(t, e)) : (hl(t), t.flags &= -16777217)) : e ? e !== l.memoizedState ? (Yt(t), hl(t), Vo(t, e)) : (hl(t), t.flags &= -16777217) : (l.memoizedProps !== u && Yt(t), hl(t), t.flags &= -16777217), null;
      case 27:
        Da(t), e = V.current;
        var a = t.type;
        if (l !== null && t.stateNode != null)
          l.memoizedProps !== u && Yt(t);
        else {
          if (!u) {
            if (t.stateNode === null)
              throw Error(s(166));
            return hl(t), null;
          }
          l = Y.current, Yu(t) ? Ss(t) : (l = Vr(a, u, e), t.stateNode = l, Yt(t));
        }
        return hl(t), null;
      case 5:
        if (Da(t), e = t.type, l !== null && t.stateNode != null)
          l.memoizedProps !== u && Yt(t);
        else {
          if (!u) {
            if (t.stateNode === null)
              throw Error(s(166));
            return hl(t), null;
          }
          if (l = Y.current, Yu(t))
            Ss(t);
          else {
            switch (a = _n(
              V.current
            ), l) {
              case 1:
                l = a.createElementNS(
                  "http://www.w3.org/2000/svg",
                  e
                );
                break;
              case 2:
                l = a.createElementNS(
                  "http://www.w3.org/1998/Math/MathML",
                  e
                );
                break;
              default:
                switch (e) {
                  case "svg":
                    l = a.createElementNS(
                      "http://www.w3.org/2000/svg",
                      e
                    );
                    break;
                  case "math":
                    l = a.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      e
                    );
                    break;
                  case "script":
                    l = a.createElement("div"), l.innerHTML = "<script><\/script>", l = l.removeChild(l.firstChild);
                    break;
                  case "select":
                    l = typeof u.is == "string" ? a.createElement("select", { is: u.is }) : a.createElement("select"), u.multiple ? l.multiple = !0 : u.size && (l.size = u.size);
                    break;
                  default:
                    l = typeof u.is == "string" ? a.createElement(e, { is: u.is }) : a.createElement(e);
                }
            }
            l[ql] = t, l[Ll] = u;
            l: for (a = t.child; a !== null; ) {
              if (a.tag === 5 || a.tag === 6)
                l.appendChild(a.stateNode);
              else if (a.tag !== 4 && a.tag !== 27 && a.child !== null) {
                a.child.return = a, a = a.child;
                continue;
              }
              if (a === t) break l;
              for (; a.sibling === null; ) {
                if (a.return === null || a.return === t)
                  break l;
                a = a.return;
              }
              a.sibling.return = a.return, a = a.sibling;
            }
            t.stateNode = l;
            l: switch (xl(l, e, u), e) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                l = !!u.autoFocus;
                break l;
              case "img":
                l = !0;
                break l;
              default:
                l = !1;
            }
            l && Yt(t);
          }
        }
        return hl(t), t.flags &= -16777217, null;
      case 6:
        if (l && t.stateNode != null)
          l.memoizedProps !== u && Yt(t);
        else {
          if (typeof u != "string" && t.stateNode === null)
            throw Error(s(166));
          if (l = V.current, Yu(t)) {
            if (l = t.stateNode, e = t.memoizedProps, u = null, a = Zl, a !== null)
              switch (a.tag) {
                case 27:
                case 5:
                  u = a.memoizedProps;
              }
            l[ql] = t, l = !!(l.nodeValue === e || u !== null && u.suppressHydrationWarning === !0 || Br(l.nodeValue, e)), l || Re(t);
          } else
            l = _n(l).createTextNode(
              u
            ), l[ql] = t, t.stateNode = l;
        }
        return hl(t), null;
      case 13:
        if (u = t.memoizedState, l === null || l.memoizedState !== null && l.memoizedState.dehydrated !== null) {
          if (a = Yu(t), u !== null && u.dehydrated !== null) {
            if (l === null) {
              if (!a) throw Error(s(318));
              if (a = t.memoizedState, a = a !== null ? a.dehydrated : null, !a) throw Error(s(317));
              a[ql] = t;
            } else
              Gu(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            hl(t), a = !1;
          } else
            a = Ts(), l !== null && l.memoizedState !== null && (l.memoizedState.hydrationErrors = a), a = !0;
          if (!a)
            return t.flags & 256 ? (Bt(t), t) : (Bt(t), null);
        }
        if (Bt(t), (t.flags & 128) !== 0)
          return t.lanes = e, t;
        if (e = u !== null, l = l !== null && l.memoizedState !== null, e) {
          u = t.child, a = null, u.alternate !== null && u.alternate.memoizedState !== null && u.alternate.memoizedState.cachePool !== null && (a = u.alternate.memoizedState.cachePool.pool);
          var n = null;
          u.memoizedState !== null && u.memoizedState.cachePool !== null && (n = u.memoizedState.cachePool.pool), n !== a && (u.flags |= 2048);
        }
        return e !== l && e && (t.child.flags |= 8192), vn(t, t.updateQueue), hl(t), null;
      case 4:
        return Vt(), l === null && qi(t.stateNode.containerInfo), hl(t), null;
      case 10:
        return Ct(t.type), hl(t), null;
      case 19:
        if (H(Dl), a = t.memoizedState, a === null) return hl(t), null;
        if (u = (t.flags & 128) !== 0, n = a.rendering, n === null)
          if (u) ta(a, !1);
          else {
            if (ml !== 0 || l !== null && (l.flags & 128) !== 0)
              for (l = t.child; l !== null; ) {
                if (n = sn(l), n !== null) {
                  for (t.flags |= 128, ta(a, !1), l = n.updateQueue, t.updateQueue = l, vn(t, l), t.subtreeFlags = 0, l = e, e = t.child; e !== null; )
                    ms(e, l), e = e.sibling;
                  return U(
                    Dl,
                    Dl.current & 1 | 2
                  ), t.child;
                }
                l = l.sibling;
              }
            a.tail !== null && Tt() > gn && (t.flags |= 128, u = !0, ta(a, !1), t.lanes = 4194304);
          }
        else {
          if (!u)
            if (l = sn(n), l !== null) {
              if (t.flags |= 128, u = !0, l = l.updateQueue, t.updateQueue = l, vn(t, l), ta(a, !0), a.tail === null && a.tailMode === "hidden" && !n.alternate && !el)
                return hl(t), null;
            } else
              2 * Tt() - a.renderingStartTime > gn && e !== 536870912 && (t.flags |= 128, u = !0, ta(a, !1), t.lanes = 4194304);
          a.isBackwards ? (n.sibling = t.child, t.child = n) : (l = a.last, l !== null ? l.sibling = n : t.child = n, a.last = n);
        }
        return a.tail !== null ? (t = a.tail, a.rendering = t, a.tail = t.sibling, a.renderingStartTime = Tt(), t.sibling = null, l = Dl.current, U(Dl, u ? l & 1 | 2 : l & 1), t) : (hl(t), null);
      case 22:
      case 23:
        return Bt(t), Gc(), u = t.memoizedState !== null, l !== null ? l.memoizedState !== null !== u && (t.flags |= 8192) : u && (t.flags |= 8192), u ? (e & 536870912) !== 0 && (t.flags & 128) === 0 && (hl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : hl(t), e = t.updateQueue, e !== null && vn(t, e.retryQueue), e = null, l !== null && l.memoizedState !== null && l.memoizedState.cachePool !== null && (e = l.memoizedState.cachePool.pool), u = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (u = t.memoizedState.cachePool.pool), u !== e && (t.flags |= 2048), l !== null && H(Me), null;
      case 24:
        return e = null, l !== null && (e = l.memoizedState.cache), t.memoizedState.cache !== e && (t.flags |= 2048), Ct(Al), hl(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(s(156, t.tag));
  }
  function i0(l, t) {
    switch (Rc(t), t.tag) {
      case 1:
        return l = t.flags, l & 65536 ? (t.flags = l & -65537 | 128, t) : null;
      case 3:
        return Ct(Al), Vt(), l = t.flags, (l & 65536) !== 0 && (l & 128) === 0 ? (t.flags = l & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return Da(t), null;
      case 13:
        if (Bt(t), l = t.memoizedState, l !== null && l.dehydrated !== null) {
          if (t.alternate === null)
            throw Error(s(340));
          Gu();
        }
        return l = t.flags, l & 65536 ? (t.flags = l & -65537 | 128, t) : null;
      case 19:
        return H(Dl), null;
      case 4:
        return Vt(), null;
      case 10:
        return Ct(t.type), null;
      case 22:
      case 23:
        return Bt(t), Gc(), l !== null && H(Me), l = t.flags, l & 65536 ? (t.flags = l & -65537 | 128, t) : null;
      case 24:
        return Ct(Al), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Lo(l, t) {
    switch (Rc(t), t.tag) {
      case 3:
        Ct(Al), Vt();
        break;
      case 26:
      case 27:
      case 5:
        Da(t);
        break;
      case 4:
        Vt();
        break;
      case 13:
        Bt(t);
        break;
      case 19:
        H(Dl);
        break;
      case 10:
        Ct(t.type);
        break;
      case 22:
      case 23:
        Bt(t), Gc(), l !== null && H(Me);
        break;
      case 24:
        Ct(Al);
    }
  }
  function ea(l, t) {
    try {
      var e = t.updateQueue, u = e !== null ? e.lastEffect : null;
      if (u !== null) {
        var a = u.next;
        e = a;
        do {
          if ((e.tag & l) === l) {
            u = void 0;
            var n = e.create, c = e.inst;
            u = n(), c.destroy = u;
          }
          e = e.next;
        } while (e !== a);
      }
    } catch (i) {
      sl(t, t.return, i);
    }
  }
  function le(l, t, e) {
    try {
      var u = t.updateQueue, a = u !== null ? u.lastEffect : null;
      if (a !== null) {
        var n = a.next;
        u = n;
        do {
          if ((u.tag & l) === l) {
            var c = u.inst, i = c.destroy;
            if (i !== void 0) {
              c.destroy = void 0, a = t;
              var o = e, g = i;
              try {
                g();
              } catch (p) {
                sl(
                  a,
                  o,
                  p
                );
              }
            }
          }
          u = u.next;
        } while (u !== n);
      }
    } catch (p) {
      sl(t, t.return, p);
    }
  }
  function Ko(l) {
    var t = l.updateQueue;
    if (t !== null) {
      var e = l.stateNode;
      try {
        Ns(t, e);
      } catch (u) {
        sl(l, l.return, u);
      }
    }
  }
  function Jo(l, t, e) {
    e.props = Ue(
      l.type,
      l.memoizedProps
    ), e.state = l.memoizedState;
    try {
      e.componentWillUnmount();
    } catch (u) {
      sl(l, t, u);
    }
  }
  function ua(l, t) {
    try {
      var e = l.ref;
      if (e !== null) {
        switch (l.tag) {
          case 26:
          case 27:
          case 5:
            var u = l.stateNode;
            break;
          case 30:
            u = l.stateNode;
            break;
          default:
            u = l.stateNode;
        }
        typeof e == "function" ? l.refCleanup = e(u) : e.current = u;
      }
    } catch (a) {
      sl(l, t, a);
    }
  }
  function At(l, t) {
    var e = l.ref, u = l.refCleanup;
    if (e !== null)
      if (typeof u == "function")
        try {
          u();
        } catch (a) {
          sl(l, t, a);
        } finally {
          l.refCleanup = null, l = l.alternate, l != null && (l.refCleanup = null);
        }
      else if (typeof e == "function")
        try {
          e(null);
        } catch (a) {
          sl(l, t, a);
        }
      else e.current = null;
  }
  function wo(l) {
    var t = l.type, e = l.memoizedProps, u = l.stateNode;
    try {
      l: switch (t) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          e.autoFocus && u.focus();
          break l;
        case "img":
          e.src ? u.src = e.src : e.srcSet && (u.srcset = e.srcSet);
      }
    } catch (a) {
      sl(l, l.return, a);
    }
  }
  function hi(l, t, e) {
    try {
      var u = l.stateNode;
      M0(u, l.type, e, t), u[Ll] = t;
    } catch (a) {
      sl(l, l.return, a);
    }
  }
  function $o(l) {
    return l.tag === 5 || l.tag === 3 || l.tag === 26 || l.tag === 27 && fe(l.type) || l.tag === 4;
  }
  function vi(l) {
    l: for (; ; ) {
      for (; l.sibling === null; ) {
        if (l.return === null || $o(l.return)) return null;
        l = l.return;
      }
      for (l.sibling.return = l.return, l = l.sibling; l.tag !== 5 && l.tag !== 6 && l.tag !== 18; ) {
        if (l.tag === 27 && fe(l.type) || l.flags & 2 || l.child === null || l.tag === 4) continue l;
        l.child.return = l, l = l.child;
      }
      if (!(l.flags & 2)) return l.stateNode;
    }
  }
  function yi(l, t, e) {
    var u = l.tag;
    if (u === 5 || u === 6)
      l = l.stateNode, t ? (e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e).insertBefore(l, t) : (t = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, t.appendChild(l), e = e._reactRootContainer, e != null || t.onclick !== null || (t.onclick = On));
    else if (u !== 4 && (u === 27 && fe(l.type) && (e = l.stateNode, t = null), l = l.child, l !== null))
      for (yi(l, t, e), l = l.sibling; l !== null; )
        yi(l, t, e), l = l.sibling;
  }
  function yn(l, t, e) {
    var u = l.tag;
    if (u === 5 || u === 6)
      l = l.stateNode, t ? e.insertBefore(l, t) : e.appendChild(l);
    else if (u !== 4 && (u === 27 && fe(l.type) && (e = l.stateNode), l = l.child, l !== null))
      for (yn(l, t, e), l = l.sibling; l !== null; )
        yn(l, t, e), l = l.sibling;
  }
  function ko(l) {
    var t = l.stateNode, e = l.memoizedProps;
    try {
      for (var u = l.type, a = t.attributes; a.length; )
        t.removeAttributeNode(a[0]);
      xl(t, u, e), t[ql] = l, t[Ll] = e;
    } catch (n) {
      sl(l, l.return, n);
    }
  }
  var Gt = !1, Sl = !1, mi = !1, Wo = typeof WeakSet == "function" ? WeakSet : Set, _l = null;
  function f0(l, t) {
    if (l = l.containerInfo, Xi = Hn, l = cs(l), vc(l)) {
      if ("selectionStart" in l)
        var e = {
          start: l.selectionStart,
          end: l.selectionEnd
        };
      else
        l: {
          e = (e = l.ownerDocument) && e.defaultView || window;
          var u = e.getSelection && e.getSelection();
          if (u && u.rangeCount !== 0) {
            e = u.anchorNode;
            var a = u.anchorOffset, n = u.focusNode;
            u = u.focusOffset;
            try {
              e.nodeType, n.nodeType;
            } catch {
              e = null;
              break l;
            }
            var c = 0, i = -1, o = -1, g = 0, p = 0, R = l, S = null;
            t: for (; ; ) {
              for (var b; R !== e || a !== 0 && R.nodeType !== 3 || (i = c + a), R !== n || u !== 0 && R.nodeType !== 3 || (o = c + u), R.nodeType === 3 && (c += R.nodeValue.length), (b = R.firstChild) !== null; )
                S = R, R = b;
              for (; ; ) {
                if (R === l) break t;
                if (S === e && ++g === a && (i = c), S === n && ++p === u && (o = c), (b = R.nextSibling) !== null) break;
                R = S, S = R.parentNode;
              }
              R = b;
            }
            e = i === -1 || o === -1 ? null : { start: i, end: o };
          } else e = null;
        }
      e = e || { start: 0, end: 0 };
    } else e = null;
    for (Qi = { focusedElem: l, selectionRange: e }, Hn = !1, _l = t; _l !== null; )
      if (t = _l, l = t.child, (t.subtreeFlags & 1024) !== 0 && l !== null)
        l.return = t, _l = l;
      else
        for (; _l !== null; ) {
          switch (t = _l, n = t.alternate, l = t.flags, t.tag) {
            case 0:
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((l & 1024) !== 0 && n !== null) {
                l = void 0, e = t, a = n.memoizedProps, n = n.memoizedState, u = e.stateNode;
                try {
                  var Z = Ue(
                    e.type,
                    a,
                    e.elementType === e.type
                  );
                  l = u.getSnapshotBeforeUpdate(
                    Z,
                    n
                  ), u.__reactInternalSnapshotBeforeUpdate = l;
                } catch (G) {
                  sl(
                    e,
                    e.return,
                    G
                  );
                }
              }
              break;
            case 3:
              if ((l & 1024) !== 0) {
                if (l = t.stateNode.containerInfo, e = l.nodeType, e === 9)
                  Li(l);
                else if (e === 1)
                  switch (l.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      Li(l);
                      break;
                    default:
                      l.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((l & 1024) !== 0) throw Error(s(163));
          }
          if (l = t.sibling, l !== null) {
            l.return = t.return, _l = l;
            break;
          }
          _l = t.return;
        }
  }
  function Fo(l, t, e) {
    var u = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        te(l, e), u & 4 && ea(5, e);
        break;
      case 1:
        if (te(l, e), u & 4)
          if (l = e.stateNode, t === null)
            try {
              l.componentDidMount();
            } catch (c) {
              sl(e, e.return, c);
            }
          else {
            var a = Ue(
              e.type,
              t.memoizedProps
            );
            t = t.memoizedState;
            try {
              l.componentDidUpdate(
                a,
                t,
                l.__reactInternalSnapshotBeforeUpdate
              );
            } catch (c) {
              sl(
                e,
                e.return,
                c
              );
            }
          }
        u & 64 && Ko(e), u & 512 && ua(e, e.return);
        break;
      case 3:
        if (te(l, e), u & 64 && (l = e.updateQueue, l !== null)) {
          if (t = null, e.child !== null)
            switch (e.child.tag) {
              case 27:
              case 5:
                t = e.child.stateNode;
                break;
              case 1:
                t = e.child.stateNode;
            }
          try {
            Ns(l, t);
          } catch (c) {
            sl(e, e.return, c);
          }
        }
        break;
      case 27:
        t === null && u & 4 && ko(e);
      case 26:
      case 5:
        te(l, e), t === null && u & 4 && wo(e), u & 512 && ua(e, e.return);
        break;
      case 12:
        te(l, e);
        break;
      case 13:
        te(l, e), u & 4 && lr(l, e), u & 64 && (l = e.memoizedState, l !== null && (l = l.dehydrated, l !== null && (e = g0.bind(
          null,
          e
        ), j0(l, e))));
        break;
      case 22:
        if (u = e.memoizedState !== null || Gt, !u) {
          t = t !== null && t.memoizedState !== null || Sl, a = Gt;
          var n = Sl;
          Gt = u, (Sl = t) && !n ? ee(
            l,
            e,
            (e.subtreeFlags & 8772) !== 0
          ) : te(l, e), Gt = a, Sl = n;
        }
        break;
      case 30:
        break;
      default:
        te(l, e);
    }
  }
  function Io(l) {
    var t = l.alternate;
    t !== null && (l.alternate = null, Io(t)), l.child = null, l.deletions = null, l.sibling = null, l.tag === 5 && (t = l.stateNode, t !== null && kn(t)), l.stateNode = null, l.return = null, l.dependencies = null, l.memoizedProps = null, l.memoizedState = null, l.pendingProps = null, l.stateNode = null, l.updateQueue = null;
  }
  var dl = null, wl = !1;
  function Xt(l, t, e) {
    for (e = e.child; e !== null; )
      Po(l, t, e), e = e.sibling;
  }
  function Po(l, t, e) {
    if (Fl && typeof Fl.onCommitFiberUnmount == "function")
      try {
        Fl.onCommitFiberUnmount(Du, e);
      } catch {
      }
    switch (e.tag) {
      case 26:
        Sl || At(e, t), Xt(
          l,
          t,
          e
        ), e.memoizedState ? e.memoizedState.count-- : e.stateNode && (e = e.stateNode, e.parentNode.removeChild(e));
        break;
      case 27:
        Sl || At(e, t);
        var u = dl, a = wl;
        fe(e.type) && (dl = e.stateNode, wl = !1), Xt(
          l,
          t,
          e
        ), da(e.stateNode), dl = u, wl = a;
        break;
      case 5:
        Sl || At(e, t);
      case 6:
        if (u = dl, a = wl, dl = null, Xt(
          l,
          t,
          e
        ), dl = u, wl = a, dl !== null)
          if (wl)
            try {
              (dl.nodeType === 9 ? dl.body : dl.nodeName === "HTML" ? dl.ownerDocument.body : dl).removeChild(e.stateNode);
            } catch (n) {
              sl(
                e,
                t,
                n
              );
            }
          else
            try {
              dl.removeChild(e.stateNode);
            } catch (n) {
              sl(
                e,
                t,
                n
              );
            }
        break;
      case 18:
        dl !== null && (wl ? (l = dl, Qr(
          l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l,
          e.stateNode
        ), Ta(l)) : Qr(dl, e.stateNode));
        break;
      case 4:
        u = dl, a = wl, dl = e.stateNode.containerInfo, wl = !0, Xt(
          l,
          t,
          e
        ), dl = u, wl = a;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        Sl || le(2, e, t), Sl || le(4, e, t), Xt(
          l,
          t,
          e
        );
        break;
      case 1:
        Sl || (At(e, t), u = e.stateNode, typeof u.componentWillUnmount == "function" && Jo(
          e,
          t,
          u
        )), Xt(
          l,
          t,
          e
        );
        break;
      case 21:
        Xt(
          l,
          t,
          e
        );
        break;
      case 22:
        Sl = (u = Sl) || e.memoizedState !== null, Xt(
          l,
          t,
          e
        ), Sl = u;
        break;
      default:
        Xt(
          l,
          t,
          e
        );
    }
  }
  function lr(l, t) {
    if (t.memoizedState === null && (l = t.alternate, l !== null && (l = l.memoizedState, l !== null && (l = l.dehydrated, l !== null))))
      try {
        Ta(l);
      } catch (e) {
        sl(t, t.return, e);
      }
  }
  function s0(l) {
    switch (l.tag) {
      case 13:
      case 19:
        var t = l.stateNode;
        return t === null && (t = l.stateNode = new Wo()), t;
      case 22:
        return l = l.stateNode, t = l._retryCache, t === null && (t = l._retryCache = new Wo()), t;
      default:
        throw Error(s(435, l.tag));
    }
  }
  function gi(l, t) {
    var e = s0(l);
    t.forEach(function(u) {
      var a = S0.bind(null, l, u);
      e.has(u) || (e.add(u), u.then(a, a));
    });
  }
  function tt(l, t) {
    var e = t.deletions;
    if (e !== null)
      for (var u = 0; u < e.length; u++) {
        var a = e[u], n = l, c = t, i = c;
        l: for (; i !== null; ) {
          switch (i.tag) {
            case 27:
              if (fe(i.type)) {
                dl = i.stateNode, wl = !1;
                break l;
              }
              break;
            case 5:
              dl = i.stateNode, wl = !1;
              break l;
            case 3:
            case 4:
              dl = i.stateNode.containerInfo, wl = !0;
              break l;
          }
          i = i.return;
        }
        if (dl === null) throw Error(s(160));
        Po(n, c, a), dl = null, wl = !1, n = a.alternate, n !== null && (n.return = null), a.return = null;
      }
    if (t.subtreeFlags & 13878)
      for (t = t.child; t !== null; )
        tr(t, l), t = t.sibling;
  }
  var mt = null;
  function tr(l, t) {
    var e = l.alternate, u = l.flags;
    switch (l.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        tt(t, l), et(l), u & 4 && (le(3, l, l.return), ea(3, l), le(5, l, l.return));
        break;
      case 1:
        tt(t, l), et(l), u & 512 && (Sl || e === null || At(e, e.return)), u & 64 && Gt && (l = l.updateQueue, l !== null && (u = l.callbacks, u !== null && (e = l.shared.hiddenCallbacks, l.shared.hiddenCallbacks = e === null ? u : e.concat(u))));
        break;
      case 26:
        var a = mt;
        if (tt(t, l), et(l), u & 512 && (Sl || e === null || At(e, e.return)), u & 4) {
          var n = e !== null ? e.memoizedState : null;
          if (u = l.memoizedState, e === null)
            if (u === null)
              if (l.stateNode === null) {
                l: {
                  u = l.type, e = l.memoizedProps, a = a.ownerDocument || a;
                  t: switch (u) {
                    case "title":
                      n = a.getElementsByTagName("title")[0], (!n || n[_u] || n[ql] || n.namespaceURI === "http://www.w3.org/2000/svg" || n.hasAttribute("itemprop")) && (n = a.createElement(u), a.head.insertBefore(
                        n,
                        a.querySelector("head > title")
                      )), xl(n, u, e), n[ql] = l, Rl(n), u = n;
                      break l;
                    case "link":
                      var c = kr(
                        "link",
                        "href",
                        a
                      ).get(u + (e.href || ""));
                      if (c) {
                        for (var i = 0; i < c.length; i++)
                          if (n = c[i], n.getAttribute("href") === (e.href == null || e.href === "" ? null : e.href) && n.getAttribute("rel") === (e.rel == null ? null : e.rel) && n.getAttribute("title") === (e.title == null ? null : e.title) && n.getAttribute("crossorigin") === (e.crossOrigin == null ? null : e.crossOrigin)) {
                            c.splice(i, 1);
                            break t;
                          }
                      }
                      n = a.createElement(u), xl(n, u, e), a.head.appendChild(n);
                      break;
                    case "meta":
                      if (c = kr(
                        "meta",
                        "content",
                        a
                      ).get(u + (e.content || ""))) {
                        for (i = 0; i < c.length; i++)
                          if (n = c[i], n.getAttribute("content") === (e.content == null ? null : "" + e.content) && n.getAttribute("name") === (e.name == null ? null : e.name) && n.getAttribute("property") === (e.property == null ? null : e.property) && n.getAttribute("http-equiv") === (e.httpEquiv == null ? null : e.httpEquiv) && n.getAttribute("charset") === (e.charSet == null ? null : e.charSet)) {
                            c.splice(i, 1);
                            break t;
                          }
                      }
                      n = a.createElement(u), xl(n, u, e), a.head.appendChild(n);
                      break;
                    default:
                      throw Error(s(468, u));
                  }
                  n[ql] = l, Rl(n), u = n;
                }
                l.stateNode = u;
              } else
                Wr(
                  a,
                  l.type,
                  l.stateNode
                );
            else
              l.stateNode = $r(
                a,
                u,
                l.memoizedProps
              );
          else
            n !== u ? (n === null ? e.stateNode !== null && (e = e.stateNode, e.parentNode.removeChild(e)) : n.count--, u === null ? Wr(
              a,
              l.type,
              l.stateNode
            ) : $r(
              a,
              u,
              l.memoizedProps
            )) : u === null && l.stateNode !== null && hi(
              l,
              l.memoizedProps,
              e.memoizedProps
            );
        }
        break;
      case 27:
        tt(t, l), et(l), u & 512 && (Sl || e === null || At(e, e.return)), e !== null && u & 4 && hi(
          l,
          l.memoizedProps,
          e.memoizedProps
        );
        break;
      case 5:
        if (tt(t, l), et(l), u & 512 && (Sl || e === null || At(e, e.return)), l.flags & 32) {
          a = l.stateNode;
          try {
            Ze(a, "");
          } catch (b) {
            sl(l, l.return, b);
          }
        }
        u & 4 && l.stateNode != null && (a = l.memoizedProps, hi(
          l,
          a,
          e !== null ? e.memoizedProps : a
        )), u & 1024 && (mi = !0);
        break;
      case 6:
        if (tt(t, l), et(l), u & 4) {
          if (l.stateNode === null)
            throw Error(s(162));
          u = l.memoizedProps, e = l.stateNode;
          try {
            e.nodeValue = u;
          } catch (b) {
            sl(l, l.return, b);
          }
        }
        break;
      case 3:
        if (Un = null, a = mt, mt = Mn(t.containerInfo), tt(t, l), mt = a, et(l), u & 4 && e !== null && e.memoizedState.isDehydrated)
          try {
            Ta(t.containerInfo);
          } catch (b) {
            sl(l, l.return, b);
          }
        mi && (mi = !1, er(l));
        break;
      case 4:
        u = mt, mt = Mn(
          l.stateNode.containerInfo
        ), tt(t, l), et(l), mt = u;
        break;
      case 12:
        tt(t, l), et(l);
        break;
      case 13:
        tt(t, l), et(l), l.child.flags & 8192 && l.memoizedState !== null != (e !== null && e.memoizedState !== null) && (Ai = Tt()), u & 4 && (u = l.updateQueue, u !== null && (l.updateQueue = null, gi(l, u)));
        break;
      case 22:
        a = l.memoizedState !== null;
        var o = e !== null && e.memoizedState !== null, g = Gt, p = Sl;
        if (Gt = g || a, Sl = p || o, tt(t, l), Sl = p, Gt = g, et(l), u & 8192)
          l: for (t = l.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (e === null || o || Gt || Sl || Ne(l)), e = null, t = l; ; ) {
            if (t.tag === 5 || t.tag === 26) {
              if (e === null) {
                o = e = t;
                try {
                  if (n = o.stateNode, a)
                    c = n.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                  else {
                    i = o.stateNode;
                    var R = o.memoizedProps.style, S = R != null && R.hasOwnProperty("display") ? R.display : null;
                    i.style.display = S == null || typeof S == "boolean" ? "" : ("" + S).trim();
                  }
                } catch (b) {
                  sl(o, o.return, b);
                }
              }
            } else if (t.tag === 6) {
              if (e === null) {
                o = t;
                try {
                  o.stateNode.nodeValue = a ? "" : o.memoizedProps;
                } catch (b) {
                  sl(o, o.return, b);
                }
              }
            } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === l) && t.child !== null) {
              t.child.return = t, t = t.child;
              continue;
            }
            if (t === l) break l;
            for (; t.sibling === null; ) {
              if (t.return === null || t.return === l) break l;
              e === t && (e = null), t = t.return;
            }
            e === t && (e = null), t.sibling.return = t.return, t = t.sibling;
          }
        u & 4 && (u = l.updateQueue, u !== null && (e = u.retryQueue, e !== null && (u.retryQueue = null, gi(l, e))));
        break;
      case 19:
        tt(t, l), et(l), u & 4 && (u = l.updateQueue, u !== null && (l.updateQueue = null, gi(l, u)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        tt(t, l), et(l);
    }
  }
  function et(l) {
    var t = l.flags;
    if (t & 2) {
      try {
        for (var e, u = l.return; u !== null; ) {
          if ($o(u)) {
            e = u;
            break;
          }
          u = u.return;
        }
        if (e == null) throw Error(s(160));
        switch (e.tag) {
          case 27:
            var a = e.stateNode, n = vi(l);
            yn(l, n, a);
            break;
          case 5:
            var c = e.stateNode;
            e.flags & 32 && (Ze(c, ""), e.flags &= -33);
            var i = vi(l);
            yn(l, i, c);
            break;
          case 3:
          case 4:
            var o = e.stateNode.containerInfo, g = vi(l);
            yi(
              l,
              g,
              o
            );
            break;
          default:
            throw Error(s(161));
        }
      } catch (p) {
        sl(l, l.return, p);
      }
      l.flags &= -3;
    }
    t & 4096 && (l.flags &= -4097);
  }
  function er(l) {
    if (l.subtreeFlags & 1024)
      for (l = l.child; l !== null; ) {
        var t = l;
        er(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), l = l.sibling;
      }
  }
  function te(l, t) {
    if (t.subtreeFlags & 8772)
      for (t = t.child; t !== null; )
        Fo(l, t.alternate, t), t = t.sibling;
  }
  function Ne(l) {
    for (l = l.child; l !== null; ) {
      var t = l;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          le(4, t, t.return), Ne(t);
          break;
        case 1:
          At(t, t.return);
          var e = t.stateNode;
          typeof e.componentWillUnmount == "function" && Jo(
            t,
            t.return,
            e
          ), Ne(t);
          break;
        case 27:
          da(t.stateNode);
        case 26:
        case 5:
          At(t, t.return), Ne(t);
          break;
        case 22:
          t.memoizedState === null && Ne(t);
          break;
        case 30:
          Ne(t);
          break;
        default:
          Ne(t);
      }
      l = l.sibling;
    }
  }
  function ee(l, t, e) {
    for (e = e && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
      var u = t.alternate, a = l, n = t, c = n.flags;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          ee(
            a,
            n,
            e
          ), ea(4, n);
          break;
        case 1:
          if (ee(
            a,
            n,
            e
          ), u = n, a = u.stateNode, typeof a.componentDidMount == "function")
            try {
              a.componentDidMount();
            } catch (g) {
              sl(u, u.return, g);
            }
          if (u = n, a = u.updateQueue, a !== null) {
            var i = u.stateNode;
            try {
              var o = a.shared.hiddenCallbacks;
              if (o !== null)
                for (a.shared.hiddenCallbacks = null, a = 0; a < o.length; a++)
                  Us(o[a], i);
            } catch (g) {
              sl(u, u.return, g);
            }
          }
          e && c & 64 && Ko(n), ua(n, n.return);
          break;
        case 27:
          ko(n);
        case 26:
        case 5:
          ee(
            a,
            n,
            e
          ), e && u === null && c & 4 && wo(n), ua(n, n.return);
          break;
        case 12:
          ee(
            a,
            n,
            e
          );
          break;
        case 13:
          ee(
            a,
            n,
            e
          ), e && c & 4 && lr(a, n);
          break;
        case 22:
          n.memoizedState === null && ee(
            a,
            n,
            e
          ), ua(n, n.return);
          break;
        case 30:
          break;
        default:
          ee(
            a,
            n,
            e
          );
      }
      t = t.sibling;
    }
  }
  function Si(l, t) {
    var e = null;
    l !== null && l.memoizedState !== null && l.memoizedState.cachePool !== null && (e = l.memoizedState.cachePool.pool), l = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (l = t.memoizedState.cachePool.pool), l !== e && (l != null && l.refCount++, e != null && Zu(e));
  }
  function bi(l, t) {
    l = null, t.alternate !== null && (l = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== l && (t.refCount++, l != null && Zu(l));
  }
  function Dt(l, t, e, u) {
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; )
        ur(
          l,
          t,
          e,
          u
        ), t = t.sibling;
  }
  function ur(l, t, e, u) {
    var a = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Dt(
          l,
          t,
          e,
          u
        ), a & 2048 && ea(9, t);
        break;
      case 1:
        Dt(
          l,
          t,
          e,
          u
        );
        break;
      case 3:
        Dt(
          l,
          t,
          e,
          u
        ), a & 2048 && (l = null, t.alternate !== null && (l = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== l && (t.refCount++, l != null && Zu(l)));
        break;
      case 12:
        if (a & 2048) {
          Dt(
            l,
            t,
            e,
            u
          ), l = t.stateNode;
          try {
            var n = t.memoizedProps, c = n.id, i = n.onPostCommit;
            typeof i == "function" && i(
              c,
              t.alternate === null ? "mount" : "update",
              l.passiveEffectDuration,
              -0
            );
          } catch (o) {
            sl(t, t.return, o);
          }
        } else
          Dt(
            l,
            t,
            e,
            u
          );
        break;
      case 13:
        Dt(
          l,
          t,
          e,
          u
        );
        break;
      case 23:
        break;
      case 22:
        n = t.stateNode, c = t.alternate, t.memoizedState !== null ? n._visibility & 2 ? Dt(
          l,
          t,
          e,
          u
        ) : aa(l, t) : n._visibility & 2 ? Dt(
          l,
          t,
          e,
          u
        ) : (n._visibility |= 2, iu(
          l,
          t,
          e,
          u,
          (t.subtreeFlags & 10256) !== 0
        )), a & 2048 && Si(c, t);
        break;
      case 24:
        Dt(
          l,
          t,
          e,
          u
        ), a & 2048 && bi(t.alternate, t);
        break;
      default:
        Dt(
          l,
          t,
          e,
          u
        );
    }
  }
  function iu(l, t, e, u, a) {
    for (a = a && (t.subtreeFlags & 10256) !== 0, t = t.child; t !== null; ) {
      var n = l, c = t, i = e, o = u, g = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          iu(
            n,
            c,
            i,
            o,
            a
          ), ea(8, c);
          break;
        case 23:
          break;
        case 22:
          var p = c.stateNode;
          c.memoizedState !== null ? p._visibility & 2 ? iu(
            n,
            c,
            i,
            o,
            a
          ) : aa(
            n,
            c
          ) : (p._visibility |= 2, iu(
            n,
            c,
            i,
            o,
            a
          )), a && g & 2048 && Si(
            c.alternate,
            c
          );
          break;
        case 24:
          iu(
            n,
            c,
            i,
            o,
            a
          ), a && g & 2048 && bi(c.alternate, c);
          break;
        default:
          iu(
            n,
            c,
            i,
            o,
            a
          );
      }
      t = t.sibling;
    }
  }
  function aa(l, t) {
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; ) {
        var e = l, u = t, a = u.flags;
        switch (u.tag) {
          case 22:
            aa(e, u), a & 2048 && Si(
              u.alternate,
              u
            );
            break;
          case 24:
            aa(e, u), a & 2048 && bi(u.alternate, u);
            break;
          default:
            aa(e, u);
        }
        t = t.sibling;
      }
  }
  var na = 8192;
  function fu(l) {
    if (l.subtreeFlags & na)
      for (l = l.child; l !== null; )
        ar(l), l = l.sibling;
  }
  function ar(l) {
    switch (l.tag) {
      case 26:
        fu(l), l.flags & na && l.memoizedState !== null && $0(
          mt,
          l.memoizedState,
          l.memoizedProps
        );
        break;
      case 5:
        fu(l);
        break;
      case 3:
      case 4:
        var t = mt;
        mt = Mn(l.stateNode.containerInfo), fu(l), mt = t;
        break;
      case 22:
        l.memoizedState === null && (t = l.alternate, t !== null && t.memoizedState !== null ? (t = na, na = 16777216, fu(l), na = t) : fu(l));
        break;
      default:
        fu(l);
    }
  }
  function nr(l) {
    var t = l.alternate;
    if (t !== null && (l = t.child, l !== null)) {
      t.child = null;
      do
        t = l.sibling, l.sibling = null, l = t;
      while (l !== null);
    }
  }
  function ca(l) {
    var t = l.deletions;
    if ((l.flags & 16) !== 0) {
      if (t !== null)
        for (var e = 0; e < t.length; e++) {
          var u = t[e];
          _l = u, ir(
            u,
            l
          );
        }
      nr(l);
    }
    if (l.subtreeFlags & 10256)
      for (l = l.child; l !== null; )
        cr(l), l = l.sibling;
  }
  function cr(l) {
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        ca(l), l.flags & 2048 && le(9, l, l.return);
        break;
      case 3:
        ca(l);
        break;
      case 12:
        ca(l);
        break;
      case 22:
        var t = l.stateNode;
        l.memoizedState !== null && t._visibility & 2 && (l.return === null || l.return.tag !== 13) ? (t._visibility &= -3, mn(l)) : ca(l);
        break;
      default:
        ca(l);
    }
  }
  function mn(l) {
    var t = l.deletions;
    if ((l.flags & 16) !== 0) {
      if (t !== null)
        for (var e = 0; e < t.length; e++) {
          var u = t[e];
          _l = u, ir(
            u,
            l
          );
        }
      nr(l);
    }
    for (l = l.child; l !== null; ) {
      switch (t = l, t.tag) {
        case 0:
        case 11:
        case 15:
          le(8, t, t.return), mn(t);
          break;
        case 22:
          e = t.stateNode, e._visibility & 2 && (e._visibility &= -3, mn(t));
          break;
        default:
          mn(t);
      }
      l = l.sibling;
    }
  }
  function ir(l, t) {
    for (; _l !== null; ) {
      var e = _l;
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          le(8, e, t);
          break;
        case 23:
        case 22:
          if (e.memoizedState !== null && e.memoizedState.cachePool !== null) {
            var u = e.memoizedState.cachePool.pool;
            u != null && u.refCount++;
          }
          break;
        case 24:
          Zu(e.memoizedState.cache);
      }
      if (u = e.child, u !== null) u.return = e, _l = u;
      else
        l: for (e = l; _l !== null; ) {
          u = _l;
          var a = u.sibling, n = u.return;
          if (Io(u), u === e) {
            _l = null;
            break l;
          }
          if (a !== null) {
            a.return = n, _l = a;
            break l;
          }
          _l = n;
        }
    }
  }
  var o0 = {
    getCacheForType: function(l) {
      var t = Yl(Al), e = t.data.get(l);
      return e === void 0 && (e = l(), t.data.set(l, e)), e;
    }
  }, r0 = typeof WeakMap == "function" ? WeakMap : Map, ul = 0, ol = null, k = null, F = 0, al = 0, ut = null, ue = !1, su = !1, Ti = !1, Qt = 0, ml = 0, ae = 0, xe = 0, pi = 0, ht = 0, ou = 0, ia = null, $l = null, Ei = !1, Ai = 0, gn = 1 / 0, Sn = null, ne = null, Nl = 0, ce = null, ru = null, du = 0, Di = 0, Ri = null, fr = null, fa = 0, Oi = null;
  function at() {
    if ((ul & 2) !== 0 && F !== 0)
      return F & -F;
    if (A.T !== null) {
      var l = Pe;
      return l !== 0 ? l : Hi();
    }
    return Af();
  }
  function sr() {
    ht === 0 && (ht = (F & 536870912) === 0 || el ? bf() : 536870912);
    var l = dt.current;
    return l !== null && (l.flags |= 32), ht;
  }
  function nt(l, t, e) {
    (l === ol && (al === 2 || al === 9) || l.cancelPendingCommit !== null) && (hu(l, 0), ie(
      l,
      F,
      ht,
      !1
    )), Ou(l, e), ((ul & 2) === 0 || l !== ol) && (l === ol && ((ul & 2) === 0 && (xe |= e), ml === 4 && ie(
      l,
      F,
      ht,
      !1
    )), Rt(l));
  }
  function or(l, t, e) {
    if ((ul & 6) !== 0) throw Error(s(327));
    var u = !e && (t & 124) === 0 && (t & l.expiredLanes) === 0 || Ru(l, t), a = u ? v0(l, t) : zi(l, t, !0), n = u;
    do {
      if (a === 0) {
        su && !u && ie(l, t, 0, !1);
        break;
      } else {
        if (e = l.current.alternate, n && !d0(e)) {
          a = zi(l, t, !1), n = !1;
          continue;
        }
        if (a === 2) {
          if (n = t, l.errorRecoveryDisabledLanes & n)
            var c = 0;
          else
            c = l.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            l: {
              var i = l;
              a = ia;
              var o = i.current.memoizedState.isDehydrated;
              if (o && (hu(i, c).flags |= 256), c = zi(
                i,
                c,
                !1
              ), c !== 2) {
                if (Ti && !o) {
                  i.errorRecoveryDisabledLanes |= n, xe |= n, a = 4;
                  break l;
                }
                n = $l, $l = a, n !== null && ($l === null ? $l = n : $l.push.apply(
                  $l,
                  n
                ));
              }
              a = c;
            }
            if (n = !1, a !== 2) continue;
          }
        }
        if (a === 1) {
          hu(l, 0), ie(l, t, 0, !0);
          break;
        }
        l: {
          switch (u = l, n = a, n) {
            case 0:
            case 1:
              throw Error(s(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              ie(
                u,
                t,
                ht,
                !ue
              );
              break l;
            case 2:
              $l = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(s(329));
          }
          if ((t & 62914560) === t && (a = Ai + 300 - Tt(), 10 < a)) {
            if (ie(
              u,
              t,
              ht,
              !ue
            ), Ma(u, 0, !0) !== 0) break l;
            u.timeoutHandle = Gr(
              rr.bind(
                null,
                u,
                e,
                $l,
                Sn,
                Ei,
                t,
                ht,
                xe,
                ou,
                ue,
                n,
                2,
                -0,
                0
              ),
              a
            );
            break l;
          }
          rr(
            u,
            e,
            $l,
            Sn,
            Ei,
            t,
            ht,
            xe,
            ou,
            ue,
            n,
            0,
            -0,
            0
          );
        }
      }
      break;
    } while (!0);
    Rt(l);
  }
  function rr(l, t, e, u, a, n, c, i, o, g, p, R, S, b) {
    if (l.timeoutHandle = -1, R = t.subtreeFlags, (R & 8192 || (R & 16785408) === 16785408) && (ya = { stylesheets: null, count: 0, unsuspend: w0 }, ar(t), R = k0(), R !== null)) {
      l.cancelPendingCommit = R(
        Sr.bind(
          null,
          l,
          t,
          n,
          e,
          u,
          a,
          c,
          i,
          o,
          p,
          1,
          S,
          b
        )
      ), ie(l, n, c, !g);
      return;
    }
    Sr(
      l,
      t,
      n,
      e,
      u,
      a,
      c,
      i,
      o
    );
  }
  function d0(l) {
    for (var t = l; ; ) {
      var e = t.tag;
      if ((e === 0 || e === 11 || e === 15) && t.flags & 16384 && (e = t.updateQueue, e !== null && (e = e.stores, e !== null)))
        for (var u = 0; u < e.length; u++) {
          var a = e[u], n = a.getSnapshot;
          a = a.value;
          try {
            if (!Pl(n(), a)) return !1;
          } catch {
            return !1;
          }
        }
      if (e = t.child, t.subtreeFlags & 16384 && e !== null)
        e.return = t, t = e;
      else {
        if (t === l) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === l) return !0;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    }
    return !0;
  }
  function ie(l, t, e, u) {
    t &= ~pi, t &= ~xe, l.suspendedLanes |= t, l.pingedLanes &= ~t, u && (l.warmLanes |= t), u = l.expirationTimes;
    for (var a = t; 0 < a; ) {
      var n = 31 - Il(a), c = 1 << n;
      u[n] = -1, a &= ~c;
    }
    e !== 0 && pf(l, e, t);
  }
  function bn() {
    return (ul & 6) === 0 ? (sa(0), !1) : !0;
  }
  function _i() {
    if (k !== null) {
      if (al === 0)
        var l = k.return;
      else
        l = k, Ht = Oe = null, Lc(l), nu = null, Pu = 0, l = k;
      for (; l !== null; )
        Lo(l.alternate, l), l = l.return;
      k = null;
    }
  }
  function hu(l, t) {
    var e = l.timeoutHandle;
    e !== -1 && (l.timeoutHandle = -1, U0(e)), e = l.cancelPendingCommit, e !== null && (l.cancelPendingCommit = null, e()), _i(), ol = l, k = e = Ut(l.current, null), F = t, al = 0, ut = null, ue = !1, su = Ru(l, t), Ti = !1, ou = ht = pi = xe = ae = ml = 0, $l = ia = null, Ei = !1, (t & 8) !== 0 && (t |= t & 32);
    var u = l.entangledLanes;
    if (u !== 0)
      for (l = l.entanglements, u &= t; 0 < u; ) {
        var a = 31 - Il(u), n = 1 << a;
        t |= l[a], u &= ~n;
      }
    return Qt = t, Xa(), e;
  }
  function dr(l, t) {
    K = null, A.H = nn, t === Lu || t === ka ? (t = Ms(), al = 3) : t === Rs ? (t = Ms(), al = 4) : al = t === Uo ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, ut = t, k === null && (ml = 1, rn(
      l,
      ft(t, l.current)
    ));
  }
  function hr() {
    var l = A.H;
    return A.H = nn, l === null ? nn : l;
  }
  function vr() {
    var l = A.A;
    return A.A = o0, l;
  }
  function Mi() {
    ml = 4, ue || (F & 4194048) !== F && dt.current !== null || (su = !0), (ae & 134217727) === 0 && (xe & 134217727) === 0 || ol === null || ie(
      ol,
      F,
      ht,
      !1
    );
  }
  function zi(l, t, e) {
    var u = ul;
    ul |= 2;
    var a = hr(), n = vr();
    (ol !== l || F !== t) && (Sn = null, hu(l, t)), t = !1;
    var c = ml;
    l: do
      try {
        if (al !== 0 && k !== null) {
          var i = k, o = ut;
          switch (al) {
            case 8:
              _i(), c = 6;
              break l;
            case 3:
            case 2:
            case 9:
            case 6:
              dt.current === null && (t = !0);
              var g = al;
              if (al = 0, ut = null, vu(l, i, o, g), e && su) {
                c = 0;
                break l;
              }
              break;
            default:
              g = al, al = 0, ut = null, vu(l, i, o, g);
          }
        }
        h0(), c = ml;
        break;
      } catch (p) {
        dr(l, p);
      }
    while (!0);
    return t && l.shellSuspendCounter++, Ht = Oe = null, ul = u, A.H = a, A.A = n, k === null && (ol = null, F = 0, Xa()), c;
  }
  function h0() {
    for (; k !== null; ) yr(k);
  }
  function v0(l, t) {
    var e = ul;
    ul |= 2;
    var u = hr(), a = vr();
    ol !== l || F !== t ? (Sn = null, gn = Tt() + 500, hu(l, t)) : su = Ru(
      l,
      t
    );
    l: do
      try {
        if (al !== 0 && k !== null) {
          t = k;
          var n = ut;
          t: switch (al) {
            case 1:
              al = 0, ut = null, vu(l, t, n, 1);
              break;
            case 2:
            case 9:
              if (Os(n)) {
                al = 0, ut = null, mr(t);
                break;
              }
              t = function() {
                al !== 2 && al !== 9 || ol !== l || (al = 7), Rt(l);
              }, n.then(t, t);
              break l;
            case 3:
              al = 7;
              break l;
            case 4:
              al = 5;
              break l;
            case 7:
              Os(n) ? (al = 0, ut = null, mr(t)) : (al = 0, ut = null, vu(l, t, n, 7));
              break;
            case 5:
              var c = null;
              switch (k.tag) {
                case 26:
                  c = k.memoizedState;
                case 5:
                case 27:
                  var i = k;
                  if (!c || Fr(c)) {
                    al = 0, ut = null;
                    var o = i.sibling;
                    if (o !== null) k = o;
                    else {
                      var g = i.return;
                      g !== null ? (k = g, Tn(g)) : k = null;
                    }
                    break t;
                  }
              }
              al = 0, ut = null, vu(l, t, n, 5);
              break;
            case 6:
              al = 0, ut = null, vu(l, t, n, 6);
              break;
            case 8:
              _i(), ml = 6;
              break l;
            default:
              throw Error(s(462));
          }
        }
        y0();
        break;
      } catch (p) {
        dr(l, p);
      }
    while (!0);
    return Ht = Oe = null, A.H = u, A.A = a, ul = e, k !== null ? 0 : (ol = null, F = 0, Xa(), ml);
  }
  function y0() {
    for (; k !== null && !qd(); )
      yr(k);
  }
  function yr(l) {
    var t = Zo(l.alternate, l, Qt);
    l.memoizedProps = l.pendingProps, t === null ? Tn(l) : k = t;
  }
  function mr(l) {
    var t = l, e = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = Bo(
          e,
          t,
          t.pendingProps,
          t.type,
          void 0,
          F
        );
        break;
      case 11:
        t = Bo(
          e,
          t,
          t.pendingProps,
          t.type.render,
          t.ref,
          F
        );
        break;
      case 5:
        Lc(t);
      default:
        Lo(e, t), t = k = ms(t, Qt), t = Zo(e, t, Qt);
    }
    l.memoizedProps = l.pendingProps, t === null ? Tn(l) : k = t;
  }
  function vu(l, t, e, u) {
    Ht = Oe = null, Lc(t), nu = null, Pu = 0;
    var a = t.return;
    try {
      if (a0(
        l,
        a,
        t,
        e,
        F
      )) {
        ml = 1, rn(
          l,
          ft(e, l.current)
        ), k = null;
        return;
      }
    } catch (n) {
      if (a !== null) throw k = a, n;
      ml = 1, rn(
        l,
        ft(e, l.current)
      ), k = null;
      return;
    }
    t.flags & 32768 ? (el || u === 1 ? l = !0 : su || (F & 536870912) !== 0 ? l = !1 : (ue = l = !0, (u === 2 || u === 9 || u === 3 || u === 6) && (u = dt.current, u !== null && u.tag === 13 && (u.flags |= 16384))), gr(t, l)) : Tn(t);
  }
  function Tn(l) {
    var t = l;
    do {
      if ((t.flags & 32768) !== 0) {
        gr(
          t,
          ue
        );
        return;
      }
      l = t.return;
      var e = c0(
        t.alternate,
        t,
        Qt
      );
      if (e !== null) {
        k = e;
        return;
      }
      if (t = t.sibling, t !== null) {
        k = t;
        return;
      }
      k = t = l;
    } while (t !== null);
    ml === 0 && (ml = 5);
  }
  function gr(l, t) {
    do {
      var e = i0(l.alternate, l);
      if (e !== null) {
        e.flags &= 32767, k = e;
        return;
      }
      if (e = l.return, e !== null && (e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null), !t && (l = l.sibling, l !== null)) {
        k = l;
        return;
      }
      k = l = e;
    } while (l !== null);
    ml = 6, k = null;
  }
  function Sr(l, t, e, u, a, n, c, i, o) {
    l.cancelPendingCommit = null;
    do
      pn();
    while (Nl !== 0);
    if ((ul & 6) !== 0) throw Error(s(327));
    if (t !== null) {
      if (t === l.current) throw Error(s(177));
      if (n = t.lanes | t.childLanes, n |= bc, wd(
        l,
        e,
        n,
        c,
        i,
        o
      ), l === ol && (k = ol = null, F = 0), ru = t, ce = l, du = e, Di = n, Ri = a, fr = u, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (l.callbackNode = null, l.callbackPriority = 0, b0(Ra, function() {
        return Ar(), null;
      })) : (l.callbackNode = null, l.callbackPriority = 0), u = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || u) {
        u = A.T, A.T = null, a = N.p, N.p = 2, c = ul, ul |= 4;
        try {
          f0(l, t, e);
        } finally {
          ul = c, N.p = a, A.T = u;
        }
      }
      Nl = 1, br(), Tr(), pr();
    }
  }
  function br() {
    if (Nl === 1) {
      Nl = 0;
      var l = ce, t = ru, e = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || e) {
        e = A.T, A.T = null;
        var u = N.p;
        N.p = 2;
        var a = ul;
        ul |= 4;
        try {
          tr(t, l);
          var n = Qi, c = cs(l.containerInfo), i = n.focusedElem, o = n.selectionRange;
          if (c !== i && i && i.ownerDocument && ns(
            i.ownerDocument.documentElement,
            i
          )) {
            if (o !== null && vc(i)) {
              var g = o.start, p = o.end;
              if (p === void 0 && (p = g), "selectionStart" in i)
                i.selectionStart = g, i.selectionEnd = Math.min(
                  p,
                  i.value.length
                );
              else {
                var R = i.ownerDocument || document, S = R && R.defaultView || window;
                if (S.getSelection) {
                  var b = S.getSelection(), Z = i.textContent.length, G = Math.min(o.start, Z), il = o.end === void 0 ? G : Math.min(o.end, Z);
                  !b.extend && G > il && (c = il, il = G, G = c);
                  var v = as(
                    i,
                    G
                  ), h = as(
                    i,
                    il
                  );
                  if (v && h && (b.rangeCount !== 1 || b.anchorNode !== v.node || b.anchorOffset !== v.offset || b.focusNode !== h.node || b.focusOffset !== h.offset)) {
                    var m = R.createRange();
                    m.setStart(v.node, v.offset), b.removeAllRanges(), G > il ? (b.addRange(m), b.extend(h.node, h.offset)) : (m.setEnd(h.node, h.offset), b.addRange(m));
                  }
                }
              }
            }
            for (R = [], b = i; b = b.parentNode; )
              b.nodeType === 1 && R.push({
                element: b,
                left: b.scrollLeft,
                top: b.scrollTop
              });
            for (typeof i.focus == "function" && i.focus(), i = 0; i < R.length; i++) {
              var D = R[i];
              D.element.scrollLeft = D.left, D.element.scrollTop = D.top;
            }
          }
          Hn = !!Xi, Qi = Xi = null;
        } finally {
          ul = a, N.p = u, A.T = e;
        }
      }
      l.current = t, Nl = 2;
    }
  }
  function Tr() {
    if (Nl === 2) {
      Nl = 0;
      var l = ce, t = ru, e = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || e) {
        e = A.T, A.T = null;
        var u = N.p;
        N.p = 2;
        var a = ul;
        ul |= 4;
        try {
          Fo(l, t.alternate, t);
        } finally {
          ul = a, N.p = u, A.T = e;
        }
      }
      Nl = 3;
    }
  }
  function pr() {
    if (Nl === 4 || Nl === 3) {
      Nl = 0, Yd();
      var l = ce, t = ru, e = du, u = fr;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? Nl = 5 : (Nl = 0, ru = ce = null, Er(l, l.pendingLanes));
      var a = l.pendingLanes;
      if (a === 0 && (ne = null), wn(e), t = t.stateNode, Fl && typeof Fl.onCommitFiberRoot == "function")
        try {
          Fl.onCommitFiberRoot(
            Du,
            t,
            void 0,
            (t.current.flags & 128) === 128
          );
        } catch {
        }
      if (u !== null) {
        t = A.T, a = N.p, N.p = 2, A.T = null;
        try {
          for (var n = l.onRecoverableError, c = 0; c < u.length; c++) {
            var i = u[c];
            n(i.value, {
              componentStack: i.stack
            });
          }
        } finally {
          A.T = t, N.p = a;
        }
      }
      (du & 3) !== 0 && pn(), Rt(l), a = l.pendingLanes, (e & 4194090) !== 0 && (a & 42) !== 0 ? l === Oi ? fa++ : (fa = 0, Oi = l) : fa = 0, sa(0);
    }
  }
  function Er(l, t) {
    (l.pooledCacheLanes &= t) === 0 && (t = l.pooledCache, t != null && (l.pooledCache = null, Zu(t)));
  }
  function pn(l) {
    return br(), Tr(), pr(), Ar();
  }
  function Ar() {
    if (Nl !== 5) return !1;
    var l = ce, t = Di;
    Di = 0;
    var e = wn(du), u = A.T, a = N.p;
    try {
      N.p = 32 > e ? 32 : e, A.T = null, e = Ri, Ri = null;
      var n = ce, c = du;
      if (Nl = 0, ru = ce = null, du = 0, (ul & 6) !== 0) throw Error(s(331));
      var i = ul;
      if (ul |= 4, cr(n.current), ur(
        n,
        n.current,
        c,
        e
      ), ul = i, sa(0, !1), Fl && typeof Fl.onPostCommitFiberRoot == "function")
        try {
          Fl.onPostCommitFiberRoot(Du, n);
        } catch {
        }
      return !0;
    } finally {
      N.p = a, A.T = u, Er(l, t);
    }
  }
  function Dr(l, t, e) {
    t = ft(e, t), t = ai(l.stateNode, t, 2), l = Wt(l, t, 2), l !== null && (Ou(l, 2), Rt(l));
  }
  function sl(l, t, e) {
    if (l.tag === 3)
      Dr(l, l, e);
    else
      for (; t !== null; ) {
        if (t.tag === 3) {
          Dr(
            t,
            l,
            e
          );
          break;
        } else if (t.tag === 1) {
          var u = t.stateNode;
          if (typeof t.type.getDerivedStateFromError == "function" || typeof u.componentDidCatch == "function" && (ne === null || !ne.has(u))) {
            l = ft(e, l), e = Mo(2), u = Wt(t, e, 2), u !== null && (zo(
              e,
              u,
              t,
              l
            ), Ou(u, 2), Rt(u));
            break;
          }
        }
        t = t.return;
      }
  }
  function Ui(l, t, e) {
    var u = l.pingCache;
    if (u === null) {
      u = l.pingCache = new r0();
      var a = /* @__PURE__ */ new Set();
      u.set(t, a);
    } else
      a = u.get(t), a === void 0 && (a = /* @__PURE__ */ new Set(), u.set(t, a));
    a.has(e) || (Ti = !0, a.add(e), l = m0.bind(null, l, t, e), t.then(l, l));
  }
  function m0(l, t, e) {
    var u = l.pingCache;
    u !== null && u.delete(t), l.pingedLanes |= l.suspendedLanes & e, l.warmLanes &= ~e, ol === l && (F & e) === e && (ml === 4 || ml === 3 && (F & 62914560) === F && 300 > Tt() - Ai ? (ul & 2) === 0 && hu(l, 0) : pi |= e, ou === F && (ou = 0)), Rt(l);
  }
  function Rr(l, t) {
    t === 0 && (t = Tf()), l = ke(l, t), l !== null && (Ou(l, t), Rt(l));
  }
  function g0(l) {
    var t = l.memoizedState, e = 0;
    t !== null && (e = t.retryLane), Rr(l, e);
  }
  function S0(l, t) {
    var e = 0;
    switch (l.tag) {
      case 13:
        var u = l.stateNode, a = l.memoizedState;
        a !== null && (e = a.retryLane);
        break;
      case 19:
        u = l.stateNode;
        break;
      case 22:
        u = l.stateNode._retryCache;
        break;
      default:
        throw Error(s(314));
    }
    u !== null && u.delete(t), Rr(l, e);
  }
  function b0(l, t) {
    return Vn(l, t);
  }
  var En = null, yu = null, Ni = !1, An = !1, xi = !1, He = 0;
  function Rt(l) {
    l !== yu && l.next === null && (yu === null ? En = yu = l : yu = yu.next = l), An = !0, Ni || (Ni = !0, p0());
  }
  function sa(l, t) {
    if (!xi && An) {
      xi = !0;
      do
        for (var e = !1, u = En; u !== null; ) {
          if (l !== 0) {
            var a = u.pendingLanes;
            if (a === 0) var n = 0;
            else {
              var c = u.suspendedLanes, i = u.pingedLanes;
              n = (1 << 31 - Il(42 | l) + 1) - 1, n &= a & ~(c & ~i), n = n & 201326741 ? n & 201326741 | 1 : n ? n | 2 : 0;
            }
            n !== 0 && (e = !0, zr(u, n));
          } else
            n = F, n = Ma(
              u,
              u === ol ? n : 0,
              u.cancelPendingCommit !== null || u.timeoutHandle !== -1
            ), (n & 3) === 0 || Ru(u, n) || (e = !0, zr(u, n));
          u = u.next;
        }
      while (e);
      xi = !1;
    }
  }
  function T0() {
    Or();
  }
  function Or() {
    An = Ni = !1;
    var l = 0;
    He !== 0 && (z0() && (l = He), He = 0);
    for (var t = Tt(), e = null, u = En; u !== null; ) {
      var a = u.next, n = _r(u, t);
      n === 0 ? (u.next = null, e === null ? En = a : e.next = a, a === null && (yu = e)) : (e = u, (l !== 0 || (n & 3) !== 0) && (An = !0)), u = a;
    }
    sa(l);
  }
  function _r(l, t) {
    for (var e = l.suspendedLanes, u = l.pingedLanes, a = l.expirationTimes, n = l.pendingLanes & -62914561; 0 < n; ) {
      var c = 31 - Il(n), i = 1 << c, o = a[c];
      o === -1 ? ((i & e) === 0 || (i & u) !== 0) && (a[c] = Jd(i, t)) : o <= t && (l.expiredLanes |= i), n &= ~i;
    }
    if (t = ol, e = F, e = Ma(
      l,
      l === t ? e : 0,
      l.cancelPendingCommit !== null || l.timeoutHandle !== -1
    ), u = l.callbackNode, e === 0 || l === t && (al === 2 || al === 9) || l.cancelPendingCommit !== null)
      return u !== null && u !== null && Ln(u), l.callbackNode = null, l.callbackPriority = 0;
    if ((e & 3) === 0 || Ru(l, e)) {
      if (t = e & -e, t === l.callbackPriority) return t;
      switch (u !== null && Ln(u), wn(e)) {
        case 2:
        case 8:
          e = gf;
          break;
        case 32:
          e = Ra;
          break;
        case 268435456:
          e = Sf;
          break;
        default:
          e = Ra;
      }
      return u = Mr.bind(null, l), e = Vn(e, u), l.callbackPriority = t, l.callbackNode = e, t;
    }
    return u !== null && u !== null && Ln(u), l.callbackPriority = 2, l.callbackNode = null, 2;
  }
  function Mr(l, t) {
    if (Nl !== 0 && Nl !== 5)
      return l.callbackNode = null, l.callbackPriority = 0, null;
    var e = l.callbackNode;
    if (pn() && l.callbackNode !== e)
      return null;
    var u = F;
    return u = Ma(
      l,
      l === ol ? u : 0,
      l.cancelPendingCommit !== null || l.timeoutHandle !== -1
    ), u === 0 ? null : (or(l, u, t), _r(l, Tt()), l.callbackNode != null && l.callbackNode === e ? Mr.bind(null, l) : null);
  }
  function zr(l, t) {
    if (pn()) return null;
    or(l, t, !0);
  }
  function p0() {
    N0(function() {
      (ul & 6) !== 0 ? Vn(
        mf,
        T0
      ) : Or();
    });
  }
  function Hi() {
    return He === 0 && (He = bf()), He;
  }
  function Ur(l) {
    return l == null || typeof l == "symbol" || typeof l == "boolean" ? null : typeof l == "function" ? l : Ha("" + l);
  }
  function Nr(l, t) {
    var e = t.ownerDocument.createElement("input");
    return e.name = t.name, e.value = t.value, l.id && e.setAttribute("form", l.id), t.parentNode.insertBefore(e, t), l = new FormData(l), e.parentNode.removeChild(e), l;
  }
  function E0(l, t, e, u, a) {
    if (t === "submit" && e && e.stateNode === a) {
      var n = Ur(
        (a[Ll] || null).action
      ), c = u.submitter;
      c && (t = (t = c[Ll] || null) ? Ur(t.formAction) : c.getAttribute("formAction"), t !== null && (n = t, c = null));
      var i = new qa(
        "action",
        "action",
        null,
        u,
        a
      );
      l.push({
        event: i,
        listeners: [
          {
            instance: null,
            listener: function() {
              if (u.defaultPrevented) {
                if (He !== 0) {
                  var o = c ? Nr(a, c) : new FormData(a);
                  Pc(
                    e,
                    {
                      pending: !0,
                      data: o,
                      method: a.method,
                      action: n
                    },
                    null,
                    o
                  );
                }
              } else
                typeof n == "function" && (i.preventDefault(), o = c ? Nr(a, c) : new FormData(a), Pc(
                  e,
                  {
                    pending: !0,
                    data: o,
                    method: a.method,
                    action: n
                  },
                  n,
                  o
                ));
            },
            currentTarget: a
          }
        ]
      });
    }
  }
  for (var Ci = 0; Ci < Sc.length; Ci++) {
    var ji = Sc[Ci], A0 = ji.toLowerCase(), D0 = ji[0].toUpperCase() + ji.slice(1);
    yt(
      A0,
      "on" + D0
    );
  }
  yt(ss, "onAnimationEnd"), yt(os, "onAnimationIteration"), yt(rs, "onAnimationStart"), yt("dblclick", "onDoubleClick"), yt("focusin", "onFocus"), yt("focusout", "onBlur"), yt(Qh, "onTransitionRun"), yt(Zh, "onTransitionStart"), yt(Vh, "onTransitionCancel"), yt(ds, "onTransitionEnd"), Ge("onMouseEnter", ["mouseout", "mouseover"]), Ge("onMouseLeave", ["mouseout", "mouseover"]), Ge("onPointerEnter", ["pointerout", "pointerover"]), Ge("onPointerLeave", ["pointerout", "pointerover"]), ge(
    "onChange",
    "change click focusin focusout input keydown keyup selectionchange".split(" ")
  ), ge(
    "onSelect",
    "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
      " "
    )
  ), ge("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), ge(
    "onCompositionEnd",
    "compositionend focusout keydown keypress keyup mousedown".split(" ")
  ), ge(
    "onCompositionStart",
    "compositionstart focusout keydown keypress keyup mousedown".split(" ")
  ), ge(
    "onCompositionUpdate",
    "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
  );
  var oa = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
    " "
  ), R0 = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(oa)
  );
  function xr(l, t) {
    t = (t & 4) !== 0;
    for (var e = 0; e < l.length; e++) {
      var u = l[e], a = u.event;
      u = u.listeners;
      l: {
        var n = void 0;
        if (t)
          for (var c = u.length - 1; 0 <= c; c--) {
            var i = u[c], o = i.instance, g = i.currentTarget;
            if (i = i.listener, o !== n && a.isPropagationStopped())
              break l;
            n = i, a.currentTarget = g;
            try {
              n(a);
            } catch (p) {
              on(p);
            }
            a.currentTarget = null, n = o;
          }
        else
          for (c = 0; c < u.length; c++) {
            if (i = u[c], o = i.instance, g = i.currentTarget, i = i.listener, o !== n && a.isPropagationStopped())
              break l;
            n = i, a.currentTarget = g;
            try {
              n(a);
            } catch (p) {
              on(p);
            }
            a.currentTarget = null, n = o;
          }
      }
    }
  }
  function W(l, t) {
    var e = t[$n];
    e === void 0 && (e = t[$n] = /* @__PURE__ */ new Set());
    var u = l + "__bubble";
    e.has(u) || (Hr(t, l, 2, !1), e.add(u));
  }
  function Bi(l, t, e) {
    var u = 0;
    t && (u |= 4), Hr(
      e,
      l,
      u,
      t
    );
  }
  var Dn = "_reactListening" + Math.random().toString(36).slice(2);
  function qi(l) {
    if (!l[Dn]) {
      l[Dn] = !0, Rf.forEach(function(e) {
        e !== "selectionchange" && (R0.has(e) || Bi(e, !1, l), Bi(e, !0, l));
      });
      var t = l.nodeType === 9 ? l : l.ownerDocument;
      t === null || t[Dn] || (t[Dn] = !0, Bi("selectionchange", !1, t));
    }
  }
  function Hr(l, t, e, u) {
    switch (ud(t)) {
      case 2:
        var a = I0;
        break;
      case 8:
        a = P0;
        break;
      default:
        a = Fi;
    }
    e = a.bind(
      null,
      t,
      e,
      l
    ), a = void 0, !nc || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (a = !0), u ? a !== void 0 ? l.addEventListener(t, e, {
      capture: !0,
      passive: a
    }) : l.addEventListener(t, e, !0) : a !== void 0 ? l.addEventListener(t, e, {
      passive: a
    }) : l.addEventListener(t, e, !1);
  }
  function Yi(l, t, e, u, a) {
    var n = u;
    if ((t & 1) === 0 && (t & 2) === 0 && u !== null)
      l: for (; ; ) {
        if (u === null) return;
        var c = u.tag;
        if (c === 3 || c === 4) {
          var i = u.stateNode.containerInfo;
          if (i === a) break;
          if (c === 4)
            for (c = u.return; c !== null; ) {
              var o = c.tag;
              if ((o === 3 || o === 4) && c.stateNode.containerInfo === a)
                return;
              c = c.return;
            }
          for (; i !== null; ) {
            if (c = Be(i), c === null) return;
            if (o = c.tag, o === 5 || o === 6 || o === 26 || o === 27) {
              u = n = c;
              continue l;
            }
            i = i.parentNode;
          }
        }
        u = u.return;
      }
    Gf(function() {
      var g = n, p = uc(e), R = [];
      l: {
        var S = hs.get(l);
        if (S !== void 0) {
          var b = qa, Z = l;
          switch (l) {
            case "keypress":
              if (ja(e) === 0) break l;
            case "keydown":
            case "keyup":
              b = bh;
              break;
            case "focusin":
              Z = "focus", b = sc;
              break;
            case "focusout":
              Z = "blur", b = sc;
              break;
            case "beforeblur":
            case "afterblur":
              b = sc;
              break;
            case "click":
              if (e.button === 2) break l;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              b = Zf;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              b = ih;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              b = Eh;
              break;
            case ss:
            case os:
            case rs:
              b = oh;
              break;
            case ds:
              b = Dh;
              break;
            case "scroll":
            case "scrollend":
              b = nh;
              break;
            case "wheel":
              b = Oh;
              break;
            case "copy":
            case "cut":
            case "paste":
              b = dh;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              b = Lf;
              break;
            case "toggle":
            case "beforetoggle":
              b = Mh;
          }
          var G = (t & 4) !== 0, il = !G && (l === "scroll" || l === "scrollend"), v = G ? S !== null ? S + "Capture" : null : S;
          G = [];
          for (var h = g, m; h !== null; ) {
            var D = h;
            if (m = D.stateNode, D = D.tag, D !== 5 && D !== 26 && D !== 27 || m === null || v === null || (D = zu(h, v), D != null && G.push(
              ra(h, D, m)
            )), il) break;
            h = h.return;
          }
          0 < G.length && (S = new b(
            S,
            Z,
            null,
            e,
            p
          ), R.push({ event: S, listeners: G }));
        }
      }
      if ((t & 7) === 0) {
        l: {
          if (S = l === "mouseover" || l === "pointerover", b = l === "mouseout" || l === "pointerout", S && e !== ec && (Z = e.relatedTarget || e.fromElement) && (Be(Z) || Z[je]))
            break l;
          if ((b || S) && (S = p.window === p ? p : (S = p.ownerDocument) ? S.defaultView || S.parentWindow : window, b ? (Z = e.relatedTarget || e.toElement, b = g, Z = Z ? Be(Z) : null, Z !== null && (il = z(Z), G = Z.tag, Z !== il || G !== 5 && G !== 27 && G !== 6) && (Z = null)) : (b = null, Z = g), b !== Z)) {
            if (G = Zf, D = "onMouseLeave", v = "onMouseEnter", h = "mouse", (l === "pointerout" || l === "pointerover") && (G = Lf, D = "onPointerLeave", v = "onPointerEnter", h = "pointer"), il = b == null ? S : Mu(b), m = Z == null ? S : Mu(Z), S = new G(
              D,
              h + "leave",
              b,
              e,
              p
            ), S.target = il, S.relatedTarget = m, D = null, Be(p) === g && (G = new G(
              v,
              h + "enter",
              Z,
              e,
              p
            ), G.target = m, G.relatedTarget = il, D = G), il = D, b && Z)
              t: {
                for (G = b, v = Z, h = 0, m = G; m; m = mu(m))
                  h++;
                for (m = 0, D = v; D; D = mu(D))
                  m++;
                for (; 0 < h - m; )
                  G = mu(G), h--;
                for (; 0 < m - h; )
                  v = mu(v), m--;
                for (; h--; ) {
                  if (G === v || v !== null && G === v.alternate)
                    break t;
                  G = mu(G), v = mu(v);
                }
                G = null;
              }
            else G = null;
            b !== null && Cr(
              R,
              S,
              b,
              G,
              !1
            ), Z !== null && il !== null && Cr(
              R,
              il,
              Z,
              G,
              !0
            );
          }
        }
        l: {
          if (S = g ? Mu(g) : window, b = S.nodeName && S.nodeName.toLowerCase(), b === "select" || b === "input" && S.type === "file")
            var j = If;
          else if (Wf(S))
            if (Pf)
              j = Yh;
            else {
              j = Bh;
              var w = jh;
            }
          else
            b = S.nodeName, !b || b.toLowerCase() !== "input" || S.type !== "checkbox" && S.type !== "radio" ? g && tc(g.elementType) && (j = If) : j = qh;
          if (j && (j = j(l, g))) {
            Ff(
              R,
              j,
              e,
              p
            );
            break l;
          }
          w && w(l, S, g), l === "focusout" && g && S.type === "number" && g.memoizedProps.value != null && lc(S, "number", S.value);
        }
        switch (w = g ? Mu(g) : window, l) {
          case "focusin":
            (Wf(w) || w.contentEditable === "true") && (Je = w, yc = g, qu = null);
            break;
          case "focusout":
            qu = yc = Je = null;
            break;
          case "mousedown":
            mc = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            mc = !1, is(R, e, p);
            break;
          case "selectionchange":
            if (Xh) break;
          case "keydown":
          case "keyup":
            is(R, e, p);
        }
        var B;
        if (rc)
          l: {
            switch (l) {
              case "compositionstart":
                var X = "onCompositionStart";
                break l;
              case "compositionend":
                X = "onCompositionEnd";
                break l;
              case "compositionupdate":
                X = "onCompositionUpdate";
                break l;
            }
            X = void 0;
          }
        else
          Ke ? $f(l, e) && (X = "onCompositionEnd") : l === "keydown" && e.keyCode === 229 && (X = "onCompositionStart");
        X && (Kf && e.locale !== "ko" && (Ke || X !== "onCompositionStart" ? X === "onCompositionEnd" && Ke && (B = Xf()) : (Jt = p, cc = "value" in Jt ? Jt.value : Jt.textContent, Ke = !0)), w = Rn(g, X), 0 < w.length && (X = new Vf(
          X,
          l,
          null,
          e,
          p
        ), R.push({ event: X, listeners: w }), B ? X.data = B : (B = kf(e), B !== null && (X.data = B)))), (B = Uh ? Nh(l, e) : xh(l, e)) && (X = Rn(g, "onBeforeInput"), 0 < X.length && (w = new Vf(
          "onBeforeInput",
          "beforeinput",
          null,
          e,
          p
        ), R.push({
          event: w,
          listeners: X
        }), w.data = B)), E0(
          R,
          l,
          g,
          e,
          p
        );
      }
      xr(R, t);
    });
  }
  function ra(l, t, e) {
    return {
      instance: l,
      listener: t,
      currentTarget: e
    };
  }
  function Rn(l, t) {
    for (var e = t + "Capture", u = []; l !== null; ) {
      var a = l, n = a.stateNode;
      if (a = a.tag, a !== 5 && a !== 26 && a !== 27 || n === null || (a = zu(l, e), a != null && u.unshift(
        ra(l, a, n)
      ), a = zu(l, t), a != null && u.push(
        ra(l, a, n)
      )), l.tag === 3) return u;
      l = l.return;
    }
    return [];
  }
  function mu(l) {
    if (l === null) return null;
    do
      l = l.return;
    while (l && l.tag !== 5 && l.tag !== 27);
    return l || null;
  }
  function Cr(l, t, e, u, a) {
    for (var n = t._reactName, c = []; e !== null && e !== u; ) {
      var i = e, o = i.alternate, g = i.stateNode;
      if (i = i.tag, o !== null && o === u) break;
      i !== 5 && i !== 26 && i !== 27 || g === null || (o = g, a ? (g = zu(e, n), g != null && c.unshift(
        ra(e, g, o)
      )) : a || (g = zu(e, n), g != null && c.push(
        ra(e, g, o)
      ))), e = e.return;
    }
    c.length !== 0 && l.push({ event: t, listeners: c });
  }
  var O0 = /\r\n?/g, _0 = /\u0000|\uFFFD/g;
  function jr(l) {
    return (typeof l == "string" ? l : "" + l).replace(O0, `
`).replace(_0, "");
  }
  function Br(l, t) {
    return t = jr(t), jr(l) === t;
  }
  function On() {
  }
  function cl(l, t, e, u, a, n) {
    switch (e) {
      case "children":
        typeof u == "string" ? t === "body" || t === "textarea" && u === "" || Ze(l, u) : (typeof u == "number" || typeof u == "bigint") && t !== "body" && Ze(l, "" + u);
        break;
      case "className":
        Ua(l, "class", u);
        break;
      case "tabIndex":
        Ua(l, "tabindex", u);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        Ua(l, e, u);
        break;
      case "style":
        qf(l, u, n);
        break;
      case "data":
        if (t !== "object") {
          Ua(l, "data", u);
          break;
        }
      case "src":
      case "href":
        if (u === "" && (t !== "a" || e !== "href")) {
          l.removeAttribute(e);
          break;
        }
        if (u == null || typeof u == "function" || typeof u == "symbol" || typeof u == "boolean") {
          l.removeAttribute(e);
          break;
        }
        u = Ha("" + u), l.setAttribute(e, u);
        break;
      case "action":
      case "formAction":
        if (typeof u == "function") {
          l.setAttribute(
            e,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof n == "function" && (e === "formAction" ? (t !== "input" && cl(l, t, "name", a.name, a, null), cl(
            l,
            t,
            "formEncType",
            a.formEncType,
            a,
            null
          ), cl(
            l,
            t,
            "formMethod",
            a.formMethod,
            a,
            null
          ), cl(
            l,
            t,
            "formTarget",
            a.formTarget,
            a,
            null
          )) : (cl(l, t, "encType", a.encType, a, null), cl(l, t, "method", a.method, a, null), cl(l, t, "target", a.target, a, null)));
        if (u == null || typeof u == "symbol" || typeof u == "boolean") {
          l.removeAttribute(e);
          break;
        }
        u = Ha("" + u), l.setAttribute(e, u);
        break;
      case "onClick":
        u != null && (l.onclick = On);
        break;
      case "onScroll":
        u != null && W("scroll", l);
        break;
      case "onScrollEnd":
        u != null && W("scrollend", l);
        break;
      case "dangerouslySetInnerHTML":
        if (u != null) {
          if (typeof u != "object" || !("__html" in u))
            throw Error(s(61));
          if (e = u.__html, e != null) {
            if (a.children != null) throw Error(s(60));
            l.innerHTML = e;
          }
        }
        break;
      case "multiple":
        l.multiple = u && typeof u != "function" && typeof u != "symbol";
        break;
      case "muted":
        l.muted = u && typeof u != "function" && typeof u != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (u == null || typeof u == "function" || typeof u == "boolean" || typeof u == "symbol") {
          l.removeAttribute("xlink:href");
          break;
        }
        e = Ha("" + u), l.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          e
        );
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        u != null && typeof u != "function" && typeof u != "symbol" ? l.setAttribute(e, "" + u) : l.removeAttribute(e);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        u && typeof u != "function" && typeof u != "symbol" ? l.setAttribute(e, "") : l.removeAttribute(e);
        break;
      case "capture":
      case "download":
        u === !0 ? l.setAttribute(e, "") : u !== !1 && u != null && typeof u != "function" && typeof u != "symbol" ? l.setAttribute(e, u) : l.removeAttribute(e);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        u != null && typeof u != "function" && typeof u != "symbol" && !isNaN(u) && 1 <= u ? l.setAttribute(e, u) : l.removeAttribute(e);
        break;
      case "rowSpan":
      case "start":
        u == null || typeof u == "function" || typeof u == "symbol" || isNaN(u) ? l.removeAttribute(e) : l.setAttribute(e, u);
        break;
      case "popover":
        W("beforetoggle", l), W("toggle", l), za(l, "popover", u);
        break;
      case "xlinkActuate":
        Mt(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:actuate",
          u
        );
        break;
      case "xlinkArcrole":
        Mt(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:arcrole",
          u
        );
        break;
      case "xlinkRole":
        Mt(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:role",
          u
        );
        break;
      case "xlinkShow":
        Mt(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:show",
          u
        );
        break;
      case "xlinkTitle":
        Mt(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:title",
          u
        );
        break;
      case "xlinkType":
        Mt(
          l,
          "http://www.w3.org/1999/xlink",
          "xlink:type",
          u
        );
        break;
      case "xmlBase":
        Mt(
          l,
          "http://www.w3.org/XML/1998/namespace",
          "xml:base",
          u
        );
        break;
      case "xmlLang":
        Mt(
          l,
          "http://www.w3.org/XML/1998/namespace",
          "xml:lang",
          u
        );
        break;
      case "xmlSpace":
        Mt(
          l,
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          u
        );
        break;
      case "is":
        za(l, "is", u);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < e.length) || e[0] !== "o" && e[0] !== "O" || e[1] !== "n" && e[1] !== "N") && (e = uh.get(e) || e, za(l, e, u));
    }
  }
  function Gi(l, t, e, u, a, n) {
    switch (e) {
      case "style":
        qf(l, u, n);
        break;
      case "dangerouslySetInnerHTML":
        if (u != null) {
          if (typeof u != "object" || !("__html" in u))
            throw Error(s(61));
          if (e = u.__html, e != null) {
            if (a.children != null) throw Error(s(60));
            l.innerHTML = e;
          }
        }
        break;
      case "children":
        typeof u == "string" ? Ze(l, u) : (typeof u == "number" || typeof u == "bigint") && Ze(l, "" + u);
        break;
      case "onScroll":
        u != null && W("scroll", l);
        break;
      case "onScrollEnd":
        u != null && W("scrollend", l);
        break;
      case "onClick":
        u != null && (l.onclick = On);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!Of.hasOwnProperty(e))
          l: {
            if (e[0] === "o" && e[1] === "n" && (a = e.endsWith("Capture"), t = e.slice(2, a ? e.length - 7 : void 0), n = l[Ll] || null, n = n != null ? n[e] : null, typeof n == "function" && l.removeEventListener(t, n, a), typeof u == "function")) {
              typeof n != "function" && n !== null && (e in l ? l[e] = null : l.hasAttribute(e) && l.removeAttribute(e)), l.addEventListener(t, u, a);
              break l;
            }
            e in l ? l[e] = u : u === !0 ? l.setAttribute(e, "") : za(l, e, u);
          }
    }
  }
  function xl(l, t, e) {
    switch (t) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        W("error", l), W("load", l);
        var u = !1, a = !1, n;
        for (n in e)
          if (e.hasOwnProperty(n)) {
            var c = e[n];
            if (c != null)
              switch (n) {
                case "src":
                  u = !0;
                  break;
                case "srcSet":
                  a = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(s(137, t));
                default:
                  cl(l, t, n, c, e, null);
              }
          }
        a && cl(l, t, "srcSet", e.srcSet, e, null), u && cl(l, t, "src", e.src, e, null);
        return;
      case "input":
        W("invalid", l);
        var i = n = c = a = null, o = null, g = null;
        for (u in e)
          if (e.hasOwnProperty(u)) {
            var p = e[u];
            if (p != null)
              switch (u) {
                case "name":
                  a = p;
                  break;
                case "type":
                  c = p;
                  break;
                case "checked":
                  o = p;
                  break;
                case "defaultChecked":
                  g = p;
                  break;
                case "value":
                  n = p;
                  break;
                case "defaultValue":
                  i = p;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (p != null)
                    throw Error(s(137, t));
                  break;
                default:
                  cl(l, t, u, p, e, null);
              }
          }
        Hf(
          l,
          n,
          i,
          o,
          g,
          c,
          a,
          !1
        ), Na(l);
        return;
      case "select":
        W("invalid", l), u = c = n = null;
        for (a in e)
          if (e.hasOwnProperty(a) && (i = e[a], i != null))
            switch (a) {
              case "value":
                n = i;
                break;
              case "defaultValue":
                c = i;
                break;
              case "multiple":
                u = i;
              default:
                cl(l, t, a, i, e, null);
            }
        t = n, e = c, l.multiple = !!u, t != null ? Qe(l, !!u, t, !1) : e != null && Qe(l, !!u, e, !0);
        return;
      case "textarea":
        W("invalid", l), n = a = u = null;
        for (c in e)
          if (e.hasOwnProperty(c) && (i = e[c], i != null))
            switch (c) {
              case "value":
                u = i;
                break;
              case "defaultValue":
                a = i;
                break;
              case "children":
                n = i;
                break;
              case "dangerouslySetInnerHTML":
                if (i != null) throw Error(s(91));
                break;
              default:
                cl(l, t, c, i, e, null);
            }
        jf(l, u, a, n), Na(l);
        return;
      case "option":
        for (o in e)
          if (e.hasOwnProperty(o) && (u = e[o], u != null))
            switch (o) {
              case "selected":
                l.selected = u && typeof u != "function" && typeof u != "symbol";
                break;
              default:
                cl(l, t, o, u, e, null);
            }
        return;
      case "dialog":
        W("beforetoggle", l), W("toggle", l), W("cancel", l), W("close", l);
        break;
      case "iframe":
      case "object":
        W("load", l);
        break;
      case "video":
      case "audio":
        for (u = 0; u < oa.length; u++)
          W(oa[u], l);
        break;
      case "image":
        W("error", l), W("load", l);
        break;
      case "details":
        W("toggle", l);
        break;
      case "embed":
      case "source":
      case "link":
        W("error", l), W("load", l);
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (g in e)
          if (e.hasOwnProperty(g) && (u = e[g], u != null))
            switch (g) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(s(137, t));
              default:
                cl(l, t, g, u, e, null);
            }
        return;
      default:
        if (tc(t)) {
          for (p in e)
            e.hasOwnProperty(p) && (u = e[p], u !== void 0 && Gi(
              l,
              t,
              p,
              u,
              e,
              void 0
            ));
          return;
        }
    }
    for (i in e)
      e.hasOwnProperty(i) && (u = e[i], u != null && cl(l, t, i, u, e, null));
  }
  function M0(l, t, e, u) {
    switch (t) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var a = null, n = null, c = null, i = null, o = null, g = null, p = null;
        for (b in e) {
          var R = e[b];
          if (e.hasOwnProperty(b) && R != null)
            switch (b) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                o = R;
              default:
                u.hasOwnProperty(b) || cl(l, t, b, null, u, R);
            }
        }
        for (var S in u) {
          var b = u[S];
          if (R = e[S], u.hasOwnProperty(S) && (b != null || R != null))
            switch (S) {
              case "type":
                n = b;
                break;
              case "name":
                a = b;
                break;
              case "checked":
                g = b;
                break;
              case "defaultChecked":
                p = b;
                break;
              case "value":
                c = b;
                break;
              case "defaultValue":
                i = b;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (b != null)
                  throw Error(s(137, t));
                break;
              default:
                b !== R && cl(
                  l,
                  t,
                  S,
                  b,
                  u,
                  R
                );
            }
        }
        Pn(
          l,
          c,
          i,
          o,
          g,
          p,
          n,
          a
        );
        return;
      case "select":
        b = c = i = S = null;
        for (n in e)
          if (o = e[n], e.hasOwnProperty(n) && o != null)
            switch (n) {
              case "value":
                break;
              case "multiple":
                b = o;
              default:
                u.hasOwnProperty(n) || cl(
                  l,
                  t,
                  n,
                  null,
                  u,
                  o
                );
            }
        for (a in u)
          if (n = u[a], o = e[a], u.hasOwnProperty(a) && (n != null || o != null))
            switch (a) {
              case "value":
                S = n;
                break;
              case "defaultValue":
                i = n;
                break;
              case "multiple":
                c = n;
              default:
                n !== o && cl(
                  l,
                  t,
                  a,
                  n,
                  u,
                  o
                );
            }
        t = i, e = c, u = b, S != null ? Qe(l, !!e, S, !1) : !!u != !!e && (t != null ? Qe(l, !!e, t, !0) : Qe(l, !!e, e ? [] : "", !1));
        return;
      case "textarea":
        b = S = null;
        for (i in e)
          if (a = e[i], e.hasOwnProperty(i) && a != null && !u.hasOwnProperty(i))
            switch (i) {
              case "value":
                break;
              case "children":
                break;
              default:
                cl(l, t, i, null, u, a);
            }
        for (c in u)
          if (a = u[c], n = e[c], u.hasOwnProperty(c) && (a != null || n != null))
            switch (c) {
              case "value":
                S = a;
                break;
              case "defaultValue":
                b = a;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (a != null) throw Error(s(91));
                break;
              default:
                a !== n && cl(l, t, c, a, u, n);
            }
        Cf(l, S, b);
        return;
      case "option":
        for (var Z in e)
          if (S = e[Z], e.hasOwnProperty(Z) && S != null && !u.hasOwnProperty(Z))
            switch (Z) {
              case "selected":
                l.selected = !1;
                break;
              default:
                cl(
                  l,
                  t,
                  Z,
                  null,
                  u,
                  S
                );
            }
        for (o in u)
          if (S = u[o], b = e[o], u.hasOwnProperty(o) && S !== b && (S != null || b != null))
            switch (o) {
              case "selected":
                l.selected = S && typeof S != "function" && typeof S != "symbol";
                break;
              default:
                cl(
                  l,
                  t,
                  o,
                  S,
                  u,
                  b
                );
            }
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var G in e)
          S = e[G], e.hasOwnProperty(G) && S != null && !u.hasOwnProperty(G) && cl(l, t, G, null, u, S);
        for (g in u)
          if (S = u[g], b = e[g], u.hasOwnProperty(g) && S !== b && (S != null || b != null))
            switch (g) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (S != null)
                  throw Error(s(137, t));
                break;
              default:
                cl(
                  l,
                  t,
                  g,
                  S,
                  u,
                  b
                );
            }
        return;
      default:
        if (tc(t)) {
          for (var il in e)
            S = e[il], e.hasOwnProperty(il) && S !== void 0 && !u.hasOwnProperty(il) && Gi(
              l,
              t,
              il,
              void 0,
              u,
              S
            );
          for (p in u)
            S = u[p], b = e[p], !u.hasOwnProperty(p) || S === b || S === void 0 && b === void 0 || Gi(
              l,
              t,
              p,
              S,
              u,
              b
            );
          return;
        }
    }
    for (var v in e)
      S = e[v], e.hasOwnProperty(v) && S != null && !u.hasOwnProperty(v) && cl(l, t, v, null, u, S);
    for (R in u)
      S = u[R], b = e[R], !u.hasOwnProperty(R) || S === b || S == null && b == null || cl(l, t, R, S, u, b);
  }
  var Xi = null, Qi = null;
  function _n(l) {
    return l.nodeType === 9 ? l : l.ownerDocument;
  }
  function qr(l) {
    switch (l) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Yr(l, t) {
    if (l === 0)
      switch (t) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return l === 1 && t === "foreignObject" ? 0 : l;
  }
  function Zi(l, t) {
    return l === "textarea" || l === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var Vi = null;
  function z0() {
    var l = window.event;
    return l && l.type === "popstate" ? l === Vi ? !1 : (Vi = l, !0) : (Vi = null, !1);
  }
  var Gr = typeof setTimeout == "function" ? setTimeout : void 0, U0 = typeof clearTimeout == "function" ? clearTimeout : void 0, Xr = typeof Promise == "function" ? Promise : void 0, N0 = typeof queueMicrotask == "function" ? queueMicrotask : typeof Xr < "u" ? function(l) {
    return Xr.resolve(null).then(l).catch(x0);
  } : Gr;
  function x0(l) {
    setTimeout(function() {
      throw l;
    });
  }
  function fe(l) {
    return l === "head";
  }
  function Qr(l, t) {
    var e = t, u = 0, a = 0;
    do {
      var n = e.nextSibling;
      if (l.removeChild(e), n && n.nodeType === 8)
        if (e = n.data, e === "/$") {
          if (0 < u && 8 > u) {
            e = u;
            var c = l.ownerDocument;
            if (e & 1 && da(c.documentElement), e & 2 && da(c.body), e & 4)
              for (e = c.head, da(e), c = e.firstChild; c; ) {
                var i = c.nextSibling, o = c.nodeName;
                c[_u] || o === "SCRIPT" || o === "STYLE" || o === "LINK" && c.rel.toLowerCase() === "stylesheet" || e.removeChild(c), c = i;
              }
          }
          if (a === 0) {
            l.removeChild(n), Ta(t);
            return;
          }
          a--;
        } else
          e === "$" || e === "$?" || e === "$!" ? a++ : u = e.charCodeAt(0) - 48;
      else u = 0;
      e = n;
    } while (e);
    Ta(t);
  }
  function Li(l) {
    var t = l.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var e = t;
      switch (t = t.nextSibling, e.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Li(e), kn(e);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (e.rel.toLowerCase() === "stylesheet") continue;
      }
      l.removeChild(e);
    }
  }
  function H0(l, t, e, u) {
    for (; l.nodeType === 1; ) {
      var a = e;
      if (l.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!u && (l.nodeName !== "INPUT" || l.type !== "hidden"))
          break;
      } else if (u) {
        if (!l[_u])
          switch (t) {
            case "meta":
              if (!l.hasAttribute("itemprop")) break;
              return l;
            case "link":
              if (n = l.getAttribute("rel"), n === "stylesheet" && l.hasAttribute("data-precedence"))
                break;
              if (n !== a.rel || l.getAttribute("href") !== (a.href == null || a.href === "" ? null : a.href) || l.getAttribute("crossorigin") !== (a.crossOrigin == null ? null : a.crossOrigin) || l.getAttribute("title") !== (a.title == null ? null : a.title))
                break;
              return l;
            case "style":
              if (l.hasAttribute("data-precedence")) break;
              return l;
            case "script":
              if (n = l.getAttribute("src"), (n !== (a.src == null ? null : a.src) || l.getAttribute("type") !== (a.type == null ? null : a.type) || l.getAttribute("crossorigin") !== (a.crossOrigin == null ? null : a.crossOrigin)) && n && l.hasAttribute("async") && !l.hasAttribute("itemprop"))
                break;
              return l;
            default:
              return l;
          }
      } else if (t === "input" && l.type === "hidden") {
        var n = a.name == null ? null : "" + a.name;
        if (a.type === "hidden" && l.getAttribute("name") === n)
          return l;
      } else return l;
      if (l = gt(l.nextSibling), l === null) break;
    }
    return null;
  }
  function C0(l, t, e) {
    if (t === "") return null;
    for (; l.nodeType !== 3; )
      if ((l.nodeType !== 1 || l.nodeName !== "INPUT" || l.type !== "hidden") && !e || (l = gt(l.nextSibling), l === null)) return null;
    return l;
  }
  function Ki(l) {
    return l.data === "$!" || l.data === "$?" && l.ownerDocument.readyState === "complete";
  }
  function j0(l, t) {
    var e = l.ownerDocument;
    if (l.data !== "$?" || e.readyState === "complete")
      t();
    else {
      var u = function() {
        t(), e.removeEventListener("DOMContentLoaded", u);
      };
      e.addEventListener("DOMContentLoaded", u), l._reactRetry = u;
    }
  }
  function gt(l) {
    for (; l != null; l = l.nextSibling) {
      var t = l.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (t = l.data, t === "$" || t === "$!" || t === "$?" || t === "F!" || t === "F")
          break;
        if (t === "/$") return null;
      }
    }
    return l;
  }
  var Ji = null;
  function Zr(l) {
    l = l.previousSibling;
    for (var t = 0; l; ) {
      if (l.nodeType === 8) {
        var e = l.data;
        if (e === "$" || e === "$!" || e === "$?") {
          if (t === 0) return l;
          t--;
        } else e === "/$" && t++;
      }
      l = l.previousSibling;
    }
    return null;
  }
  function Vr(l, t, e) {
    switch (t = _n(e), l) {
      case "html":
        if (l = t.documentElement, !l) throw Error(s(452));
        return l;
      case "head":
        if (l = t.head, !l) throw Error(s(453));
        return l;
      case "body":
        if (l = t.body, !l) throw Error(s(454));
        return l;
      default:
        throw Error(s(451));
    }
  }
  function da(l) {
    for (var t = l.attributes; t.length; )
      l.removeAttributeNode(t[0]);
    kn(l);
  }
  var vt = /* @__PURE__ */ new Map(), Lr = /* @__PURE__ */ new Set();
  function Mn(l) {
    return typeof l.getRootNode == "function" ? l.getRootNode() : l.nodeType === 9 ? l : l.ownerDocument;
  }
  var Zt = N.d;
  N.d = {
    f: B0,
    r: q0,
    D: Y0,
    C: G0,
    L: X0,
    m: Q0,
    X: V0,
    S: Z0,
    M: L0
  };
  function B0() {
    var l = Zt.f(), t = bn();
    return l || t;
  }
  function q0(l) {
    var t = qe(l);
    t !== null && t.tag === 5 && t.type === "form" ? so(t) : Zt.r(l);
  }
  var gu = typeof document > "u" ? null : document;
  function Kr(l, t, e) {
    var u = gu;
    if (u && typeof t == "string" && t) {
      var a = it(t);
      a = 'link[rel="' + l + '"][href="' + a + '"]', typeof e == "string" && (a += '[crossorigin="' + e + '"]'), Lr.has(a) || (Lr.add(a), l = { rel: l, crossOrigin: e, href: t }, u.querySelector(a) === null && (t = u.createElement("link"), xl(t, "link", l), Rl(t), u.head.appendChild(t)));
    }
  }
  function Y0(l) {
    Zt.D(l), Kr("dns-prefetch", l, null);
  }
  function G0(l, t) {
    Zt.C(l, t), Kr("preconnect", l, t);
  }
  function X0(l, t, e) {
    Zt.L(l, t, e);
    var u = gu;
    if (u && l && t) {
      var a = 'link[rel="preload"][as="' + it(t) + '"]';
      t === "image" && e && e.imageSrcSet ? (a += '[imagesrcset="' + it(
        e.imageSrcSet
      ) + '"]', typeof e.imageSizes == "string" && (a += '[imagesizes="' + it(
        e.imageSizes
      ) + '"]')) : a += '[href="' + it(l) + '"]';
      var n = a;
      switch (t) {
        case "style":
          n = Su(l);
          break;
        case "script":
          n = bu(l);
      }
      vt.has(n) || (l = C(
        {
          rel: "preload",
          href: t === "image" && e && e.imageSrcSet ? void 0 : l,
          as: t
        },
        e
      ), vt.set(n, l), u.querySelector(a) !== null || t === "style" && u.querySelector(ha(n)) || t === "script" && u.querySelector(va(n)) || (t = u.createElement("link"), xl(t, "link", l), Rl(t), u.head.appendChild(t)));
    }
  }
  function Q0(l, t) {
    Zt.m(l, t);
    var e = gu;
    if (e && l) {
      var u = t && typeof t.as == "string" ? t.as : "script", a = 'link[rel="modulepreload"][as="' + it(u) + '"][href="' + it(l) + '"]', n = a;
      switch (u) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          n = bu(l);
      }
      if (!vt.has(n) && (l = C({ rel: "modulepreload", href: l }, t), vt.set(n, l), e.querySelector(a) === null)) {
        switch (u) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (e.querySelector(va(n)))
              return;
        }
        u = e.createElement("link"), xl(u, "link", l), Rl(u), e.head.appendChild(u);
      }
    }
  }
  function Z0(l, t, e) {
    Zt.S(l, t, e);
    var u = gu;
    if (u && l) {
      var a = Ye(u).hoistableStyles, n = Su(l);
      t = t || "default";
      var c = a.get(n);
      if (!c) {
        var i = { loading: 0, preload: null };
        if (c = u.querySelector(
          ha(n)
        ))
          i.loading = 5;
        else {
          l = C(
            { rel: "stylesheet", href: l, "data-precedence": t },
            e
          ), (e = vt.get(n)) && wi(l, e);
          var o = c = u.createElement("link");
          Rl(o), xl(o, "link", l), o._p = new Promise(function(g, p) {
            o.onload = g, o.onerror = p;
          }), o.addEventListener("load", function() {
            i.loading |= 1;
          }), o.addEventListener("error", function() {
            i.loading |= 2;
          }), i.loading |= 4, zn(c, t, u);
        }
        c = {
          type: "stylesheet",
          instance: c,
          count: 1,
          state: i
        }, a.set(n, c);
      }
    }
  }
  function V0(l, t) {
    Zt.X(l, t);
    var e = gu;
    if (e && l) {
      var u = Ye(e).hoistableScripts, a = bu(l), n = u.get(a);
      n || (n = e.querySelector(va(a)), n || (l = C({ src: l, async: !0 }, t), (t = vt.get(a)) && $i(l, t), n = e.createElement("script"), Rl(n), xl(n, "link", l), e.head.appendChild(n)), n = {
        type: "script",
        instance: n,
        count: 1,
        state: null
      }, u.set(a, n));
    }
  }
  function L0(l, t) {
    Zt.M(l, t);
    var e = gu;
    if (e && l) {
      var u = Ye(e).hoistableScripts, a = bu(l), n = u.get(a);
      n || (n = e.querySelector(va(a)), n || (l = C({ src: l, async: !0, type: "module" }, t), (t = vt.get(a)) && $i(l, t), n = e.createElement("script"), Rl(n), xl(n, "link", l), e.head.appendChild(n)), n = {
        type: "script",
        instance: n,
        count: 1,
        state: null
      }, u.set(a, n));
    }
  }
  function Jr(l, t, e, u) {
    var a = (a = V.current) ? Mn(a) : null;
    if (!a) throw Error(s(446));
    switch (l) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof e.precedence == "string" && typeof e.href == "string" ? (t = Su(e.href), e = Ye(
          a
        ).hoistableStyles, u = e.get(t), u || (u = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, e.set(t, u)), u) : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (e.rel === "stylesheet" && typeof e.href == "string" && typeof e.precedence == "string") {
          l = Su(e.href);
          var n = Ye(
            a
          ).hoistableStyles, c = n.get(l);
          if (c || (a = a.ownerDocument || a, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }, n.set(l, c), (n = a.querySelector(
            ha(l)
          )) && !n._p && (c.instance = n, c.state.loading = 5), vt.has(l) || (e = {
            rel: "preload",
            as: "style",
            href: e.href,
            crossOrigin: e.crossOrigin,
            integrity: e.integrity,
            media: e.media,
            hrefLang: e.hrefLang,
            referrerPolicy: e.referrerPolicy
          }, vt.set(l, e), n || K0(
            a,
            l,
            e,
            c.state
          ))), t && u === null)
            throw Error(s(528, ""));
          return c;
        }
        if (t && u !== null)
          throw Error(s(529, ""));
        return null;
      case "script":
        return t = e.async, e = e.src, typeof e == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = bu(e), e = Ye(
          a
        ).hoistableScripts, u = e.get(t), u || (u = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, e.set(t, u)), u) : { type: "void", instance: null, count: 0, state: null };
      default:
        throw Error(s(444, l));
    }
  }
  function Su(l) {
    return 'href="' + it(l) + '"';
  }
  function ha(l) {
    return 'link[rel="stylesheet"][' + l + "]";
  }
  function wr(l) {
    return C({}, l, {
      "data-precedence": l.precedence,
      precedence: null
    });
  }
  function K0(l, t, e, u) {
    l.querySelector('link[rel="preload"][as="style"][' + t + "]") ? u.loading = 1 : (t = l.createElement("link"), u.preload = t, t.addEventListener("load", function() {
      return u.loading |= 1;
    }), t.addEventListener("error", function() {
      return u.loading |= 2;
    }), xl(t, "link", e), Rl(t), l.head.appendChild(t));
  }
  function bu(l) {
    return '[src="' + it(l) + '"]';
  }
  function va(l) {
    return "script[async]" + l;
  }
  function $r(l, t, e) {
    if (t.count++, t.instance === null)
      switch (t.type) {
        case "style":
          var u = l.querySelector(
            'style[data-href~="' + it(e.href) + '"]'
          );
          if (u)
            return t.instance = u, Rl(u), u;
          var a = C({}, e, {
            "data-href": e.href,
            "data-precedence": e.precedence,
            href: null,
            precedence: null
          });
          return u = (l.ownerDocument || l).createElement(
            "style"
          ), Rl(u), xl(u, "style", a), zn(u, e.precedence, l), t.instance = u;
        case "stylesheet":
          a = Su(e.href);
          var n = l.querySelector(
            ha(a)
          );
          if (n)
            return t.state.loading |= 4, t.instance = n, Rl(n), n;
          u = wr(e), (a = vt.get(a)) && wi(u, a), n = (l.ownerDocument || l).createElement("link"), Rl(n);
          var c = n;
          return c._p = new Promise(function(i, o) {
            c.onload = i, c.onerror = o;
          }), xl(n, "link", u), t.state.loading |= 4, zn(n, e.precedence, l), t.instance = n;
        case "script":
          return n = bu(e.src), (a = l.querySelector(
            va(n)
          )) ? (t.instance = a, Rl(a), a) : (u = e, (a = vt.get(n)) && (u = C({}, e), $i(u, a)), l = l.ownerDocument || l, a = l.createElement("script"), Rl(a), xl(a, "link", u), l.head.appendChild(a), t.instance = a);
        case "void":
          return null;
        default:
          throw Error(s(443, t.type));
      }
    else
      t.type === "stylesheet" && (t.state.loading & 4) === 0 && (u = t.instance, t.state.loading |= 4, zn(u, e.precedence, l));
    return t.instance;
  }
  function zn(l, t, e) {
    for (var u = e.querySelectorAll(
      'link[rel="stylesheet"][data-precedence],style[data-precedence]'
    ), a = u.length ? u[u.length - 1] : null, n = a, c = 0; c < u.length; c++) {
      var i = u[c];
      if (i.dataset.precedence === t) n = i;
      else if (n !== a) break;
    }
    n ? n.parentNode.insertBefore(l, n.nextSibling) : (t = e.nodeType === 9 ? e.head : e, t.insertBefore(l, t.firstChild));
  }
  function wi(l, t) {
    l.crossOrigin == null && (l.crossOrigin = t.crossOrigin), l.referrerPolicy == null && (l.referrerPolicy = t.referrerPolicy), l.title == null && (l.title = t.title);
  }
  function $i(l, t) {
    l.crossOrigin == null && (l.crossOrigin = t.crossOrigin), l.referrerPolicy == null && (l.referrerPolicy = t.referrerPolicy), l.integrity == null && (l.integrity = t.integrity);
  }
  var Un = null;
  function kr(l, t, e) {
    if (Un === null) {
      var u = /* @__PURE__ */ new Map(), a = Un = /* @__PURE__ */ new Map();
      a.set(e, u);
    } else
      a = Un, u = a.get(e), u || (u = /* @__PURE__ */ new Map(), a.set(e, u));
    if (u.has(l)) return u;
    for (u.set(l, null), e = e.getElementsByTagName(l), a = 0; a < e.length; a++) {
      var n = e[a];
      if (!(n[_u] || n[ql] || l === "link" && n.getAttribute("rel") === "stylesheet") && n.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = n.getAttribute(t) || "";
        c = l + c;
        var i = u.get(c);
        i ? i.push(n) : u.set(c, [n]);
      }
    }
    return u;
  }
  function Wr(l, t, e) {
    l = l.ownerDocument || l, l.head.insertBefore(
      e,
      t === "title" ? l.querySelector("head > title") : null
    );
  }
  function J0(l, t, e) {
    if (e === 1 || t.itemProp != null) return !1;
    switch (l) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
          break;
        return !0;
      case "link":
        if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
          break;
        switch (t.rel) {
          case "stylesheet":
            return l = t.disabled, typeof t.precedence == "string" && l == null;
          default:
            return !0;
        }
      case "script":
        if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
          return !0;
    }
    return !1;
  }
  function Fr(l) {
    return !(l.type === "stylesheet" && (l.state.loading & 3) === 0);
  }
  var ya = null;
  function w0() {
  }
  function $0(l, t, e) {
    if (ya === null) throw Error(s(475));
    var u = ya;
    if (t.type === "stylesheet" && (typeof e.media != "string" || matchMedia(e.media).matches !== !1) && (t.state.loading & 4) === 0) {
      if (t.instance === null) {
        var a = Su(e.href), n = l.querySelector(
          ha(a)
        );
        if (n) {
          l = n._p, l !== null && typeof l == "object" && typeof l.then == "function" && (u.count++, u = Nn.bind(u), l.then(u, u)), t.state.loading |= 4, t.instance = n, Rl(n);
          return;
        }
        n = l.ownerDocument || l, e = wr(e), (a = vt.get(a)) && wi(e, a), n = n.createElement("link"), Rl(n);
        var c = n;
        c._p = new Promise(function(i, o) {
          c.onload = i, c.onerror = o;
        }), xl(n, "link", e), t.instance = n;
      }
      u.stylesheets === null && (u.stylesheets = /* @__PURE__ */ new Map()), u.stylesheets.set(t, l), (l = t.state.preload) && (t.state.loading & 3) === 0 && (u.count++, t = Nn.bind(u), l.addEventListener("load", t), l.addEventListener("error", t));
    }
  }
  function k0() {
    if (ya === null) throw Error(s(475));
    var l = ya;
    return l.stylesheets && l.count === 0 && ki(l, l.stylesheets), 0 < l.count ? function(t) {
      var e = setTimeout(function() {
        if (l.stylesheets && ki(l, l.stylesheets), l.unsuspend) {
          var u = l.unsuspend;
          l.unsuspend = null, u();
        }
      }, 6e4);
      return l.unsuspend = t, function() {
        l.unsuspend = null, clearTimeout(e);
      };
    } : null;
  }
  function Nn() {
    if (this.count--, this.count === 0) {
      if (this.stylesheets) ki(this, this.stylesheets);
      else if (this.unsuspend) {
        var l = this.unsuspend;
        this.unsuspend = null, l();
      }
    }
  }
  var xn = null;
  function ki(l, t) {
    l.stylesheets = null, l.unsuspend !== null && (l.count++, xn = /* @__PURE__ */ new Map(), t.forEach(W0, l), xn = null, Nn.call(l));
  }
  function W0(l, t) {
    if (!(t.state.loading & 4)) {
      var e = xn.get(l);
      if (e) var u = e.get(null);
      else {
        e = /* @__PURE__ */ new Map(), xn.set(l, e);
        for (var a = l.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ), n = 0; n < a.length; n++) {
          var c = a[n];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (e.set(c.dataset.precedence, c), u = c);
        }
        u && e.set(null, u);
      }
      a = t.instance, c = a.getAttribute("data-precedence"), n = e.get(c) || u, n === u && e.set(null, a), e.set(c, a), this.count++, u = Nn.bind(this), a.addEventListener("load", u), a.addEventListener("error", u), n ? n.parentNode.insertBefore(a, n.nextSibling) : (l = l.nodeType === 9 ? l.head : l, l.insertBefore(a, l.firstChild)), t.state.loading |= 4;
    }
  }
  var ma = {
    $$typeof: bl,
    Provider: null,
    Consumer: null,
    _currentValue: Q,
    _currentValue2: Q,
    _threadCount: 0
  };
  function F0(l, t, e, u, a, n, c, i) {
    this.tag = 1, this.containerInfo = l, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Kn(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Kn(0), this.hiddenUpdates = Kn(null), this.identifierPrefix = u, this.onUncaughtError = a, this.onCaughtError = n, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = i, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Ir(l, t, e, u, a, n, c, i, o, g, p, R) {
    return l = new F0(
      l,
      t,
      e,
      c,
      i,
      o,
      g,
      R
    ), t = 1, n === !0 && (t |= 24), n = lt(3, null, null, t), l.current = n, n.stateNode = l, t = Uc(), t.refCount++, l.pooledCache = t, t.refCount++, n.memoizedState = {
      element: u,
      isDehydrated: e,
      cache: t
    }, Cc(n), l;
  }
  function Pr(l) {
    return l ? (l = We, l) : We;
  }
  function ld(l, t, e, u, a, n) {
    a = Pr(a), u.context === null ? u.context = a : u.pendingContext = a, u = kt(t), u.payload = { element: e }, n = n === void 0 ? null : n, n !== null && (u.callback = n), e = Wt(l, u, t), e !== null && (nt(e, l, t), Ju(e, l, t));
  }
  function td(l, t) {
    if (l = l.memoizedState, l !== null && l.dehydrated !== null) {
      var e = l.retryLane;
      l.retryLane = e !== 0 && e < t ? e : t;
    }
  }
  function Wi(l, t) {
    td(l, t), (l = l.alternate) && td(l, t);
  }
  function ed(l) {
    if (l.tag === 13) {
      var t = ke(l, 67108864);
      t !== null && nt(t, l, 67108864), Wi(l, 67108864);
    }
  }
  var Hn = !0;
  function I0(l, t, e, u) {
    var a = A.T;
    A.T = null;
    var n = N.p;
    try {
      N.p = 2, Fi(l, t, e, u);
    } finally {
      N.p = n, A.T = a;
    }
  }
  function P0(l, t, e, u) {
    var a = A.T;
    A.T = null;
    var n = N.p;
    try {
      N.p = 8, Fi(l, t, e, u);
    } finally {
      N.p = n, A.T = a;
    }
  }
  function Fi(l, t, e, u) {
    if (Hn) {
      var a = Ii(u);
      if (a === null)
        Yi(
          l,
          t,
          u,
          Cn,
          e
        ), ad(l, u);
      else if (tv(
        a,
        l,
        t,
        e,
        u
      ))
        u.stopPropagation();
      else if (ad(l, u), t & 4 && -1 < lv.indexOf(l)) {
        for (; a !== null; ) {
          var n = qe(a);
          if (n !== null)
            switch (n.tag) {
              case 3:
                if (n = n.stateNode, n.current.memoizedState.isDehydrated) {
                  var c = me(n.pendingLanes);
                  if (c !== 0) {
                    var i = n;
                    for (i.pendingLanes |= 2, i.entangledLanes |= 2; c; ) {
                      var o = 1 << 31 - Il(c);
                      i.entanglements[1] |= o, c &= ~o;
                    }
                    Rt(n), (ul & 6) === 0 && (gn = Tt() + 500, sa(0));
                  }
                }
                break;
              case 13:
                i = ke(n, 2), i !== null && nt(i, n, 2), bn(), Wi(n, 2);
            }
          if (n = Ii(u), n === null && Yi(
            l,
            t,
            u,
            Cn,
            e
          ), n === a) break;
          a = n;
        }
        a !== null && u.stopPropagation();
      } else
        Yi(
          l,
          t,
          u,
          null,
          e
        );
    }
  }
  function Ii(l) {
    return l = uc(l), Pi(l);
  }
  var Cn = null;
  function Pi(l) {
    if (Cn = null, l = Be(l), l !== null) {
      var t = z(l);
      if (t === null) l = null;
      else {
        var e = t.tag;
        if (e === 13) {
          if (l = x(t), l !== null) return l;
          l = null;
        } else if (e === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated)
            return t.tag === 3 ? t.stateNode.containerInfo : null;
          l = null;
        } else t !== l && (l = null);
      }
    }
    return Cn = l, null;
  }
  function ud(l) {
    switch (l) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (Gd()) {
          case mf:
            return 2;
          case gf:
            return 8;
          case Ra:
          case Xd:
            return 32;
          case Sf:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var lf = !1, se = null, oe = null, re = null, ga = /* @__PURE__ */ new Map(), Sa = /* @__PURE__ */ new Map(), de = [], lv = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
    " "
  );
  function ad(l, t) {
    switch (l) {
      case "focusin":
      case "focusout":
        se = null;
        break;
      case "dragenter":
      case "dragleave":
        oe = null;
        break;
      case "mouseover":
      case "mouseout":
        re = null;
        break;
      case "pointerover":
      case "pointerout":
        ga.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Sa.delete(t.pointerId);
    }
  }
  function ba(l, t, e, u, a, n) {
    return l === null || l.nativeEvent !== n ? (l = {
      blockedOn: t,
      domEventName: e,
      eventSystemFlags: u,
      nativeEvent: n,
      targetContainers: [a]
    }, t !== null && (t = qe(t), t !== null && ed(t)), l) : (l.eventSystemFlags |= u, t = l.targetContainers, a !== null && t.indexOf(a) === -1 && t.push(a), l);
  }
  function tv(l, t, e, u, a) {
    switch (t) {
      case "focusin":
        return se = ba(
          se,
          l,
          t,
          e,
          u,
          a
        ), !0;
      case "dragenter":
        return oe = ba(
          oe,
          l,
          t,
          e,
          u,
          a
        ), !0;
      case "mouseover":
        return re = ba(
          re,
          l,
          t,
          e,
          u,
          a
        ), !0;
      case "pointerover":
        var n = a.pointerId;
        return ga.set(
          n,
          ba(
            ga.get(n) || null,
            l,
            t,
            e,
            u,
            a
          )
        ), !0;
      case "gotpointercapture":
        return n = a.pointerId, Sa.set(
          n,
          ba(
            Sa.get(n) || null,
            l,
            t,
            e,
            u,
            a
          )
        ), !0;
    }
    return !1;
  }
  function nd(l) {
    var t = Be(l.target);
    if (t !== null) {
      var e = z(t);
      if (e !== null) {
        if (t = e.tag, t === 13) {
          if (t = x(e), t !== null) {
            l.blockedOn = t, $d(l.priority, function() {
              if (e.tag === 13) {
                var u = at();
                u = Jn(u);
                var a = ke(e, u);
                a !== null && nt(a, e, u), Wi(e, u);
              }
            });
            return;
          }
        } else if (t === 3 && e.stateNode.current.memoizedState.isDehydrated) {
          l.blockedOn = e.tag === 3 ? e.stateNode.containerInfo : null;
          return;
        }
      }
    }
    l.blockedOn = null;
  }
  function jn(l) {
    if (l.blockedOn !== null) return !1;
    for (var t = l.targetContainers; 0 < t.length; ) {
      var e = Ii(l.nativeEvent);
      if (e === null) {
        e = l.nativeEvent;
        var u = new e.constructor(
          e.type,
          e
        );
        ec = u, e.target.dispatchEvent(u), ec = null;
      } else
        return t = qe(e), t !== null && ed(t), l.blockedOn = e, !1;
      t.shift();
    }
    return !0;
  }
  function cd(l, t, e) {
    jn(l) && e.delete(t);
  }
  function ev() {
    lf = !1, se !== null && jn(se) && (se = null), oe !== null && jn(oe) && (oe = null), re !== null && jn(re) && (re = null), ga.forEach(cd), Sa.forEach(cd);
  }
  function Bn(l, t) {
    l.blockedOn === t && (l.blockedOn = null, lf || (lf = !0, f.unstable_scheduleCallback(
      f.unstable_NormalPriority,
      ev
    )));
  }
  var qn = null;
  function id(l) {
    qn !== l && (qn = l, f.unstable_scheduleCallback(
      f.unstable_NormalPriority,
      function() {
        qn === l && (qn = null);
        for (var t = 0; t < l.length; t += 3) {
          var e = l[t], u = l[t + 1], a = l[t + 2];
          if (typeof u != "function") {
            if (Pi(u || e) === null)
              continue;
            break;
          }
          var n = qe(e);
          n !== null && (l.splice(t, 3), t -= 3, Pc(
            n,
            {
              pending: !0,
              data: a,
              method: e.method,
              action: u
            },
            u,
            a
          ));
        }
      }
    ));
  }
  function Ta(l) {
    function t(o) {
      return Bn(o, l);
    }
    se !== null && Bn(se, l), oe !== null && Bn(oe, l), re !== null && Bn(re, l), ga.forEach(t), Sa.forEach(t);
    for (var e = 0; e < de.length; e++) {
      var u = de[e];
      u.blockedOn === l && (u.blockedOn = null);
    }
    for (; 0 < de.length && (e = de[0], e.blockedOn === null); )
      nd(e), e.blockedOn === null && de.shift();
    if (e = (l.ownerDocument || l).$$reactFormReplay, e != null)
      for (u = 0; u < e.length; u += 3) {
        var a = e[u], n = e[u + 1], c = a[Ll] || null;
        if (typeof n == "function")
          c || id(e);
        else if (c) {
          var i = null;
          if (n && n.hasAttribute("formAction")) {
            if (a = n, c = n[Ll] || null)
              i = c.formAction;
            else if (Pi(a) !== null) continue;
          } else i = c.action;
          typeof i == "function" ? e[u + 1] = i : (e.splice(u, 3), u -= 3), id(e);
        }
      }
  }
  function tf(l) {
    this._internalRoot = l;
  }
  Yn.prototype.render = tf.prototype.render = function(l) {
    var t = this._internalRoot;
    if (t === null) throw Error(s(409));
    var e = t.current, u = at();
    ld(e, u, l, t, null, null);
  }, Yn.prototype.unmount = tf.prototype.unmount = function() {
    var l = this._internalRoot;
    if (l !== null) {
      this._internalRoot = null;
      var t = l.containerInfo;
      ld(l.current, 2, null, l, null, null), bn(), t[je] = null;
    }
  };
  function Yn(l) {
    this._internalRoot = l;
  }
  Yn.prototype.unstable_scheduleHydration = function(l) {
    if (l) {
      var t = Af();
      l = { blockedOn: null, target: l, priority: t };
      for (var e = 0; e < de.length && t !== 0 && t < de[e].priority; e++) ;
      de.splice(e, 0, l), e === 0 && nd(l);
    }
  };
  var fd = y.version;
  if (fd !== "19.1.0")
    throw Error(
      s(
        527,
        fd,
        "19.1.0"
      )
    );
  N.findDOMNode = function(l) {
    var t = l._reactInternals;
    if (t === void 0)
      throw typeof l.render == "function" ? Error(s(188)) : (l = Object.keys(l).join(","), Error(s(268, l)));
    return l = _(t), l = l !== null ? T(l) : null, l = l === null ? null : l.stateNode, l;
  };
  var uv = {
    bundleType: 0,
    version: "19.1.0",
    rendererPackageName: "react-dom",
    currentDispatcherRef: A,
    reconcilerVersion: "19.1.0"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Gn = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Gn.isDisabled && Gn.supportsFiber)
      try {
        Du = Gn.inject(
          uv
        ), Fl = Gn;
      } catch {
      }
  }
  return Ea.createRoot = function(l, t) {
    if (!M(l)) throw Error(s(299));
    var e = !1, u = "", a = Do, n = Ro, c = Oo, i = null;
    return t != null && (t.unstable_strictMode === !0 && (e = !0), t.identifierPrefix !== void 0 && (u = t.identifierPrefix), t.onUncaughtError !== void 0 && (a = t.onUncaughtError), t.onCaughtError !== void 0 && (n = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError), t.unstable_transitionCallbacks !== void 0 && (i = t.unstable_transitionCallbacks)), t = Ir(
      l,
      1,
      !1,
      null,
      null,
      e,
      u,
      a,
      n,
      c,
      i,
      null
    ), l[je] = t.current, qi(l), new tf(t);
  }, Ea.hydrateRoot = function(l, t, e) {
    if (!M(l)) throw Error(s(299));
    var u = !1, a = "", n = Do, c = Ro, i = Oo, o = null, g = null;
    return e != null && (e.unstable_strictMode === !0 && (u = !0), e.identifierPrefix !== void 0 && (a = e.identifierPrefix), e.onUncaughtError !== void 0 && (n = e.onUncaughtError), e.onCaughtError !== void 0 && (c = e.onCaughtError), e.onRecoverableError !== void 0 && (i = e.onRecoverableError), e.unstable_transitionCallbacks !== void 0 && (o = e.unstable_transitionCallbacks), e.formState !== void 0 && (g = e.formState)), t = Ir(
      l,
      1,
      !0,
      t,
      e ?? null,
      u,
      a,
      n,
      c,
      i,
      o,
      g
    ), t.context = Pr(null), e = t.current, u = at(), u = Jn(u), a = kt(u), a.callback = null, Wt(e, a, u), e = u, t.current.lanes = e, Ou(t, e), Rt(t), l[je] = t.current, qi(l), new Yn(t);
  }, Ea.version = "19.1.0", Ea;
}
var Sd;
function hv() {
  if (Sd) return af.exports;
  Sd = 1;
  function f() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(f);
      } catch (y) {
        console.error(y);
      }
  }
  return f(), af.exports = dv(), af.exports;
}
var vv = hv();
class yv extends tl.Component {
  constructor(y) {
    super(y), this.state = { hasError: !1 };
  }
  static getDerivedStateFromError(y) {
    return { hasError: !0, error: y };
  }
  render() {
    return this.state.hasError ? /* @__PURE__ */ E.jsx("div", { children: "Something went wrong. Please refresh the page or contact express dev team." }) : this.props.children;
  }
}
const bd = "https://www.adobe.com/express-search-api-v3", of = "urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418", Ed = "urn:aaid:sc:VA6C2:a6767752-9c76-493e-a9e8-49b54b3b9852", df = " AND ", Ad = ",";
function mv(f) {
  f.has("collection") && (f.get("collection") === "default" ? f.set("collectionId", `${of}`) : f.get("collection") === "popular" && f.set("collectionId", `${Ed}`), f.delete("collection")), f.get("collectionId") || f.set("collectionId", `${of}`);
}
function gv(f) {
  f.get("license") && (f.append("filters", `licensingCategory==${f.get("license")}`), f.delete("license")), f.get("behaviors") && (f.append("filters", `behaviors==${f.get("behaviors")}`), f.delete("behaviors")), f.get("tasks") && (f.append("filters", `pages.task.name==${f.get("tasks")}`), f.delete("tasks")), f.get("topics") && (f.get("topics").split(df).forEach((y) => {
    f.append("filters", `topics==${y}`);
  }), f.delete("topics")), f.get("language") && (f.append("filters", `language==${f.get("language")}`), f.delete("language"));
}
function Sv(f) {
  const y = {};
  return f.get("prefLang") && (y["x-express-pref-lang"] = f.get("prefLang"), f.delete("prefLang")), f.get("prefRegion") && (y["x-express-pref-region-code"] = f.get("prefRegion"), f.delete("prefRegion")), y;
}
function Dd(f, y) {
  const r = /\[(.+)\]/.exec(y)[1].split(";"), s = new URLSearchParams(f);
  return s.delete("limit"), s.delete("start"), r.forEach((M) => {
    const z = /^-(.+)/.exec(M);
    if (z) {
      s.delete(z[1]);
      return;
    }
    const x = /^(.+)=(.+)/.exec(M);
    x && s.set(x[1], x[2]);
  }), s.toString();
}
function hf(f) {
  const y = {}, r = new URLSearchParams(f);
  if (r.set("queryType", "search"), mv(r), r.has("backup")) {
    const M = r.get("backup");
    r.delete("backup"), y.backupQuery = {
      target: r.get("limit"),
      ...hf(Dd(r, M))
    };
  }
  r.get("templateIds") ? (r.append("filters", `id==${r.get("templateIds")}`), r.delete("templateIds"), r.delete("start"), r.delete("orderBy")) : (gv(r), y.headers = Sv(r));
  const s = new URL(bd).host === window.location.host ? "" : "&ax-env=stage";
  return y.url = `${bd}?${decodeURIComponent(r.toString())}${s}`, y;
}
async function sf(f, y) {
  return await (await fetch(f, { headers: y })).json();
}
function bv(f) {
  const [y, r] = [/* @__PURE__ */ new Set(), []];
  return f.forEach((s) => {
    y.has(s.id) || (y.add(s.id), r.push(s));
  }), r;
}
async function Tv(f) {
  var T;
  const { url: y, headers: r, backupQuery: s } = hf(f);
  if (!s || !s.target)
    return sf(y, r);
  const [M, z] = [
    sf(y, r),
    sf(s.url, s.headers)
  ], x = await M;
  if (((T = x.items) == null ? void 0 : T.length) >= s.target)
    return x;
  const q = await z, _ = bv([...x.items, ...q.items]).slice(0, s.target);
  return {
    metadata: {
      totalHits: _.length,
      start: "0",
      limit: s.target
    },
    items: _
  };
}
function pv(f) {
  var y, r, s;
  return (y = f["dc:title"]) != null && y["i-default"] ? f["dc:title"]["i-default"] : (r = f.moods) != null && r.length && ((s = f.task) != null && s.name) ? `${f.moods.join(", ")} ${f.task.name}` : "";
}
function Rd(f) {
  var y, r;
  return (r = (y = f._links) == null ? void 0 : y["http://ns.adobe.com/adobecloud/rel/rendition"]) == null ? void 0 : r.href;
}
function Od(f) {
  var y, r;
  return (r = (y = f._links) == null ? void 0 : y["http://ns.adobe.com/adobecloud/rel/component"]) == null ? void 0 : r.href;
}
function Ev(f) {
  return !!(f != null && f.pages.some((y) => {
    var r, s, M;
    return (M = (s = (r = y == null ? void 0 : y.rendition) == null ? void 0 : r.video) == null ? void 0 : s.thumbnail) == null ? void 0 : M.componentId;
  }));
}
function Av(f) {
  var y, r;
  return (r = (y = f == null ? void 0 : f.rendition) == null ? void 0 : y.image) == null ? void 0 : r.thumbnail;
}
function _d(f, y, r) {
  const s = Av(r);
  if (!s)
    return f.replace("{&page,size,type,fragment}", "");
  const {
    mediaType: M,
    componentId: z,
    width: x,
    height: q,
    hzRevision: _
  } = s;
  return M === "image/webp" ? y.replace(
    "{&revision,component_id}",
    `&revision=${_ || 0}&component_id=${z}`
  ) : f.replace(
    "{&page,size,type,fragment}",
    `&size=${Math.max(x, q)}&type=${M}&fragment=id=${z}`
  );
}
const Dv = "application/vnd.adobe.ccv.videometadata";
async function Rv(f, y, r) {
  var q, _;
  const s = (_ = (q = r.rendition) == null ? void 0 : q.video) == null ? void 0 : _.thumbnail, { componentId: M } = s, z = f.replace(
    "{&page,size,type,fragment}",
    `&type=${Dv}&fragment=id=${M}`
  ), x = _d(f, y, r);
  try {
    const T = await fetch(z);
    if (!T.ok)
      throw new Error(T.statusText);
    const { renditionsStatus: { state: C }, posterframe: J, renditions: $ } = await T.json();
    if (C !== "COMPLETED") throw new Error("Video not ready");
    const vl = $.find((El) => El.videoContainer === "MP4");
    if (!(vl != null && vl.url)) throw new Error("No MP4 rendition found");
    return { src: vl.url, poster: (J == null ? void 0 : J.url) || x };
  } catch {
    return {
      src: y.replace(
        "{&revision,component_id}",
        `&revision=0&component_id=${M}`
      ),
      poster: x
    };
  }
}
const vf = {
  collection: "default",
  collectionId: "",
  q: "",
  limit: 10,
  start: 0,
  orderBy: "",
  // filters
  language: "",
  tasks: "",
  topics: [[""]],
  license: "",
  behaviors: "",
  // manual ids
  templateIds: [""],
  // boosting
  prefLang: "",
  prefRegion: "",
  // backup recipe
  backupRecipe: ""
};
function Md(f, y) {
  return !f && !y || f === y ? !0 : Array.isArray(f) && Array.isArray(y) ? f.length !== y.length ? !1 : f.every((r, s) => Md(r, y[s])) : !1;
}
const Td = { topics: Ud, templateIds: Nd };
function Ov(f, y) {
  return Object.keys(vf).filter((r) => !["start", "backupRecipe", "limit"].includes(r)).reduce((r, s) => {
    const M = f[s], z = y[s];
    if (Md(M, z))
      return r;
    if (M && !z)
      return [...r, { type: "-", key: s }];
    if (s in Td) {
      const x = Td[s](z);
      return x ? [...r, { type: "+", key: s, value: x }] : [...r, { type: "-", key: s }];
    }
    return [...r, { type: "+", key: s, value: z }];
  }, []);
}
function zd(f) {
  const y = new URLSearchParams(f), r = structuredClone(vf);
  if (y.has("collectionId") ? y.get("collectionId") === of ? (r.collection = "default", r.collectionId = "") : y.get("collectionId") === Ed ? (r.collection = "popular", r.collectionId = "") : r.collection = "custom" : y.has("collection") && ["default", "popular"].includes(y.get("collection")) ? (r.collection = y.get("collection"), r.collectionId = "") : (r.collection = "default", r.collectionId = ""), y.get("limit") && (r.limit = Number(y.get("limit"))), y.get("backup")) {
    const s = y.get("backup");
    y.delete("backup"), r.backupRecipe = Dd(y, s);
  }
  return y.has("templateIds") && (r.templateIds = y.get("templateIds").split(",")), y.get("start") && (r.start = Number(y.get("start"))), y.get("orderBy") && (r.orderBy = y.get("orderBy")), y.get("q") && (r.q = y.get("q")), y.get("language") && (r.language = y.get("language")), y.get("tasks") && (r.tasks = y.get("tasks")), y.get("topics") && (r.topics = y.get("topics").split(df).map((s) => s.split(Ad))), y.get("license") && (r.license = y.get("license")), y.get("behaviors") && (r.behaviors = y.get("behaviors")), y.get("prefLang") && (r.prefLang = y.get("prefLang")), y.get("prefRegion") && (r.prefRegion = y.get("prefRegion").toUpperCase()), r;
}
function Ud(f) {
  return f.filter((y) => y.some(Boolean)).map((y) => y.filter(Boolean).join(Ad)).join(df);
}
function Nd(f) {
  return f.filter(Boolean).join(",");
}
function yf(f) {
  const y = f.collection === "custom" ? "" : `collection=${f.collection}`, r = f.collection === "custom" ? `collectionId=${f.collectionId}` : "", s = f.limit ? `limit=${f.limit}` : "";
  let M = "";
  if (f.backupRecipe) {
    const bl = zd(f.backupRecipe), Vl = Ov(f, bl);
    Vl.length && (M = `backup=[${Vl.map(({ type: Xl, key: Cl, value: Ql }) => Xl === "-" ? `-${Cl}` : `${Cl}=${Ql}`).join(";")}]`);
  }
  const z = f.templateIds.filter(Boolean).map((bl) => bl.trim()), x = Nd(z);
  if (x)
    return [
      y,
      r,
      `templateIds=${x}`,
      M,
      M && s
    ].filter(Boolean).join("&");
  const q = f.start ? `start=${f.start}` : "", _ = f.q ? `q=${f.q}` : "", T = f.language ? `language=${f.language}` : "", C = f.tasks ? `tasks=${f.tasks}` : "", J = Ud(f.topics), $ = J ? `topics=${J}` : "", vl = f.license ? `license=${f.license}` : "", El = f.behaviors ? `behaviors=${f.behaviors}` : "", kl = f.orderBy ? `orderBy=${f.orderBy}` : "", Hl = f.prefLang ? `prefLang=${f.prefLang}` : "", Ot = f.prefRegion ? `prefRegion=${f.prefRegion}` : "";
  return [
    _,
    $,
    C,
    T,
    vl,
    El,
    kl,
    s,
    y,
    r,
    Hl,
    Ot,
    q,
    M
  ].filter(Boolean).join("&");
}
const xd = tl.createContext(null), Hd = tl.createContext(null), Cd = tl.createContext(null);
function pu() {
  return tl.useContext(xd);
}
function Eu() {
  return tl.useContext(Hd);
}
function _v() {
  return tl.useContext(Cd);
}
const zl = {
  UPDATE_RECIPE: "UPDATE_RECIPE",
  UPDATE_FORM: "UPDATE_FORM",
  TOPICS_ADD: "TOPICS_ADD",
  TOPICS_UPDATE: "TOPICS_UPDATE",
  TOPICS_REMOVE: "TOPICS_REMOVE",
  TOPICS_EXPAND: "TOPICS_EXPAND",
  IDS_ADD: "IDS_ADD",
  IDS_REMOVE: "IDS_REMOVE",
  IDS_UPDATE: "IDS_UPDATE"
};
function Mv(f, y) {
  const { type: r, payload: s } = y, { field: M, value: z, topicsRow: x, topicsCol: q, idsRow: _ } = s || {};
  switch (r) {
    case zl.UPDATE_RECIPE:
      return zd(z);
    case zl.UPDATE_FORM:
      return { ...f, [M]: z };
    case zl.TOPICS_ADD: {
      const T = structuredClone(f.topics);
      return T[x].push(""), { ...f, topics: T };
    }
    case zl.TOPICS_REMOVE: {
      const T = structuredClone(f.topics);
      return T[x].pop(), T[x].length || T.splice(x, 1), {
        ...f,
        topics: T
      };
    }
    case zl.TOPICS_UPDATE: {
      const T = structuredClone(f.topics);
      return T[x][q] = z, {
        ...f,
        topics: T
      };
    }
    case zl.TOPICS_EXPAND:
      return {
        ...f,
        topics: [...f.topics, [""]]
      };
    case zl.IDS_ADD:
      return {
        ...f,
        templateIds: [...f.templateIds, ""]
      };
    case zl.IDS_UPDATE:
      return {
        ...f,
        templateIds: [...f.templateIds.slice(0, _), z, ...f.templateIds.slice(_ + 1)]
      };
    case zl.IDS_REMOVE:
      return {
        ...f,
        templateIds: [...f.templateIds.slice(0, _), ...f.templateIds.slice(_ + 1)]
      };
    default:
      throw new Error(`Unhandled action type: ${r}`);
  }
}
function zv() {
  const [f, y] = tl.useState(null), r = tl.useRef(null), s = tl.useCallback((M) => {
    r.current && clearTimeout(r.current), y(M), r.current = setTimeout(() => y(null), 5e3);
  }, []);
  return tl.useEffect(() => () => {
    r.current && clearTimeout(r.current);
  }, []), [f, s];
}
function Uv({ children: f }) {
  const [y, r] = zv();
  return /* @__PURE__ */ E.jsx(Cd, { value: { activeInfo: y, showInfo: r }, children: f });
}
function Nv({ children: f }) {
  const [y, r] = tl.useReducer(Mv, vf);
  return /* @__PURE__ */ E.jsx(xd, { value: y, children: /* @__PURE__ */ E.jsx(Uv, { children: /* @__PURE__ */ E.jsx(Hd, { value: r, children: f }) }) });
}
function xv() {
  const [f, y] = tl.useState(!1), r = pu(), s = yf(r), M = Eu(), z = () => {
    navigator.clipboard.writeText(s), y(!0), setTimeout(() => y(!1), 2e3);
  };
  return /* @__PURE__ */ E.jsxs("div", { className: "border-grey rounded p-1", children: [
    /* @__PURE__ */ E.jsx("h2", { children: "Recipe to Form:" }),
    /* @__PURE__ */ E.jsx(
      "textarea",
      {
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: "false",
        value: s,
        onChange: (x) => M({
          type: zl.UPDATE_RECIPE,
          payload: { value: x.target.value }
        })
      }
    ),
    /* @__PURE__ */ E.jsxs("div", { className: "copy-button-container flex items-center justify-between", children: [
      /* @__PURE__ */ E.jsx("button", { onClick: z, children: "Copy" }),
      f && /* @__PURE__ */ E.jsx("p", { className: "copied", children: "Copied to clipboard!" })
    ] })
  ] });
}
function Au({ children: f }) {
  return /* @__PURE__ */ E.jsx("label", { className: "flex gap-2 items-center flex-wrap", children: f });
}
function Hv({ topicsGroup: f, rowIndex: y, expandButton: r, inputRefSetter: s }) {
  const M = Eu();
  return /* @__PURE__ */ E.jsxs(Au, { children: [
    y === 0 ? "Topics:" : "AND Topics:",
    f.map((z, x) => /* @__PURE__ */ E.jsx(
      "input",
      {
        ref: (q) => s && s(q, y, x),
        className: "topics-input",
        name: `topic-group-${y}-${x}`,
        type: "text",
        value: z,
        onChange: (q) => M({
          type: zl.TOPICS_UPDATE,
          payload: {
            topicsRow: y,
            topicsCol: x,
            value: q.target.value
          }
        })
      },
      x
    )),
    /* @__PURE__ */ E.jsxs("div", { className: "flex gap-1", children: [
      y === 0 && f.length === 1 || /* @__PURE__ */ E.jsx(
        "button",
        {
          onClick: (z) => {
            z.preventDefault(), M({
              type: zl.TOPICS_REMOVE,
              payload: {
                topicsRow: y
              }
            });
          },
          children: "-"
        }
      ),
      f.every(Boolean) && /* @__PURE__ */ E.jsx(
        "button",
        {
          onClick: (z) => {
            z.preventDefault(), M({
              type: zl.TOPICS_ADD,
              payload: { topicsRow: y }
            });
          },
          children: "+"
        }
      ),
      r
    ] })
  ] });
}
function Cv() {
  const f = pu(), y = Eu(), r = f.topics, s = tl.useRef([]), M = tl.useRef(r.length), z = tl.useRef(r.map((_) => _.length));
  tl.useEffect(() => {
    if (r.length > M.current) {
      const _ = r.length - 1;
      s.current[_] && s.current[_][0] && s.current[_][0].focus();
    } else
      for (let _ = 0; _ < r.length; _++) {
        const T = r[_].length, C = z.current[_] || 0;
        if (T > C) {
          const J = T - 1;
          s.current[_] && s.current[_][J] && s.current[_][J].focus();
          break;
        }
      }
    M.current = r.length, z.current = r.map((_) => _.length);
  }, [r]);
  const x = (_, T, C) => {
    s.current[T] || (s.current[T] = []), s.current[T][C] = _;
  }, q = /* @__PURE__ */ E.jsx(
    "button",
    {
      onClick: (_) => {
        _.preventDefault(), y({
          type: zl.TOPICS_EXPAND
        });
      },
      children: "AND"
    }
  );
  return /* @__PURE__ */ E.jsx("div", { className: "flex flex-col items-start", children: r.map((_, T) => /* @__PURE__ */ E.jsx(
    Hv,
    {
      rowIndex: T,
      topicsGroup: r[T],
      expandButton: T === r.length - 1 ? q : null,
      inputRefSetter: x
    },
    T
  )) });
}
function jv({ fieldName: f, content: y }) {
  const { activeInfo: r, showInfo: s } = _v();
  return /* @__PURE__ */ E.jsxs(E.Fragment, { children: [
    /* @__PURE__ */ E.jsx(
      "button",
      {
        type: "button",
        className: "info-button",
        "aria-label": `Show information for ${f}`,
        onClick: () => s(f),
        children: "？"
      }
    ),
    r === f && /* @__PURE__ */ E.jsx("div", { className: "info-content", tabIndex: "0", children: /* @__PURE__ */ E.jsx("small", { children: y }) })
  ] });
}
const Aa = tl.memo(jv);
function Tu({
  label: f,
  name: y,
  title: r,
  value: s,
  onChange: M,
  info: z,
  required: x,
  disabled: q,
  ..._
}) {
  return /* @__PURE__ */ E.jsxs(Au, { children: [
    f,
    /* @__PURE__ */ E.jsx(
      "input",
      {
        name: y,
        type: "text",
        title: r,
        required: x,
        disabled: q,
        value: s,
        onChange: M,
        ..._
      }
    ),
    z && /* @__PURE__ */ E.jsx(
      Aa,
      {
        fieldName: y,
        content: z
      }
    )
  ] });
}
function Xn({
  label: f,
  name: y,
  value: r,
  onChange: s,
  options: M,
  info: z,
  ...x
}) {
  return /* @__PURE__ */ E.jsxs(Au, { children: [
    f,
    /* @__PURE__ */ E.jsx(
      "select",
      {
        name: y,
        value: r,
        onChange: s,
        ...x,
        children: M.map((q) => /* @__PURE__ */ E.jsx("option", { value: q.value, children: q.label }, q.value))
      }
    ),
    z && /* @__PURE__ */ E.jsx(
      Aa,
      {
        fieldName: y,
        content: z
      }
    )
  ] });
}
function pd({
  label: f,
  name: y,
  value: r,
  onChange: s,
  info: M,
  ...z
}) {
  return /* @__PURE__ */ E.jsxs(Au, { children: [
    f,
    /* @__PURE__ */ E.jsx(
      "input",
      {
        name: y,
        type: "number",
        value: r,
        onChange: s,
        ...z
      }
    ),
    M && /* @__PURE__ */ E.jsx(
      Aa,
      {
        fieldName: y,
        content: M
      }
    )
  ] });
}
function Bv({
  label: f,
  name: y,
  value: r,
  onChange: s,
  info: M
}) {
  return /* @__PURE__ */ E.jsxs(Au, { children: [
    /* @__PURE__ */ E.jsx("small", { children: f }),
    /* @__PURE__ */ E.jsx(
      "textarea",
      {
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: "false",
        name: y,
        value: r,
        onChange: s
      }
    ),
    M && /* @__PURE__ */ E.jsx(
      Aa,
      {
        fieldName: y,
        content: M
      }
    )
  ] });
}
function qv({ rowIndex: f, templateId: y, expandButton: r, inputRef: s }) {
  const M = Eu();
  return /* @__PURE__ */ E.jsxs(Au, { children: [
    /* @__PURE__ */ E.jsx(
      "input",
      {
        ref: s,
        className: "template-id-input",
        type: "text",
        value: y,
        name: `template-manual-id-${f}`,
        onChange: (z) => M({
          type: zl.IDS_UPDATE,
          payload: {
            idsRow: f,
            value: z.target.value
          }
        })
      }
    ),
    /* @__PURE__ */ E.jsxs("div", { className: "flex gap-1", children: [
      f === 0 || /* @__PURE__ */ E.jsx(
        "button",
        {
          onClick: (z) => {
            z.preventDefault(), M({
              type: zl.IDS_REMOVE,
              payload: {
                idsRow: f
              }
            });
          },
          children: "-"
        }
      ),
      r
    ] }),
    /* @__PURE__ */ E.jsx(Aa, { fieldName: "template-id", content: "Having manual ids will ignore all filters and boosting. Collection is still needed. Limit can be used in combo with backup recipe. Clicking each Template Result can toggle the display of its id." })
  ] });
}
const jd = 8;
function Yv() {
  const f = pu(), y = Eu(), { templateIds: r } = f, s = tl.useRef([]), M = tl.useRef(r.length);
  tl.useEffect(() => {
    if (r.length > M.current) {
      const x = r.length - 1;
      s.current[x] && s.current[x].focus();
    }
    M.current = r.length;
  }, [r.length]);
  const z = /* @__PURE__ */ E.jsx(
    "button",
    {
      onClick: (x) => {
        x.preventDefault(), y({
          type: zl.IDS_ADD
        });
      },
      children: "ADD ID"
    }
  );
  return /* @__PURE__ */ E.jsx("div", { className: "flex flex-col items-start", children: r.map((x, q) => /* @__PURE__ */ E.jsx(
    qv,
    {
      rowIndex: q,
      templateId: x,
      expandButton: q === r.length - 1 && r.length < jd ? z : null,
      inputRef: (_) => s.current[q] = _
    },
    q
  )) });
}
function Gv() {
  const f = pu(), y = Eu(), r = tl.useCallback(
    (s, M = !1) => ({ target: { value: z } }) => {
      y({
        type: zl.UPDATE_FORM,
        payload: { field: s, value: M ? Number(z) : z }
      });
    },
    [y]
  );
  return /* @__PURE__ */ E.jsxs("form", { className: "border-grey rounded p-1 gap-1", children: [
    /* @__PURE__ */ E.jsx("h2", { children: "Form to Recipe:" }),
    /* @__PURE__ */ E.jsx("h4", { children: "Search Parameters" }),
    /* @__PURE__ */ E.jsx(
      Tu,
      {
        label: "Q:",
        name: "q",
        value: f.q,
        onChange: r("q"),
        info: "Search query. This is more flexible and ambiguous than using filters but also less precise."
      }
    ),
    /* @__PURE__ */ E.jsx(
      Xn,
      {
        label: "Collection:",
        name: "collection",
        value: f.collection,
        onChange: r("collection"),
        options: [
          { value: "default", label: "Default" },
          { value: "popular", label: "Popular" },
          { value: "custom", label: "Use Custom collection ID" }
        ],
        info: "Predefined collections. Select Customized to use specific Collection ID. Defaults to the global collection (urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418). You can also use the Popular collection (urn:aaid:sc:VA6C2:a6767752-9c76-493e-a9e8-49b54b3b9852)."
      }
    ),
    /* @__PURE__ */ E.jsx(
      Tu,
      {
        label: "Collection ID:",
        name: "collectionId",
        value: f.collectionId,
        onChange: r("collectionId"),
        title: "Optional. Defaults to the global collection (urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418). Another common is the popular collection (urn:aaid:sc:VA6C2:a6767752-9c76-493e-a9e8-49b54b3b9852).",
        disabled: f.collection !== "custom",
        required: f.collection === "custom"
      }
    ),
    f.collection === "custom" && !f.collectionId && /* @__PURE__ */ E.jsx("div", { className: "error-message", children: "Collection ID is required when using a custom collection" }),
    /* @__PURE__ */ E.jsx(
      pd,
      {
        label: "Limit:",
        name: "limit",
        value: f.limit,
        onChange: r("limit", !0),
        info: "Number of results to return"
      }
    ),
    /* @__PURE__ */ E.jsx(
      pd,
      {
        label: "Start:",
        name: "start",
        value: f.start,
        onChange: r("start", !0),
        info: "Starting index for the results"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Xn,
      {
        label: "Order by:",
        name: "orderBy",
        value: f.orderBy,
        onChange: r("orderBy"),
        options: [
          { value: "", label: "Relevancy (Default)" },
          { value: "-remixCount", label: "Descending Remix Count" },
          { value: "+remixCount", label: "Ascending Remix Count" },
          {
            value: "-createDate",
            label: "Descending Create Date (New first)"
          },
          {
            value: "+createDate",
            label: "Ascending Create Date (Old first)"
          }
        ],
        info: "Select by which method results would be ordered"
      }
    ),
    /* @__PURE__ */ E.jsx("h4", { children: "Filters (comma separated):" }),
    /* @__PURE__ */ E.jsx(
      Tu,
      {
        label: "Language:",
        name: "language",
        value: f.language,
        onChange: r("language"),
        info: "Available values : ar-SA, bn-IN, cs-CZ, da-DK, de-DE, el-GR, en-US, es-ES, fil-P,fi-FI, fr-FR,hi-IN, id-ID, it-IT, ja-JP, ko-KR, ms-MY, nb-NO, nl-NL, pl-PL, pt-BR, ro-RO, ru-RU, sv-SE, ta-IN, th-TH, tr-TR, uk-UA, vi-VN, zh-Hans-CN, zh-Hant-TW"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Tu,
      {
        label: "Tasks:",
        name: "tasks",
        value: f.tasks,
        onChange: r("tasks")
      }
    ),
    /* @__PURE__ */ E.jsx(Cv, {}),
    /* @__PURE__ */ E.jsx(
      Xn,
      {
        label: "Behaviors:",
        name: "behaviors",
        value: f.behaviors,
        onChange: r("behaviors"),
        options: [
          { value: "", label: "All (Default)" },
          { value: "still", label: "Still" },
          { value: "animated", label: "Animated" },
          { value: "video", label: "Video" },
          { value: "animated,video", label: "Animated + Video" }
        ]
      }
    ),
    /* @__PURE__ */ E.jsx(
      Xn,
      {
        label: "Licensing Category:",
        name: "license",
        value: f.license,
        onChange: r("license"),
        options: [
          { value: "", label: "All (Default)" },
          { value: "free", label: "Free" },
          { value: "premium", label: "Premium" }
        ],
        info: "Premium/Crown icon will be added to Template Results for premium templates"
      }
    ),
    /* @__PURE__ */ E.jsxs("h4", { children: [
      "Manual Template IDs (Max ",
      jd,
      ")"
    ] }),
    /* @__PURE__ */ E.jsx(Yv, {}),
    /* @__PURE__ */ E.jsx("h4", { children: "Boosting:" }),
    /* @__PURE__ */ E.jsx(
      Tu,
      {
        label: "Preferred Language Boosting:",
        name: "prefLang",
        value: f.prefLang,
        onChange: r("prefLang"),
        info: "Boost templates that are in this language. Useful when your results have a mix of languages. Same list as the one for language filter."
      }
    ),
    /* @__PURE__ */ E.jsx(
      Tu,
      {
        label: "Preferred Region Boosting:",
        name: "prefRegion",
        value: f.prefRegion,
        onChange: r("prefRegion"),
        info: "Available values :  AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KR, KV, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, ST, SV, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, YE, YT, ZA, ZM, ZW, ZZ"
      }
    ),
    /* @__PURE__ */ E.jsx("h4", { children: "Backup Recipe:" }),
    /* @__PURE__ */ E.jsx(
      Bv,
      {
        name: "backupRecipe",
        value: f.backupRecipe,
        onChange: r("backupRecipe"),
        label: "When not enough templates exist for the recipe's limit, templates from this backup recipe will be used to backfill. Note: start will stop functioning, and this setup should only be used for 1-page query (no toolbar and pagination)."
      }
    )
  ] });
}
function Xv(f) {
  const [y, r] = tl.useState(null), [s, M] = tl.useState(!0), [z, x] = tl.useState(null);
  return tl.useEffect(() => {
    let q = !1;
    async function _() {
      r(null), M(!0), x(null);
      try {
        const T = await f();
        q || r(T);
      } catch (T) {
        q || x(T);
      } finally {
        q || M(!1);
      }
    }
    return _(), () => {
      q = !0;
    };
  }, [f]), { data: y, loading: s, error: z };
}
function Bd({ template: f }) {
  const y = Od(f), r = Rd(f);
  return /* @__PURE__ */ E.jsx(
    "img",
    {
      src: _d(
        r,
        y,
        f.pages[0]
      ),
      alt: pv(f)
    }
  );
}
function Qv({ template: f }) {
  const y = Od(f), r = Rd(f), { loading: s, data: M, error: z } = Xv(
    tl.useCallback(
      () => Rv(r, y, f.pages[0]),
      [y, r, f.pages]
    )
  );
  return z ? /* @__PURE__ */ E.jsx("div", { children: "Error loading video template." }) : s ? /* @__PURE__ */ E.jsx(Bd, { template: f }) : /* @__PURE__ */ E.jsx("video", { poster: M.poster, muted: !0, autoPlay: !0, loop: !0, children: /* @__PURE__ */ E.jsx("source", { src: M.src }) });
}
function Zv({ template: f }) {
  const y = Ev(f), r = f.licensingCategory === "premium", [s, M] = tl.useState(!1);
  return /* @__PURE__ */ E.jsxs(
    "div",
    {
      className: "flex flex-col template",
      onClick: () => M((z) => !z),
      children: [
        r && /* @__PURE__ */ E.jsx(
          "img",
          {
            className: "icon icon-premium",
            src: "https://www.adobe.com/express/code/icons/premium.svg",
            alt: "premium"
          }
        ),
        y ? /* @__PURE__ */ E.jsx(Qv, { template: f }) : /* @__PURE__ */ E.jsx(Bd, { template: f }),
        s && /* @__PURE__ */ E.jsx("div", { className: "template-id", children: f.id })
      ]
    }
  );
}
function Vv({ generateResults: f, loading: y, results: r }) {
  return /* @__PURE__ */ E.jsx("button", { onClick: f, disabled: y, children: y ? "Generating..." : r ? "Regenerate" : "Generate" });
}
function Lv() {
  var T, C, J;
  const f = pu(), y = yf(f), [r, s] = tl.useState(null), [M, z] = tl.useState(!1), [x, q] = tl.useState(null), _ = async () => {
    s(null), z(!0), q(null);
    try {
      const $ = await Tv(y);
      s($);
    } catch ($) {
      q($);
    } finally {
      z(!1);
    }
  };
  return /* @__PURE__ */ E.jsxs("div", { className: "border-grey rounded p-1 gap-1", children: [
    /* @__PURE__ */ E.jsx("h2", { children: "Results" }),
    /* @__PURE__ */ E.jsx(
      Vv,
      {
        generateResults: _,
        loading: M,
        results: r
      }
    ),
    M && /* @__PURE__ */ E.jsx("p", { children: "Loading..." }),
    x && /* @__PURE__ */ E.jsxs("p", { children: [
      "Error: ",
      x.message
    ] }),
    ((T = r == null ? void 0 : r.metadata) == null ? void 0 : T.totalHits) > 0 && /* @__PURE__ */ E.jsxs("p", { children: [
      "Total hits: ",
      r.metadata.totalHits
    ] }),
    ((C = r == null ? void 0 : r.metadata) == null ? void 0 : C.totalHits) === 0 && /* @__PURE__ */ E.jsx("p", { children: "No results found. Try different recipe." }),
    ((J = r == null ? void 0 : r.items) == null ? void 0 : J.length) > 0 && /* @__PURE__ */ E.jsx("div", { className: "flex flex-wrap gap-2 row-gap-7 templates", children: r.items.map(($) => /* @__PURE__ */ E.jsx(Zv, { template: $ }, $.id)) })
  ] });
}
function Kv() {
  const f = pu(), { url: y, headers: r, backupQuery: s } = hf(yf(f)), M = s ? /* @__PURE__ */ E.jsxs("div", { className: "pt-1", children: [
    /* @__PURE__ */ E.jsx("div", { children: /* @__PURE__ */ E.jsxs("code", { children: [
      "Backup URL: ",
      s.url
    ] }) }),
    /* @__PURE__ */ E.jsx("div", { children: /* @__PURE__ */ E.jsxs("code", { children: [
      "Backup Headers: ",
      JSON.stringify(s.headers, null, 2)
    ] }) })
  ] }) : null;
  return /* @__PURE__ */ E.jsxs("div", { className: "border-grey rounded p-1", children: [
    /* @__PURE__ */ E.jsx("h2", { children: "Support" }),
    /* @__PURE__ */ E.jsxs("p", { children: [
      "Authoring questions, copy the ",
      /* @__PURE__ */ E.jsx("strong", { children: "recipe (left)" }),
      " and ask in",
      " ",
      /* @__PURE__ */ E.jsx("a", { href: "https://adobe.enterprise.slack.com/archives/C04UH0M1CRG", children: "#express-dev-core" }),
      "."
    ] }),
    /* @__PURE__ */ E.jsxs("p", { children: [
      "API/Content Tagging questions, copy the url and headers below and ask in",
      " ",
      /* @__PURE__ */ E.jsx("a", { href: "https://adobe.enterprise.slack.com/archives/C01KV8N5EPR", children: "#express-content-clients" }),
      "."
    ] }),
    /* @__PURE__ */ E.jsxs("div", { className: "support--code", children: [
      /* @__PURE__ */ E.jsxs("div", { children: [
        /* @__PURE__ */ E.jsx("div", { children: /* @__PURE__ */ E.jsxs("code", { children: [
          "URL: ",
          y
        ] }) }),
        /* @__PURE__ */ E.jsx("div", { children: /* @__PURE__ */ E.jsxs("code", { children: [
          "headers: ",
          JSON.stringify(r, null, 2)
        ] }) })
      ] }),
      M
    ] })
  ] });
}
function Jv() {
  return /* @__PURE__ */ E.jsx(yv, { children: /* @__PURE__ */ E.jsx(Nv, { children: /* @__PURE__ */ E.jsxs("div", { className: "app-container m-auto", children: [
    /* @__PURE__ */ E.jsx("h1", { children: "Templates as a Service (TaaS)" }),
    /* @__PURE__ */ E.jsxs("div", { className: "flex flex-wrap gap-1", children: [
      /* @__PURE__ */ E.jsxs("div", { className: "left-container flex flex-col gap-1", children: [
        /* @__PURE__ */ E.jsx(xv, {}),
        /* @__PURE__ */ E.jsx(Gv, {})
      ] }),
      /* @__PURE__ */ E.jsxs("div", { className: "right-container flex flex-col gap-1", children: [
        /* @__PURE__ */ E.jsx(Kv, {}),
        /* @__PURE__ */ E.jsx(Lv, {})
      ] })
    ] })
  ] }) }) });
}
function wv(f = "root") {
  const y = document.getElementById(f);
  if (!y) {
    console.error(`Container with id "${f}" not found`);
    return;
  }
  const r = vv.createRoot(y);
  return r.render(
    /* @__PURE__ */ E.jsx(tl.StrictMode, { children: /* @__PURE__ */ E.jsx(Jv, {}) })
  ), r;
}
typeof window < "u" && document.getElementById("root") && wv("root");
export {
  wv as initTemplatesAsAService
};
//# sourceMappingURL=templates-as-a-service.min.es.js.map
