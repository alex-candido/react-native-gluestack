import EditScreenInfo from "@/components/EditScreenInfo";
import { View } from "@/components/Themed";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount((prevCount) => prevCount + 1);
  };

  return (
    <View>
      <Center className="flex-1">
        <Heading className="font-bold text-2xl">Expo V3</Heading>
        <Divider className="my-[30px] w-[80%]" />
        <Text className="p-4">
          Example below to use gluestack-ui components.
        </Text>
        <EditScreenInfo path="app/(app)/(tabs)/index.tsx" />
      </Center>

      <View className="flex flex-row justify-center items-center gap-4 mb-4">
        <Button
          size="md"
          variant="solid"
          action="primary"
          className="w-fit"
          onPress={handleClick}
        >
          <ButtonText>Click</ButtonText>
        </Button>
        <Text className="text-lg">{count}</Text>
      </View>
    </View>
  );
}
