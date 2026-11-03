import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import RowItem from '../components/RowItem';
import { USER_NAME, useDocs, usePeople } from '../store';
import { colors, fonts, gradients, radius } from '../theme';
import { initials } from '../lib/format';

// Profile: who you are, who Owly watches, and how it protects you.
export default function Profile() {
  const docs = useDocs();
  const people = usePeople();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <LinearGradient colors={gradients.brand} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(USER_NAME)}</Text>
          </View>
          <Text style={styles.name}>Hello, {USER_NAME}</Text>
          <Text style={styles.stats}>
            {people.length + 1} {people.length === 0 ? 'person' : 'people'} · {docs.length} documents
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <RowItem
            label="People"
            value={`${people.length + 1}`}
            onPress={() => router.push('/people')}
          />
          <RowItem label="Security & PIN" value="" onPress={() => router.push('/security')} />
          <RowItem label="Notifications" value="" onPress={() => router.push('/notifications')} last />
        </View>

        <View style={styles.about}>
          <Text style={styles.aboutTitle}>Owly v1.0</Text>
          <Text style={styles.aboutSub}>
            Your documents never leave this phone. No account, no cloud, no ads watching you renew your passport.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12, alignSelf: 'flex-start' },
  backText: { fontSize: 15, fontFamily: fonts.bold, color: colors.coral },
  hero: { borderRadius: 26, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontFamily: fonts.extraBold },
  name: { color: '#fff', fontSize: 22, fontFamily: fonts.extraBold },
  stats: { color: '#fff', fontSize: 14, fontFamily: fonts.bold, opacity: 0.92, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  about: { marginTop: 18, alignItems: 'center', paddingHorizontal: 12 },
  aboutTitle: { fontSize: 14, fontFamily: fonts.extraBold, color: colors.muted },
  aboutSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
