import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

// List all your protected routes (routes that require login)
const PROTECTED_ROUTES = [
  '/',                    // Home/dashboard
  '/(tabs)',              // Tab navigation
  '/(tabs)/index',        // Your dashboard
  '/(tabs)/profile',      // Profile tab
  '/(tabs)/orders',       // Orders tab
  '/products',            // Products screen
  '/cart',                // Cart screen
  '/checkout',            // Checkout screen
  // Add other protected routes here
];

// List all your public routes (routes that don't require login)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/welcome',
  '/',
];

export async function middleware(request: any) {
  const { url } = request;
  
  // Extract just the path from the URL
  // Example: "exp://192.168.1.100:8081/(tabs)/index" → "/(tabs)/index"
  const path = extractPathFromUrl(url);
  
  console.log('Middleware checking:', { path, url });
  
  // Check if user has an auth token
  const hasToken = await checkForAuthToken();
  const isAuthenticated = await checkIsAuthenticated();
  
  // If trying to access protected route WITHOUT token → redirect to login
  if (!isAuthenticated && isProtectedRoute(path)) {
    console.log('❌ No auth token, redirecting to login');
    return Redirect({ href: '/login' });
  }
  
  // If has token AND trying to access login/register → redirect to home
  if (isAuthenticated && isAuthPage(path)) {
    console.log('✅ Already logged in, redirecting to home');
    return Redirect({ href: '/' });
  }
  
  // Allow access
  console.log('✅ Access granted to:', path);
  return null;
}

// Helper: Check if auth token exists in storage
async function checkForAuthToken(): Promise<boolean> {
  try {
    // const token = await AsyncStorage.getItem('auth_token');
     const { token} = useAuth();

    return !!token; // Returns true if token exists, false otherwise
  } catch (error) {
    console.error('Error checking auth token:', error);
    return false;
  }
}

async function checkIsAuthenticated(): Promise<boolean> {
  try {
    const { isAuthenticated } = useAuth(); 
    return isAuthenticated;
    } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
    }
}

// Helper: Extract path from URL
function extractPathFromUrl(url: string): string {
  try {
    // Remove protocol and host
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, try simple extraction
    const match = url.match(/\/[^?#]*/);
    return match ? match[0] : '/';
  }
}

// Helper: Check if route is protected
function isProtectedRoute(path: string): boolean {
  // Check if path matches any protected route
  return PROTECTED_ROUTES.some(route => {
    // Exact match
    if (path === route) return true;
    
    // Starts with route (for nested routes)
    if (path.startsWith(route + '/')) return true;
    
    // Special case for root
    if (route === '/' && path === '/') return true;
    
    return false;
  });
}

// Helper: Check if route is an auth page (login, register, etc.)
function isAuthPage(path: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    path === route || path.startsWith(route + '/')
  );
}