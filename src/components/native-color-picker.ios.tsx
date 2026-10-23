import { ColorPicker, Host } from '@expo/ui/swift-ui';
import { View } from 'react-native';
import { parseHex, toHex } from '@/domain/color';
import { useAppTheme } from '@/theme/theme';

/** The system color picker (iOS only). Calls `onChange` with a `#RRGGBB` string. */
export function NativeColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const { mode } = useAppTheme();
  return (
    // The picker brings its own padding; a fixed, centered box keeps the swatch in the middle of the row.
    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Host matchContents colorScheme={mode}>
        <ColorPicker selection={value} onSelectionChange={(c) => onChange(toHex(parseHex(c)))} />
      </Host>
    </View>
  );
}

export const HAS_NATIVE_COLOR_PICKER = true;
