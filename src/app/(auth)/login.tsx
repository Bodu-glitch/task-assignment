import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { View, Text, TextInput, Pressable, ScrollView, Link } from '@/tw';
import { useAuth } from '@/context/auth';
import { ApiError } from '@/lib/api/client';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.code === 'INVALID_CREDENTIALS'
            ? 'Wrong email or password'
            : e.message
          : 'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
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
        contentContainerClassName="flex-1 justify-center px-6 bg-white dark:bg-black"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / title */}
        <View className="mb-10 items-center">
          <View className="w-16 h-16 rounded-2xl bg-brand items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">T</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</Text>
          <Text className="text-sm text-gray-500 mt-1">Sign in to continue</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
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
              Password
            </Text>
            <TextInput
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              editable={!loading}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="w-full bg-brand rounded-xl py-3.5 items-center justify-center mt-2 active:opacity-80 disabled:opacity-50"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Sign In</Text>
            )}
          </Pressable>
        </View>

        <View className="items-center mt-6">
          <Text className="text-sm text-gray-500 dark:text-gray-400">Don't have an account? </Text>
          <Link href="/(auth)/register">
            <Text className="text-sm font-semibold text-brand">Create one</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
