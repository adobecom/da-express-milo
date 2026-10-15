/**
 * Statistics: summarizing a set of runs, and a Welch's-t-test confidence
 * interval for the difference between two summaries.
 *
 * Everything here operates on plain numbers/summary objects, not on "LCP"
 * specifically — the same `welch()`/`summarize()` pair works for any metric
 * that produces one numeric value per run (CLS, TBT, etc.), which is what
 * lets compare.mjs stay a thin CLI as more metrics are added.
 */

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const stdev = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

// Turn a list of measureRun() results into a stats summary of their `.lcp`
// values (null/errored runs excluded). Hardcoded to `.lcp` for now since LCP
// is the only metric compare.mjs measures today; generalize to an accessor/key
// argument when a second metric (e.g. CLS) is added.
export function summarize(runs) {
  const values = runs.filter((r) => r.error == null && r.lcp != null).map((r) => r.lcp);
  if (!values.length) return null;
  return {
    n: values.length,
    values,
    mean: mean(values),
    median: median(values),
    stdev: stdev(values),
    variance: values.length > 1 ? stdev(values) ** 2 : 0,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// --- Student's t-distribution (pure JS, no deps) --------------------------
// Used to put a confidence interval on the difference of two means and to get
// a p-value, so the verdict reflects whether the observed delta is
// statistically distinguishable from zero rather than just clearing a fixed
// threshold. Implemented via the regularized incomplete beta function
// (Numerical Recipes betacf/betai + Lanczos gammaln).

function gammaln(x) {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += cof[j] / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(x, a, b) {
  const MAXIT = 200;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

// Regularized incomplete beta I_x(a, b).
export function betai(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

// Two-sided p-value for a t statistic: P(|T| > |t|) with `df` degrees of freedom.
export function tTwoSidedP(t, df) {
  if (!Number.isFinite(t)) return 0;
  const x = df / (df + t * t);
  return betai(x, df / 2, 0.5);
}

// Critical t value t* such that P(-t* < T < t*) = confidence, via bisection on
// the (monotonic) two-sided p-value.
export function tCritical(df, confidence) {
  const target = 1 - confidence; // desired two-sided tail mass
  let lo = 0;
  let hi = 1e6;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tTwoSidedP(mid, df) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Welch's two-sample t-test (unequal variances) on test vs control means.
// delta = test.mean - control.mean (negative => test is faster => improvement).
export function welch(test, control, confidence) {
  const a = test;
  const b = control;
  if (!a || !b || a.n < 2 || b.n < 2) return null;
  const delta = a.mean - b.mean;
  const se = Math.sqrt(a.variance / a.n + b.variance / b.n);
  if (se === 0) {
    // No within-group variance at all: CI collapses to the point estimate.
    return { delta, se, t: delta === 0 ? 0 : Infinity, df: a.n + b.n - 2, p: delta === 0 ? 1 : 0, ci: [delta, delta], confidence };
  }
  const t = delta / se;
  const df =
    (a.variance / a.n + b.variance / b.n) ** 2 /
    ((a.variance / a.n) ** 2 / (a.n - 1) + (b.variance / b.n) ** 2 / (b.n - 1));
  const p = tTwoSidedP(t, df);
  const tCrit = tCritical(df, confidence);
  const ci = [delta - tCrit * se, delta + tCrit * se];
  return { delta, se, t, df, p, ci, confidence };
}

// Rough runs-per-URL needed to detect a true difference of |delta| at the given
// confidence and 80% power, using the observed variances. Normal-approximation
// power formula: n = (z_alpha/2 + z_beta)^2 (var_t + var_c) / delta^2, with a +1
// bump to partly offset the t-vs-normal small-sample gap. Answers "how many runs
// would I have needed?" when a result comes back inconclusive.
export function suggestRuns(test, control, delta, confidence) {
  if (!delta || !Number.isFinite(delta)) return null;
  const zAlpha = tCritical(1e7, confidence); // ~= normal quantile at large df
  const zBeta80 = 0.8416;
  const n = ((zAlpha + zBeta80) ** 2 * (test.variance + control.variance)) / delta ** 2;
  return Math.ceil(n) + 1;
}
