import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/auth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function OTLayout() {
  const { token, user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!token || !user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'operator') return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
