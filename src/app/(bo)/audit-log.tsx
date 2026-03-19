import { useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View, Text, Pressable } from '@/tw';
import { auditApi } from '@/lib/api/audit';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import type { AuditAction, AuditLog } from '@/types/api';

const ACTION_FILTERS: { label: string; value: AuditAction | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Created', value: 'task_created' },
  { label: 'Assigned', value: 'task_assigned' },
  { label: 'Check-in', value: 'checkin' },
  { label: 'Check-out', value: 'checkout' },
  { label: 'Completed', value: 'task_completed' },
  { label: 'Cancelled', value: 'task_cancelled' },
  { label: 'Rejected', value: 'task_rejected' },
  { label: 'Member invited', value: 'member_invited' },
  { label: 'Member removed', value: 'member_removed' },
];

const ACTION_COLORS: Record<string, string> = {
  task_created: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  task_updated: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  task_assigned: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  task_cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  task_rejected: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  checkin: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  checkout: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300',
  member_invited: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
  member_removed: 'bg-red-100 dark:bg-red-900 text-red-500',
  status_changed: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  task_completed: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
};

function AuditCard({ log }: { log: AuditLog }) {
  const colorClass =
    ACTION_COLORS[log.action] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500';

  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-gray-800">
      <View className="flex-row items-start justify-between mb-1">
        <View className={`px-2.5 py-1 rounded-full ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
          <Text className={`text-xs font-semibold ${colorClass.split(' ').slice(2).join(' ')}`}>
            {log.action.replace(/_/g, ' ')}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">
          {new Date(log.created_at).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
        {log.actor_name}
      </Text>
      <Text className="text-xs text-gray-400 mt-0.5">
        {new Date(log.created_at).toLocaleTimeString('vi-VN')}
      </Text>
    </View>
  );
}

export default function AuditLogScreen() {
  const [actionFilter, setActionFilter] = useState<AuditAction | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['audit', actionFilter, page],
    queryFn: () => auditApi.list(actionFilter, page),
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center mb-3">
          <Pressable onPress={() => router.back()} className="mr-3 active:opacity-60">
            <Text className="text-brand text-base">← Back</Text>
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Audit Log</Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ACTION_FILTERS}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { setActionFilter(item.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                actionFilter === item.value ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  actionFilter === item.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AuditCard log={item} />}
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { setPage(1); refetch(); }} />
        }
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-gray-400">No audit logs found</Text>
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
