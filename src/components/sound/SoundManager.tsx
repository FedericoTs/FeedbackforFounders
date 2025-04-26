import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "@/supabase/auth";
import {
  userPreferencesService,
  PreferenceType,
} from "@/services/userPreferences";

interface Sound {
  id: string;
  src: string;
  volume?: number;
  category: "achievement" | "notification" | "feedback" | "ui" | "background";
}

interface SoundSettings {
  masterVolume: number;
  categoryVolumes: Record<string, number>;
  muted: boolean;
  soundEnabled: boolean;
}

interface SoundContextType {
  playSound: (soundId: string) => void;
  playSoundFromSource: (
    src: string,
    category?: string,
    volume?: number,
  ) => void;
  registerSound: (sound: Sound) => void;
  unregisterSound: (soundId: string) => void;
  setMasterVolume: (volume: number) => void;
  setCategoryVolume: (category: string, volume: number) => void;
  toggleMute: () => void;
  toggleSoundEnabled: () => void;
  settings: SoundSettings;
}

const defaultSettings: SoundSettings = {
  masterVolume: 0.5,
  categoryVolumes: {
    achievement: 0.8,
    notification: 0.6,
    feedback: 0.7,
    ui: 0.4,
    background: 0.3,
  },
  muted: false,
  soundEnabled: true,
};

const SoundContext = createContext<SoundContextType | null>(null);

export const useSoundManager = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSoundManager must be used within a SoundProvider");
  }
  return context;
};

interface SoundProviderProps {
  children: React.ReactNode;
  initialSettings?: Partial<SoundSettings>;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({
  children,
  initialSettings = {},
}) => {
  // Merge default settings with initial settings
  const mergedSettings = {
    ...defaultSettings,
    ...initialSettings,
    categoryVolumes: {
      ...defaultSettings.categoryVolumes,
      ...(initialSettings.categoryVolumes || {}),
    },
  };

  const { user } = useAuth();
  const [settings, setSettings] = useState<SoundSettings>(mergedSettings);
  const [sounds, setSounds] = useState<Record<string, Sound>>({});
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load settings from database or localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      // Start with local settings for immediate response
      const savedSettings = localStorage.getItem("soundSettings");
      let localSettings = mergedSettings;

      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          localSettings = {
            ...mergedSettings,
            ...parsedSettings,
            categoryVolumes: {
              ...mergedSettings.categoryVolumes,
              ...(parsedSettings.categoryVolumes || {}),
            },
          };
          setSettings(localSettings);
        } catch (error) {
          console.error("Error parsing sound settings:", error);
        }
      }

      // If user is authenticated, try to load from database
      if (user) {
        try {
          const dbSettings =
            await userPreferencesService.getUserPreference<SoundSettings>(
              user.id,
              PreferenceType.SOUND,
            );

          if (dbSettings) {
            // Database settings take precedence over local settings
            setSettings({
              ...localSettings,
              ...dbSettings,
              categoryVolumes: {
                ...localSettings.categoryVolumes,
                ...(dbSettings.categoryVolumes || {}),
              },
            });
          } else if (savedSettings) {
            // If we have local settings but no DB settings, sync to DB
            await userPreferencesService.saveUserPreference(
              user.id,
              PreferenceType.SOUND,
              localSettings,
            );
          }
        } catch (error) {
          console.error("Error loading sound settings from database:", error);
        }
      }

      setIsInitialized(true);
    };

    loadSettings();

    // Subscribe to preference changes from other devices
    let unsubscribe: (() => void) | undefined;
    if (user) {
      unsubscribe = userPreferencesService.subscribeToPreferenceChanges(
        user.id,
        PreferenceType.SOUND,
        (newSettings) => {
          // Only update if not currently syncing to avoid loops
          if (!isSyncing) {
            setSettings((current) => ({
              ...current,
              ...newSettings,
              categoryVolumes: {
                ...current.categoryVolumes,
                ...(newSettings.categoryVolumes || {}),
              },
            }));
            // Update local storage too
            localStorage.setItem("soundSettings", JSON.stringify(newSettings));
          }
        },
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, mergedSettings]);

  // Save settings to localStorage and database when they change
  useEffect(() => {
    if (!isInitialized) return;

    // Always save to localStorage for offline use
    localStorage.setItem("soundSettings", JSON.stringify(settings));

    // Save to database if user is authenticated
    const syncToDatabase = async () => {
      if (user) {
        setIsSyncing(true);
        try {
          await userPreferencesService.saveUserPreference(
            user.id,
            PreferenceType.SOUND,
            settings,
          );
        } catch (error) {
          console.error("Error saving sound settings to database:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    syncToDatabase();
  }, [settings, user, isInitialized]);

  // Preload sounds
  const preloadSound = (src: string): HTMLAudioElement => {
    if (!audioCache.current[src]) {
      const audio = new Audio(src);
      audio.preload = "auto";
      audioCache.current[src] = audio;
    }
    return audioCache.current[src];
  };

  // Register a sound
  const registerSound = (sound: Sound) => {
    setSounds((prev) => ({
      ...prev,
      [sound.id]: sound,
    }));
    // Preload the sound
    preloadSound(sound.src);
  };

  // Unregister a sound
  const unregisterSound = (soundId: string) => {
    setSounds((prev) => {
      const newSounds = { ...prev };
      delete newSounds[soundId];
      return newSounds;
    });
  };

  // Play a sound by ID
  const playSound = (soundId: string) => {
    if (!settings.soundEnabled || settings.muted) return;

    const sound = sounds[soundId];
    if (!sound) {
      console.warn(`Sound with ID ${soundId} not found`);
      return;
    }

    playSoundFromSource(sound.src, sound.category, sound.volume);
  };

  // Play a sound from source
  const playSoundFromSource = (
    src: string,
    category = "ui",
    volume?: number,
  ) => {
    if (!settings.soundEnabled || settings.muted) return;

    try {
      // Get or create audio element
      const audio = preloadSound(src);

      // Reset audio to beginning if it's already playing
      audio.currentTime = 0;

      // Calculate volume
      const categoryVolume = settings.categoryVolumes[category] || 1;
      const soundVolume = volume !== undefined ? volume : 1;
      audio.volume = settings.masterVolume * categoryVolume * soundVolume;

      // Play the sound
      audio.play().catch((error) => {
        console.error("Error playing sound:", error);
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  // Set master volume
  const setMasterVolume = (volume: number) => {
    setSettings((prev) => ({
      ...prev,
      masterVolume: Math.max(0, Math.min(1, volume)),
    }));
  };

  // Set category volume
  const setCategoryVolume = (category: string, volume: number) => {
    setSettings((prev) => ({
      ...prev,
      categoryVolumes: {
        ...prev.categoryVolumes,
        [category]: Math.max(0, Math.min(1, volume)),
      },
    }));
  };

  // Toggle mute
  const toggleMute = () => {
    setSettings((prev) => ({
      ...prev,
      muted: !prev.muted,
    }));
  };

  // Toggle sound enabled
  const toggleSoundEnabled = () => {
    setSettings((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  return (
    <SoundContext.Provider
      value={{
        playSound,
        playSoundFromSource,
        registerSound,
        unregisterSound,
        setMasterVolume,
        setCategoryVolume,
        toggleMute,
        toggleSoundEnabled,
        settings,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};
