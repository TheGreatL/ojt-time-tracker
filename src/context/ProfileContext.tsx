// Global context for managing active profile state

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '../database/schema';
import { getProfileById } from '../database/queries';

interface ProfileContextType {
    activeProfile: Profile | null;
    setActiveProfile: (profile: Profile | null) => void;
    refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
    children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
    const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);

    const setActiveProfile = (profile: Profile | null) => {
        setActiveProfileState(profile);
    };

    const refreshProfile = async () => {
        if (activeProfile?.id) {
            const updated = await getProfileById(activeProfile.id);
            setActiveProfileState(updated);
        }
    };

    return (
        <ProfileContext.Provider value={{ activeProfile, setActiveProfile, refreshProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = (): ProfileContextType => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
