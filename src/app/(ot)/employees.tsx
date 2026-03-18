import { View, Text } from '@/tw';

// UM-01 đến UM-06: Mời nhân viên qua email, xem danh sách, gửi lại/hủy lời mời
export default function OTEmployeeManagementScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Employee Management</Text>
      <Text className="text-sm text-gray-500 mt-1">Operation Team — Invite only</Text>
    </View>
  );
}
