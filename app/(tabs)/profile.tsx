import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { token, user, isAuthenticated } = useAuth();
  console.log('User info in ProfileScreen:', token);
  return (
    <UserProfile />
  );
}