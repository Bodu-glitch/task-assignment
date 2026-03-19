import { useState } from 'react';
import { Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlatList } from 'react-native';
import { View, Text, Pressable } from '@/tw';
import { tasksApi } from '@/lib/api/tasks';
import { staffApi } from '@/lib/api/staff';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { ApiError } from '@/lib/api/client';
import type { Task } from '@/types/api';

export default function TaskAssignmentScreen() {
  const qc = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasksQuery = useQuery({
    queryKey: ['tasks', 'pending'],
    queryFn: () => tasksApi.list({ status: 'pending', limit: 50 }),
    select: (d) => d.data,
  });

  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
    select: (d) => d.data,
  });

  const assignMutation = useMutation({
    mutationFn: ({ taskId, staffId }: { taskId: string; staffId: string }) =>
      tasksApi.assign(taskId, [staffId]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSelectedTask(null);
      Alert.alert('Success', 'Task assigned successfully');
    },
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to assign'),
  });

  if (tasksQuery.isLoading || staffQuery.isLoading) return <LoadingScreen />;
  if (tasksQuery.isError || staffQuery.isError)
    return (
      <ErrorView
        onRetry={() => {
          tasksQuery.refetch();
          staffQuery.refetch();
        }}
      />
    );

  const tasks = tasksQuery.data ?? [];
  const staffList = staffQuery.data ?? [];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3 active:opacity-60">
            <Text className="text-brand text-base">← Back</Text>
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Task Assignment</Text>
        </View>
      </View>

      {selectedTask ? (
        /* Staff picker for selected task */
        <View className="flex-1">
          <View className="px-4 py-3 bg-blue-50 dark:bg-blue-950 border-b border-blue-100 dark:border-blue-900">
            <Text className="text-xs text-blue-500 font-semibold uppercase mb-1">
              Assigning task:
            </Text>
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              {selectedTask.title}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">
              Already assigned: {selectedTask.assignees.map((a) => a.full_name).join(', ') || 'None'}
            </Text>
          </View>

          <FlatList
            data={staffList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={staffQuery.isRefetching} onRefresh={staffQuery.refetch} />
            }
            ListHeaderComponent={
              <Pressable
                onPress={() => setSelectedTask(null)}
                className="mb-4 py-2 items-center rounded-xl bg-gray-100 dark:bg-gray-800 active:opacity-60"
              >
                <Text className="text-sm text-gray-500">← Back to tasks</Text>
              </Pressable>
            }
            renderItem={({ item: s }) => {
              const alreadyAssigned = selectedTask.assignees.some((a) => a.id === s.id);
              return (
                <Pressable
                  onPress={() => {
                    if (alreadyAssigned) return;
                    assignMutation.mutate({ taskId: selectedTask.id, staffId: s.id });
                  }}
                  disabled={alreadyAssigned || assignMutation.isPending}
                  className={`flex-row items-center px-4 py-3.5 rounded-2xl mb-3 border ${
                    alreadyAssigned
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 opacity-60'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 active:opacity-70'
                  }`}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">
                      {s.full_name}
                    </Text>
                    <Text className="text-xs text-gray-400">{s.email}</Text>
                  </View>
                  {alreadyAssigned ? (
                    <Text className="text-xs text-green-500 font-semibold">Assigned ✓</Text>
                  ) : assignMutation.isPending ? (
                    <ActivityIndicator size="small" color="#208AEF" />
                  ) : (
                    <Text className="text-sm text-brand font-medium">Assign</Text>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View className="py-12 items-center">
                <Text className="text-gray-400">No staff available</Text>
              </View>
            }
          />
        </View>
      ) : (
        /* Task list */
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={tasksQuery.isRefetching} onRefresh={tasksQuery.refetch} />
          }
          renderItem={({ item: task }) => (
            <Pressable
              onPress={() => setSelectedTask(task)}
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
              <Text className="text-xs text-gray-400">
                {task.assignees.length === 0
                  ? '⚠️ Unassigned'
                  : `👥 ${task.assignees.map((a) => a.full_name).join(', ')}`}
              </Text>
              {task.scheduled_at && (
                <Text className="text-xs text-gray-400 mt-0.5">
                  🕐 {new Date(task.scheduled_at).toLocaleString('vi-VN')}
                </Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-gray-400">No pending tasks to assign</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
