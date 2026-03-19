import { useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { View, Text, Pressable, ScrollView } from '@/tw';
import { useAuth } from '@/context/auth';
import { ApiError } from '@/lib/api/client';
import type { TenantOption } from '@/types/api';

const SESSION_DURATION = 300; // 5 minutes in seconds

function RoleBadge({ role }: { role: TenantOption['role'] }) {
  const config = {
    business_owner: { label: 'Chủ sở hữu', className: 'bg-blue-100 dark:bg-blue-900' as const, textClassName: 'text-blue-700 dark:text-blue-300' as const },
    operator: { label: 'Vận hành', className: 'bg-purple-100 dark:bg-purple-900' as const, textClassName: 'text-purple-700 dark:text-purple-300' as const },
    staff: { label: 'Nhân viên', className: 'bg-green-100 dark:bg-green-900' as const, textClassName: 'text-green-700 dark:text-green-300' as const },
    superadmin: { label: 'Superadmin', className: 'bg-red-100 dark:bg-red-900' as const, textClassName: 'text-red-700 dark:text-red-300' as const },
  };
  const { label, className, textClassName } = config[role] ?? config.staff;
  return (
    <View className={`self-start px-2 py-0.5 rounded-full ${className}`}>
      <Text className={`text-xs font-medium ${textClassName}`}>{label}</Text>
    </View>
  );
}

export default function SelectTenantScreen() {
  const { pendingSelection, selectTenant, logout } = useAuth();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_DURATION);
  const sessionStart = useRef(Date.now());

  // Guard: if no pending selection, redirect to login
  useEffect(() => {
    if (!pendingSelection) {
      router.replace('/(auth)/login');
    }
  }, [pendingSelection, router]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
      const left = SESSION_DURATION - elapsed;
      if (left <= 0) {
        clearInterval(interval);
        Alert.alert('Phiên hết hạn', 'Vui lòng đăng nhập lại.', [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            },
          },
        ]);
      } else {
        setSecondsLeft(left);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [logout, router]);

  async function handleSelect(tenant: TenantOption) {
    if (!pendingSelection) return;
    setLoadingId(tenant.id);
    try {
      await selectTenant(pendingSelection.userId, tenant.id);
      // index.tsx will redirect to the correct role screen
    } catch (e) {
      let message = e instanceof Error ? e.message : 'Đã có lỗi xảy ra.';
      if (e instanceof ApiError) {
        if (e.code === 'INVALID_SESSION') {
          Alert.alert('Phiên hết hạn', 'Vui lòng đăng nhập lại.', [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                router.replace('/(auth)/login');
              },
            },
          ]);
          return;
        } else if (e.code === 'FORBIDDEN') {
          message = 'Bạn không có quyền truy cập workspace này.';
        } else {
          message = e.message;
        }
      }
      Alert.alert('Lỗi', message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleBack() {
    await logout();
    router.replace('/(auth)/login');
  }

  if (!pendingSelection) return null;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Chọn Workspace</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Đăng nhập vào tài khoản nào?
        </Text>
      </View>

      {/* Session warning */}
      {secondsLeft < 60 && (
        <View className="mx-6 mb-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl">
          <Text className="text-sm text-amber-700 dark:text-amber-300">
            Phiên hết hạn sau {secondsLeft} giây
          </Text>
        </View>
      )}

      <ScrollView className="flex-1 px-6" contentContainerClassName="gap-3 pb-6">
        {pendingSelection.tenants.map((tenant) => (
          <Pressable
            key={tenant.id}
            onPress={() => handleSelect(tenant)}
            disabled={loadingId !== null}
            className="border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 bg-gray-50 dark:bg-gray-900 active:opacity-70 disabled:opacity-60"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-white">
                  {tenant.name}
                </Text>
                <Text className="text-sm text-gray-400 dark:text-gray-500">{tenant.slug}</Text>
                <RoleBadge role={tenant.role} />
              </View>
              {loadingId === tenant.id && (
                <ActivityIndicator size="small" color="#208AEF" />
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Back button */}
      <View className="px-6 pb-10 pt-2">
        <Pressable
          onPress={handleBack}
          className="items-center py-3 active:opacity-70"
        >
          <Text className="text-sm text-gray-500 dark:text-gray-400">Quay lại đăng nhập</Text>
        </Pressable>
      </View>
    </View>
  );
}
