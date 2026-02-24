# Hotel App (React Native) – Guide for React Developers

This guide explains **hotel-app** file by file. You already know React; here you’ll see how it’s used in a **React Native** app (mobile) and how the project is structured.

---

## 1. React vs React Native (quick recap)

- **React (web):** Uses `<div>`, `<span>`, `<button>`, etc. Styling with CSS.
- **React Native:** Uses `<View>`, `<Text>`, `<Pressable>`, etc. No CSS files; styles are JavaScript objects or **NativeWind** (Tailwind-like classes, e.g. `className="flex-1"`).

So when you see `View`, `Text`, `Pressable`, `ScrollView` — they’re the mobile equivalents of `div`, `span`, `button`, and a scrollable container.

---

## 2. Project root

### `package.json`

- **App name:** `travio` (internal name).
- **Framework:** React Native 0.78, React 19.
- **Scripts:**
  - `npm run android` / `npm run ios` — run on device/simulator (production).
  - `npm run android:dev` / `npm run ios:dev` — development.
  - `npm run start` — start Metro bundler (like “dev server” for React Native).
- **Important libraries:**
  - **Navigation:** `@react-navigation/native`, `native-stack`, `bottom-tabs`.
  - **State:** `zustand`, `@reduxjs/toolkit`, `@tanstack/react-query`.
  - **UI:** `@gluestack-ui/*`, `nativewind` (Tailwind-style).
  - **Forms:** `react-hook-form`, `yup`, `@hookform/resolvers`.
  - **i18n:** `i18next`, `react-i18next`.
  - **API:** `axios`.
  - **Auth storage:** `react-native-keychain`.
  - **Firebase:** messaging, perf.

### `index.js`

- **Entry point** of the app (like `index.html` + root component in web).
- Registers the app with React Native via `AppRegistry.registerComponent(appName, () => App)`.
- Imports `App` from `./App`.
- Sets up Firebase background message handler for push notifications.

### `App.tsx` (root component)

- Wraps the whole app and runs **one-time setup**:
  - **Google Sign-In** config (from `react-native-config` env).
  - **Permissions:** location and notification (via custom hooks).
  - **Auth:** `initializeAuth()` from Zustand (restore token from Keychain).
  - **Language:** `initializeLanguage()` from language store.
  - **Push:** when a message is received in foreground, shows a local notification (Notifee).
- After init, hides the splash screen (`BootSplash.hide`).
- **Component tree:**
  - `QueryClientProvider` (React Query)
  - → `GluestackUIProvider` (UI theme)
  - → `AppNavigator` (all navigation)

So: **one root component, providers, then navigation**. No router like React Router; navigation is stack/tab-based.

### `tsconfig.json`

- **Path alias:** `@/*` → `src/*` so you can do `import x from '@/store'` instead of `../../../store`.
- Same idea as `paths` in a Vite/React web app.

### `tailwind.config.js` / `global.css`

- **NativeWind** brings Tailwind-style utility classes to React Native.
- You’ll see `className="flex-1 gap-y-6"` in components — that’s NativeWind, not web CSS.

---

## 3. Navigation (`src/navigation/`)

Navigation is **stack-based** (screens stacked on top of each other) and **tab-based** (bottom tabs). Think of it like: “one stack of screens per tab, plus many stacks for modals/details.”

### `Navigator.ts`

- **Stack:** `createNativeStackNavigator<RootStackParamList>()` — one stack for the whole app.
- **Tab:** `createBottomTabNavigator<RootStackParamList>()` — bottom tabs (Home, Search, Map, Profile).
- **Ref:** `navigationRef` so you can navigate from outside React (e.g. after login).
- **Helper:** `navigate(name, params)` uses that ref to navigate by route name.

### `AppNavigator.tsx`

- Wraps the app in:
  - `SafeAreaProvider`, `KeyboardProvider`, `GestureHandlerRootView`, `I18nextProvider`, `BottomSheetModalProvider`
  - `NavigationContainer` (the “router” of React Navigation)
  - `ModalProvider`, `AlertProvider`
  - `ToastProvider` at the end
- Reads **auth state:** `isAuthenticated` from `useAuthStore()`.
- Renders **one** `Stack.Navigator` with:
  - **Private routes** (only if `isAuthenticated`): e.g. Preview Reservation, Wishlist, Profile details, etc.
  - **Public routes** (always): tabs, hotel/room details, search, auth screens, settings, etc.

So: **same stack**, but some screens exist only when the user is logged in.

### `StackNavigator.tsx`

- **PublicStackNavigator:** Defines all **public** screens as `Stack.Screen` components:
  - Tab navigator (main 4 tabs)
  - Hotel detail, room list, room detail, image galleries
  - Search (main + default)
  - Auth: Welcome, Sign In, Sign Up (phone/email), Create Password, Forgot/Reset Password, OTP
  - Deals: coupon list/detail
  - Profile-related: region, announcements, settings, language, currency, notifications, etc.
- **PrivateStackNavigator:** Defines **logged-in-only** screens:
  - Preview reservation, wishlist, reviews, reservation history, profile detail, FAQ, receipt, account settings, support Q&A, delete/deactivate account, etc.
- **paths:** Route names come from `PublicPath` and `PrivatePath` enums (see `paths.ts`).

### `TabNavigator.tsx`

- **Bottom tabs:** Home, Search, Map (Around), Profile.
- Each tab is a **screen component:** `HomeScreen`, `SearchScreen`, `MapScreen`, `ProfileScreen`.
- Tab icons: SVG components (e.g. `HomeIcon`, `HomeActiveIcon`) — active/inactive state.
- Uses `useTypedTranslation()` for labels (e.g. `t('bottom_tab.home')`).
- **Custom tab bar:** `BottomTabLayout`, `ScreenLayout` from `@/components/layout`.

### `paths.ts`

- **PublicPath** and **PrivatePath** are enums of **route names** (strings).
- Used everywhere for type-safe navigation: `navigate(PublicPath.HOTEL_DETAIL, { id })` instead of raw strings.

---

## 4. State management

### Zustand stores (`src/store/`)

**authStore** (`store/features/authStore.ts`):

- **State:** `token`, `isAuthenticated`, `selectedRegionCode`, `isLoading`.
- **Actions:** `login`, `logout`, `changeRegionCode`, `setLoading`, `initializeAuth`.
- **Persistence:** Uses `persist` with AsyncStorage (and Keychain for the actual token). On app open, `initializeAuth()` reads from Keychain and sets `token` / `isAuthenticated`.
- Used in `App.tsx` for init and in `AppNavigator` to show/hide private routes.

**languageStore** (`store/shared/languageStore.ts`):

- **State:** `currentLanguage`.
- **Actions:** `changeLanguage`, `initializeLanguage`.
- **Persistence:** Stored so the app remembers the selected language. Also calls `i18n.changeLanguage()`.

Other stores (search, reservation, profile, etc.) are exported from `store/index.ts` and used in their feature areas.

---

## 5. API layer (`src/api/`)

### `instance.ts`

- **Axios instance** with `baseURL` from `react-native-config` (env).
- Request/response interceptors are set up (can add logging or token refresh later).

### `controller.ts`

- **Generic API caller:** `controller(endpoint, data?, config?, signal?)`.
- **Endpoint format:** string like `"post:/app/login"` or `"get:/app/hotel/detail"` — first part method, second part URL path (relative to baseURL).
- **Auth:** Gets token via `getToken()` from `@/utils/api.util` and adds `Authorization: Bearer <token>` to headers.
- **Errors:** On failure, throws an object with `status`, `data`, `message`, `isAxiosError`. On 401 you could add logout or refresh logic.

### `endpoints.ts`

- **Central list of API routes** as `"method:path"` strings (e.g. auth, hotels, banners, notifications, booking, payment, coupons, search, profile).
- Services import these and pass them to `controller`.

### Services (e.g. `services/auth.service.ts`)

- **Plain async functions** that call `controller(endpoint, payload, options)`.
- Examples: `signInService`, `otpSendService`, `otpValidateService`, `createNewPasswordService`, `loginGoogleService`, etc.
- They don’t use React; they’re just “API functions.” React Query or components call these.

---

## 6. API hooks – React Query (`src/api-hooks/`)

These are **React hooks** that use **TanStack React Query** (same idea as in React web) to call the API and cache results.

### `QueryClientProvider.tsx` (in `src/provider/`)

- Creates a **QueryClient** with retry and cache options.
- Wraps the app so every screen can use `useQuery` / `useMutation`.

### Example: `api-hooks/home/queries.ts`

- **useGetBannerListQuery()** — `useQuery` with `queryKey: ['banner-list']`, fetches banners.
- **useGetCategoryListQuery(param)** — categories by param.
- **useGetHotelListForHomeQuery(query, payload)** — hotel list for home.
- **useGetNotificationListQuery(paging, notiType)** — **useInfiniteQuery** for paginated notifications; `getNextPageParam` for “load more.”
- **useGetBannerDetailQuery(id)** — single banner; `enabled: !!id` so it only runs when `id` exists.

So: **queries** = fetching/caching, **mutations** (in `mutations.ts`) = login, submit, etc. Screens and components use these hooks instead of calling services directly.

---

## 7. Utils (`src/utils/`)

- **api.util.ts:** `getToken`, `saveToken`, `deleteToken` (Keychain), `createFormData`, and **errorMapper** to turn API error objects into user-facing messages (2xx/4xx/5xx).
- **storage.util.ts:** Wrappers around AsyncStorage if used.
- **formatter.util.ts**, **dateTime.util.ts**, **notification.util.ts:** Formatting, dates, and notification helpers.

---

## 8. Types and schema (`src/types/`, `src/schema/`)

- **types:** TypeScript interfaces for the app (e.g. auth, profile, shared).
- **schema:** Often request/response shapes for API (e.g. `ISignUpRequest`, `IResetPassword`). Used by services and hooks.

---

## 9. Screens (`src/screens/`)

Screens are **React components** that are registered as `Stack.Screen` or `Tab.Screen` components. They use the same patterns you know from React: hooks, state, and child components.

### Example: `screens/home/HomeScreen.tsx`

- Uses **React Query:** `queryClient.prefetchQuery({ queryKey: ['userInfo'] })` and a refetch list for categories, banners, coupons, hotel list.
- **UI:** A single `TabBarContentLayout` (scroll + pull-to-refresh) containing:
  - `HomeHeaderSection`
  - `HomeCategorySection`
  - `BannerSlideSection`
  - `HomeDiscountCoupon`
  - `MostPopularSection`
- So the “page” is just a composition of **feature components** + layout. No direct API calls here; the section components use the api-hooks.

### Example: `screens/welcome/Login.tsx`

- Local state: `username`, `password`, validation flags.
- Can use **Redux** (`useLoginMutation`, `setToken`, `useDispatch`) in some versions, or **Zustand** in others — same idea: call login API, store token, navigate to main (e.g. `navigate('Main')`).
- Uses **i18n:** `t('label_username')`, `t('message_auth_failed')`, etc.
- UI: Gluestack form components (`FormControl`, `Input`, `Button`, etc.) and `className` for layout.

---

## 10. Components

### Layout (`src/components/layout/`)

- **TabBarContentLayout:** ScrollView with pull-to-refresh and bottom padding so content isn’t hidden behind the tab bar. Used on Home and similar screens.
- **ContentLayout**, **BottomTabLayout**, **ScreenLayout:** Reusable wrappers for padding, safe area, and tab bar.

### UI (`src/components/ui/`)

- Gluestack UI building blocks: Button, Input, FormControl, Icon, Alert, Checkbox, etc. They’re React Native components with a consistent API (e.g. `size`, `variant`).

### Feature components (`src/components/features/`)

- **home:** e.g. `HomeHeaderSection`, `HomeCategorySection`, `BannerSlideSection`, `MostPopularSection`, `HotelDetailHeader`, `HotelSlideImage`, etc.
- **search,** **reservation,** **profile,** **deals,** **authentication,** **map:** same idea — sections or pieces used by the corresponding screens.

Example: **HomeHeaderSection** uses `useAuthStore()`, `useNavigation()`, `useGetUserInfoQuery`, `useGetNotificationListQuery`, and renders header + notification icon or “Sign in” button. So: **hooks for data and auth, layout and UI components for presentation.**

---

## 11. Providers (`src/provider/`)

- **QueryClientProvider:** React Query client.
- **GluestackUIProvider:** In `App.tsx`; theme for Gluestack.
- **ModalProvider,** **AlertProvider,** **ToastProvider:** Global modal, alert, and toast UI (used from anywhere in the app).
- **LanguageTranslationProvider:** If used, wraps i18n context; often the app uses `I18nextProvider` in `AppNavigator` with `i18n` from `@/locales/i18n`.

---

## 12. Locales (`src/locales/`)

- **i18n.ts:** Configures **i18next**: loads language from AsyncStorage, sets `resources` (e.g. `en`, `mn`, `kr`, `mm`), `fallbackLng`, and `interpolation`.
- **lang/*.json:** Translation keys and strings per language. In components you use `useTranslation()` or `useTypedTranslation()` and `t('key')`.

---

## 13. Theme (`src/theme.js`)

- **colors:** Objects like `primary`, `neutral`, `yellow`, `error` with shades (50–900). Used in styles and by Gluestack so the app looks consistent.

---

## 14. How it all fits together (flow)

1. **App starts** → `index.js` registers `App`.
2. **App.tsx** runs → permissions, `initializeAuth()` (Keychain), `initializeLanguage()`, then hides splash and renders providers + `AppNavigator`.
3. **AppNavigator** reads `isAuthenticated` → renders Stack with public + (if logged in) private screens.
4. **Default route** is the **Tab** navigator (e.g. `PublicPath.TAB`) → user sees Home, Search, Map, Profile.
5. **Screens** (e.g. Home) use **api-hooks** (React Query) to load data and **Zustand** for auth/global UI state; they render **layout** + **feature components**.
6. **Feature components** use the same hooks and **navigation** (`navigate(PublicPath.HOTEL_DETAIL, { id })`) to open detail screens.
7. **Auth:** Login screen calls auth service (or mutation), then auth store’s `login(token)` and Keychain; navigator re-renders and shows private routes.
8. **API:** Services use `controller` + `endpoints`; controller adds Bearer token from `getToken()`. Errors are handled in the caller or via `errorMapper`.

---

## 15. Summary for a React developer

| Concept        | In React (web)     | In this app (React Native)        |
|----------------|--------------------|-----------------------------------|
| Entry         | index.html + root  | `index.js` + `App.tsx`            |
| “Pages”       | React Router       | React Navigation (Stack + Tab)   |
| State         | Context/Redux/etc. | Zustand (+ some Redux)           |
| Server state  | React Query/SWR     | TanStack React Query             |
| API calls     | fetch/axios         | axios `controller` + services     |
| Styling       | CSS/Tailwind       | NativeWind + StyleSheet          |
| UI components | Your design system | Gluestack UI + custom            |
| i18n          | react-i18next      | Same (i18next + react-i18next)   |

If you open any file, you can now guess: **navigation** = routes and stacks; **store** = global state; **api + api-hooks** = backend; **screens** = pages; **components** = reusable UI and sections. Use this doc as a map and jump into the file you care about (e.g. a screen or an api-hook) to see the exact code.
