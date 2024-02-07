import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Provider from '@ant-design/react-native/lib/provider';
import { useFonts } from 'expo-font';
import { RFPercentage } from "react-native-responsive-fontsize";

import Auth from './screens/Auth';
import Operations from './screens/Operations';
const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'antoutline': require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
    'antfill': require('@ant-design/icons-react-native/fonts/antfill.ttf'),
    'cinzel': require('./assets/fonts/CinzelRegular.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{fontSize: RFPercentage(3)}}>Please Wait...</Text>
      </View>
    )
  }
  return (
    <Provider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen options={{ headerShown: false }} name="Auth" component={Auth} />
          <Stack.Screen options={{ headerShown: false }} name="Operations" component={Operations} />
        </Stack.Navigator>
        <StatusBar style="light" backgroundColor='#898989' />
      </NavigationContainer>
    </Provider>
  );
}