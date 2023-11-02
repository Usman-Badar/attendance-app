import { StatusBar } from 'expo-status-bar';
import { Suspense, lazy, useEffect } from 'react';
import { useFonts } from 'expo-font';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Provider from '@ant-design/react-native/lib/provider';
import { Text } from 'react-native';

import Auth from './screens/Auth';
import Operations from './screens/Operations';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'antoutline': require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
    'antfill': require('@ant-design/icons-react-native/fonts/antfill.ttf'),
    'cinzel': require('./assets/Cinzel-Regular.ttf'),
  });
  if (!fontsLoaded) {
    return <Text>Please Wait...</Text>
  }
  return (
    <Provider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen options={{ headerShown: false }} name="Auth" component={Auth} />
          <Stack.Screen options={{ headerShown: false }} name="Operations" component={Operations} />
        </Stack.Navigator>
        <StatusBar style="light" backgroundColor='#4385F5' />
      </NavigationContainer>
    </Provider>
  );
}