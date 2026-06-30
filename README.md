# React + TypeScript + Vite

## Supabase Sicherheit

Die App greift aus dem Browser nicht direkt auf geschuetzte Tabellen zu, sondern verwendet serverseitig gepruefte Supabase RPC-Funktionen. Die zugehoerige RLS- und RPC-Migration liegt unter `supabase/migrations/20260628123000_secure_data_access.sql`.

Details zu Tabellen, Policies, Adminrechten und verbleibenden Grenzen stehen in `docs/security.md`.

Eine Uebersicht ueber Aufbau, Datenfluss und wichtige Architekturentscheidungen steht in `docs/architecture.md`.

Die technische Referenz zum aktuellen Datenbankschema steht in `docs/database-schema.md`.

## Tests

Die Unit Tests werden mit Vitest, React Testing Library, jest-dom, jsdom und dem V8 Coverage Provider ausgeführt.

### Lokale Testausführung

```bash
npm test
```

Weitere Testbefehle:

```bash
npm run test:watch
npm run test:coverage
```

Die Testdateien liegen unter `src/test`. Das globale Setup befindet sich in `src/test/setupTests.ts` und wird zentral über `vite.config.ts` eingebunden.

### Automatische Testausführung

Bei jedem Push und bei jedem Pull Request werden die Unit Tests automatisch über GitHub Actions ausgeführt.

Das Ergebnis der Testausführung ist im GitHub Repository unter **Actions** sichtbar. Schlägt ein Test fehl, kann die Ursache im jeweiligen Workflow Log nachvollzogen werden.


## PWA lokal prüfen

```bash
npm run build
npm run preview
```

Die Preview-URL im Browser öffnen und in den DevTools unter `Application` prüfen, ob Manifest und Service Worker vorhanden sind. Für einen Install-Test auf einem mobilen Gerät die Preview über eine HTTPS-fähige Umgebung oder ein lokales Netzwerk-Setup mit gültigem HTTPS öffnen und anschließend die Browser-Funktion `Zum Startbildschirm hinzufügen` verwenden.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
