# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server (scan QR or press a/i/w to open)
npm run android        # Start on Android emulator/device
npm run ios            # Start on iOS simulator/device
npm run web            # Start on web browser
npm run lint           # Run ESLint via expo lint
```

No test runner is configured yet.

## Architecture

This is an **Expo 55 / React Native 0.83** app using **Expo Router** (file-based routing). Source lives under `src/` with the `@/` path alias resolving to `src/`.

This is a **Task Assignment App** — multi-tenant SaaS for field task management. Three mobile roles: Business Owner (BO), Operation Team (OT), Staff. Role values in code: `business_owner`, `operator`, `staff`.

### Auth

Auth is handled by `src/context/auth.tsx` (`AuthProvider` / `useAuth()`). It persists a JWT token via `tokenStore` (in `src/lib/api/client.ts`) and exposes: `login`, `logout`, `register`, `selectTenant`, `refreshProfile`, `role`, `user`, `pendingSelection`.

Login may return a `requires_tenant_selection` response — in this case `pendingSelection` is set and the user is redirected to `/(auth)/select-tenant` before a token is issued.

`src/app/index.tsx` uses `useAuth()` to redirect:
1. Loading → `<LoadingScreen />`
2. `pendingSelection` → `/(auth)/select-tenant`
3. Not logged in → `/(auth)/login`
4. Has pending invitations → `/(auth)/invitations`
5. By role: `business_owner` → `/(bo)`, `operator` → `/(ot)`, `staff` → `/(staff)`

### Routing

`src/app/` is the Expo Router root. `_layout.tsx` wraps the entire app in `ThemeProvider` + `AnimatedSplashOverlay` and renders a `Stack` navigator.

#### Route groups by role

```
src/app/
├── _layout.tsx              → Stack navigator (ThemeProvider + AnimatedSplashOverlay)
├── index.tsx                → Auth-aware redirect (useAuth → bo/ot/staff/auth)
├── notifications.tsx        → Shared — Notification Center (all roles)
│
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx            → Login (AU-01 to AU-05)
│   ├── register.tsx         → Register new account + tenant
│   ├── select-tenant.tsx    → Tenant picker (multi-tenant login flow)
│   └── invitations.tsx      → Pending staff invitations on first login
│
├── (bo)/                    → Business Owner screens
│   ├── _layout.tsx
│   ├── index.tsx            → Dashboard Overview (TM-11)
│   ├── audit-log.tsx        → Audit Log — BO only (AL-01 to AL-06)
│   ├── employees.tsx        → Employee Management — full access (UM-01 to UM-08)
│   ├── rejected-overdue.tsx → Rejected/Overdue Handling
│   └── tasks/
│       ├── index.tsx        → Task Manager (TM-07, TM-09, TM-10)
│       ├── [id].tsx         → Task Detail — management view (TM-08, AL-05)
│       └── create.tsx       → Create/Edit Task (TM-01 to TM-06)
│
├── (ot)/                    → Operation Team screens
│   ├── _layout.tsx
│   ├── index.tsx            → Team Dashboard
│   ├── assignment.tsx       → Task Assignment (TM-04)
│   ├── employees.tsx        → Employee Management — invite only (UM-01 to UM-06)
│   ├── rejected-overdue.tsx → Rejected/Overdue Handling
│   └── tasks/
│       ├── index.tsx        → Task List (same filters as BO)
│       ├── [id].tsx         → Task Detail — management view (same as BO)
│       └── create.tsx       → Create/Edit Task
│
└── (staff)/                 → Staff screens
    ├── _layout.tsx
    ├── index.tsx            → My Task List (ST-01)
    ├── history.tsx          → Work History (ST-03)
    └── tasks/
        └── [id].tsx         → Task Detail & Execution — check in/out, reject (ST-02, CI-01 to CI-06)
```

#### Shared screens (BO + OT)

Task Detail, Task Create/Edit, Employee Management, and Rejected/Overdue exist in both `(bo)/` and `(ot)/` with different permission levels. They should share underlying components but maintain separate routes.

#### Staff Task Detail is independent

`(staff)/tasks/[id].tsx` is a completely different screen from the management view — it renders Check In, Check Out, and Reject actions. Do not merge it with BO/OT task detail.

### API layer

`src/lib/api/` contains all backend API modules:

| Module | Purpose |
|---|---|
| `client.ts` | Axios base client + `tokenStore` (JWT persistence) |
| `auth.ts` | login, logout, register, profile, selectTenant |
| `me.ts` | Current user profile endpoints |
| `tasks.ts` | Task CRUD, list, status transitions |
| `staff.ts` | Staff management + `myInvitations()` |
| `audit.ts` | Audit log queries |
| `notifications.ts` | Notification endpoints |

Types for all API responses live in `src/types/api.ts`.

### Platform-specific files

The codebase uses Expo's `.web.ts(x)` extension convention to swap implementations per platform:

| Native | Web |
|---|---|
| `animated-icon.tsx` | `animated-icon.web.tsx` |

`app-tabs.tsx` and `app-tabs.web.tsx` exist in `src/components/` but are no longer used in the root layout (kept for reference when building role-specific tab UIs).

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
