import { View, Text } from '@/tw';

// TM-11: Dashboard tổng quan — số liệu real-time, biểu đồ tiến độ
export default function BODashboardScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Dashboard Overview</Text>
      <Text className="text-sm text-gray-500 mt-1">Business Owner</Text>
    </View>
  );
}
