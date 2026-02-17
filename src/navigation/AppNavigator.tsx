// App Navigator - Stack navigation setup

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

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
                    component={ProfileSelectionScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="AddProfile"
                    component={AddProfileScreen}
                    options={{ title: 'New Profile' }}
                />
                <Stack.Screen
                    name="Main"
                    component={MainNavigator}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="EditProfile"
                    component={EditProfileScreen}
                    options={{ title: 'Edit Profile' }}
                />
                <Stack.Screen
                    name="About"
                    component={AboutScreen}
                    options={{ title: 'About App' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
