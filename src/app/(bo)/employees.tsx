import { View, Text } from '@/tw';

// UM-01 đến UM-08: Quản lý nhân viên đầy đủ — mời, chỉnh sửa, kích hoạt/vô hiệu hóa
export default function BOEmployeeManagementScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Employee Management</Text>
      <Text className="text-sm text-gray-500 mt-1">Business Owner — Full access</Text>
    </View>
  );
}
