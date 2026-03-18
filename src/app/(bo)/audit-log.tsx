import { View, Text } from '@/tw';

// AL-01 đến AL-06: Lịch sử toàn hệ thống — lọc theo nhân viên/task/hành động, xem GPS + ảnh
export default function AuditLogScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Audit Log</Text>
      <Text className="text-sm text-gray-500 mt-1">Business Owner only</Text>
    </View>
  );
}
