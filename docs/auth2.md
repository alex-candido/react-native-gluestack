Looking at your project structure and the authentication implementation code you shared, I see you're working on a React Native Expo application with a well-organized folder structure. To create a flexible authentication system that supports multiple providers (CredentialsProvider and GoogleProvider initially, with the ability to add more later), I'll design a solution that fits your existing architecture.

The key is to create an abstraction layer that allows you to add authentication providers easily. Here's how we can implement this:

## Authentication Provider Architecture

Let's create a flexible authentication system with these components:

1. A base authentication provider interface
2. Specific provider implementations (Credentials, Google, etc.)
3. A provider registry to manage all available providers
4. A unified authentication context to use throughout your app

Let's start building this system:

```typescript
// src/auth/providers/base-provider.ts
export interface AuthProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  token?: string;
  [key: string]: any; // Allow for additional provider-specific credentials
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  [key: string]: any; // Allow for additional provider-specific user data
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthResponse {
  success: boolean;
  session?: AuthSession | null;
  error?: string;
}

// Base Authentication Provider interface
export abstract class BaseAuthProvider {
  id: string;
  name: string;
  enabled: boolean;

  constructor(config: AuthProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.enabled = config.enabled;
  }

  abstract signIn(credentials: AuthCredentials): Promise<AuthResponse>;
  abstract signUp?(credentials: AuthCredentials): Promise<AuthResponse>;
  abstract signOut(): Promise<boolean>;
  abstract refreshSession?(refreshToken: string): Promise<AuthResponse>;
}

// src/auth/providers/credentials-provider.ts
import {
  BaseAuthProvider,
  AuthCredentials,
  AuthResponse,
  AuthProviderConfig,
} from "./base-provider";
import api from "../../libs/api";

export interface CredentialsProviderConfig extends AuthProviderConfig {
  signInUrl: string;
  signUpUrl: string;
  validateCredentials?: (credentials: AuthCredentials) => boolean;
}

export class CredentialsProvider extends BaseAuthProvider {
  private signInUrl: string;
  private signUpUrl: string;
  private validateCredentials?: (credentials: AuthCredentials) => boolean;

  constructor(config: CredentialsProviderConfig) {
    super(config);
    this.signInUrl = config.signInUrl;
    this.signUpUrl = config.signUpUrl;
    this.validateCredentials = config.validateCredentials;
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    if (this.validateCredentials && !this.validateCredentials(credentials)) {
      return {
        success: false,
        error: "Invalid credentials format",
      };
    }

    try {
      const response = await api.post(this.signInUrl, credentials);

      return {
        success: true,
        session: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: response.data.expiresAt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to sign in",
      };
    }
  }

  async signUp(credentials: AuthCredentials): Promise<AuthResponse> {
    if (this.validateCredentials && !this.validateCredentials(credentials)) {
      return {
        success: false,
        error: "Invalid credentials format",
      };
    }

    try {
      const response = await api.post(this.signUpUrl, credentials);

      return {
        success: true,
        session: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: response.data.expiresAt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to sign up",
      };
    }
  }

  async signOut(): Promise<boolean> {
    return true; // No server-side session to invalidate for credentials
  }

  async refreshSession(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/refresh", { refreshToken });

      return {
        success: true,
        session: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: response.data.expiresAt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to refresh session",
      };
    }
  }
}

// src/auth/providers/google-provider.ts
import {
  BaseAuthProvider,
  AuthCredentials,
  AuthResponse,
  AuthProviderConfig,
} from "./base-provider";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import api from "../../libs/api";

// Register for web redirect
if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export interface GoogleProviderConfig extends AuthProviderConfig {
  clientId: string;
  androidClientId?: string;
  iosClientId?: string;
  webClientId?: string;
  expoClientId?: string;
  serverAuthUrl?: string; // For server-side validation and user creation
}

export class GoogleProvider extends BaseAuthProvider {
  private config: GoogleProviderConfig;

  constructor(config: GoogleProviderConfig) {
    super(config);
    this.config = config;
  }

  // Helper method to get Google auth request
  private getGoogleAuthRequest() {
    const [request, response, promptAsync] = Google.useAuthRequest({
      androidClientId: this.config.androidClientId,
      iosClientId: this.config.iosClientId,
      webClientId: this.config.webClientId,
      expoClientId: this.config.expoClientId,
    });

    return { request, response, promptAsync };
  }

  // Method for external components to access auth
  getAuthRequestHook() {
    return Google.useAuthRequest({
      androidClientId: this.config.androidClientId,
      iosClientId: this.config.iosClientId,
      webClientId: this.config.webClientId,
      expoClientId: this.config.expoClientId,
    });
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      // If we already have a token from Google auth flow
      if (credentials.token) {
        // Server-side validation and user creation/retrieval
        if (this.config.serverAuthUrl) {
          const response = await api.post(this.config.serverAuthUrl, {
            idToken: credentials.token,
            provider: "google",
          });

          return {
            success: true,
            session: {
              user: response.data.user,
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
              expiresAt: response.data.expiresAt,
            },
          };
        } else {
          // Client-side handling (not recommended for production)
          // Extract user info from ID token (would require JWT decoding)
          // This is a simplified example
          return {
            success: true,
            session: {
              user: {
                id: "google-user-id", // Would come from decoded token
                email: "example@gmail.com", // Would come from decoded token
                name: "Google User", // Would come from decoded token
                picture: "https://example.com/avatar.jpg", // Would come from decoded token
              },
              accessToken: credentials.token,
            },
          };
        }
      }

      return {
        success: false,
        error: "No authentication token provided",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to sign in with Google",
      };
    }
  }

  async signOut(): Promise<boolean> {
    // Google sign out logic if needed
    return true;
  }

  async refreshSession(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/refresh", {
        refreshToken,
        provider: "google",
      });

      return {
        success: true,
        session: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: response.data.expiresAt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to refresh session",
      };
    }
  }
}

// src/auth/providers/index.ts
import { BaseAuthProvider } from "./base-provider";

class AuthProviderRegistry {
  private providers: Map<string, BaseAuthProvider> = new Map();

  registerProvider(provider: BaseAuthProvider): void {
    if (!provider.enabled) return;
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId: string): BaseAuthProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): BaseAuthProvider[] {
    return Array.from(this.providers.values());
  }
}

// Create singleton instance
const authProviderRegistry = new AuthProviderRegistry();
export default authProviderRegistry;
```

Now, let's create the Redux slice for authentication and the authentication context that will use these providers:

```typescript
// src/store/slices/auth-slice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import secureStorage from "../../services/secureStorage";
import authProviderRegistry from "../../auth/providers";
import {
  AuthCredentials,
  AuthResponse,
  AuthSession,
} from "../../auth/providers/base-provider";

// Storage keys
const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";
const PROVIDER_ID_KEY = "auth_provider_id";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSession | null;
  providerId: string | null;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  session: null,
  providerId: null,
  error: null,
};

// Helper for token decoding/validation if needed
const isTokenExpired = (expiresAt?: number): boolean => {
  if (!expiresAt) return false;
  return Date.now() > expiresAt;
};

// Async Thunks
export const signIn = createAsyncThunk(
  "auth/signIn",
  async (
    {
      providerId,
      credentials,
    }: { providerId: string; credentials: AuthCredentials },
    { rejectWithValue },
  ) => {
    try {
      const provider = authProviderRegistry.getProvider(providerId);

      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }

      const response = await provider.signIn(credentials);

      if (!response.success || !response.session) {
        throw new Error(response.error || "Sign in failed");
      }

      // Save auth data in secure storage
      await secureStorage.setItem(
        ACCESS_TOKEN_KEY,
        response.session.accessToken,
      );
      if (response.session.refreshToken) {
        await secureStorage.setItem(
          REFRESH_TOKEN_KEY,
          response.session.refreshToken,
        );
      }
      await secureStorage.setItem(
        USER_KEY,
        JSON.stringify(response.session.user),
      );
      await secureStorage.setItem(PROVIDER_ID_KEY, providerId);

      return {
        session: response.session,
        providerId,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Authentication failed");
    }
  },
);

export const signUp = createAsyncThunk(
  "auth/signUp",
  async (
    {
      providerId,
      credentials,
    }: { providerId: string; credentials: AuthCredentials },
    { rejectWithValue },
  ) => {
    try {
      const provider = authProviderRegistry.getProvider(providerId);

      if (!provider || !provider.signUp) {
        throw new Error(`Provider ${providerId} does not support sign up`);
      }

      const response = await provider.signUp(credentials);

      if (!response.success || !response.session) {
        throw new Error(response.error || "Sign up failed");
      }

      // Save auth data in secure storage
      await secureStorage.setItem(
        ACCESS_TOKEN_KEY,
        response.session.accessToken,
      );
      if (response.session.refreshToken) {
        await secureStorage.setItem(
          REFRESH_TOKEN_KEY,
          response.session.refreshToken,
        );
      }
      await secureStorage.setItem(
        USER_KEY,
        JSON.stringify(response.session.user),
      );
      await secureStorage.setItem(PROVIDER_ID_KEY, providerId);

      return {
        session: response.session,
        providerId,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Registration failed");
    }
  },
);

export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const providerId = state.auth.providerId;

      if (providerId) {
        const provider = authProviderRegistry.getProvider(providerId);
        if (provider) {
          await provider.signOut();
        }
      }

      // Clear secure storage
      await secureStorage.removeItem(ACCESS_TOKEN_KEY);
      await secureStorage.removeItem(REFRESH_TOKEN_KEY);
      await secureStorage.removeItem(USER_KEY);
      await secureStorage.removeItem(PROVIDER_ID_KEY);

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || "Sign out failed");
    }
  },
);

export const refreshSession = createAsyncThunk(
  "auth/refreshSession",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const providerId = state.auth.providerId;
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);

      if (!providerId || !refreshToken) {
        throw new Error("No active session found");
      }

      const provider = authProviderRegistry.getProvider(providerId);

      if (!provider || !provider.refreshSession) {
        throw new Error(
          `Provider ${providerId} does not support session refresh`,
        );
      }

      const result = await provider.refreshSession(refreshToken);

      if (!result.success || !result.session) {
        throw new Error(result.error || "Session refresh failed");
      }

      // Update storage with new tokens
      await secureStorage.setItem(ACCESS_TOKEN_KEY, result.session.accessToken);
      if (result.session.refreshToken) {
        await secureStorage.setItem(
          REFRESH_TOKEN_KEY,
          result.session.refreshToken,
        );
      }
      await secureStorage.setItem(
        USER_KEY,
        JSON.stringify(result.session.user),
      );

      return {
        session: result.session,
        providerId,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Token refresh failed");
    }
  },
);

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Check if we have tokens in storage
      const accessToken = await secureStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      const userInfo = await secureStorage.getItem(USER_KEY);
      const providerId = await secureStorage.getItem(PROVIDER_ID_KEY);

      if (!accessToken || !userInfo || !providerId) {
        throw new Error("No active session found");
      }

      // Parse user info
      const user = JSON.parse(userInfo);

      // Check token expiration if available
      const session = {
        user,
        accessToken,
        refreshToken: refreshToken || undefined,
      };

      // If session has expiration info and is expired, try refresh
      if (session.user.expiresAt && isTokenExpired(session.user.expiresAt)) {
        if (refreshToken) {
          // Refresh the token
          return await dispatch(refreshSession()).unwrap();
        } else {
          throw new Error("Session expired");
        }
      }

      return {
        session,
        providerId,
      };
    } catch (error: any) {
      // Clear storage on auth check failure
      await secureStorage.removeItem(ACCESS_TOKEN_KEY);
      await secureStorage.removeItem(REFRESH_TOKEN_KEY);
      await secureStorage.removeItem(USER_KEY);
      await secureStorage.removeItem(PROVIDER_ID_KEY);

      return rejectWithValue(error.message || "Authentication check failed");
    }
  },
);

// Auth slice definition
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Sign In
    builder.addCase(signIn.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signIn.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.session = action.payload.session;
      state.providerId = action.payload.providerId;
    });
    builder.addCase(signIn.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Sign Up
    builder.addCase(signUp.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signUp.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.session = action.payload.session;
      state.providerId = action.payload.providerId;
    });
    builder.addCase(signUp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Sign Out
    builder.addCase(signOut.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(signOut.fulfilled, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.session = null;
      state.providerId = null;
    });
    builder.addCase(signOut.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.session = null;
      state.providerId = null;
    });

    // Check Auth
    builder.addCase(checkAuth.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(checkAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.session = action.payload.session;
      state.providerId = action.payload.providerId;
    });
    builder.addCase(checkAuth.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.session = null;
      state.providerId = null;
    });

    // Refresh Session
    builder.addCase(refreshSession.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(refreshSession.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.session = action.payload.session;
      state.providerId = action.payload.providerId;
    });
    builder.addCase(refreshSession.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.session = null;
      state.providerId = null;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { AppDispatch } from "../store";
import * as Google from "expo-auth-session/providers/google";
import {
  signIn,
  signUp,
  signOut,
  checkAuth,
  refreshSession,
} from "../store/slices/auth-slice";
import { AuthCredentials, AuthUser } from "./providers/base-provider";
import authProviderRegistry from "./providers";
import { GoogleProvider } from "./providers/google-provider";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: string | null;
  availableProviders: string[];
  signInWithProvider: (
    providerId: string,
    credentials: AuthCredentials,
  ) => Promise<void>;
  signUpWithProvider: (
    providerId: string,
    credentials: AuthCredentials,
  ) => Promise<void>;
  logout: () => Promise<void>;
  googleAuth: {
    request: any;
    response: Google.AuthSessionResult | null;
    promptAsync: () => Promise<Google.AuthSessionResult>;
  } | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, error, session, providerId } =
    useSelector((state: RootState) => state.auth);

  // Set up Google auth if needed
  const googleProvider = authProviderRegistry.getProvider("google") as
    | GoogleProvider
    | undefined;
  const googleAuth = googleProvider
    ? {
        ...googleProvider.getAuthRequestHook(),
      }
    : null;

  // Check authentication status on app load
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Handle Google auth response
  useEffect(() => {
    if (
      googleAuth?.response?.type === "success" &&
      googleAuth.response.authentication
    ) {
      const { idToken } = googleAuth.response.authentication;
      dispatch(
        signIn({
          providerId: "google",
          credentials: { token: idToken },
        }),
      );
    }
  }, [googleAuth?.response, dispatch]);

  const signInWithProvider = async (
    providerId: string,
    credentials: AuthCredentials,
  ) => {
    await dispatch(signIn({ providerId, credentials }));
  };

  const signUpWithProvider = async (
    providerId: string,
    credentials: AuthCredentials,
  ) => {
    await dispatch(signUp({ providerId, credentials }));
  };

  const logout = async () => {
    await dispatch(signOut());
  };

  const clearAuthError = () => {
    dispatch({ type: "auth/clearError" });
  };

  const availableProviders = authProviderRegistry
    .getAllProviders()
    .map((provider) => provider.id);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user: session?.user || null,
        error,
        availableProviders,
        signInWithProvider,
        signUpWithProvider,
        logout,
        googleAuth,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

Now, let's create a secure storage service to safely store authentication tokens:

```typescript
// src/services/secureStorage.ts
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create storage interface
interface StorageService {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Web implementation using localStorage
const webStorage: StorageService = {
  getItem: async (key: string) => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    localStorage.removeItem(key);
  },
};

// Native implementation using SecureStore with fallback to AsyncStorage
const nativeStorage: StorageService = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      return AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      await AsyncStorage.removeItem(key);
    }
  },
};

// Choose appropriate implementation based on platform
const secureStorage: StorageService =
  Platform.OS === "web" ? webStorage : nativeStorage;

export default secureStorage;
```

Finally, let's create the login and registration screens:

```typescript
// src/app/(auth)/auth/(routes)/sign-in.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { VStack, HStack, Text, Input, Button, FormControl, Pressable, Box, Icon } from '../../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAuth } from '../../../auth/AuthContext';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithProvider, isLoading, error, googleAuth, clearAuthError } = useAuth();

  const handleCredentialsLogin = async () => {
    clearAuthError();
    await signInWithProvider('credentials', { email, password });
  };

  const handleGoogleLogin = async () => {
    clearAuthError();
    if (googleAuth) {
      await googleAuth.promptAsync();
    }
  };

  return (
    <View style={styles.container}>
      <VStack space={4} width="100%" maxWidth={400} p={4}>
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" mb={6}>
          Welcome Back
        </Text>

        {error && (
          <Box bg="red.100" p={3} borderRadius="md" mb={4}>
            <Text color="red.800">{error}</Text>
          </Box>
        )}

        <FormControl>
          <FormControl.Label>Email</FormControl.Label>
          <Input
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftElement={
              <Icon as={Ionicons} name="mail-outline" size="sm" ml={2} color="muted.400" />
            }
          />
        </FormControl>

        <FormControl>
          <FormControl.Label>Password</FormControl.Label>
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            type={showPassword ? "text" : "password"}
            leftElement={
              <Icon as={Ionicons} name="lock-closed-outline" size="sm" ml={2} color="muted.400" />
            }
            rightElement={
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  as={Ionicons}
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size="sm"
                  mr={2}
                  color="muted.400"
                />
              </Pressable>
            }
          />
        </FormControl>

        <Button
          onPress={handleCredentialsLogin}
          isDisabled={isLoading}
          mt={4}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : "Sign In"}
        </Button>

        <HStack justifyContent="center" alignItems="center" space={2} my={4}>
          <Box flex={1} height="1px" bg="muted.300" />
          <Text color="muted.500">OR</Text>
          <Box flex={1} height="1px" bg="muted.300" />
        </HStack>

        <Button
          onPress={handleGoogleLogin}
          isDisabled={isLoading || !googleAuth}
          leftIcon={<Icon as={Ionicons} name="logo-google" size="sm" />}
          variant="outline"
        >
          Continue with Google
        </Button>

        <HStack justifyContent="center" mt={6}>
          <Text>Don't have an account? </Text>
          <Link href="/auth/sign-up" asChild>
            <Pressable>
              <Text color="primary.600" fontWeight="medium">Sign Up</Text>
            </Pressable>
          </Link>
        </HStack>
      </VStack>
```