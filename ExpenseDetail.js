import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Button,
  Alert,
  Picker,
  Switch,
  DatePickerAndroid,
  AsyncStorage,
  ActivityIndicator,
} from 'react-native';

const locations = [
  'Indonesia',
  'Australia',
  'New Zealand',
  'Place to Place',
  'Malaysia',
  'Philippines',
];

const currencyCodes = [
  'IDR',
  'USD',
  'AUD',
  'NZD',
  'MYR',
  'PHP',
];

const categories = [
  'Pick a category',
  'Lodging',
  'Flight/Bus',
  'Cab/Metro',
  'Bar/Alcohol',
  'Groceries',
  'Food',
  'Lunch',
  'Dinner',
  'Activity',
  'Car Rental',
  'Other',
];

const debug = false;

function string2PickerItem(item) {
  return <Picker.Item key={item} label={item} value={item} />
}

class ExpenseDetail extends Component {
  constructor(props) {
    super(props);
    // default
    this.state = {
      location: locations[0],
      date: new Date().toISOString().split('T')[0],
      amount: null,
      currencyCode: currencyCodes[0],
      category: null,
      comment: '',
      needsReview: false,
      loaded: true // for now...
    };
    if (this.props.dataKey) {
      this.state.loaded = false;
      // load from the datastore
      AsyncStorage.getItem(this.props.dataKey)
      .then(data => {
        let expData = JSON.parse(data);
        expData.loaded = true;
        this.setState(expData);
      })
      .catch(e => {
        Alert.alert('Unable to load the expense data...');
        console.log(e);
        this.setState({loaded: true, error: 'unable to load expense data'});
      });
    }
  }
  async selectDate() {
    try {
      const {action, year, month, day} = await DatePickerAndroid.open({
        // Use `new Date()` for current date.
        // May 25 2020. Month 0 is January.
        date: new Date(this.state.date)
      });
      if (action !== DatePickerAndroid.dismissedAction) {
        // Selected year, month (0-11), day
        this.setState({date: new Date(year, month, day+1).toISOString().split('T')[0]});
      }
    } catch ({code, message}) {
      console.warn('Cannot open date picker', message);
    }
  }
  saveExpense() {
    if (!this.state.amount) {
      Alert.alert('You forgot an amount');
      return;
    }
    if (!this.state.category || this.state.category === categories[0]) {
      Alert.alert('You forgot a category');
      return;
    }
    let key = this.props.dataKey || new Date().toISOString();
    AsyncStorage.setItem(key, JSON.stringify(this.state))
      .then(() => this.props.navigator.push({id: 'list', title: 'Expense List'}))
      .catch(e => {
        this.setState({error: e});
        Alert.alert('Something went wrong.\n' + e);
      });
  }
  render() {
    if (!this.state.loaded) {
      return (
        <ActivityIndicator
          animating={!this.state.loaded}
          size="large"
        />
      );
    }
    return (
      <View style={styles.container}>
        <View style={[styles.header]}>
          <Text style={[styles.title]}>{this.props.title}</Text>
        </View>
        <View style={[styles.content]}>

          <View style={[styles.row]}>
            <Picker
              style={{flex: 1}}
              selectedValue={this.state.location}
              onValueChange={(loc) => this.setState({location: loc})}>
              {locations.map(string2PickerItem)}
            </Picker>

            <TextInput
              style={{flex: 1}}
              value={this.state.date}
              onFocus={this.selectDate.bind(this)}
            />

          </View>

          <View style={[styles.row]}>
            <TextInput
              style={{width: 90}}
              placeholder="amount"
              keyboardType="numeric"
              value={this.state.amount ? this.state.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : null}
              onChangeText={(amt) => this.setState({amount: amt.replace(/,/g,'')})}
            />

            <Picker
              style={{width: 100}}
              selectedValue={this.state.currencyCode}
              onValueChange={(code) => this.setState({currencyCode: code})}>
              {currencyCodes.map(string2PickerItem)}
            </Picker>

            <Picker
              style={{flex:1}}
              selectedValue={this.state.category}
              onValueChange={(cat) => this.setState({category: cat})}>
              {categories.map(string2PickerItem)}
            </Picker>
          </View>

          <View style={[styles.row]}>
            <TextInput
              style={{flex:1}}
              placeholder="Comment"
              value={this.state.comment}
              onChangeText={(text) => this.setState({comment: text})}
            />
          </View>

          <View style={[styles.row]}>
            <Switch
              onValueChange={(value) => this.setState({needsReview: value})}
              value={this.state.needsReview}
            />
            <Text>Hold for review</Text>
          </View>

          { debug &&
            <View style={{backgroundColor: 'pink'}}>
              <Text>For debugging...{'\n'}{JSON.stringify(this.state, null, 2)}</Text>
            </View>
          }
        </View>
        <View style={[styles.footer]}>
          <View style={[styles.box]}>
            <Button
              onPress={() => {this.props.navigator.push({id: 'list', title: 'Expense List'});}}
              title="Cancel"
              color="gray"
            />
          </View>
          <View style={[styles.box]}>
            <Button
              onPress={this.saveExpense.bind(this)}
              title="Save"
            />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    height: 56,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#03A9F4',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white'
  },
  content: {
    marginTop: 50,
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 4,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flex: 1,
    padding: 4,
  },
  box: {
    flex: 1,
    padding: 4,
  },
});

module.exports = ExpenseDetail;
