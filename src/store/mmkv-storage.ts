import { createMMKV, type MMKV } from 'react-native-mmkv';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

export const mmkv: MMKV = createMMKV({ id: 'hourfolio' });

const mmkvStateStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => {
    mmkv.remove(name);
  },
};

export const mmkvZustandStorage = createJSONStorage(() => mmkvStateStorage);
