// // services/auth.js

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// // Store user data in AsyncStorage
// const storeUserData = async (data) => {
//   try {
//     const userData = {
//       user: JSON.stringify(data.user),
//       userToken: data['access-token'],
//       client: data.client,
//       uid: data.uid,
//     };

//     // Batch store the user data
//     const items = Object.entries(userData).map(([key, value]) => [key, value]);
//     await AsyncStorage.multiSet(items); // Batch set items
//     console.log('User data stored successfully');
//   } catch (error) {
//     console.error('Error storing user data:', error);
//   }
// };

// // Get user data from AsyncStorage
// const getUserData = async () => {
//   try {
//     const keys = ['user', 'userToken', 'client', 'uid'];
//     const values = await AsyncStorage.multiGet(keys);
//     const data = values.reduce((acc, [key, value]) => {
//       acc[key] = key === 'user' ? JSON.parse(value) : value;
//       return acc;
//     }, {});

//     return data;
//   } catch (error) {
//     console.error('Error getting user data:', error);
//     return {};
//   }
// };

// // Clear user data from AsyncStorage
// const clearUserData = async () => {
//   try {
//     const keys = ['user', 'userToken', 'client', 'uid'];
//     await AsyncStorage.multiRemove(keys); // Batch remove items
//     console.log('User data cleared successfully');
//   } catch (error) {
//     console.error('Error clearing user data:', error);
//   }
// };

// // Export functions
// export { storeUserData, getUserData, clearUserData };
// services/auth.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Store user data in AsyncStorage
// const storeUserData = async (data) => {
//   try {
//     const userData = {
//       user: JSON.stringify(data.user),
//       userToken: data['access-token'],
//       client: data.client,
//       uid: data.uid,
//     };

//     // Batch store the user data
//     const items = Object.entries(userData).map(([key, value]) => [key, value]);
//     await AsyncStorage.multiSet(items); // Batch set items
//     console.log('User data stored successfully');
//   } catch (error) {
//     console.error('Error storing user data:', error);
//   }
// };
const storeUserData = async ({ user, accessToken, client, uid }) => {
    try {
      if (!accessToken || !client || !uid) {
        throw new Error("Missing authentication headers");
      }
  
      const userData = {
        user: JSON.stringify(user),
        userToken: accessToken,
        client,
        uid,
      };
  
      const items = Object.entries(userData).map(([key, value]) => [key, value]);
      await AsyncStorage.multiSet(items);
      console.log("User data stored successfully");
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  };
  
  

// Get user data from AsyncStorage
const getUserData = async () => {
  try {
    const keys = ['user', 'userToken', 'client', 'uid'];
    const values = await AsyncStorage.multiGet(keys);
    const data = values.reduce((acc, [key, value]) => {
      acc[key] = key === 'user' ? JSON.parse(value) : value;
      return acc;
    }, {});

    return data;
  } catch (error) {
    console.error('Error getting user data:', error);
    return {};
  }
};

// Clear user data from AsyncStorage
const clearUserData = async () => {
  try {
    const keys = ['user', 'userToken', 'client', 'uid'];
    await AsyncStorage.multiRemove(keys); // Batch remove items
    console.log('User data cleared successfully');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

// Export functions
export { storeUserData, getUserData, clearUserData };
