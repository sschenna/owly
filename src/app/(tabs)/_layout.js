import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

const comingSoon = (what, milestone) =>
  Alert.alert('Coming soon', `${what} lands in Milestone ${milestone}.`, [{ text: 'OK' }]);

function TabButton({ label, focused, onPress, children }) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
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

// Home | (+) | Summary — the big + opens the add flow (Milestone 4).
// Tab switching uses the global router (not the tabBar's navigation prop).
function CustomBar({ state }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.bar}>
        <TabButton
          label="Home"
          focused={state.index === 0}
          onPress={() => {
            if (state.index !== 0) router.push('/home');
          }}
        >
          <Path d="M3 11l9-8 9 8" />
          <Path d="M5 10v10h5v-6h4v6h5V10" />
        </TabButton>
        <View style={styles.addSlot}>
          <Pressable
            style={styles.addBtn}
            onPress={() => comingSoon('The add flow', 4)}
            accessibilityLabel="Add document"
          >
            <Text style={styles.addPlus}>+</Text>
          </Pressable>
        </View>
        <TabButton
          label="Summary"
          focused={state.index === 1}
          onPress={() => {
            if (state.index !== 1) router.push('/summary');
          }}
        >
          <Path d="M4 20V10" />
          <Path d="M10 20V4" />
          <Path d="M16 20v-8" />
        </TabButton>
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="summary" options={{ title: 'Summary' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
  addSlot: { width: 76, alignItems: 'center', justifyContent: 'flex-start' },
  addBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: colors.coral,
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  addPlus: { color: '#fff', fontSize: 30, fontFamily: fonts.extraBold, lineHeight: 32 },
});
