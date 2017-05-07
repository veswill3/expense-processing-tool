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
        <StackNavigation initialRoute={Router.getRoute('detail')} />
      </NavigationProvider>
    );
    return (
      <View>
        <Navigator
          initialRoute={{ title: 'Enter New Expense', id: 'detail' }}
          renderScene={(route, navigator) => {
            var routeId = route.id;
            if (routeId === 'detail') {
              return (<DetailScreen title={route.title} navigator={navigator} dataKey={route.dataKey} />);
            }
            if (routeId === 'list') {
              return (<ListScreen title={route.title} navigator={navigator} />);
            }
            return (
              <View style={{flex: 1, alignItems: 'stretch', justifyContent: 'center'}}>
                <TouchableOpacity style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}
                  onPress={() => navigator.pop()}
                >
                  <Text style={{color: 'red', fontWeight: 'bold'}}>This route does not exist...</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        {Platform.OS === 'android' &&  <View style={{height: 24, backgroundColor: 'rgba(0,0,0,0.2)',}} />}
      </View>
    );
  }
}

Expo.registerRootComponent(App);
