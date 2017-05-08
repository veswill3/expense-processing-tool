import Expo from 'expo';
import React from 'react';
import {
  Platform,
  Navigator,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  createRouter,
  NavigationProvider,
  StackNavigation,
} from '@expo/ex-navigation';

import DetailScreen from './screens/DetailScreen';
import ListScreen from './screens/ListScreen';

const Router = createRouter(() => ({
  detail: () => DetailScreen,
  list: () => ListScreen,
}));

class App extends React.Component {
  render() {
    return (
      <NavigationProvider router={Router}>
        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        {Platform.OS === 'android' &&  <View style={{height: 24, backgroundColor: 'rgba(0,0,0,0.2)',}} />}
        <StackNavigation initialRoute={Router.getRoute('detail')} />
      </NavigationProvider>
    );
  }
}

Expo.registerRootComponent(App);
