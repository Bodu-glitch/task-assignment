import { View, Text } from '@/tw';

// TM-01 đến TM-04: Tạo task mới, giao cho nhân viên hoặc giao thông qua OT
export default function OTTaskCreateScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Create / Edit Task</Text>
      <Text className="text-sm text-gray-500 mt-1">Operation Team</Text>
    </View>
  );
}
