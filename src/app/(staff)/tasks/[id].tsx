import { useLocalSearchParams } from 'expo-router';

import { View, Text } from '@/tw';

// ST-02, CI-01 đến CI-06: Chi tiết task, Check In/Out (GPS + ảnh bắt buộc), Từ chối có lý do
export default function StaffTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Task Detail & Execution</Text>
      <Text className="text-sm text-gray-500 mt-1">Task ID: {id}</Text>
      <Text className="text-sm text-gray-500">Staff</Text>
    </View>
  );
}
