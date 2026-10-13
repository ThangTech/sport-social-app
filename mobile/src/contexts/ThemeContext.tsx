import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { COLORS } from "@/constants/theme";

const lightColors: typeof COLORS = {
  ...COLORS,
  background: "#FFFFFF",
  surface: "#F5F7FA",
  surfaceAlt: "#E9EEF3",
  text: "#172033",
  textMuted: "#526176",
  border: "#D8E0EA",
  primary: "#247A16",
  primarySoft: "#E3F4DE",
};
const ThemeContext = createContext({
  colors: COLORS,
  isLight: false,
  toggleTheme: () => {},
});
const key = "socialsport.theme";
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isLight, setIsLight] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read =
      Platform.OS === "web"
        ? Promise.resolve().then(() => localStorage.getItem(key))
        : SecureStore.getItemAsync(key);
    void read
      .then((value) => setIsLight(value === "light"))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    const save =
      Platform.OS === "web"
        ? Promise.resolve().then(() =>
            localStorage.setItem(key, next ? "light" : "dark"),
          )
        : SecureStore.setItemAsync(key, next ? "light" : "dark");
    void save.catch(() => {});
  };
  if (!ready) return null;
  return (
    <ThemeContext.Provider
      value={{ colors: isLight ? lightColors : COLORS, isLight, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
