import { View, Text } from '@/tw';

// Số liệu theo đội: task hôm nay, đang thực hiện, cần xử lý; task mới từ BO chưa phân công
export default function OTTeamDashboardScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Team Dashboard</Text>
      <Text className="text-sm text-gray-500 mt-1">Operation Team</Text>
    </View>
  );
}
