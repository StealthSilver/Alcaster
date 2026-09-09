import { useTheme } from "@/context/ThemeContext";

type AlcasterLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
  onDark?: boolean;
};

export function AlcasterLogo({
  className = "h-7 w-auto",
  width = 72,
  height = 32,
  alt = "Alcaster",
  onDark = false,
}: AlcasterLogoProps) {
  const { theme } = useTheme();
  const darkBackground = onDark || theme === "dark";
  return (
    <img
      src={darkBackground ? "/Alcaster-dark.svg" : "/Alcaster-light.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
