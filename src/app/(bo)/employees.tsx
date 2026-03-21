import { useState } from 'react';
import { Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { View, Text, TextInput, Pressable, ScrollView } from '@/tw';
import { staffApi } from '@/lib/api/staff';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { ApiError } from '@/lib/api/client';

type Tab = 'staff' | 'invitations';

export default function BOEmployeeManagementScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('staff');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'staff' | 'operator'>('staff');
  const [showInviteForm, setShowInviteForm] = useState(false);

  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
    select: (d) => d.data,
  });

  const invitationsQuery = useQuery({
    queryKey: ['invitations'],
    queryFn: () => staffApi.invitations(),
    select: (d) => d.data,
  });

  const inviteMutation = useMutation({
    mutationFn: () => staffApi.invite(inviteEmail.trim(), inviteRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] });
      setInviteEmail('');
      setShowInviteForm(false);
      Alert.alert('Success', 'Invitation sent');
    },
    onError: (e) => {
      const msg =
        e instanceof ApiError && e.code === 'EMAIL_ALREADY_EXISTS'
          ? 'This email is already registered'
          : e instanceof ApiError
            ? e.message
            : 'Failed to send invite';
      Alert.alert('Error', msg);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to remove'),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => staffApi.resendInvite(id),
    onSuccess: () => Alert.alert('Success', 'Invitation resent'),
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to resend'),
  });

  const isLoading = staffQuery.isLoading || invitationsQuery.isLoading;
  const isError = staffQuery.isError || invitationsQuery.isError;

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={() => { staffQuery.refetch(); invitationsQuery.refetch(); }} />;

  const staffList = staffQuery.data ?? [];
  const invitationList = invitationsQuery.data ?? [];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3 active:opacity-60">
              <Text className="text-brand text-base">← Back</Text>
            </Pressable>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">Employees</Text>
          </View>
          <Pressable
            onPress={() => setShowInviteForm((v) => !v)}
            className="bg-brand rounded-xl px-3 py-1.5 active:opacity-80"
          >
            <Text className="text-white text-sm font-semibold">+ Invite</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2">
          {(['staff', 'invitations'] as Tab[]).map((t) => (
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
                {t === 'staff' ? `Staff (${staffList.length})` : `Pending (${invitationList.length})`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={staffQuery.isRefetching || invitationsQuery.isRefetching}
            onRefresh={() => { staffQuery.refetch(); invitationsQuery.refetch(); }}
          />
        }
      >
        {/* Invite form */}
        {showInviteForm && (
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 border border-gray-100 dark:border-gray-800">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Invite New Member
            </Text>
            <TextInput
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 mb-3"
              placeholder="Email address"
              placeholderTextColor="#9ca3af"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View className="flex-row gap-2 mb-3">
              {(['staff', 'operator'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setInviteRole(r)}
                  className={`flex-1 py-2.5 rounded-xl items-center border ${
                    inviteRole === r
                      ? 'bg-brand border-brand'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${
                      inviteRole === r ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
              className="bg-brand rounded-xl py-3 items-center active:opacity-80 disabled:opacity-50"
            >
              {inviteMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Send Invitation</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Staff list */}
        {tab === 'staff' && (
          <>
            {staffList.length === 0 && (
              <View className="py-16 items-center">
                <Text className="text-gray-400">No staff members yet</Text>
              </View>
            )}
            {staffList.map((s) => (
              <View
                key={s.id}
                className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-3.5 mb-3 border border-gray-100 dark:border-gray-800 flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">
                    {s.full_name}
                  </Text>
                  <Text className="text-xs text-gray-400">{s.email}</Text>
                  <Text className="text-xs text-gray-400 capitalize mt-0.5">{s.role}</Text>
                </View>
                <Pressable
                  onPress={() =>
                    Alert.alert('Remove', `Remove ${s.full_name} from the team?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => removeMutation.mutate(s.id),
                      },
                    ])
                  }
                  className="active:opacity-60"
                >
                  <Text className="text-sm text-red-400">Remove</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        {/* Invitations list */}
        {tab === 'invitations' && (
          <>
            {invitationList.length === 0 && (
              <View className="py-16 items-center">
                <Text className="text-gray-400">No pending invitations</Text>
              </View>
            )}
            {invitationList.map((inv) => (
              <View
                key={inv.id}
                className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-3.5 mb-3 border border-gray-100 dark:border-gray-800 flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">
                    {inv.email}
                  </Text>
                  <Text className="text-xs text-yellow-500 capitalize mt-0.5">{inv.status}</Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(inv.created_at).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => resendMutation.mutate(inv.id)}
                  disabled={resendMutation.isPending}
                  className="active:opacity-60"
                >
                  <Text className="text-sm text-brand">Resend</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
