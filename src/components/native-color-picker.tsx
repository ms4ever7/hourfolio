/** Android and web have no system color picker; the presets on the Appearance screen are all there is. */
export function NativeColorPicker(_props: { value: string; onChange: (hex: string) => void }) {
  return null;
}

export const HAS_NATIVE_COLOR_PICKER = false;
