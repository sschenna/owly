import { Pressable } from 'react-native';
import { playUiSound } from '../lib/sounds';
import { getSettings } from '../store';

// Drop-in replacement for Pressable that plays the user's chosen UI tap
// sound on every press. Use everywhere instead of raw Pressable.
export default function Tap({ onPress, ...props }) {
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        try {
          playUiSound(() => getSettings().uiSound);
        } catch {}
        if (onPress) onPress(e);
      }}
    />
  );
}
