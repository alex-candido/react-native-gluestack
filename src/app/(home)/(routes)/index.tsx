import DocumentData from "@/assets/Icons/DocumentData";
import Gradient from "@/assets/Icons/Gradient";
import LightBulbPerson from "@/assets/Icons/LightbulbPerson";
import Logo from "@/assets/Icons/Logo";
import Rocket from "@/assets/Icons/Rocket";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { AppDispatch, RootState } from "@/store";
import { findAllUsers } from "@/store/actions/users-actions";
import { Link } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";

const FeatureCard = ({ iconSvg: IconSvg, name, desc }: any) => {
  return (
    <Box
      className="flex-column border border-w-1 border-outline-700 md:flex-1 m-2 p-4 rounded"
      key={name}
    >
      <Box className="items-center flex flex-row">
        <Text>
          <IconSvg />
        </Text>
        <Text className="text-typography-white font-medium ml-2 text-xl">
          {name}
        </Text>
      </Box>
      <Text className="text-typography-400 mt-2">{desc}</Text>
    </Box>
  );
};

export default function Home() {
  const dispatch: AppDispatch = useDispatch();
  const { list, loading, error, message } = useSelector(
    (state: RootState) => state.users,
  );

  useEffect(() => {
    dispatch(findAllUsers());
    console.log(list);
  }, [dispatch]);

  return (
    <Box className="flex-1 bg-black h-[100vh]">
      <ScrollView
        style={{ height: "100%" }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box className="absolute h-[500px] w-[500px] lg:w-[700px] lg:h-[700px]">
          <Gradient />
        </Box>
        <Box className="flex flex-1 items-center my-16 mx-5 lg:my-24 lg:mx-32">
          <Box className="gap-10 base:flex-col sm:flex-row justify-between sm:w-[80%] md:flex-1">
            <Box className="bg-background-template py-2 px-6 rounded-full items-center flex-column md:flex-row md:self-start">
              <Text className="text-typography-white font-normal">
                Get started by editing
              </Text>
              <Text className="text-typography-white font-medium ml-2">
                ./App.tsx
              </Text>
            </Box>
            <Box>
              <Link href="/app">
                <Box className="bg-background-template py-2 px-6 rounded-full items-center flex-column sm:flex-row md:self-start">
                  <Text className="text-typography-white font-normal">
                    Explore App Navigation
                  </Text>
                </Box>
              </Link>
              <Link href="/auth/sign-in">
                <Box className="bg-background-template py-2 px-6 rounded-full items-center flex-column sm:flex-row md:self-start">
                  <Text className="text-typography-white font-normal">
                    Explore Auth Navigation
                  </Text>
                </Box>
              </Link>
            </Box>
          </Box>
          <Box className="flex-1 justify-center items-center h-[20px] w-[300px] lg:h-[160px] lg:w-[400px]">
            <Logo />
          </Box>

          <Box className="flex-column md:flex-row">
            <FeatureCard
              iconSvg={DocumentData}
              name="Docs"
              desc="Find in-depth information about gluestack features and API."
            />
            <FeatureCard
              iconSvg={LightBulbPerson}
              name="Learn"
              desc="Learn about gluestack in an interactive course with quizzes!"
            />
            <FeatureCard
              iconSvg={Rocket}
              name="Deploy"
              desc="Instantly drop your gluestack site to a shareable URL with vercel."
            />
          </Box>

          {loading && <Text>Loading users...</Text>}
          {error && <Text>Error: {message}</Text>}
          <Box className="flex-1">
            {list && list.length > 0 ? (
              list.map((user) => (
                <Text key={user.id} className="text-white">
                  {user.name} - {user.email}
                </Text>
              ))
            ) : (
              <Text>No users found</Text>
            )}
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}
