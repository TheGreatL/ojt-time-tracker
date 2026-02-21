import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PerformanceMonitor } from '../components/PerformanceMonitor';
import { DashboardScreen } from '../screens/DashboardScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LeaderboardScreen } from '../screens/TeamStatusScreen';
import { Home, Settings, FileText, Trophy } from 'lucide-react-native';
import { colors } from '../styles/theme';

export type MainTabParamList = {
    Dashboard: undefined;
    Leaderboards: undefined;
    Notes: undefined;
    Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            >
                {(props) => (
                    <PerformanceMonitor componentName="DashboardScreen">
                        <DashboardScreen {...props} />
                    </PerformanceMonitor>
                )}
            </Tab.Screen>
            <Tab.Screen
                name="Leaderboards"
                options={{
                    tabBarLabel: 'Leaderboards',
                    tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
                }}
            >
                {(props) => (
                    <PerformanceMonitor componentName="LeaderboardScreen">
                        <LeaderboardScreen {...props} />
                    </PerformanceMonitor>
                )}
            </Tab.Screen>
            <Tab.Screen
                name="Notes"
                options={{
                    tabBarLabel: 'Notes',
                    tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
                }}
            >
                {(props) => (
                    <PerformanceMonitor componentName="NotesScreen">
                        <NotesScreen {...props} />
                    </PerformanceMonitor>
                )}
            </Tab.Screen>
            <Tab.Screen
                name="Settings"
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                    headerShown: true,
                }}
            >
                 {(props) => (
                    <PerformanceMonitor componentName="SettingsScreen">
                        <SettingsScreen {...props} />
                    </PerformanceMonitor>
                )}
            </Tab.Screen>
        </Tab.Navigator>
    );
};
