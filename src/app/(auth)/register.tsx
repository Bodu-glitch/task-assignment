import { useState, useEffect, useRef } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, Pressable, ScrollView, Link } from '@/tw';
import { useAuth } from '@/context/auth';
import { ApiError } from '@/lib/api/client';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const slugEdited = useRef(false);

  useEffect(() => {
    if (!slugEdited.current) {
      setTenantSlug(slugify(tenantName));
    }
  }, [tenantName]);

  function handleSlugChange(text: string) {
    slugEdited.current = true;
    setTenantSlug(text.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  }

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword || !tenantName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (tenantSlug && !/^[a-z0-9-]+$/.test(tenantSlug)) {
      Alert.alert('Error', 'Workspace URL can only contain lowercase letters, numbers, and hyphens.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim(), tenantName.trim(), tenantSlug || undefined);
      // On success, auth state is set and index.tsx redirects automatically
    } catch (e) {
      let message = 'Đăng ký thất bại. Vui lòng thử lại.';
      if (e instanceof ApiError) {
        if (e.code === 'EMAIL_ALREADY_EXISTS') {
          message = 'Email đã được đăng ký. Hãy thử đăng nhập.';
        } else if (e.code === 'SLUG_ALREADY_EXISTS') {
          message = 'Workspace URL đã được dùng. Chọn tên khác.';
        } else {
          message = e.message || message;
        }
      }
      Alert.alert('Đăng ký thất bại', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 py-10 bg-white dark:bg-black"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-8 items-center">
          <View className="w-16 h-16 rounded-2xl bg-brand items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">T</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</Text>
          <Text className="text-sm text-gray-500 mt-1">Set up your workspace</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
              placeholder="Nguyễn Văn A"
              placeholderTextColor="#9ca3af"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
              placeholder="At least 6 characters"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm Password <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View className="mt-2">
            <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Business Info
            </Text>

            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Business Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
                  placeholder="Acme Corp"
                  placeholderTextColor="#9ca3af"
                  value={tenantName}
                  onChangeText={setTenantName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Workspace URL{' '}
                  <Text className="text-gray-400 font-normal">(optional)</Text>
                </Text>
                <TextInput
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
                  placeholder="acme-corp"
                  placeholderTextColor="#9ca3af"
                  value={tenantSlug}
                  onChangeText={handleSlugChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {tenantSlug.length > 0 && (
                  <Text className="text-xs text-gray-400 mt-1 ml-1">
                    app.example.com/{tenantSlug}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            className="w-full bg-brand rounded-xl py-3.5 items-center justify-center mt-4 active:opacity-80 disabled:opacity-50"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Create Account</Text>
            )}
          </Pressable>
        </View>

        <View className="items-center mt-6">
          <Text className="text-sm text-gray-500 dark:text-gray-400">Already have an account? </Text>
          <Link href="/(auth)/login" replace>
            <Text className="text-sm font-semibold text-brand">Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
