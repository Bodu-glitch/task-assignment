import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { View, Text, Pressable } from '@/tw';
import { meApi } from '@/lib/api/me';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { useAuth } from '@/context/auth';
import type { Task, TaskStatus } from '@/types/api';

const TABS: { label: string; status?: TaskStatus }[] = [
  { label: 'Active', status: undefined },
  { label: 'Pending', status: 'pending' },
  { label: 'In Progress', status: 'in_progress' },
];

function TaskCard({ task }: { task: Task }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(staff)/tasks/[id]', params: { id: task.id } })}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-gray-800 active:opacity-70"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-base font-semibold text-gray-900 dark:text-white flex-1 mr-2"
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <StatusBadge status={task.status} />
      </View>

      {task.priority && (
        <View className="mb-2">
          <PriorityBadge priority={task.priority} />
        </View>
      )}

      {isOverdue && (
        <View className="bg-orange-100 dark:bg-orange-950 rounded-lg px-2.5 py-1 self-start mb-2">
          <Text className="text-xs font-semibold text-orange-600 dark:text-orange-400">
            ⚠️ Overdue
          </Text>
        </View>
      )}

      {task.location_name && (
        <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
          📍 {task.location_name}
        </Text>
      )}

      {task.scheduled_at && (
        <Text className="text-xs text-gray-400">
          🕐 {new Date(task.scheduled_at).toLocaleString('vi-VN')}
        </Text>
      )}

      {task.deadline && (
        <Text className={`text-xs mt-0.5 ${isOverdue ? 'text-orange-500' : 'text-gray-400'}`}>
          ⏰ Deadline: {new Date(task.deadline).toLocaleString('vi-VN')}
        </Text>
      )}
    </Pressable>
  );
}

export default function MyTaskListScreen() {
  const { user, logout } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['me-tasks', statusFilter],
    queryFn: () => meApi.tasks(statusFilter),
  });

  const tasks = data?.data ?? [];

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xs text-gray-500">My Tasks</Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {user?.full_name ?? 'Staff'}
            </Text>
          </View>
          <View className="flex-row gap-3 items-center">
            <Pressable onPress={() => router.push('/notifications')} className="active:opacity-60">
              <Text className="text-2xl">🔔</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(staff)/history')} className="active:opacity-60">
              <Text className="text-sm text-brand font-medium">History</Text>
            </Pressable>
            <Pressable onPress={logout} className="active:opacity-60">
              <Text className="text-sm text-red-500">Logout</Text>
            </Pressable>
          </View>
        </View>

        {/* Filter tabs */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setStatusFilter(item.status)}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                statusFilter === item.status ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  statusFilter === item.status ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} />}
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-gray-400 text-base">No tasks assigned to you</Text>
            <Text className="text-gray-300 text-sm mt-1">Pull to refresh</Text>
          </View>
        }
      />
    </View>
  );
}
