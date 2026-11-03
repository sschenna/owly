import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { getSettings } from '../../store';
import { playUiSound } from '../../lib/sounds';

const uiTap = () => playUiSound(() => getSettings().uiSound);

function TabButton({ label, focused, onPress, children }) {
  return (
    <Pressable
      style={styles.tab}
      onPress={() => {
        uiTap();
        onPress();
      }}
    >
      <Svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke={focused ? colors.coral : colors.muted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </Svg>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// Home | Summary | Profile — the + is a floating button at bottom-right,
// just above the tab bar. Tab switching uses router.navigate (not push)
// so the stack doesn't accumulate duplicate tab entries.
function CustomBar({ state }) {
  const go = (index, href) => {
    if (state.index !== index) router.navigate(href);
  };
  return (
    <View style={styles.wrapper}>
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.bar}>
          <TabButton label="Home" focused={state.index === 0} onPress={() => go(0, '/home')}>
            <Path d="M3 11l9-8 9 8" />
            <Path d="M5 10v10h5v-6h4v6h5V10" />
          </TabButton>
          <TabButton label="Summary" focused={state.index === 1} onPress={() => go(1, '/summary')}>
            <Path d="M4 20V10" />
            <Path d="M10 20V4" />
            <Path d="M16 20v-8" />
          </TabButton>
          <TabButton label="Profile" focused={state.index === 2} onPress={() => go(2, '/profile')}>
            <Circle cx="12" cy="8" r="4" />
            <Path d="M4 21v-1a7 7 0 0 1 14 0v1" />
          </TabButton>
        </View>
      </SafeAreaView>
      <Pressable
        style={styles.fab}
        onPress={() => {
          uiTap();
          router.push('/add');
        }}
        accessibilityLabel="Add document"
      >
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="summary" options={{ title: 'Summary' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  safe: { backgroundColor: colors.surface },
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingBottom: 6 },
  tabLabel: { fontSize: 11, fontFamily: fonts.extraBold, color: colors.muted },
  tabLabelActive: { color: colors.coral },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabPlus: { color: '#fff', fontSize: 30, fontFamily: fonts.extraBold, lineHeight: 32 },
});
