import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radius } from '../theme';
import Tap from './Tap';

// Bottom sheet with a list of tappable options. Backdrop tap dismisses.
// Selection is staged locally — tap Save to confirm, Cancel to discard.
// Set closeOnSelect={false} to keep the sheet open after tapping (for previews).
// If onSave is provided, the sheet shows a Save button and only calls onSave
// (not onSelect) when Save is tapped. Otherwise onSelect fires immediately
// (unless closeOnSelect=false).
export default function OptionSheet({ visible, title, options, selectedId, onSelect, onSave, onClose, renderRight, closeOnSelect = true }) {
  const [staged, setStaged] = useState(selectedId);
  useEffect(() => { if (visible) setStaged(selectedId); }, [visible, selectedId]);

  const pick = (o) => {
    if (onSave) {
      setStaged(o.id);
    } else {
      onSelect(o);
      if (closeOnSelect) onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Tap style={styles.backdrop} onPress={onClose}>
        <Tap style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {options.map((o) => {
              const sel = o.id === (onSave ? staged : selectedId);
              return (
                <Tap
                  key={o.id}
                  style={[styles.opt, sel && styles.optSel]}
                  onPress={() => pick(o)}
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
                </Tap>
              );
            })}
          </ScrollView>
          {onSave ? (
            <View style={styles.saveRow}>
              <Tap style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Tap>
              <Tap
                style={styles.saveBtn}
                onPress={() => {
                  const o = options.find((x) => x.id === staged);
                  if (o) onSave(o);
                  onClose();
                }}
              >
                <Text style={styles.saveText}>Save</Text>
              </Tap>
            </View>
          ) : (
            <Tap style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Tap>
          )}
        </Tap>
      </Tap>
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
  saveRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.coral,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveText: { fontSize: 16, fontFamily: fonts.extraBold, color: '#fff' },
});
