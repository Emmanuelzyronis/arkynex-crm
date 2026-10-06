import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React 19's compiler rules flag deliberate, pre-existing patterns
      // (resetting dialog state when it closes; a display-only countdown).
      // Keep them visible as warnings so CI stays green on errors.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".test-dist/**",
    "scripts/**",
  ]),
]);
