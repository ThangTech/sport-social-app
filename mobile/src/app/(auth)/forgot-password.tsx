import { forgotPassword } from "@/services/auth.service";
import { ApiError } from "@/types/api";
import { router } from "expo-router";
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async () => {
    setErrorMessage("");
    setFieldErrors({});
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email.");
      return;
    }

    try {
      setLoading(true);

      const response = await forgotPassword({
        email: email.trim(),
      });

      setSuccessMessage(response.message);
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

      setErrorMessage("Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Quay lại</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.brand}>SocialSport</Text>

          <Text style={styles.title}>Quên mật khẩu?</Text>

          <Text style={styles.subtitle}>
            Nhập email tài khoản của bạn. Chúng tôi sẽ gửi liên kết đặt lại mật
            khẩu.
          </Text>
        </View>

        {successMessage ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>

            <Text style={styles.successHint}>
              Hãy kiểm tra cả hộp thư đến và thư rác.
            </Text>

            <Pressable
              onPress={() => router.replace("/(auth)/login")}
              style={styles.backToLoginButton}
            >
              <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View>
              <Text style={styles.label}>Email</Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              {fieldErrors.Email?.map((message, index) => (
                <Text key={`${message}-${index}`} style={styles.fieldError}>
                  {message}
                </Text>
              ))}
            </View>

            <Pressable
              onPress={handleSubmit}
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
                <Text style={styles.buttonText}>
                  Gửi liên kết đặt lại mật khẩu
                </Text>
              )}
            </Pressable>
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 28,
  },

  backText: {
    fontSize: 15,
    fontWeight: "500",
  },

  header: {
    marginBottom: 30,
  },

  brand: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
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

  successBox: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },

  successText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },

  successHint: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.6,
    marginTop: 8,
  },

  backToLoginButton: {
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },

  backToLoginText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
