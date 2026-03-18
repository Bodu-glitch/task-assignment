# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server (scan QR or press a/i/w to open)
npm run android        # Start on Android emulator/device
npm run ios            # Start on iOS simulator/device
npm run web            # Start on web browser
npm run lint           # Run ESLint via expo lint
npm run reset-project  # Move starter code to app-example/ and start fresh
```

No test runner is configured yet.

## Architecture

This is an **Expo 55 / React Native 0.83** app using **Expo Router** (file-based routing). Source lives under `src/` with the `@/` path alias resolving to `src/`.

### Routing

`src/app/` is the Expo Router root. `_layout.tsx` wraps the entire app in React Navigation's `ThemeProvider` and renders `AppTabs`. Screens are `index.tsx` (Home) and `explore.tsx` (Explore).

### Platform-specific files

The codebase uses Expo's `.web.ts(x)` extension convention to swap implementations per platform:

| Native | Web |
|---|---|
| `app-tabs.tsx` — uses `expo-router/unstable-native-tabs` `NativeTabs` | `app-tabs.web.tsx` — uses `expo-router/ui` `Tabs`/`TabList` |
| `animated-icon.tsx` | `animated-icon.web.tsx` |
| `use-color-scheme.ts` | `use-color-scheme.web.ts` (adds hydration guard for static rendering) |

### Theming

Tailwind CSS (NativeWind v5 / Tailwind v4) is the single theming layer. All theme customisation goes in `src/global.css` using `@theme`:

```css
@layer theme {
  @theme {
    --color-brand: #208AEF;
  }
}
```

Light/dark mode is handled with Tailwind's `dark:` variant. Platform-specific CSS variables use `@media ios` / `@media android` blocks (already in `global.css`). `postcss.config.mjs` drives the PostCSS pipeline; `metro.config.js` wires it into Metro.

**CSS-wrapped components** in `src/tw/` must be used instead of bare `react-native` primitives — core RN components do not accept `className` directly:

| Import | Components |
|---|---|
| `@/tw` | `View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, `TouchableHighlight`, `Link`, `useCSSVariable` |
| `@/tw/image` | `Image` |
| `@/tw/animated` | `Animated.View` |

**Layout constants** that are used in JS logic (not just styling) live in `src/constants/theme.ts`: `BottomTabInset`, `MaxContentWidth`. `Spacing` and `Colors`/`Fonts` are redundant with Tailwind and should not be used for new code.

`ThemedText`, `ThemedView`, and `useTheme()` are legacy — do not use them for new components.

### `app.json` notes

- `experiments.typedRoutes` and `experiments.reactCompiler` are both enabled.
- Web output is `"static"`.
