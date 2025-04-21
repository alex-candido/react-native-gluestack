import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useColorScheme } from "@/components/useColorScheme";
import { persistor, store } from "@/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GluestackUIProvider mode={colorScheme === "dark" ? "dark" : "light"}>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            {children}
          </ThemeProvider>
        </GluestackUIProvider>
      </PersistGate>
    </Provider>
  );
}
