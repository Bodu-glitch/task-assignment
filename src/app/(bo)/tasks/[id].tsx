import { useLocalSearchParams } from 'expo-router';

import { View, Text } from '@/tw';

// TM-08, AL-05: Thông tin đầy đủ task, timeline audit log, ảnh GPS check in/out
export default function BOTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Task Detail</Text>
      <Text className="text-sm text-gray-500 mt-1">Task ID: {id}</Text>
      <Text className="text-sm text-gray-500">Business Owner</Text>
    </View>
  );
}
