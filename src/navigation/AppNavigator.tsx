// App Navigator - Stack navigation setup

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PerformanceMonitor } from '../components/PerformanceMonitor';

import { ProfileSelectionScreen } from '../screens/ProfileSelectionScreen';
import { AddProfileScreen } from '../screens/AddProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { MainNavigator } from './MainNavigator';
import { AboutScreen } from '../screens/AboutScreen';
import { colors } from '../styles/theme';

export type RootStackParamList = {
    ProfileSelection: undefined;
    AddProfile: undefined;
    Main: undefined;
    EditProfile: { profileId: number };
    About: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="ProfileSelection"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.background,
                    },
                    headerTintColor: colors.primary,
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                    headerShadowVisible: false,
                }}
            >
                <Stack.Screen
                    name="ProfileSelection"
                    options={{ headerShown: false }}
                >
                    {(props) => (
                        <PerformanceMonitor componentName="ProfileSelectionScreen">
                            <ProfileSelectionScreen {...props} />
                        </PerformanceMonitor>
                    )}
                </Stack.Screen>
                <Stack.Screen
                    name="AddProfile"
                    options={{ headerShown: false }}
                >
                    {(props) => (
                        <PerformanceMonitor componentName="AddProfileScreen">
                            <AddProfileScreen {...props} />
                        </PerformanceMonitor>
                    )}
                </Stack.Screen>
                <Stack.Screen
                    name="Main"
                    options={{ headerShown: false }}
                >
                    {(props) => (
                        <PerformanceMonitor componentName="MainNavigator">
                            <MainNavigator {...props} />
                        </PerformanceMonitor>
                    )}
                </Stack.Screen>
                <Stack.Screen
                    name="EditProfile"
                    options={{ headerShown: false }}
                >
                    {(props) => (
                        <PerformanceMonitor componentName="EditProfileScreen">
                            <EditProfileScreen {...props} />
                        </PerformanceMonitor>
                    )}
                </Stack.Screen>
                <Stack.Screen
                    name="About"
                    options={{ title: 'About App' }}
                >
                    {(props) => (
                        <PerformanceMonitor componentName="AboutScreen">
                            <AboutScreen {...props} />
                        </PerformanceMonitor>
                    )}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
};
