// OT Task Detail — same as BO but navigates within (ot) routes
import { useState } from 'react';
import { Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { View, Text, Pressable, ScrollView, TextInput } from '@/tw';
import { tasksApi } from '@/lib/api/tasks';
import { staffApi } from '@/lib/api/staff';
import { auditApi } from '@/lib/api/audit';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { ApiError } from '@/lib/api/client';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-gray-800">
      <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start mb-2">
      <Text className="text-sm text-gray-500 w-28">{label}</Text>
      <Text className="text-sm text-gray-900 dark:text-white flex-1">{value}</Text>
    </View>
  );
}

export default function OTTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id),
    select: (d) => d.data,
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit-task', id],
    queryFn: () => auditApi.byTask(id),
    select: (d) => d.data,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
    select: (d) => d.data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['task', id] });
    qc.invalidateQueries({ queryKey: ['tasks'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => tasksApi.cancel(id, reason),
    onSuccess: () => { invalidate(); setShowCancelInput(false); setReason(''); },
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to cancel'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => tasksApi.reject(id, reason),
    onSuccess: () => { invalidate(); setShowRejectInput(false); setReason(''); },
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to reject'),
  });

  const assignMutation = useMutation({
    mutationFn: (staffId: string) => tasksApi.assign(id, [staffId]),
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to assign'),
  });

  const unassignMutation = useMutation({
    mutationFn: (staffId: string) => tasksApi.unassign(id, staffId),
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to unassign'),
  });

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorView onRetry={refetch} />;

  const task = data;
  const assignedIds = task.assignees.map((a) => a.id);
  const unassignedStaff = (staffData ?? []).filter((s) => !assignedIds.includes(s.id));
  const canModify = task.status !== 'cancelled' && task.status !== 'rejected' && task.status !== 'completed';

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="active:opacity-60">
            <Text className="text-brand text-base">← Back</Text>
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
            {task.title}
          </Text>
          {canModify && (
            <Pressable
              onPress={() => router.push({ pathname: '/(ot)/tasks/create', params: { id: task.id } })}
              className="active:opacity-60"
            >
              <Text className="text-brand text-sm">Edit</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Section title="Status">
          <View className="flex-row gap-2 flex-wrap">
            <StatusBadge status={task.status} />
            {task.priority && <PriorityBadge priority={task.priority} />}
          </View>
          {task.cancel_reason && <Text className="text-sm text-gray-500 mt-2">Cancel reason: {task.cancel_reason}</Text>}
          {task.reject_reason && <Text className="text-sm text-gray-500 mt-2">Reject reason: {task.reject_reason}</Text>}
        </Section>

        <Section title="Details">
          {task.description ? <Text className="text-sm text-gray-700 dark:text-gray-300 mb-3">{task.description}</Text> : null}
          <InfoRow label="Location" value={task.location_name} />
          {task.location_lat && task.location_lng && (
            <InfoRow label="GPS" value={`${task.location_lat}, ${task.location_lng}${task.location_radius_m ? ` (±${task.location_radius_m}m)` : ''}`} />
          )}
          <InfoRow label="Scheduled" value={task.scheduled_at ? new Date(task.scheduled_at).toLocaleString('vi-VN') : undefined} />
          <InfoRow label="Deadline" value={task.deadline ? new Date(task.deadline).toLocaleString('vi-VN') : undefined} />
          <InfoRow label="Created" value={new Date(task.created_at).toLocaleString('vi-VN')} />
        </Section>

        {(task.checkin || task.checkout) && (
          <Section title="Check-in / Check-out">
            {task.checkin && (
              <View className="mb-3">
                <Text className="text-xs font-semibold text-green-600 mb-1">✅ Check-in</Text>
                <InfoRow label="Time" value={task.checkin.checked_in_at ? new Date(task.checkin.checked_in_at).toLocaleString('vi-VN') : undefined} />
                <InfoRow label="Notes" value={task.checkin.notes} />
                {task.checkin.gps_lat && <InfoRow label="GPS" value={`${task.checkin.gps_lat}, ${task.checkin.gps_lng}`} />}
                {task.checkin.photo_url && <Text className="text-xs text-brand mt-1">📷 Photo attached</Text>}
              </View>
            )}
            {task.checkout && (
              <View>
                <Text className="text-xs font-semibold text-blue-600 mb-1">🏁 Check-out</Text>
                <InfoRow label="Time" value={task.checkout.checked_out_at ? new Date(task.checkout.checked_out_at).toLocaleString('vi-VN') : undefined} />
                <InfoRow label="Notes" value={task.checkout.notes} />
              </View>
            )}
          </Section>
        )}

        <Section title="Assignees">
          {task.assignees.length === 0 ? (
            <Text className="text-sm text-gray-400">No assignees</Text>
          ) : (
            task.assignees.map((a) => (
              <View key={a.id} className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-900 dark:text-white">{a.full_name}</Text>
                {canModify && (
                  <Pressable onPress={() => unassignMutation.mutate(a.id)} className="active:opacity-60">
                    <Text className="text-xs text-red-400">Remove</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
          {canModify && unassignedStaff.length > 0 && (
            <View className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
              <Text className="text-xs text-gray-400 mb-2">Add staff:</Text>
              {unassignedStaff.map((s) => (
                <Pressable key={s.id} onPress={() => assignMutation.mutate(s.id)} className="flex-row items-center py-1.5 active:opacity-60">
                  <Text className="text-brand text-sm">+ {s.full_name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Section>

        {canModify && (
          <Section title="Actions">
            {showCancelInput ? (
              <View className="gap-2 mb-3">
                <TextInput className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900" placeholder="Cancel reason (optional)" placeholderTextColor="#9ca3af" value={reason} onChangeText={setReason} />
                <View className="flex-row gap-2">
                  <Pressable onPress={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl py-2 items-center active:opacity-70">
                    {cancelMutation.isPending ? <ActivityIndicator size="small" /> : <Text className="text-sm font-medium text-gray-700 dark:text-white">Confirm Cancel</Text>}
                  </Pressable>
                  <Pressable onPress={() => { setShowCancelInput(false); setReason(''); }} className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 active:opacity-70">
                    <Text className="text-sm text-gray-500">Dismiss</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => { setShowCancelInput(true); setShowRejectInput(false); setReason(''); }} className="py-3 rounded-xl bg-gray-100 dark:bg-gray-800 items-center mb-2 active:opacity-70">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Cancel Task</Text>
              </Pressable>
            )}

            {showRejectInput ? (
              <View className="gap-2">
                <TextInput className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900" placeholder="Reject reason (optional)" placeholderTextColor="#9ca3af" value={reason} onChangeText={setReason} />
                <View className="flex-row gap-2">
                  <Pressable onPress={() => rejectMutation.mutate()} disabled={rejectMutation.isPending} className="flex-1 bg-red-500 rounded-xl py-2 items-center active:opacity-70">
                    {rejectMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-sm font-medium text-white">Confirm Reject</Text>}
                  </Pressable>
                  <Pressable onPress={() => { setShowRejectInput(false); setReason(''); }} className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 active:opacity-70">
                    <Text className="text-sm text-gray-500">Dismiss</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => { setShowRejectInput(true); setShowCancelInput(false); setReason(''); }} className="py-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 items-center active:opacity-70">
                <Text className="text-sm font-medium text-red-600 dark:text-red-400">Reject Task</Text>
              </Pressable>
            )}
          </Section>
        )}

        {auditData && auditData.length > 0 && (
          <Section title="Activity Log">
            {auditData.map((log) => (
              <View key={log.id} className="flex-row mb-3">
                <View className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{log.actor_name}</Text>
                  <Text className="text-xs text-gray-500 capitalize">{log.action.replace(/_/g, ' ')}</Text>
                  <Text className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('vi-VN')}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
