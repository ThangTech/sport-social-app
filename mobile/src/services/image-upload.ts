import type { ImagePickerAsset } from "expo-image-picker";

export const createImageFormData = (
  asset: ImagePickerAsset,
  filePrefix: string,
) => {
  const formData = new FormData();
  const extension = asset.mimeType?.split("/")[1] ?? "jpg";

  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName ?? `${filePrefix}-${Date.now()}.${extension}`,
    type: asset.mimeType ?? "image/jpeg",
  } as any);

  return formData;
};
