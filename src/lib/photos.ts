import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { newId } from '@/domain/ids';

const folder = () => new Directory(Paths.document, 'photos');

/**
 * Lets the user pick a photo and crop it square, then keeps a copy in the app's
 * document folder. Returns the file name, or null if the user cancelled.
 */
export async function pickSquarePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 });
  if (result.canceled || !result.assets?.[0]) return null;
  const dir = folder();
  const name = `${newId('p')}.jpg`;
  try {
    dir.create({ idempotent: true });
    // `copy` is asynchronous: the name goes back only once the file is really there.
    await new File(result.assets[0].uri).copy(new File(dir, name));
    return name;
  } catch {
    // No room, or the picked file is gone: better no photo than one that points at nothing.
    return null;
  }
}

/** The current URI of a stored photo. The document folder can move between app updates. */
export function photoUri(file: string): string {
  return new File(folder(), file).uri;
}

export function deletePhoto(file: string | undefined) {
  if (!file) return;
  try {
    const f = new File(folder(), file);
    if (f.exists) f.delete();
  } catch {
    // A missing photo is fine: there is nothing left to clean up.
  }
}
