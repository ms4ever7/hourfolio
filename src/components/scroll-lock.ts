import { createContext } from 'react';

/**
 * Lets something inside a screen stop the screen's own scrolling while it is
 * dragged (a planned session being moved). `Screen` provides it.
 */
export const ScrollLockContext = createContext<(locked: boolean) => void>(() => {});
