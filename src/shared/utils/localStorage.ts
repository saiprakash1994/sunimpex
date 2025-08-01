import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItemToLocalStorage = async (key: string, data: unknown): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data to AsyncStorage", error);
  }
};

export const getItemFromLocalStorage = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null && value !== "") {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    console.error("Error retrieving data from AsyncStorage", error);
    return null;
  }
};

export const clearLocalStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Error clearing AsyncStorage", error);
  }
};

// Constants
export const AppConstants = {
  accessToken: "accessToken",
  userInfo: "userInfo",
};
