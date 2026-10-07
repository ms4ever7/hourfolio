import { ColorPicker, Host } from '@expo/ui/swift-ui';
import { parseHex, toHex } from '@/domain/color';
import { useAppTheme } from '@/theme/theme';

/** The system color picker (iOS only). Calls `onChange` with a `#RRGGBB` string. */
export function NativeColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const { mode } = useAppTheme();
  return (
    <Host matchContents colorScheme={mode}>
      <ColorPicker selection={value} onSelectionChange={(c) => onChange(toHex(parseHex(c)))} />
    </Host>
  );
}

export const HAS_NATIVE_COLOR_PICKER = true;
