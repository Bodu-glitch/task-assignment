import { View, Text } from '@/tw';

// ST-03: Lịch sử task Done + Rejected của cá nhân, ảnh check in/out, thời gian thực hiện
export default function WorkHistoryScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Work History</Text>
      <Text className="text-sm text-gray-500 mt-1">Staff</Text>
    </View>
  );
}
