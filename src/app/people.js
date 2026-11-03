import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import OptionSheet from '../components/OptionSheet';
import { USER_NAME, getDocs, updateDocs, updatePeople, usePeople } from '../store';
import { colors, fonts, gradients, radius } from '../theme';
import { initials } from '../lib/format';

const PALETTE = ['#f2668b', '#b388ff', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];
const uid = () => `p-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// People: everyone whose documents Owly tracks. Deleting someone
// hands their documents back to you rather than deleting them.
export default function People() {
  const people = usePeople();
  const docs = getDocs();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [delPerson, setDelPerson] = useState(null);

  const countFor = (id) => docs.filter((d) => d.owner === id).length;

  const addPerson = () => {
    const n = name.trim();
    if (!n) return;
    updatePeople((ps) => [...ps, { id: uid(), name: n, color }]);
    setName('');
    setAdding(false);
  };

  const confirmDelete = () => {
    const p = delPerson;
    setDelPerson(null);
    updateDocs((ds) => ds.map((d) => (d.owner === p.id ? { ...d, owner: 'me' } : d)));
    updatePeople((ps) => ps.filter((x) => x.id !== p.id));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>Profile</Text>
        </Pressable>

        <Text style={styles.title}>People</Text>
        <Text style={styles.sub}>Whose documents is Owly watching?</Text>

        <View style={styles.card}>
          <View style={[styles.row, styles.rowFirst]}>
            <View style={[styles.avatar, { backgroundColor: colors.coral }]}>
              <Text style={styles.avatarText}>{initials(USER_NAME)}</Text>
            </View>
            <View style={styles.mid}>
              <Text style={styles.name}>{USER_NAME} (you)</Text>
              <Text style={styles.count}>{countFor('me')} documents</Text>
            </View>
          </View>
          {people.map((p) => (
            <Pressable key={p.id} style={styles.row} onPress={() => setDelPerson(p)}>
              <View style={[styles.avatar, { backgroundColor: p.color }]}>
                <Text style={styles.avatarText}>{initials(p.name)}</Text>
              </View>
              <View style={styles.mid}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.count}>{countFor(p.id)} documents</Text>
              </View>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
                <Path d="M9 6l6 6-6 6" />
              </Svg>
            </Pressable>
          ))}
        </View>

        {adding ? (
          <View style={styles.addCard}>
            <Text style={styles.addLabel}>New person</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Their name"
              placeholderTextColor={colors.muted}
              maxLength={30}
              autoFocus
            />
            <View style={styles.swatches}>
              {PALETTE.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
            <View style={styles.addBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => setAdding(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addPerson} disabled={!name.trim()}>
                <LinearGradient
                  colors={name.trim() ? gradients.brand : ['#e8dfe3', '#e8dfe3']}
                  style={styles.saveBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saveText}>Add person</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.addMore} onPress={() => setAdding(true)}>
            <Text style={styles.addMoreText}>+ Add person</Text>
          </Pressable>
        )}
      </ScrollView>

      <OptionSheet
        visible={delPerson !== null}
        title={`Remove ${delPerson ? delPerson.name : ''}?`}
        options={[
          {
            id: 'del',
            label: 'Remove person',
            sub: 'Their documents come back to you — nothing is deleted',
            destructive: true,
          },
        ]}
        onClose={() => setDelPerson(null)}
        onSelect={confirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12, alignSelf: 'flex-start' },
  backText: { fontSize: 15, fontFamily: fonts.bold, color: colors.coral },
  title: { fontSize: 27, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginBottom: 18 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowFirst: { borderTopWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 15, fontFamily: fonts.extraBold },
  mid: { flex: 1 },
  name: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
  count: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 2 },
  addMore: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addMoreText: { color: colors.coral, fontFamily: fonts.extraBold, fontSize: 15 },
  addCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  addLabel: { fontSize: 13, fontFamily: fonts.extraBold, color: colors.coral, letterSpacing: 0.4, marginBottom: 10 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.ink,
    backgroundColor: colors.bg,
    marginBottom: 12,
  },
  swatches: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  swatch: { width: 38, height: 38, borderRadius: 19 },
  swatchOn: { borderWidth: 3, borderColor: colors.ink },
  addBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelText: { fontSize: 15, fontFamily: fonts.bold, color: colors.muted },
  saveBtn: { borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 22 },
  saveText: { color: '#fff', fontSize: 15, fontFamily: fonts.extraBold },
});
