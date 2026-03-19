import { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { View, Text, TextInput, Pressable, ScrollView } from '@/tw';
import { tasksApi } from '@/lib/api/tasks';
import { staffApi } from '@/lib/api/staff';
import { ApiError } from '@/lib/api/client';
import type { TaskPriority } from '@/types/api';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function BOTaskCreateScreen() {
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!editId;
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority | undefined>();
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [locationRadius, setLocationRadius] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  // Load existing task if editing
  const editQuery = useQuery({
    queryKey: ['task', editId],
    queryFn: () => tasksApi.get(editId!),
    enabled: isEditing,
    select: (d) => d.data,
  });

  useEffect(() => {
    const task = editQuery.data;
    if (!task) return;
    setTitle(task.title ?? '');
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setLocationName(task.location_name ?? '');
    setLocationLat(task.location_lat?.toString() ?? '');
    setLocationLng(task.location_lng?.toString() ?? '');
    setLocationRadius(task.location_radius_m?.toString() ?? '');
    setScheduledAt(task.scheduled_at ? task.scheduled_at.slice(0, 16) : '');
    setDeadline(task.deadline ? task.deadline.slice(0, 16) : '');
    setSelectedStaff(task.assignees?.map((a) => a.id) ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editQuery.data?.id]);

  // Staff list for assignment
  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
  });
  const staffList = staffData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      tasksApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        location_name: locationName.trim() || undefined,
        location_lat: locationLat ? parseFloat(locationLat) : undefined,
        location_lng: locationLng ? parseFloat(locationLng) : undefined,
        location_radius_m: locationRadius ? parseInt(locationRadius) : undefined,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        assignee_ids: selectedStaff.length > 0 ? selectedStaff : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Success', 'Task created', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e) => {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to create task');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      tasksApi.update(editId!, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        location_name: locationName.trim() || undefined,
        location_lat: locationLat ? parseFloat(locationLat) : undefined,
        location_lng: locationLng ? parseFloat(locationLng) : undefined,
        location_radius_m: locationRadius ? parseInt(locationRadius) : undefined,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', editId] });
      Alert.alert('Success', 'Task updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e) => {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Failed to update task');
    },
  });

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const inputCls =
    'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-900';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-50 dark:bg-black">
        {/* Header */}
        <View className="bg-white dark:bg-gray-900 px-5 pt-14 pb-4 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3 active:opacity-60">
              <Text className="text-brand text-base">← Back</Text>
            </Pressable>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Task' : 'Create Task'}
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4">
          {/* Title */}
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Title *
            </Text>
            <TextInput
              className={inputCls}
              placeholder="Task title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </Text>
            <TextInput
              className={`${inputCls} h-20`}
              placeholder="Task description"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Priority */}
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Priority
            </Text>
            <View className="flex-row gap-2">
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(priority === p ? undefined : p)}
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    priority === p
                      ? 'bg-brand border-brand'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      priority === p ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Location */}
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Location
            </Text>
            <TextInput
              className={`${inputCls} mb-2`}
              placeholder="Address / location name"
              placeholderTextColor="#9ca3af"
              value={locationName}
              onChangeText={setLocationName}
            />
            <View className="flex-row gap-2 mb-2">
              <TextInput
                className={`${inputCls} flex-1`}
                placeholder="Latitude"
                placeholderTextColor="#9ca3af"
                value={locationLat}
                onChangeText={setLocationLat}
                keyboardType="decimal-pad"
              />
              <TextInput
                className={`${inputCls} flex-1`}
                placeholder="Longitude"
                placeholderTextColor="#9ca3af"
                value={locationLng}
                onChangeText={setLocationLng}
                keyboardType="decimal-pad"
              />
            </View>
            <TextInput
              className={inputCls}
              placeholder="GPS radius (meters)"
              placeholderTextColor="#9ca3af"
              value={locationRadius}
              onChangeText={setLocationRadius}
              keyboardType="number-pad"
            />
          </View>

          {/* Schedule */}
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Scheduled At (YYYY-MM-DDTHH:MM)
            </Text>
            <TextInput
              className={inputCls}
              placeholder="2026-03-20T08:00"
              placeholderTextColor="#9ca3af"
              value={scheduledAt}
              onChangeText={setScheduledAt}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Deadline (YYYY-MM-DDTHH:MM)
            </Text>
            <TextInput
              className={inputCls}
              placeholder="2026-03-20T17:00"
              placeholderTextColor="#9ca3af"
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>

          {/* Assign staff (create only) */}
          {!isEditing && staffList.length > 0 && (
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Assign Staff
              </Text>
              <View className="gap-2">
                {staffList.map((s) => {
                  const selected = selectedStaff.includes(s.id);
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() =>
                        setSelectedStaff((prev) =>
                          selected ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                        )
                      }
                      className={`flex-row items-center px-4 py-3 rounded-xl border ${
                        selected
                          ? 'border-brand bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <View
                        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                          selected ? 'border-brand bg-brand' : 'border-gray-300'
                        }`}
                      >
                        {selected && <Text className="text-white text-xs">✓</Text>}
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-gray-900 dark:text-white">
                          {s.full_name}
                        </Text>
                        <Text className="text-xs text-gray-400">{s.email}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={isMutating}
            className="bg-brand rounded-2xl py-4 items-center mt-2 active:opacity-80 disabled:opacity-50"
          >
            {isMutating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {isEditing ? 'Save Changes' : 'Create Task'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
