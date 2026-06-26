import { useEffect, useRef } from 'react';

export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  a: boolean; // primary action (space / on-screen A)
  b: boolean; // secondary action (shift / on-screen B)
  start: boolean; // pause (esc / on-screen start)
  pointer: { x: number; y: number; down: boolean } | null;
};

export type ButtonName = 'left' | 'right' | 'up' | 'down' | 'a' | 'b' | 'start';

// Single shared mutable state object. Both keyboard (useInput) and the touch
// overlay write into this; every minigame reads from it. This is what makes
// keyboard + touch a single unified contract.
const state: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  a: false,
  b: false,
  start: false,
  pointer: null,
};

// Track each source independently so releasing a key doesn't clobber a held
// touch button and vice-versa.
const keyHeld: Record<ButtonName, boolean> = {
  left: false,
  right: false,
  up: false,
  down: false,
  a: false,
  b: false,
  start: false,
};
const touchHeld: Record<ButtonName, boolean> = {
  left: false,
  right: false,
  up: false,
  down: false,
  a: false,
  b: false,
  start: false,
};

function recompute(btn: ButtonName) {
  state[btn] = keyHeld[btn] || touchHeld[btn];
}

/** Called by TouchOverlay buttons. */
export function setTouchButton(btn: ButtonName, pressed: boolean): void {
  touchHeld[btn] = pressed;
  recompute(btn);
}

export function setPointer(p: InputState['pointer']): void {
  state.pointer = p;
}

const KEY_MAP: Record<string, ButtonName> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'a',
  KeyJ: 'a',
  ShiftLeft: 'b',
  ShiftRight: 'b',
  KeyK: 'b',
  Escape: 'start',
  Enter: 'start',
};

let listenerCount = 0;
let handlersInstalled = false;

function onKeyDown(e: KeyboardEvent) {
  const btn = KEY_MAP[e.code];
  if (!btn) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
    e.preventDefault();
  }
  keyHeld[btn] = true;
  recompute(btn);
}

function onKeyUp(e: KeyboardEvent) {
  const btn = KEY_MAP[e.code];
  if (!btn) return;
  keyHeld[btn] = false;
  recompute(btn);
}

function onBlur() {
  // Drop all held keys when the window loses focus (prevents stuck movement).
  (Object.keys(keyHeld) as ButtonName[]).forEach((b) => {
    keyHeld[b] = false;
    recompute(b);
  });
}

/**
 * Installs global keyboard listeners (ref-counted so React StrictMode's
 * double-mount and multiple consumers are safe) and returns the shared,
 * stable InputState object. Read it every frame — never bind raw keydown.
 */
export function useInput(): InputState {
  const ref = useRef(state);
  useEffect(() => {
    listenerCount++;
    if (!handlersInstalled) {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);
      handlersInstalled = true;
    }
    return () => {
      listenerCount--;
      if (listenerCount <= 0 && handlersInstalled) {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onBlur);
        handlersInstalled = false;
        listenerCount = 0;
      }
    };
  }, []);
  return ref.current;
}

/** Direct accessor for non-hook code paths (e.g. one-shot edge detection). */
export function getInput(): InputState {
  return state;
}
