import React, { createContext, useState, useEffect } from 'react';
import { getUserData, clearUserData, storeUserData } from '../services/auth';

// Create context with default values
export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { userToken, user: storedUser } = await getUserData();
        console.log('Loaded user data from AsyncStorage:', storedUser);
        
        if (userToken && storedUser) {
          setUser(storedUser);
          console.log('User is logged in, setting user state:', storedUser);
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async ({ user, accessToken, client, uid }) => {
    try {
      setUser(user);
      await storeUserData({ user, accessToken, client, uid });
      setError(null);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    }
  };
  
  const logout = async () => {
    try {
      await clearUserData();
      setUser(null);
      setError(null);
      console.log('User logged out, cleared AsyncStorage.');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message || 'Logout failed');
      throw err;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    setUser,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
// import React, { createContext, useState, useEffect } from 'react';
// import { getUserData, clearUserData, storeUserData } from '../services/auth';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         const { userToken, user: storedUser } = await getUserData();
//         console.log('Loaded user data from AsyncStorage:', storedUser);
//         if (userToken && storedUser) {
//           setUser(storedUser);
//           console.log('User is logged in, setting user state:', storedUser);
//         }
//       } catch (error) {
//         console.error('Failed to load user data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadUser();
//   }, []);


// const login = async ({ user, accessToken, client, uid }) => {
//     setUser(user);
//     await storeUserData({ user, accessToken, client, uid });
//   };
  

//   const logout = async () => {
//     await clearUserData(); // Clear data on logout
//     setUser(null);
//     console.log('User logged out, cleared AsyncStorage.');
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
