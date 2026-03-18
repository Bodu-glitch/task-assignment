import { View, Text } from '@/tw';

// TM-04: Nhận task từ BO, giao cho nhân viên cụ thể, xem trạng thái nhân viên
export default function TaskAssignmentScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Task Assignment</Text>
      <Text className="text-sm text-gray-500 mt-1">Operation Team</Text>
    </View>
  );
}
