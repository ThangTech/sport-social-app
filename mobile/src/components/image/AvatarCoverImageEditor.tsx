import ImageUploadField from "@/components/image/ImageUploadField";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { Alert, StyleSheet, View } from "react-native";

type ImageType = "avatar" | "cover";

export type ImageUpdateResult = {
  avatarUrl?: string | null;
  coverUrl?: string | null;
  updatedAt?: string | null;
};

type Props = {
  title: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  imageVersion?: string | number | null;
  avatarFallback?: ImageSourcePropType | null;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onUpdated: (result: ImageUpdateResult) => void;
  onReload?: () => Promise<void>;
  uploadAvatar: (asset: ImagePicker.ImagePickerAsset) => Promise<ImageUpdateResult>;
  uploadCover: (asset: ImagePicker.ImagePickerAsset) => Promise<ImageUpdateResult>;
  deleteAvatar: () => Promise<ImageUpdateResult>;
  deleteCover: () => Promise<ImageUpdateResult>;
};

const MAX_SIZE = {
  avatar: 5 * 1024 * 1024,
  cover: 10 * 1024 * 1024,
};

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export default function AvatarCoverImageEditor({
  title,
  avatarUrl,
  coverUrl,
  imageVersion,
  avatarFallback = null,
  disabled,
  onBusyChange,
  onUpdated,
  onReload,
  uploadAvatar,
  uploadCover,
  deleteAvatar,
  deleteCover,
}: Props) {
  const [selectedAvatar, setSelectedAvatar] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedCover, setSelectedCover] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busyImage, setBusyImage] = useState<ImageType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const requestInFlightRef = useRef(false);

  const setSelectedImage = (
    imageType: ImageType,
    asset: ImagePicker.ImagePickerAsset | null,
  ) => {
    if (imageType === "avatar") setSelectedAvatar(asset);
    else setSelectedCover(asset);
  };

  const pickImage = async (imageType: ImageType) => {
    if (disabled || busyImage) return;

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

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > MAX_SIZE[imageType]) {
      setErrorMessage(
        imageType === "avatar"
          ? "Avatar không được vượt quá 5MB."
          : "Ảnh bìa không được vượt quá 10MB.",
      );
      return;
    }

    if (
      asset.mimeType &&
      !SUPPORTED_TYPES.includes(asset.mimeType.toLowerCase())
    ) {
      setErrorMessage("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.");
      return;
    }

    setErrorMessage("");
    setSelectedImage(imageType, asset);
  };

  const runOperation = async (
    imageType: ImageType,
    operation: () => Promise<ImageUpdateResult>,
    fallbackMessage: string,
  ) => {
    if (disabled || busyImage || requestInFlightRef.current) return;

    try {
      requestInFlightRef.current = true;
      setBusyImage(imageType);
      onBusyChange(true);
      setErrorMessage("");

      const result = await operation();
      setSelectedImage(imageType, null);
      onUpdated(result);
    } catch (error) {
      setSelectedImage(imageType, null);
      setErrorMessage(error instanceof Error ? error.message : fallbackMessage);

      try {
        await onReload?.();
      } catch {
        // Keep the upload error visible; the next screen focus retries the reload.
      }
    } finally {
      requestInFlightRef.current = false;
      setBusyImage(null);
      onBusyChange(false);
    }
  };

  const selectedImage = {
    avatar: selectedAvatar,
    cover: selectedCover,
  };

  const uploadImage = (imageType: ImageType) => {
    const asset = selectedImage[imageType];
    if (!asset) return;

    const operation =
      imageType === "avatar"
        ? () => uploadAvatar(asset)
        : () => uploadCover(asset);

    runOperation(
      imageType,
      operation,
      imageType === "avatar"
        ? "Không thể tải avatar lên."
        : "Không thể tải ảnh bìa lên.",
    );
  };

  const removeImage = (imageType: ImageType) => {
    runOperation(
      imageType,
      imageType === "avatar" ? deleteAvatar : deleteCover,
      imageType === "avatar"
        ? "Không thể xóa avatar."
        : "Không thể xóa ảnh bìa.",
    );
  };

  const confirmDelete = (imageType: ImageType) => {
    const label = imageType === "avatar" ? "avatar" : "ảnh bìa";

    Alert.alert(
      `Xóa ${label}`,
      `Bạn có chắc muốn xóa ${label} hiện tại?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => removeImage(imageType),
        },
      ],
    );
  };

  const avatarSource = selectedAvatar
    ? { uri: selectedAvatar.uri }
    : avatarUrl
      ? { uri: getFileUrl(avatarUrl, imageVersion)! }
      : avatarFallback;
  const coverSource = selectedCover
    ? { uri: selectedCover.uri }
    : coverUrl
      ? { uri: getFileUrl(coverUrl, imageVersion)! }
      : null;
  const actionsDisabled = disabled || Boolean(busyImage);

  return (
    <View style={styles.container}>
      <AppText variant="subtitle">{title}</AppText>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <AppText color={COLORS.danger}>{errorMessage}</AppText>
        </View>
      ) : null}

      <ImageUploadField
        title="Avatar"
        note="Tối đa 5MB"
        imageSource={avatarSource}
        variant="avatar"
        hasCurrentImage={Boolean(avatarUrl)}
        hasSelectedImage={Boolean(selectedAvatar)}
        loading={busyImage === "avatar"}
        disabled={actionsDisabled}
        onPick={() => pickImage("avatar")}
        onCancelSelection={() => setSelectedAvatar(null)}
        onUpload={() => uploadImage("avatar")}
        onDelete={() => confirmDelete("avatar")}
      />

      <ImageUploadField
        title="Ảnh bìa"
        note="Tối đa 10MB"
        imageSource={coverSource}
        variant="cover"
        hasCurrentImage={Boolean(coverUrl)}
        hasSelectedImage={Boolean(selectedCover)}
        loading={busyImage === "cover"}
        disabled={actionsDisabled}
        onPick={() => pickImage("cover")}
        onCancelSelection={() => setSelectedCover(null)}
        onUpload={() => uploadImage("cover")}
        onDelete={() => confirmDelete("cover")}
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
