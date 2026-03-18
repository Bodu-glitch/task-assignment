import { View, Text } from '@/tw';

// ST-01: Danh sách task được giao, nhóm theo Todo/In Progress/Done, sắp xếp theo deadline
export default function MyTaskListScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">My Task List</Text>
      <Text className="text-sm text-gray-500 mt-1">Staff</Text>
    </View>
  );
}
