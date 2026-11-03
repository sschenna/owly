import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radius } from '../theme';

// Bottom sheet with a list of tappable options. Backdrop tap dismisses.
export default function OptionSheet({ visible, title, options, selectedId, onSelect, onClose, renderRight }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {options.map((o) => {
              const sel = o.id === selectedId;
              return (
                <Pressable
                  key={o.id}
                  style={[styles.opt, sel && styles.optSel]}
                  onPress={() => {
                    onSelect(o);
                    onClose();
                  }}
                >
                  <View style={styles.optMid}>
                    <Text style={[styles.optLabel, sel && styles.optLabelSel, o.destructive && styles.optDestructive]}>{o.label}</Text>
                    {o.sub ? <Text style={styles.optSub}>{o.sub}</Text> : null}
                  </View>
                  {renderRight ? (
                    renderRight(o, sel)
                  ) : sel ? (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
                      <Path d="M5 13l4 4L19 7" />
                    </Svg>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(43,43,58,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: '75%',
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3, marginBottom: 10 },
  list: { maxHeight: 380 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optSel: {},
  optMid: { flex: 1 },
  optLabel: { fontSize: 16, fontFamily: fonts.regular, color: colors.ink },
  optLabelSel: { fontFamily: fonts.extraBold, color: colors.coral },
  optDestructive: { color: colors.red, fontFamily: fonts.bold },
  optSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 3 },
  cancel: {
    marginTop: 14,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
});
