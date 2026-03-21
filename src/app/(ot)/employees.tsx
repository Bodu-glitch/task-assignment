import { useState } from 'react';
import { Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { View, Text, TextInput, Pressable, ScrollView } from '@/tw';
import { staffApi } from '@/lib/api/staff';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { ApiError } from '@/lib/api/client';

export default function OTEmployeeManagementScreen() {
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
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
    mutationFn: () => staffApi.invite(inviteEmail.trim(), 'staff'),
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

  const resendMutation = useMutation({
    mutationFn: (id: string) => staffApi.resendInvite(id),
    onSuccess: () => Alert.alert('Success', 'Invitation resent'),
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to resend'),
  });

  if (staffQuery.isLoading || invitationsQuery.isLoading) return <LoadingScreen />;
  if (staffQuery.isError || invitationsQuery.isError)
    return <ErrorView onRetry={() => { staffQuery.refetch(); invitationsQuery.refetch(); }} />;

  const staffList = staffQuery.data ?? [];
  const invitationList = invitationsQuery.data ?? [];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between">
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
            <Text className="text-white text-sm font-semibold">+ Invite Staff</Text>
          </Pressable>
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
              Invite Staff
            </Text>
            <TextInput
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 mb-3"
              placeholder="Staff email address"
              placeholderTextColor="#9ca3af"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
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
        <Text className="text-sm font-semibold text-gray-500 mb-2">
          Active Staff ({staffList.length})
        </Text>
        {staffList.length === 0 && (
          <View className="py-8 items-center">
            <Text className="text-gray-400">No active staff members</Text>
          </View>
        )}
        {staffList.map((s) => (
          <View
            key={s.id}
            className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-3.5 mb-3 border border-gray-100 dark:border-gray-800"
          >
            <Text className="text-base font-semibold text-gray-900 dark:text-white">
              {s.full_name}
            </Text>
            <Text className="text-xs text-gray-400">{s.email}</Text>
          </View>
        ))}

        {/* Pending invitations */}
        {invitationList.length > 0 && (
          <>
            <Text className="text-sm font-semibold text-gray-500 mb-2 mt-4">
              Pending Invitations ({invitationList.length})
            </Text>
            {invitationList.map((inv) => (
              <View
                key={inv.id}
                className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-3.5 mb-3 border border-gray-100 dark:border-gray-800 flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                    {inv.email}
                  </Text>
                  <Text className="text-xs text-yellow-500 capitalize mt-0.5">{inv.status}</Text>
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
