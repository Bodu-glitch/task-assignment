import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { View, Text, Pressable, ScrollView } from '@/tw';
import { useAuth } from '@/context/auth';
import { staffApi } from '@/lib/api/staff';
import type { InAppInvitation } from '@/types/api';

function RoleBadge({ role }: { role: InAppInvitation['role'] }) {
  const config = {
    business_owner: { label: 'Chủ sở hữu', bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
    operator: { label: 'Vận hành', bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300' },
    staff: { label: 'Nhân viên', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
    superadmin: { label: 'Superadmin', bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300' },
  };
  const { label, bg, text } = config[role] ?? config.staff;
  return (
    <View className={`self-start px-2 py-0.5 rounded-full ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  );
}

function formatExpiry(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function InvitationsScreen() {
  const { refreshProfile } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<InAppInvitation[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(false);

  const fetchInvitations = useCallback(async () => {
    setFetching(true);
    setError(false);
    try {
      const res = await staffApi.myInvitations();
      const pending = res.data.data.filter(i => i.status === 'pending');
      setInvitations(pending);
    } catch {
      setError(true);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  async function navigateForward() {
    await refreshProfile();
    router.replace('/');
  }

  function removeInvitation(id: string, callback?: () => void) {
    setInvitations(prev => {
      const next = prev.filter(i => i.id !== id);
      if (next.length === 0) {
        // Call navigateForward after state update
        setTimeout(() => navigateForward(), 0);
      }
      return next;
    });
    callback?.();
  }

  async function handleAccept(id: string) {
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      await staffApi.acceptInvitation(id);
      removeInvitation(id);
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể chấp nhận lời mời.');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDecline(id: string) {
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      await staffApi.declineInvitation(id);
      removeInvitation(id);
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể từ chối lời mời.');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function handleSkip() {
    router.replace('/');
  }

  if (fetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black px-6">
        <Text className="text-base text-gray-700 dark:text-gray-300 text-center mb-4">
          Không thể tải lời mời. Vui lòng thử lại.
        </Text>
        <Pressable
          onPress={fetchInvitations}
          className="bg-brand px-6 py-3 rounded-xl active:opacity-80"
        >
          <Text className="text-white font-semibold">Thử lại</Text>
        </Pressable>
        <Pressable onPress={handleSkip} className="mt-4 py-2 active:opacity-70">
          <Text className="text-sm text-gray-400">Bỏ qua</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Lời mời tham gia</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Bạn được mời vào workspace
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName="gap-3 pb-6">
        {invitations.map((inv) => {
          const isLoading = loadingIds.has(inv.id);
          return (
            <View
              key={inv.id}
              className="border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 bg-gray-50 dark:bg-gray-900"
            >
              <View className="gap-2 mb-4">
                <Text className="text-base font-semibold text-gray-900 dark:text-white">
                  {inv.tenants.name}
                </Text>
                <RoleBadge role={inv.role} />
                <Text className="text-xs text-gray-400 dark:text-gray-500">
                  Hết hạn: {formatExpiry(inv.expires_at)}
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleDecline(inv.id)}
                  disabled={isLoading}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl py-2.5 items-center active:opacity-70 disabled:opacity-40"
                >
                  <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">Từ chối</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAccept(inv.id)}
                  disabled={isLoading}
                  className="flex-1 bg-brand rounded-xl py-2.5 items-center active:opacity-80 disabled:opacity-40"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">Chấp nhận</Text>
                  )}
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer skip */}
      <View className="px-6 pb-10 pt-2">
        <Pressable onPress={handleSkip} className="items-center py-3 active:opacity-70">
          <Text className="text-sm text-gray-400 dark:text-gray-500">Bỏ qua, vào app</Text>
        </Pressable>
      </View>
    </View>
  );
}
