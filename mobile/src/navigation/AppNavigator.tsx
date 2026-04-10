import React, { useState } from "react";
import { View, Text } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

import { LiquidGlassTabBar } from "../components/modules/LiquidGlassTabBar";

import { SplashScreen } from "../screens/onboarding/SplashScreen";
import { AuthScreen } from "../screens/onboarding/AuthScreen";
import { EmailPasswordScreen } from "../screens/onboarding/EmailPasswordScreen";
import { LoginScreen } from "../screens/onboarding/LoginScreen";
import { NameInputScreen } from "../screens/onboarding/NameInputScreen";
import { AllergyDeclarationScreen } from "../screens/onboarding/AllergyDeclarationScreen";
import {
  SetupProgressScreen,
  WelcomeUserScreen,
  GreatChoiceScreen,
} from "../screens/onboarding/WelcomeScreens";

import { TutorialScreen } from "../screens/onboarding/TutorialScreen";

import { HomeScreen } from "../screens/home/HomeScreen";
import { MealLogScreen } from "../screens/home/MealLogScreen";
import { FoodLibraryScreen } from "../screens/home/FoodLibraryScreen";
import { ProfileScreen } from "../screens/home/ProfileScreen";
import { NotificationsScreen } from "../screens/home/NotificationsScreen";
import { SymptomAnalysisScreen } from "../screens/home/SymptomAnalysisScreen";
import { EmailVerificationScreen } from "../screens/onboarding/EmailVerification";
import { CrossReactivityScreen } from "../screens/home/CrossReactivityScreen";
import { useAuth } from "../hooks/useAuth";

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  EmailPassword: undefined;
  Login: undefined;
  NameInput: undefined;
  EmailVerification: { email: string };
  AllergyDeclaration: undefined;
  SetupProgress: undefined;
  WelcomeUser: { userName: string };
  GreatChoice: { userName: string };
  Tutorial: { userName: string };

  MainApp: { userName: string };
  Notifications: undefined;
  SymptomAnalysis: undefined;
  CrossReactivity: undefined;
};

export type MainTabParamList = {
  Home: { userName: string };
  MealLog: undefined;
  Library: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();


function HomeScreenWrapper({ userName }: { userName: string }) {
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNavigation = useNavigation<any>();

  return (
    <HomeScreen
      userName={userName}
      onNavigate={(screen) => {
        if (screen === "mealLog") {
          tabNavigation.navigate("MealLog");
        } else if (screen === "addMeal") {
        tabNavigation.navigate("MealLog", { startAdding: true });
      }
        // Stack screens - use stack navigation
        else if (screen === "symptomAnalysis") {
          stackNavigation.navigate("SymptomAnalysis");
        } else if (screen === "crossReactivity") {
          stackNavigation.navigate("CrossReactivity");
        } else if (screen === "foodLibrary") {
          tabNavigation.navigate("Library");
        } else if (screen === "notifications") {
          stackNavigation.navigate("Notifications");
        }
      }}
    />
  );
}

function MainTabNavigator({
  route,
}: {
  route: { params: { userName: string } };
}) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const userName = user?.firstName || route.params?.userName || "User";

  const tabs = [
  {
    id: "Home",
    icon: "home-outline" as const,
    iconFilled: "home" as const,
    label: "Home",
  },
  {
    id: "MealLog",
    icon: "restaurant-outline" as const,
    iconFilled: "restaurant" as const,
    label: "Meals",
  },
  {
    id: "Library",
    icon: "book-outline" as const,
    iconFilled: "book" as const,
    label: "Library",
  },
  {
    id: "Profile",
    icon: "person-outline" as const,
    iconFilled: "person" as const,
    label: "Profile",
  },
];

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <LiquidGlassTabBar
          tabs={tabs}
          selectedTab={props.state.routes[props.state.index].name}
          onTabPress={(tabId, params) => props.navigation.navigate(tabId, params)}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreenWrapper userName={userName} />}
      </Tab.Screen>
      <Tab.Screen name="MealLog">
        {({ navigation, route }) => (
          <MealLogScreen onBack={() => navigation.navigate("Home")} route={route} />
        )}
      </Tab.Screen>
      <Tab.Screen name="Library">
        {({ navigation }) => (
          <FoodLibraryScreen onBack={() => navigation.navigate("Home")} />
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {({ navigation }) => {
          const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
          return (
            <ProfileScreen
              onBack={() => navigation.navigate("Home")}
              onEditAllergies={() => {}}
              onSignOut={() => {}}
              onViewTutorial={() => stackNav.navigate("Tutorial", { userName: "User" })}
            />
          );
        }}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const [userData, setUserData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    allergies: [] as string[],
    symptoms: [] as string[],
  });
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {/* Onboarding Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        <Stack.Screen name="Auth">
          {({ navigation }) => (
            <AuthScreen
              onSignUpPress={() => navigation.navigate("EmailPassword")}
              onLoginPress={() => navigation.navigate("Login")}
              /*onLoginPress={() => {
                setUserData({
                  ...userData,
                  firstName: "Test User",
                  lastName: "Demo",
                });
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: "MainApp", params: { userName: "Test User" } },
                  ],
                });
              }}*/
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="EmailPassword">
          {({ navigation }) => (
            <EmailPasswordScreen
              onBack={() => navigation.goBack()}
              onContinue={(email) => {
                setUserData({ ...userData, email });
                navigation.navigate("EmailVerification");
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="EmailVerification">
          {({ navigation }) => (
            <EmailVerificationScreen
              email={userData.email}
              onVerified={() => navigation.navigate("AllergyDeclaration")}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onBack={() => navigation.goBack()}
              onContinue={() => {
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: "MainApp", params: { userName: user.firstName } },
                  ],
                });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="NameInput">
          {({ navigation }) => (
            <NameInputScreen
              onBack={() => navigation.goBack()}
              onContinue={(firstName, lastName) => {
                setUserData({ ...userData, firstName, lastName });
                navigation.navigate("AllergyDeclaration");
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="AllergyDeclaration">
          {({ navigation }) => (
            <AllergyDeclarationScreen
              onBack={() => navigation.goBack()}
              onContinue={(allergyData) => {
                const updatedUserData = {
                  ...userData,
                  allergies: allergyData.allergies,
                  symptoms: allergyData.symptoms,
                };
                setUserData(updatedUserData);
                navigation.navigate("Login");
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="SetupProgress">
          {({ navigation }) => {
            React.useEffect(() => {
              const timer = setTimeout(() => {
                navigation.navigate("WelcomeUser", {
                  userName: userData.firstName,
                });
              }, 2000);
              return () => clearTimeout(timer);
            }, []);
            return <SetupProgressScreen />;
          }}
        </Stack.Screen>

        <Stack.Screen name="WelcomeUser">
          {({ navigation, route }) => {
            React.useEffect(() => {
              const timer = setTimeout(() => {
                navigation.navigate("GreatChoice", {
                  userName: route.params.userName,
                });
              }, 2500);
              return () => clearTimeout(timer);
            }, []);
            return <WelcomeUserScreen userName={route.params.userName} />;
          }}
        </Stack.Screen>

        <Stack.Screen name="GreatChoice">
          {({ navigation, route }) => {
            React.useEffect(() => {
              const timer = setTimeout(() => {
                navigation.navigate("Tutorial", {
                  userName: route.params.userName,
                });
              }, 2500);
              return () => clearTimeout(timer);
            }, []);
            return <GreatChoiceScreen userName={route.params.userName} />;
          }}
        </Stack.Screen>

        <Stack.Screen name="Tutorial">
          {({ navigation, route }) => (
            <TutorialScreen
              onComplete={() => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "MainApp",
                      params: { userName: route.params.userName },
                    },
                  ],
                });
              }}
            />
          )}
        </Stack.Screen>

        {/* Main App with Tab Bar */}
        <Stack.Screen name="MainApp" component={MainTabNavigator} />

        {/* Overlay Screens (no tab bar) */}
        <Stack.Screen name="Notifications">
          {({ navigation }) => (
            <NotificationsScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen name="SymptomAnalysis">
          {({ navigation }) => (
            <SymptomAnalysisScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen name="CrossReactivity">
          {({ navigation }) => (
            <CrossReactivityScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
