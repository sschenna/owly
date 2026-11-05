import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

// Reusable keyboard-avoiding wrapper. Pushes content up when the keyboard
// opens so inputs are never hidden behind it. Use on any screen with a
// TextInput.
export default function KbAvoid({ children, offset = 0, style }) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
