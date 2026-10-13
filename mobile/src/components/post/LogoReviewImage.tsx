import { useState } from "react";
import { Image, View } from "react-native";
import AppText from "@/components/ui/AppText";
import { useTheme } from "@/contexts/ThemeContext";
import { getFileUrl } from "@/services/api";
import type { PostMediaDto } from "@/types/feed";

type Analysis = {
  message: string;
  width: number;
  height: number;
  data: { label: string; confidence: number; bbox: number[] }[];
};

export default function LogoReviewImage({ media }: { media: PostMediaDto }) {
  const { colors } = useTheme();
  const [displayWidth, setDisplayWidth] = useState(0);
  let analysis: Analysis | null = null;
  try {
    analysis = media.logoAnalysisJson
      ? JSON.parse(media.logoAnalysisJson)
      : null;
  } catch {
    analysis = null;
  }
  const aspectRatio =
    analysis && analysis.width > 0 && analysis.height > 0
      ? analysis.width / analysis.height
      : 1;
  const scale =
    analysis && analysis.width > 0 ? displayWidth / analysis.width : 0;

  return (
    <View>
      <View
        onLayout={(event) => setDisplayWidth(event.nativeEvent.layout.width)}
      >
        <Image
          source={{ uri: getFileUrl(media.url)! }}
          resizeMode="contain"
          style={{ width: "100%", aspectRatio }}
        />
        {scale > 0 &&
          analysis?.data.map((item, index) => (
            <View
              key={index}
              pointerEvents="none"
              style={{
                position: "absolute",
                left: item.bbox[0] * scale,
                top: item.bbox[1] * scale,
                width: (item.bbox[2] - item.bbox[0]) * scale,
                height: (item.bbox[3] - item.bbox[1]) * scale,
                borderWidth: 2,
                borderColor: colors.danger,
              }}
            >
              <AppText
                variant="caption"
                style={{ backgroundColor: colors.surface }}
              >
                {item.label} · {Math.round(item.confidence * 100)}%
              </AppText>
            </View>
          ))}
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        {analysis?.message ||
          "Chưa có kết quả nhận diện. Cần xem ảnh thủ công."}
      </AppText>
    </View>
  );
}
