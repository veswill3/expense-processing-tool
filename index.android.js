/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Navigator,
  View,
  TouchableOpacity,
  Text,
  AppRegistry
} from 'react-native';

var ExpenseDetail = require('./ExpenseDetail');
var ExpenseList = require('./ExpenseList');

export default class TravelExpenses extends Component {
  render() {
    return (
      <Navigator
        initialRoute={{ title: 'Enter New Expense', id: 'detail' }}
        renderScene={(route, navigator) => {
          var routeId = route.id;
          if (routeId === 'detail') {
            return (<ExpenseDetail title={route.title} navigator={navigator} dataKey={route.dataKey} />);
          }
          if (routeId === 'list') {
            return (<ExpenseList title={route.title} navigator={navigator} />);
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
    );
  }
}

AppRegistry.registerComponent('TravelExpenses', () => TravelExpenses);
