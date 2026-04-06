import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { StyleSheet } from "react-native";

export default function Page() {
  // const { isAuthenticated, isLoading, user } = useAuth();

  // const isAdmin = user?.department === 'ADMIN';
  // const isSupplierManager = user?.department === 'SUPPLIER' && user?.role === 'MANAGER';
  // const isSupplierCashier = user?.department === 'SUPPLIER' && user?.role === 'CASHIER';
  // // console.log('user?.department', user?.department);
  // // console.log('user?.role', user?.role);

  // if (isLoading) {
  //   return <LoadingSpinner visible={true} />;
  // }

  // // If not authenticated, redirect to login
  // if (!isAuthenticated) {
  //   return <Redirect href="/(auth)/login" />;
  // }

  // if(isSupplierManager || isAdmin){
  //   return <Redirect href="/(tabs)" />;
  // }else if(isSupplierCashier){
  //   return <Redirect href="/(tabs)/cart" />;
  // }
  // 1. Show loading while checking auth state

  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <LoadingSpinner visible={true} />;
  }

  // 2. If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // 3. Prevent race conditions: wait for the user object to fully load
  if (isAuthenticated && !user) {
    return <LoadingSpinner visible={true} />;
  }

  // ✨ 4. THE FIX: Convert to uppercase to protect against database typos!
  const safeDepartment = user?.department?.toUpperCase() || '';
  const safeRole = user?.role?.toUpperCase() || '';

  const isAdmin = safeDepartment === 'ADMIN';
  const isSupplierManager = safeDepartment === 'SUPPLIER' && safeRole === 'MANAGER';
  const isSupplierCashier = safeDepartment === 'SUPPLIER' && safeRole === 'CASHIER';

  console.log('Routing Check -> Dept:', safeDepartment, '| Role:', safeRole);

  // 5. Route based on roles
  if (isSupplierCashier) {
    return <Redirect href="/(tabs)/cart" />;
  } else if (isSupplierManager || isAdmin) {
    return <Redirect href="/(tabs)" />;
  }
  
  // ✨ 6. THE FALLBACK: If a user has a weird role that doesn't match, send them here safely.
  return <Redirect href="/(tabs)" />;
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
