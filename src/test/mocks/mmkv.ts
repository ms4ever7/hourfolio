// In-memory stand-in for react-native-mmkv, which needs native code.
export function createMMKV() {
  const data = new Map<string, string>();
  return {
    getString: (key: string) => data.get(key),
    set: (key: string, value: string) => void data.set(key, value),
    remove: (key: string) => data.delete(key),
    clearAll: () => data.clear(),
  };
}

export type MMKV = ReturnType<typeof createMMKV>;
