import { useQuery } from '@tanstack/react-query';
import { RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { View, Text, Pressable, ScrollView } from '@/tw';
import { tasksApi } from '@/lib/api/tasks';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { useAuth } from '@/context/auth';
import type { TaskStatus } from '@/types/api';

const STAT_CARDS: { key: keyof ReturnType<typeof emptyStats>; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: 'bg-yellow-100 dark:bg-yellow-900' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900' },
  { key: 'completed', label: 'Completed', color: 'bg-green-100 dark:bg-green-900' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-100 dark:bg-red-900' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 dark:bg-gray-800' },
  { key: 'overdue', label: 'Overdue', color: 'bg-orange-100 dark:bg-orange-900' },
];

function emptyStats() {
  return { pending: 0, in_progress: 0, completed: 0, cancelled: 0, rejected: 0, overdue: 0 };
}

export default function BODashboardScreen() {
  const { user, logout } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => tasksApi.dashboard(),
  });

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  const stats = data?.data ?? emptyStats();

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-black"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-5 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-500">Welcome back,</Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {user?.full_name ?? 'Business Owner'}
            </Text>
          </View>
          <Pressable onPress={logout} className="active:opacity-60">
            <Text className="text-sm text-red-500">Logout</Text>
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View className="px-4 pt-5">
        <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Task Overview
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {STAT_CARDS.map(({ key, label, color }) => (
            <Pressable
              key={key}
              className={`flex-1 min-w-[44%] ${color} rounded-2xl p-4 active:opacity-75`}
              onPress={() =>
                key !== 'overdue'
                  ? router.push({ pathname: '/(bo)/tasks', params: { status: key } })
                  : undefined
              }
            >
              <Text className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats[key]}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <View className="px-4 pt-6 pb-8 gap-3">
        <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Quick Actions
        </Text>
        <Pressable
          onPress={() => router.push('/(bo)/tasks/create')}
          className="bg-brand rounded-2xl px-5 py-4 active:opacity-80"
        >
          <Text className="text-white font-semibold text-base">+ Create Task</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(bo)/tasks/')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 active:opacity-70"
        >
          <Text className="text-gray-800 dark:text-white font-medium">All Tasks</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(bo)/employees')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 active:opacity-70"
        >
          <Text className="text-gray-800 dark:text-white font-medium">Manage Employees</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(bo)/audit-log')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 active:opacity-70"
        >
          <Text className="text-gray-800 dark:text-white font-medium">Audit Log</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(bo)/rejected-overdue')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 active:opacity-70"
        >
          <Text className="text-gray-800 dark:text-white font-medium">Rejected / Overdue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
