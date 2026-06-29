import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../src/theme/colors';
import { useAppStore } from '../../src/store/appStore';

export default function TabLayout() {
  const { colors } = useTheme();
  const unreadCount = useAppStore((state) => state.unreadCount);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 80 : 65,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            shadowColor: 'transparent',
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.3,
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textSub,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.primaryGlow }]}>
                <Ionicons name="home" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.primaryGlow }]}>
                <Ionicons name="search" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.primaryGlow }]}>
                <Ionicons name="map" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="contribute"
          options={{
            title: 'Contribute',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.contributeWrap, { backgroundColor: colors.text, borderColor: colors.textSub }]}>
                <Ionicons name="add" size={28} color={colors.surface} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.goldGlow }]}>
                <Ionicons name="star" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.accentGlow }]}>
                <Ionicons name="heart" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.violetGlow }]}>
                <Ionicons name="person" size={22} color={color} />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributeWrap: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginTop: -8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
