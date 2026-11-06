import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Intro } from '@/components/Intro';
import { AccountProvider } from '@/state/AccountContext';
import { ChildProvider } from '@/state/ChildContext';
import { IntroProvider } from '@/state/IntroContext';
import { OnboardingProvider, useOnboarding } from '@/state/OnboardingContext';
import { ShellProvider } from '@/state/ShellContext';
import { color } from '@/theme/tokens';
import { fontAssets } from '@/theme/type';

SplashScreen.preventAutoHideAsync();

/** Onboarding until it is finished, then the app; neither can be reached from the other. */
function Routes() {
  const { onboarded } = useOnboarding();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.canvas },
      }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        {/* The app rises in as onboarding finishes, like the prototype's flow sliding away. */}
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        {/* Notifications rise over the tabs, like the prototype's overlay. */}
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_bottom' }} />
        {/* The full map rises the same way (the prototype's route overlay). */}
        <Stack.Screen name="route-map" options={{ animation: 'slide_from_bottom' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Hold the splash until Archivo is ready, so no screen renders in a fallback font.
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <ChildProvider>
        <AccountProvider>
          <OnboardingProvider>
            <ShellProvider>
              <IntroProvider>
                <StatusBar style="dark" />
                <Routes />
                <Intro />
              </IntroProvider>
            </ShellProvider>
          </OnboardingProvider>
        </AccountProvider>
      </ChildProvider>
    </SafeAreaProvider>
  );
}
