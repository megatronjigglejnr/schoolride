// The tab shell. The navigator keeps each tab mounted; the header, nav pill, FAB and toast are drawn once,
// above all tabs, like the prototype's single .topnav and .navwrap.
import { router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { StyleSheet, View } from 'react-native';

import { Header, type TabName } from '@/components/shell/Header';
import { NavBar } from '@/components/shell/NavBar';
import { Toast } from '@/components/shell/Toast';
import { SUB_TITLES } from '@/data/account';
import { CallSheet } from '@/components/sheets/CallSheet';
import { FriendSheet } from '@/components/sheets/FriendSheet';
import { PhotoSheet } from '@/components/sheets/PhotoSheet';
import { ShareSheet } from '@/components/sheets/ShareSheet';
import { useShell } from '@/state/ShellContext';
import { color } from '@/theme/tokens';

const paths: Record<TabName, '/' | '/schedule' | '/history' | '/profile'> = {
  index: '/',
  schedule: '/schedule',
  history: '/history',
  profile: '/profile',
};

function tabOf(pathname: string): TabName {
  if (pathname.startsWith('/schedule')) return 'schedule';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'index';
}

function Shell() {
  const pathname = usePathname();
  const tab = tabOf(pathname);
  const subTitle = tab === 'profile' ? SUB_TITLES[pathname.split('/')[2] ?? ''] : undefined;
  const { setFabOpen } = useShell();

  const goTo = (name: TabName) => {
    setFabOpen(false);
    if (name !== tab) router.navigate(paths[name]);
  };

  return (
    <View style={styles.root}>
      <Tabs tabBar={() => null} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.canvas } }}>
        <Tabs.Screen name="index" options={{ title: 'Track' }} />
        <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="profile" options={{ title: 'Account' }} />
      </Tabs>
      <Header tab={tab} subTitle={subTitle} onAccount={() => goTo('profile')} />
      <NavBar tab={tab} onTab={goTo} />
      <CallSheet />
      <ShareSheet />
      <PhotoSheet />
      <FriendSheet />
      <Toast />
    </View>
  );
}

// The shell's state (toast, sheets, FAB) lives in the root layout, so onboarding can show toasts too.
export default function TabsLayout() {
  return <Shell />;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: color.canvas } });
