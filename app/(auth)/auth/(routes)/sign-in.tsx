import React from "react";
import { View } from "react-native";
import { Link } from "expo-router";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";

export default function SignInScreen() {
  return (
    <View className="py-4" >
      <Text className="w-full text-center" >SignIn</Text>
      <Link href="/auth/sign-up">
        <Box className="bg-background-template py-2 px-6 rounded-full items-center flex-column sm:flex-row md:self-start">
          <Text className="text-typography-black font-normal">
            Explore Auth sign-up
          </Text>
        </Box>
      </Link>
    </View>
  );
}
