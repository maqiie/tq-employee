import React, { useState, useContext } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { login } from "../services/api";
import { storeUserData } from "../services/auth";

const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login: setAuthUser } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { accessToken, client, uid, user } = await login(email, password);

      if (!accessToken || !client || !uid) {
        throw new Error("Missing authentication headers");
      }

      const validateResponse = await axios.get(
        "http://192.168.100.5:3001/auth/validate_token",
        {
          headers: {
            "access-token": accessToken,
            client,
            uid,
          },
        }
      );

      const validatedUser = validateResponse.data.data;
      if (!validatedUser) {
        throw new Error("Failed to retrieve user from token validation");
      }

      await storeUserData({
        user: validatedUser,
        accessToken,
        client,
        uid,
      });

      setAuthUser({
        user: validatedUser,
        accessToken,
        client,
        uid,
      });

      navigation.navigate("Dashboard");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.decorativeContainer}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <View style={[styles.circle, styles.circle3]} />
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.logoContainer}>
                <View style={styles.logoWrapper}>
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={60}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subtitleText}>Sign in to continue</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[
                    styles.inputWrapper,
                    emailFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={emailFocused ? "#667eea" : "#94A3B8"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    passwordFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={passwordFocused ? "#667eea" : "#94A3B8"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? ['#94A3B8', '#94A3B8'] : ['#667eea', '#764ba2']}
                    style={styles.loginGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <View style={styles.loginButtonContent}>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#FFFFFF"
                          style={styles.loginButtonIcon}
                        />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  decorativeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: "absolute",
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  circle3: {
    width: width * 0.4,
    height: width * 0.4,
    top: height * 0.5,
    left: width * 0.7,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontWeight: "400",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 30,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: "#667eea",
    backgroundColor: "#FFFFFF",
    shadowOpacity: 0.15,
    shadowColor: "#667eea",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  loginGradient: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginButtonIcon: {
    marginLeft: 8,
  },
});

export default LoginScreen;

// import React, { useState, useContext } from "react";
// import {
//   View,
//   TextInput,
//   Text,
//   StyleSheet,
//   Alert,
//   TouchableOpacity,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   ActivityIndicator,
//   Animated,
//   Dimensions,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import axios from "axios";
// import { AuthContext } from "../context/AuthContext";
// import { login } from "../services/api";
// import { storeUserData } from "../services/auth";

// const { width, height } = Dimensions.get("window");

// const LoginScreen = ({ navigation }) => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [emailFocused, setEmailFocused] = useState(false);
//   const [passwordFocused, setPasswordFocused] = useState(false);
//   const { login: setAuthUser } = useContext(AuthContext);

//   // Animation values
//   const fadeAnim = new Animated.Value(0);
//   const slideAnim = new Animated.Value(50);

//   React.useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   const handleLogin = async () => {
//     if (!email.trim() || !password.trim()) {
//       Alert.alert("Error", "Please fill in all fields");
//       return;
//     }

//     try {
//       setLoading(true);
//       // Step 1: Login and get tokens from headers + user data
//       const { accessToken, client, uid, user } = await login(email, password);

//       if (!accessToken || !client || !uid) {
//         throw new Error("Missing authentication headers");
//       }

//       // Step 2: Validate token with backend to get fresh user data
//       const validateResponse = await axios.get(
//         "http://192.168.100.5:3001/auth/validate_token",
//         {
//           headers: {
//             "access-token": accessToken,
//             client,
//             uid,
//           },
//         }
//       );

//       const validatedUser = validateResponse.data.data;
//       if (!validatedUser) {
//         throw new Error("Failed to retrieve user from token validation");
//       }

//       // Step 3: Store tokens and user data in AsyncStorage
//       await storeUserData({
//         user: validatedUser,
//         accessToken,
//         client,
//         uid,
//       });

//       // Step 4: Update auth context and navigate
//       await setAuthUser({
//         user: validatedUser,
//         accessToken,
//         client,
//         uid,
//       });

//       navigation.navigate("Dashboard");
//     } catch (error) {
//       console.error("Login or validation failed:", error);
//       Alert.alert(
//         "Login Failed",
//         error.message || "Unexpected error occurred."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2', '#f093fb']}
//         style={styles.gradient}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//           style={styles.keyboardAvoidingView}
//         >
//           <ScrollView
//             contentContainerStyle={styles.scrollContainer}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             {/* Decorative Elements */}
//             <View style={styles.decorativeContainer}>
//               <View style={[styles.circle, styles.circle1]} />
//               <View style={[styles.circle, styles.circle2]} />
//               <View style={[styles.circle, styles.circle3]} />
//             </View>

//             <Animated.View
//               style={[
//                 styles.contentContainer,
//                 {
//                   opacity: fadeAnim,
//                   transform: [{ translateY: slideAnim }],
//                 },
//               ]}
//             >
//               {/* Logo/Icon Section */}
//               <View style={styles.logoContainer}>
//                 <View style={styles.logoWrapper}>
//                   <MaterialCommunityIcons
//                     name="account-circle"
//                     size={60}
//                     color="#FFFFFF"
//                   />
//                 </View>
//                 <Text style={styles.welcomeText}>Welcome Back</Text>
//                 <Text style={styles.subtitleText}>Sign in to continue</Text>
//               </View>

//               {/* Form Container */}
//               <View style={styles.formContainer}>
//                 {/* Email Input */}
//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>Email Address</Text>
//                   <View
//                     style={[
//                       styles.inputWrapper,
//                       emailFocused && styles.inputWrapperFocused,
//                     ]}
//                   >
//                     <Ionicons
//                       name="mail-outline"
//                       size={20}
//                       color={emailFocused ? "#667eea" : "#94A3B8"}
//                       style={styles.inputIcon}
//                     />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Enter your email"
//                       placeholderTextColor="#94A3B8"
//                       autoCapitalize="none"
//                       keyboardType="email-address"
//                       value={email}
//                       onChangeText={setEmail}
//                       onFocus={() => setEmailFocused(true)}
//                       onBlur={() => setEmailFocused(false)}
//                     />
//                   </View>
//                 </View>

//                 {/* Password Input */}
//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>Password</Text>
//                   <View
//                     style={[
//                       styles.inputWrapper,
//                       passwordFocused && styles.inputWrapperFocused,
//                     ]}
//                   >
//                     <Ionicons
//                       name="lock-closed-outline"
//                       size={20}
//                       color={passwordFocused ? "#667eea" : "#94A3B8"}
//                       style={styles.inputIcon}
//                     />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Enter your password"
//                       placeholderTextColor="#94A3B8"
//                       secureTextEntry={!showPassword}
//                       value={password}
//                       onChangeText={setPassword}
//                       onFocus={() => setPasswordFocused(true)}
//                       onBlur={() => setPasswordFocused(false)}
//                     />
//                     <TouchableOpacity
//                       onPress={() => setShowPassword(!showPassword)}
//                       style={styles.eyeIcon}
//                     >
//                       <Ionicons
//                         name={showPassword ? "eye-outline" : "eye-off-outline"}
//                         size={20}
//                         color="#94A3B8"
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* Login Button */}
//                 <TouchableOpacity
//                   style={[styles.loginButton, loading && styles.loginButtonDisabled]}
//                   onPress={handleLogin}
//                   disabled={loading}
//                   activeOpacity={0.8}
//                 >
//                   <LinearGradient
//                     colors={loading ? ['#94A3B8', '#94A3B8'] : ['#667eea', '#764ba2']}
//                     style={styles.loginGradient}
//                     start={{ x: 0, y: 0 }}
//                     end={{ x: 1, y: 0 }}
//                   >
//                     {loading ? (
//                       <ActivityIndicator color="#FFFFFF" size="small" />
//                     ) : (
//                       <View style={styles.loginButtonContent}>
//                         <Text style={styles.loginButtonText}>Sign In</Text>
//                         <Ionicons
//                           name="arrow-forward"
//                           size={20}
//                           color="#FFFFFF"
//                           style={styles.loginButtonIcon}
//                         />
//                       </View>
//                     )}
//                   </LinearGradient>
//                 </TouchableOpacity>

//                 {/* Forgot Password */}
//                 <TouchableOpacity style={styles.forgotPasswordContainer}>
//                   <Text style={styles.forgotPasswordText}>
//                     Forgot your password?
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </Animated.View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </LinearGradient>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 40,
//   },
//   decorativeContainer: {
//     position: "absolute",
//     width: "100%",
//     height: "100%",
//   },
//   circle: {
//     position: "absolute",
//     borderRadius: 100,
//     backgroundColor: "rgba(255, 255, 255, 0.1)",
//   },
//   circle1: {
//     width: 200,
//     height: 200,
//     top: -50,
//     right: -50,
//   },
//   circle2: {
//     width: 150,
//     height: 150,
//     bottom: 100,
//     left: -30,
//   },
//   circle3: {
//     width: 100,
//     height: 100,
//     top: height * 0.3,
//     left: width * 0.8,
//   },
//   contentContainer: {
//     flex: 1,
//     justifyContent: "center",
//     zIndex: 1,
//   },
//   logoContainer: {
//     alignItems: "center",
//     marginBottom: 50,
//   },
//   logoWrapper: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: "rgba(255, 255, 255, 0.2)",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 10,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   welcomeText: {
//     fontSize: 32,
//     fontWeight: "700",
//     color: "#FFFFFF",
//     marginBottom: 8,
//     textAlign: "center",
//     letterSpacing: -0.5,
//   },
//   subtitleText: {
//     fontSize: 16,
//     color: "rgba(255, 255, 255, 0.8)",
//     textAlign: "center",
//     fontWeight: "400",
//   },
//   formContainer: {
//     backgroundColor: "rgba(255, 255, 255, 0.95)",
//     borderRadius: 30,
//     padding: 30,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 20,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 30,
//     elevation: 20,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   inputLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#374151",
//     marginBottom: 8,
//     marginLeft: 4,
//   },
//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F8FAFC",
//     borderRadius: 16,
//     borderWidth: 2,
//     borderColor: "#E2E8F0",
//     paddingHorizontal: 16,
//     height: 56,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   inputWrapperFocused: {
//     borderColor: "#667eea",
//     backgroundColor: "#FFFFFF",
//     shadowOpacity: 0.15,
//     shadowColor: "#667eea",
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: "#1F2937",
//     fontWeight: "500",
//   },
//   eyeIcon: {
//     padding: 4,
//   },
//   loginButton: {
//     marginTop: 10,
//     marginBottom: 20,
//     shadowColor: "#667eea",
//     shadowOffset: {
//       width: 0,
//       height: 10,
//     },
//     shadowOpacity: 0.4,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   loginButtonDisabled: {
//     shadowOpacity: 0.1,
//   },
//   loginGradient: {
//     borderRadius: 16,
//     paddingVertical: 18,
//     paddingHorizontal: 32,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   loginButtonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   loginButtonText: {
//     color: "#FFFFFF",
//     fontSize: 18,
//     fontWeight: "700",
//     letterSpacing: 0.5,
//   },
//   loginButtonIcon: {
//     marginLeft: 8,
//   },
//   forgotPasswordContainer: {
//     alignItems: "center",
//   },
//   forgotPasswordText: {
//     color: "#667eea",
//     fontSize: 16,
//     fontWeight: "600",
//     textDecorationLine: "underline",
//   },
// });

// export default LoginScreen;