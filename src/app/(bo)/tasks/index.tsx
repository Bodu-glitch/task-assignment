import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable } from '@/tw';
import { tasksApi } from '@/lib/api/tasks';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { ErrorView } from '@/components/ui/ErrorView';
import type { Task, TaskStatus } from '@/types/api';

const STATUS_FILTERS: { label: string; value: TaskStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];

function TaskCard({ task }: { task: Task }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(bo)/tasks/[id]', params: { id: task.id } })}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 mx-4 border border-gray-100 dark:border-gray-800 active:opacity-70"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-base font-semibold text-gray-900 dark:text-white flex-1 mr-2"
          numberOfLines={1}
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

      {task.location_name && (
        <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
          📍 {task.location_name}
        </Text>
      )}

      {task.scheduled_at && (
        <Text className="text-xs text-gray-400">
          🕐 {new Date(task.scheduled_at).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      )}

      {task.assignees.length > 0 && (
        <Text className="text-xs text-gray-400 mt-1">
          👥 {task.assignees.map((a) => a.full_name).join(', ')}
        </Text>
      )}
    </Pressable>
  );
}

export default function TaskManagerScreen() {
  const params = useLocalSearchParams<{ status?: TaskStatus }>();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(params.status);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['tasks', statusFilter, page],
    queryFn: () => tasksApi.list({ status: statusFilter, page, limit: 20 }),
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => router.back()} className="active:opacity-60 mr-2">
            <Text className="text-brand text-base">← Back</Text>
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Tasks</Text>
          <Pressable
            onPress={() => router.push('/(bo)/tasks/create')}
            className="bg-brand rounded-xl px-3 py-1.5 active:opacity-80"
          >
            <Text className="text-white text-sm font-semibold">+ New</Text>
          </Pressable>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { setStatusFilter(item.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                statusFilter === item.value ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  statusFilter === item.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TaskCard task={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => { setPage(1); refetch(); }} />
          }
          ListEmptyComponent={
            isLoading ? null : (
              <View className="flex-1 items-center justify-center py-16">
                <Text className="text-gray-400">No tasks found</Text>
              </View>
            )
          }
          ListFooterComponent={
            meta && meta.page * meta.limit < meta.total ? (
              <Pressable
                onPress={() => setPage((p) => p + 1)}
                className="mx-4 mb-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 items-center active:opacity-60"
              >
                <Text className="text-brand font-medium">Load more</Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </View>
  );
}
