# React + TypeScript + Vite

## Tests

Die Unit-Test-Infrastruktur nutzt Vitest, React Testing Library, jest-dom,
jsdom und den V8 Coverage Provider.

```bash
npm run test
npm run test:watch
npm run test:coverage
```

Testdateien liegen gebuendelt unter `src/test`. Das globale Setup befindet
sich in `src/test/setupTests.ts` und wird zentral ueber `vite.config.ts`
eingebunden. Die vorhandenen Beispieltests pruefen nur die lokale
Test-Infrastruktur und vermeiden Supabase-Zugriffe durch Mocks.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

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
