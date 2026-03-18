import { View, Text } from '@/tw';

// TM-01 đến TM-06: Tạo/chỉnh sửa task — tiêu đề, mô tả, deadline, GPS địa điểm, độ ưu tiên, giao việc
export default function BOTaskCreateScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Create / Edit Task</Text>
      <Text className="text-sm text-gray-500 mt-1">Business Owner</Text>
    </View>
  );
}
