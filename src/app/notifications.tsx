import { View, Text } from '@/tw';

// PN-01 đến PN-05: Danh sách thông báo, deep link vào task, đánh dấu đã đọc
export default function NotificationCenterScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Notification Center</Text>
      <Text className="text-sm text-gray-500 mt-1">Shared — All roles</Text>
    </View>
  );
}
