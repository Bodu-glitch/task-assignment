import { View, Text } from '@/tw';

// Danh sách task Rejected + Overdue, xem lý do từ chối, giao lại cho nhân viên khác
export default function BOrejectedOverdueScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Rejected / Overdue Handling</Text>
      <Text className="text-sm text-gray-500 mt-1">Business Owner</Text>
    </View>
  );
}
