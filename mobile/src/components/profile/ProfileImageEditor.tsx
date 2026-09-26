import AppText from "@/components/ui/AppText";
import ProfileImageField from "@/components/profile/ProfileImageField";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import {
  deleteMyAvatar,
  deleteMyCover,
  updateMyAvatar,
  updateMyCover,
} from "@/services/user.service";
import type { UserProfileDto } from "@/types/user";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

type Props = {
  avatarUrl?: string | null;
  coverUrl?: string | null;
  imageVersion: number;
  disabled: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onProfileUpdated: (profile: UserProfileDto) => void;
};

type UploadingImage = "avatar" | "cover" | null;

export default function ProfileImageEditor({
  avatarUrl,
  coverUrl,
  imageVersion,
  disabled,
  onUploadingChange,
  onProfileUpdated,
}: Props) {
  const [selectedAvatar, setSelectedAvatar] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedCover, setSelectedCover] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadingImage, setUploadingImage] =
    useState<UploadingImage>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const requestInFlightRef = useRef(false);

  const pickImage = async (imageType: "avatar" | "cover") => {
    if (disabled || uploadingImage) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Cần quyền truy cập",
        "Bạn cần cho phép ứng dụng truy cập thư viện ảnh.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      allowsEditing: true,
      aspect: imageType === "avatar" ? [1, 1] : [16, 9],
      quality: 0.9,
    });

    if (result.canceled) return;

    const selectedImage = result.assets[0];
    const maxFileSize =
      imageType === "avatar" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (selectedImage.fileSize && selectedImage.fileSize > maxFileSize) {
      setErrorMessage(
        imageType === "avatar"
          ? "Avatar không được vượt quá 5MB."
          : "Ảnh bìa không được vượt quá 10MB.",
      );
      return;
    }

    if (
      selectedImage.mimeType &&
      !supportedTypes.includes(selectedImage.mimeType.toLowerCase())
    ) {
      setErrorMessage("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.");
      return;
    }

    setErrorMessage("");

    if (imageType === "avatar") {
      setSelectedAvatar(selectedImage);
    } else {
      setSelectedCover(selectedImage);
    }
  };

  const uploadAvatar = async () => {
    if (
      !selectedAvatar ||
      disabled ||
      uploadingImage ||
      requestInFlightRef.current
    ) {
      return;
    }

    try {
      requestInFlightRef.current = true;
      setUploadingImage("avatar");
      onUploadingChange(true);
      setErrorMessage("");
      const profile = await updateMyAvatar(selectedAvatar);

      setSelectedAvatar(null);
      onProfileUpdated(profile);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải avatar lên.",
      );
    } finally {
      requestInFlightRef.current = false;
      setUploadingImage(null);
      onUploadingChange(false);
    }
  };

  const uploadCover = async () => {
    if (
      !selectedCover ||
      disabled ||
      uploadingImage ||
      requestInFlightRef.current
    ) {
      return;
    }

    try {
      requestInFlightRef.current = true;
      setUploadingImage("cover");
      onUploadingChange(true);
      setErrorMessage("");
      const profile = await updateMyCover(selectedCover);

      setSelectedCover(null);
      onProfileUpdated(profile);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải ảnh bìa lên.",
      );
    } finally {
      requestInFlightRef.current = false;
      setUploadingImage(null);
      onUploadingChange(false);
    }
  };

  const deleteAvatar = async () => {
    if (disabled || uploadingImage || requestInFlightRef.current) return;

    try {
      requestInFlightRef.current = true;
      setUploadingImage("avatar");
      onUploadingChange(true);
      setErrorMessage("");
      const profile = await deleteMyAvatar();

      onProfileUpdated(profile);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể xóa avatar.",
      );
    } finally {
      requestInFlightRef.current = false;
      setUploadingImage(null);
      onUploadingChange(false);
    }
  };

  const deleteCover = async () => {
    if (disabled || uploadingImage || requestInFlightRef.current) return;

    try {
      requestInFlightRef.current = true;
      setUploadingImage("cover");
      onUploadingChange(true);
      setErrorMessage("");
      const profile = await deleteMyCover();

      onProfileUpdated(profile);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể xóa ảnh bìa.",
      );
    } finally {
      requestInFlightRef.current = false;
      setUploadingImage(null);
      onUploadingChange(false);
    }
  };

  const confirmDeleteAvatar = () => {
    Alert.alert("Xóa avatar", "Bạn có chắc muốn xóa avatar hiện tại?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: deleteAvatar },
    ]);
  };

  const confirmDeleteCover = () => {
    Alert.alert("Xóa ảnh bìa", "Bạn có chắc muốn xóa ảnh bìa hiện tại?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: deleteCover },
    ]);
  };

  const avatarSource = selectedAvatar
    ? { uri: selectedAvatar.uri }
    : avatarUrl
      ? { uri: getFileUrl(avatarUrl, imageVersion)! }
      : require("@/assets/images/icon.png");

  const coverSource = selectedCover
    ? { uri: selectedCover.uri }
    : coverUrl
      ? { uri: getFileUrl(coverUrl, imageVersion)! }
      : null;

  const actionsDisabled = disabled || Boolean(uploadingImage);

  return (
    <View style={styles.container}>
      <AppText variant="subtitle">Ảnh hồ sơ</AppText>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <AppText color={COLORS.danger}>{errorMessage}</AppText>
        </View>
      ) : null}

      <ProfileImageField
        title="Avatar"
        note="Tối đa 5MB"
        imageSource={avatarSource}
        variant="avatar"
        hasCurrentImage={Boolean(avatarUrl)}
        hasSelectedImage={Boolean(selectedAvatar)}
        loading={uploadingImage === "avatar"}
        disabled={actionsDisabled}
        onPick={() => pickImage("avatar")}
        onCancelSelection={() => setSelectedAvatar(null)}
        onUpload={uploadAvatar}
        onDelete={confirmDeleteAvatar}
      />

      <ProfileImageField
        title="Ảnh bìa"
        note="Tối đa 10MB"
        imageSource={coverSource}
        variant="cover"
        hasCurrentImage={Boolean(coverUrl)}
        hasSelectedImage={Boolean(selectedCover)}
        loading={uploadingImage === "cover"}
        disabled={actionsDisabled}
        onPick={() => pickImage("cover")}
        onCancelSelection={() => setSelectedCover(null)}
        onUpload={uploadCover}
        onDelete={confirmDeleteCover}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  errorBox: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
  },
});
