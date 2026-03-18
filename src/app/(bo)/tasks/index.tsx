import { View, Text } from '@/tw';

// TM-07, TM-09, TM-10: Danh sách toàn bộ task trong tenant, tìm kiếm, lọc theo trạng thái
export default function TaskManagerScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Task Manager</Text>
      <Text className="text-sm text-gray-500 mt-1">Business Owner</Text>
    </View>
  );
}
