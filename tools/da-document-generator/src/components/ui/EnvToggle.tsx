import type { GmcEnv } from '../../types';

interface Props {
  value: GmcEnv;
  onChange: (env: GmcEnv) => void;
  disabled?: boolean;
}

const ENVS: GmcEnv[] = ['test', 'prod'];
const LABELS: Record<GmcEnv, string> = { test: 'Test', prod: 'Prod' };

/** Segmented Test/Prod control. Used by the GMC submit dialog to pick the submission environment. */
export default function EnvToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
      {ENVS.map((env) => (
        <button
          key={env}
          type="button"
          disabled={disabled}
          onClick={() => onChange(env)}
          className={`px-3 py-1 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            value === env ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {LABELS[env]}
        </button>
      ))}
    </div>
  );
}
