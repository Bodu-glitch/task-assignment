import { useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View, Text, Pressable } from '@/tw';
import { meApi } from '@/lib/api/me';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import type { Task } from '@/types/api';

export default function WorkHistoryScreen() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['me-history', page],
    queryFn: () => meApi.history(page),
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  function renderTask({ item: task }: { item: Task }) {
    const duration =
      task.checkin?.checked_in_at && task.checkout?.checked_out_at
        ? (() => {
            const diff =
              new Date(task.checkout.checked_out_at).getTime() -
              new Date(task.checkin.checked_in_at).getTime();
            const hours = Math.floor(diff / 3_600_000);
            const minutes = Math.floor((diff % 3_600_000) / 60_000);
            return `${hours}h ${minutes}m`;
          })()
        : null;

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/(staff)/tasks/[id]', params: { id: task.id } })}
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

        {task.location_name && (
          <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
            📍 {task.location_name}
          </Text>
        )}

        {task.checkin?.checked_in_at && (
          <Text className="text-xs text-gray-400">
            Check-in: {new Date(task.checkin.checked_in_at).toLocaleString('vi-VN')}
          </Text>
        )}

        {task.checkout?.checked_out_at && (
          <Text className="text-xs text-gray-400">
            Check-out: {new Date(task.checkout.checked_out_at).toLocaleString('vi-VN')}
          </Text>
        )}

        {duration && (
          <Text className="text-xs text-green-500 font-medium mt-1">⏱ Duration: {duration}</Text>
        )}

        {task.checkin?.photo_url && (
          <Text className="text-xs text-brand mt-1">📷 Photo attached</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3 active:opacity-60">
            <Text className="text-brand text-base">← Back</Text>
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Work History</Text>
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { setPage(1); refetch(); }} />
        }
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-gray-400">No completed tasks yet</Text>
          </View>
        }
        ListFooterComponent={
          meta && meta.page * meta.limit < meta.total ? (
            <Pressable
              onPress={() => setPage((p) => p + 1)}
              className="py-3 rounded-xl border border-gray-200 dark:border-gray-700 items-center mb-4 active:opacity-60"
            >
              <Text className="text-brand font-medium">Load more</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}
