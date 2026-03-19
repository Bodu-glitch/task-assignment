import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function Index() {
  const { token, user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!token || !user) return <Redirect href="/(auth)/login" />;

  if (user.role === 'business_owner') return <Redirect href="/(bo)" />;
  if (user.role === 'operator') return <Redirect href="/(ot)" />;
  if (user.role === 'staff') return <Redirect href="/(staff)" />;

  return <Redirect href="/(auth)/login" />;
}
