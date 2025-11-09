import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors } from "./styles/common";
export default function RootLayout() {
  return (
    <SafeAreaView style={[{backgroundColor: colors.background,  flex: 1 }]} edges={['top', 'left', 'right', 'bottom']}>
        <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        </GestureHandlerRootView>
    </SafeAreaView>

  );
}