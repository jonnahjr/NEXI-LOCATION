import { View, ActivityIndicator } from 'react-native';

// This screen is shown briefly while _layout.tsx determines
// the correct initial route (onboarding / login / home).
// _layout.tsx handles all routing — this just renders a neutral loader.
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#FAA330" />
    </View>
  );
}
