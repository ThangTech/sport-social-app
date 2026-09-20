import { resetPassword } from "@/services/auth.service";
import { ApiError } from "@/types/api";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    setErrorMessage("");
    setFieldErrors({});

    if (!email || !token) {
      setErrorMessage("Liên kết đặt lại mật khẩu không hợp lệ.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Vui lòng nhập đầy đủ mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword({
        email,
        token,
        newPassword,
        confirmPassword,
      });

      setSuccess(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        setFieldErrors(error.errors ?? {});
        return;
      }

      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Đổi mật khẩu thành công</Text>

          <Text style={styles.successDescription}>
            Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật
            khẩu mới.
          </Text>

          <Pressable
            onPress={() => router.replace("/(auth)/login")}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>SocialSport</Text>

          <Text style={styles.title}>Đặt lại mật khẩu</Text>

          <Text style={styles.subtitle}>
            Tạo mật khẩu mới cho tài khoản của bạn.
          </Text>
        </View>

        <View style={styles.form}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View>
            <Text style={styles.label}>Mật khẩu mới</Text>

            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nhập mật khẩu mới"
              secureTextEntry
              style={styles.input}
            />

            {fieldErrors.NewPassword?.map((message, index) => (
              <Text key={`${message}-${index}`} style={styles.fieldError}>
                {message}
              </Text>
            ))}
          </View>

          <View>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry
              style={styles.input}
            />

            {fieldErrors.ConfirmPassword?.map((message, index) => (
              <Text key={`${message}-${index}`} style={styles.fieldError}>
                {message}
              </Text>
            ))}
          </View>

          <Pressable
            onPress={handleResetPassword}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  header: {
    marginBottom: 32,
  },

  brand: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 26,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.6,
  },

  form: {
    gap: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  errorBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },

  errorBoxText: {
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 20,
  },

  fieldError: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 6,
  },

  successContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },

  successDescription: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.6,
    marginBottom: 28,
  },
});
