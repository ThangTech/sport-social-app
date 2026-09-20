import { register } from "@/services/auth.service";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/types/api";
export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleRegister = async () => {
    console.log("REGISTER BUTTON PRESSED");

    setError("");
    setFieldErrors({});

    if (
      !displayName.trim() ||
      !userName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (userName.includes(" ")) {
      setError("Tên đăng nhập không được chứa khoảng trắng.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      console.log("CALLING REGISTER API");

      const response = await register({
        displayName: displayName.trim(),
        userName: userName.trim(),
        email: email.trim(),
        password,
      });

      console.log("REGISTER SUCCESS:", response);

      router.replace("/(auth)/login");
    } catch (error) {
      console.log("REGISTER ERROR:", error);

      if (error instanceof ApiError) {
        setError(error.message);
        setFieldErrors(error.errors ?? {});
        return;
      }

      if (error instanceof Error) {
        setError(error.message);
        return;
      }

      setError("Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.brand}>SocialSport</Text>

            <Text style={styles.title}>Tạo tài khoản</Text>

            <Text style={styles.subtitle}>
              Tham gia cộng đồng và kết nối với những người cùng yêu thể thao.
            </Text>
          </View>

          <View style={styles.form}>
            {error ? <Text style={styles.generalError}>{error}</Text> : null}
            <View>
              <Text style={styles.label}>Tên hiển thị</Text>

              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Nguyen Van Thang"
                style={styles.input}
              />
              {fieldErrors.DisplayName?.map((message) => (
                <Text key={message} style={styles.errorText}>
                  {message}
                </Text>
              ))}
            </View>

            <View>
              <Text style={styles.label}>Tên đăng nhập</Text>

              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="nguyenvanthang"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              {fieldErrors.UserName?.map((message) => (
                <Text key={message} style={styles.errorText}>
                  {message}
                </Text>
              ))}
            </View>

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

              {fieldErrors.Email?.map((message) => (
                <Text key={message} style={styles.errorText}>
                  {message}
                </Text>
              ))}
            </View>

            <View>
              <Text style={styles.label}>Mật khẩu</Text>

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                secureTextEntry
                style={styles.input}
              />
              {fieldErrors.Password?.map((message) => (
                <Text key={message} style={styles.errorText}>
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
            </View>

            <Pressable
              onPress={handleRegister}
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
                <Text style={styles.buttonText}>Đăng ký</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>

            <Pressable onPress={() => router.back()}>
              <Text style={styles.link}>Đăng nhập</Text>
            </Pressable>
          </View>
        </ScrollView>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
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
    marginTop: 8,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },

  footerText: {
    opacity: 0.6,
  },

  link: {
    fontWeight: "600",
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: "#DC2626",
  },

  generalError: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    marginBottom: 4,
  },
});
