import { View, Text } from '@/tw';
import type { TaskStatus, TaskPriority } from '@/types/api';

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900',
  in_progress: 'bg-blue-100 dark:bg-blue-900',
  completed: 'bg-green-100 dark:bg-green-900',
  cancelled: 'bg-gray-100 dark:bg-gray-800',
  rejected: 'bg-red-100 dark:bg-red-900',
};

const STATUS_TEXT: Record<TaskStatus, string> = {
  pending: 'text-yellow-700 dark:text-yellow-300',
  in_progress: 'text-blue-700 dark:text-blue-300',
  completed: 'text-green-700 dark:text-green-300',
  cancelled: 'text-gray-500 dark:text-gray-400',
  rejected: 'text-red-700 dark:text-red-300',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-slate-100 dark:bg-slate-800',
  medium: 'bg-orange-100 dark:bg-orange-900',
  high: 'bg-red-100 dark:bg-red-900',
  urgent: 'bg-purple-100 dark:bg-purple-900',
};

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  low: 'text-slate-600 dark:text-slate-400',
  medium: 'text-orange-600 dark:text-orange-300',
  high: 'text-red-600 dark:text-red-300',
  urgent: 'text-purple-600 dark:text-purple-300',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <View className={`px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}>
      <Text className={`text-xs font-semibold ${STATUS_TEXT[status]}`}>
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <View className={`px-2.5 py-1 rounded-full ${PRIORITY_STYLES[priority]}`}>
      <Text className={`text-xs font-semibold uppercase ${PRIORITY_TEXT[priority]}`}>
        {priority}
      </Text>
    </View>
  );
}
