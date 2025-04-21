import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { PersistConfig } from 'redux-persist';
import { RootState } from './index';

import ReduxStorage from 'redux-persist/lib/storage';

// Determine if we're in a web environment
const isWeb = Platform.OS === 'web';

// Get the appropriate storage
const storage = isWeb ? ReduxStorage : AsyncStorage;

// Configuração persistência
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['users'], 
};

export default persistConfig;