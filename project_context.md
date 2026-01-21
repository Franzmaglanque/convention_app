# Convention POS Mobile App - Project Context

## Project Overview
A React Native mobile application for Puregold Convention POS system, designed for suppliers to manage store visits, transactions, and inventory. The app provides authentication, store management, and transaction processing capabilities.

## Core Goals & Objectives
1. **Supplier Authentication**: Secure login system for suppliers to access their accounts
2. **Store Management**: View and manage assigned stores for visits
3. **Transaction Processing**: Handle sales transactions during store visits
4. **Inventory Tracking**: Monitor product inventory across stores
5. **Offline Capability**: Support for offline data collection with sync functionality
6. **Real-time Updates**: Live updates for store status and transaction processing

## Tech Stack

### Core Framework & Libraries
- **React Native**: 0.81.5 (with Expo 54.0.31)
- **Expo Router**: 6.0.21 (File-based routing)
- **TypeScript**: 5.9.2 (Type-safe development)
- **React**: 19.1.0 (Latest React version)

### State Management & Data Fetching
- **React Query (TanStack)**: 5.90.19 (Server state management)
- **Zustand**: 5.0.10 (Client state management)
- **Axios**: 1.13.2 (HTTP client)

### UI & Styling
- **React Native StyleSheet**: Native styling
- **Expo Vector Icons**: 15.0.3 (Icon library)
- **Custom Components**: Reusable UI components

### Navigation
- **Expo Router**: File-based navigation with nested layouts
- **Stack Navigation**: For auth and main app flows
- **Tab Navigation**: For main app sections (Home, Cart, Profile)

### Development Tools
- **Expo Dev Client**: For development and testing
- **TypeScript**: Full type safety
- **Environment Variables**: For API configuration

## Project Architecture

### File Structure
```
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx      # Login screen
│   │   └── _layout.tsx    # Auth layout
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Home tab
│   │   ├── cart.tsx       # Cart tab
│   │   ├── profile.tsx    # Profile tab
│   │   └── _layout.tsx    # Tabs layout
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Entry point
│   └── +not-found.tsx     # 404 page
├── components/            # Reusable UI components
│   ├── MessageToast.tsx   # Toast notification component
│   ├── LoadingSpinner.tsx # Loading indicator
│   └── Loader.tsx         # Generic loader
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Authentication logic
│   └── useMessageToast.ts # Toast management hook
├── services/              # API service layers
│   ├── auth.service.ts    # Authentication service
│   └── stores.service.ts  # Store management service
├── lib/                   # Utility libraries
│   └── api/              # API configuration
│       ├── client.ts     # Axios client setup
│       └── endpoints.ts  # API endpoint definitions
├── constants/             # App constants
│   ├── index.ts          # Constants export
│   ├── theme.ts          # Theme/design tokens
│   ├── validation.ts     # Form validation rules
│   ├── messages.ts       # UI messages
│   ├── payment.ts        # Payment-related constants
│   └── transaction.ts    # Transaction constants
└── assets/               # Static assets (images, icons)
```

### Key Architectural Patterns

#### 1. **Service Layer Architecture**
- **Service Classes**: Encapsulate API calls (AuthService, StoreService)
- **Centralized Endpoints**: All API endpoints defined in `lib/api/endpoints.ts`
- **Axios Client**: Configured with base URL, timeout, and headers

#### 2. **Custom Hook Pattern**
- **useAuth**: Manages authentication state and API calls
- **useMessageToast**: Toast notification management with success/error/info/warning types
- **Separation of Concerns**: Business logic in hooks, UI logic in components

#### 3. **Component Architecture**
- **Reusable Components**: MessageToast, LoadingSpinner, Loader
- **Toast System**: Custom toast notification system with animations and auto-dismiss
- **Loading States**: Consistent loading indicators across the app

#### 4. **State Management Strategy**
- **Server State**: React Query for API data (caching, background updates, error handling)
- **Client State**: Zustand for UI state (optional, available but not heavily used yet)
- **Form State**: React useState for local form state

## Core Features & Implementation

### 1. **Authentication System**
- **Login Flow**: Email/password authentication via `/supplier/login` endpoint
- **Token Management**: JWT token storage and refresh logic (to be implemented)
- **Protected Routes**: Auth-based navigation (to be fully implemented)
- **Error Handling**: Comprehensive error states and user feedback

### 2. **Toast Notification System**
- **Custom Hook**: `useMessageToast()` for managing toast state
- **Message Types**: Success, Error, Info, Warning with distinct styling
- **Animations**: Slide and fade animations using React Native Animated API
- **Auto-dismiss**: Configurable duration with manual close option
- **Positioning**: Top, bottom, or center positioning

### 3. **API Integration Pattern**
```typescript
// Service Layer
class AuthService {
  async login(credentials) {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }
}

// Hook Layer
function useLogin() {
  return useMutation({
    mutationFn: authService.login,
    onSuccess: handleTokenStorage, // Business logic
    onError: handleErrorLogging    // Error handling
  });
}

// Component Layer
function LoginScreen() {
  const loginMutation = useLogin();
  
  const handleLogin = () => {
    loginMutation.mutate(credentials, {
      onSuccess: showSuccessToast, // UI feedback
      onError: showErrorToast      // UI feedback
    });
  };
}
```

### 4. **Navigation Structure**
- **Auth Stack**: Login, Register (register not yet implemented)
- **Main Tabs**: Home, Cart, Profile
- **File-based Routing**: Expo Router with automatic route generation
- **Layout Hierarchy**: Root → Auth/Tabs → Individual screens

## Development Standards & Conventions

### Code Style
- **TypeScript**: Strict typing with interfaces for all props and state
- **Functional Components**: Use React functional components with hooks
- **Named Exports**: Prefer named exports over default exports
- **File Naming**: PascalCase for components, camelCase for utilities

### State Management Rules
1. **Server State**: Always use React Query for API data
2. **Form State**: Use React useState for local form state
3. **Global UI State**: Consider Zustand for cross-component state
4. **Toast State**: Always use `useMessageToast` hook for notifications

### API Integration Guidelines
1. **Service Classes**: All API calls go through service classes
2. **Endpoint Constants**: Use `API_ENDPOINTS` for all URLs
3. **Error Handling**: Handle errors at both hook and component levels
4. **Loading States**: Always show loading indicators during async operations

### Component Guidelines
1. **Reusability**: Create reusable components for common UI patterns
2. **Props Typing**: Always type component props with TypeScript interfaces
3. **Separation**: Business logic in hooks, presentation in components
4. **Toast Usage**: Use toast for user feedback, not console.log

## Environment Configuration

### Required Environment Variables
```env
EXPO_PUBLIC_API_URL=your_api_base_url
```

### Development Setup
1. Install dependencies: `npm install`
2. Configure environment variables in `.env`
3. Start development server: `npm start`
4. Run on specific platform: `npm run android` or `npm run ios`

## Current Implementation Status

### ✅ Completed Features
- Project structure and architecture
- Authentication service and hook
- Toast notification system
- API client configuration
- Basic navigation structure
- Loading components
- TypeScript configuration

### 🔄 In Progress
- Login screen UI and functionality
- Store management screens
- Cart functionality
- Profile management

### 📋 Planned Features
- Store list display
- Transaction processing
- Inventory management
- Offline data sync
- Push notifications
- Analytics integration
- Dark mode support

## Key Technical Decisions

### 1. **Expo Router over React Navigation**
- **Reason**: Simplified file-based routing, better Expo integration
- **Benefit**: Automatic route generation, type-safe navigation

### 2. **React Query over Redux**
- **Reason**: Built-in caching, background updates, devtools
- **Benefit**: Simplified server state management

### 3. **Custom Toast over Library**
- **Reason**: Full control over animations, styling, and behavior
- **Benefit**: Consistent design, no external dependencies

### 4. **Service Layer Pattern**
- **Reason**: Separation of API logic from components
- **Benefit**: Testability, reusability, maintainability

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes

### Commit Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Maintenance tasks

### Testing Strategy
- Unit tests for hooks and utilities (to be implemented)
- Component tests with React Testing Library (to be implemented)
- Integration tests for critical flows (to be implemented)

## Deployment

### Build Platforms
- **Android**: APK/AAB via Expo EAS
- **iOS**: IPA via Expo EAS
- **Web**: Progressive Web App support

### Distribution
- Internal testing via Expo Go
- Production via app stores
- OTA updates via Expo

---

*This document should be updated as the project evolves. Last updated: [Current Date]*