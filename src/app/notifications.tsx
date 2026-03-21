import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { View, Text, Pressable } from '@/tw';
import { notificationsApi } from '@/lib/api/notifications';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import type { Notification } from '@/types/api';

function NotificationItem({
  item,
  onMarkRead,
}: {
  item: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (!item.is_read) onMarkRead(item.id);
      }}
      className={`px-4 py-4 border-b border-gray-100 dark:border-gray-800 active:opacity-70 ${
        !item.is_read ? 'bg-blue-50 dark:bg-blue-950' : 'bg-white dark:bg-gray-900'
      }`}
    >
      <View className="flex-row items-start">
        {!item.is_read && (
          <View className="w-2 h-2 rounded-full bg-brand mt-1.5 mr-3 flex-shrink-0" />
        )}
        <View className={`flex-1 ${item.is_read ? 'ml-5' : ''}`}>
          <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
            {item.title}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">{item.body}</Text>
          <Text className="text-xs text-gray-400 mt-1">
            {new Date(item.created_at).toLocaleString('vi-VN')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationCenterScreen() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3 active:opacity-60">
              <Text className="text-brand text-base">← Back</Text>
            </Pressable>
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <Text className="text-xs text-brand">{unreadCount} unread</Text>
              )}
            </View>
          </View>
          {unreadCount > 0 && (
            <Pressable
              onPress={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="active:opacity-60"
            >
              <Text className="text-sm text-brand font-medium">Mark all read</Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onMarkRead={(id) => markReadMutation.mutate(id)} />
        )}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-gray-400">No notifications</Text>
          </View>
        }
      />
    </View>
  );
}
