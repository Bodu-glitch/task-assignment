import { Redirect } from 'expo-router';

// TODO: Replace with real auth context (e.g. useAuth() hook)
// Set to null to land on login screen
const MOCK_ROLE: 'bo' | 'ot' | 'staff' | null = 'ot';

export default function Index() {
  if (!MOCK_ROLE) return <Redirect href="/(auth)/login" />;
  if (MOCK_ROLE === 'bo') return <Redirect href="/(bo)/" />;
  if (MOCK_ROLE === 'ot') return <Redirect href="/(ot)/" />;
  return <Redirect href="/(staff)/" />;
}
