import { useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View, Text, Pressable } from '@/tw';
import { tasksApi } from '@/lib/api/tasks';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import type { Task } from '@/types/api';

export default function OTRejectedOverdueScreen() {
  const [tab, setTab] = useState<'rejected' | 'overdue'>('rejected');

  const rejectedQuery = useQuery({
    queryKey: ['tasks', 'rejected'],
    queryFn: () => tasksApi.list({ status: 'rejected', limit: 50 }),
    select: (d) => d.data,
  });

  const overdueQuery = useQuery({
    queryKey: ['tasks', 'overdue-all'],
    queryFn: async () => {
      const [pending, inProgress] = await Promise.all([
        tasksApi.list({ status: 'pending', limit: 50 }),
        tasksApi.list({ status: 'in_progress', limit: 50 }),
      ]);
      return [...(pending.data ?? []), ...(inProgress.data ?? [])].filter(
        (t) => t.deadline && new Date(t.deadline) < new Date(),
      );
    },
  });

  const currentQuery = tab === 'rejected' ? rejectedQuery : overdueQuery;
  const items = (currentQuery.data as Task[] | undefined) ?? [];

  if (currentQuery.isLoading && !items.length) return <LoadingScreen />;
  if (currentQuery.isError) return <ErrorView onRetry={currentQuery.refetch} />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => router.back()} className="mr-3 active:opacity-60">
            <Text className="text-brand text-base">← Back</Text>
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Rejected / Overdue
          </Text>
        </View>
        <View className="flex-row gap-2">
          {(['rejected', 'overdue'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl items-center ${
                tab === t ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Text
                className={`text-sm font-semibold capitalize ${
                  tab === t ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={currentQuery.isRefetching} onRefresh={currentQuery.refetch} />
        }
        renderItem={({ item: task }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/(ot)/tasks/[id]', params: { id: task.id } })}
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-gray-800 active:opacity-70"
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
            {task.deadline && (
              <Text className="text-xs text-gray-400">
                Deadline: {new Date(task.deadline).toLocaleString('vi-VN')}
              </Text>
            )}
            {task.assignees.length > 0 && (
              <Text className="text-xs text-gray-400 mt-1">
                👥 {task.assignees.map((a) => a.full_name).join(', ')}
              </Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-gray-400">No {tab} tasks</Text>
          </View>
        }
      />
    </View>
  );
}
