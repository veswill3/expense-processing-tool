import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Button,
  Alert,
  Picker,
  DatePickerAndroid,
  AsyncStorage,
  ActivityIndicator
} from 'react-native';

let debug = false;

class ExpenseDetail extends Component {
  constructor(props) {
    super(props);
    // default
    this.state = {
      location: 'Indonesia',
      date: new Date().toISOString().split('T')[0],
      amount: null,
      currencyCode: 'IDR',
      category: null,
      comment: '',
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
    console.log(this.state);
    if (!this.state.amount) {
      Alert.alert('You forgot an amount');
      return;
    }
    if (!this.state.category || this.state.category === 'pick') {
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
              <Picker.Item label="Indonesia" value="Indonesia" />
              <Picker.Item label="Australia" value="Australia" />
              <Picker.Item label="New Zealand" value="New Zealand" />
              <Picker.Item label="Place to Place" value="Place to Place" />
              <Picker.Item label="Malaysia" value="Malaysia" />
              <Picker.Item label="Philippines" value="Philippines" />
            </Picker>

            <TextInput
              style={styles.txt}
              value={this.state.date}
              onFocus={this.selectDate.bind(this)}
            />

          </View>

          <View style={[styles.row]}>
            <TextInput
              style={styles.txt}
              placeholder="amount"
              keyboardType="numeric"
              value={this.state.amount ? this.state.amount.toString() : null}
              onChangeText={(amt) => this.setState({amount: amt})}
            />

            <Picker
              style={{width: 100}}
              selectedValue={this.state.currencyCode}
              onValueChange={(code) => this.setState({currencyCode: code})}>
              <Picker.Item label="IDR" value="IDR" />
              <Picker.Item label="USD" value="USD" />
              <Picker.Item label="AUD" value="AUD" />
              <Picker.Item label="NZD" value="NZD" />
              <Picker.Item label="MYR" value="MYR" />
              <Picker.Item label="PHP" value="PHP" />
            </Picker>
          </View>

          <View style={[styles.row]}>
            <Picker
              style={{flex:1}}
              selectedValue={this.state.category}
              onValueChange={(cat) => this.setState({category: cat})}>
              <Picker.Item label="Pick a category" value="pick" />
              <Picker.Item label="Lodging" value="Lodging" />
              <Picker.Item label="Flight/Bus" value="Flight/Bus" />
              <Picker.Item label="Cab/Metro" value="Cab/Metro" />
              <Picker.Item label="Bar/Alcohol" value="Bar/Alcohol" />
              <Picker.Item label="Groceries" value="Groceries" />
              <Picker.Item label="Food" value="Food" />
              <Picker.Item label="Lunch" value="Lunch" />
              <Picker.Item label="Dinner" value="Dinner" />
              <Picker.Item label="Activity" value="Activity" />
              <Picker.Item label="Car Rental" value="Car Rental" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <View style={[styles.row]}>
            <TextInput
              style={styles.txt}
              placeholder="Comment"
              value={this.state.comment}
              onChangeText={(text) => this.setState({comment: text})}
            />
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
    alignItems: 'center'
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
    padding: 4
  },
  txt: {
    flex: 1,
    // height: 26,
    borderWidth: 0.5,
    borderColor: '#0f0f0f',
    // flex: 1,
    fontSize: 13,
    // padding: 4,
    margin: 4
  }
});

module.exports = ExpenseDetail;
