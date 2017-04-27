import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Button,
  ListView,
  Alert,
  Image,
  AsyncStorage,
  ActivityIndicator,
} from 'react-native';
const config = require('./config');

class ExpenseList extends Component {
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({
      // getSectionData         : (dataBlob, sId) => dataBlob[sId],
      // getRowData             : (dataBlob, sId, rId) => dataBlob[sId + ':' + rId],
      rowHasChanged          : (r1, r2) => r1 !== r2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    });
    this.state = {
      dataSource: ds.cloneWithRows(['loading']),
      ds: ds,
      uploading: false,
      uploadStage: null,
      noExpenses: false,
    };
    this.updateDisplay();
  }
  updateDisplay(newState = {}) {
    getExpenseDataPromise()
    .then(stores => {
      if (stores.length === 0) {
        newState['noExpenses'] = true;
      } else {
        // [
        //   [key, data],
        //   [key, data],
        // ]
        let groupedData = {};
        let today = new Date().toISOString().split('T')[0],
            yesterday = new Date(new Date() - 86400000).toISOString().split('T')[0];
        stores.forEach(([key, data]) => {
          let groupDate = data.date;
          if (groupDate === today) {
            groupDate = 'Today';
          } else if (groupDate === yesterday) {
            groupDate = 'Yesterday';
          }
          let group = data.location + ' ' + groupDate;
          if (!(group in groupedData)) {
            groupedData[group] = {};
          }
          groupedData[group][key] = [key, data];
        });
        let rowinfo = [];
        for (group in groupedData) {
          rowinfo.push(group);
          for (key in groupedData[group]) {
            rowinfo.push(groupedData[group][key]);
          }
        }
        newState['noExpenses'] = false;
        newState['dataSource'] = this.state.ds.cloneWithRows(rowinfo);
      }
      this.setState(newState);
    })
    .catch(e => {
      console.log('we had an issue asdfasdfasdfdsaf');
      console.warn(e)
    });
  }
  uploadExpenses() {
    // AsyncStorage.clear().then(() => {
    //   Alert.alert('Data cleared');
    //   this.updateDisplay();
    // });
    // return;

    this.setState({uploading: true, uploadStage: 1});
    Promise.all([getConversionRatesPromise(), getExpenseDataPromise()])
    .then(([convRates, expData]) => {
      this.setState({uploadStage: 2});
      // filter out any expenses that need review
      let filteredExpenseData = expData.filter((store) => {
        return !store[1].needsReview;
      });
      Promise.all(filteredExpenseData.map(store => {
        return new Promise((resolve, reject) => {
          let [key, d] = store;
          let newAmt = +round(d.amount * 1/convRates['USD' + d.currencyCode], 2).toFixed(2);
          let dateParts = d.date.split('-');
          let params = {
            'entry.1146702422': d.location,
            'entry.1922298015': newAmt,
            'entry.1408651527_year': +dateParts[0],
            'entry.1408651527_month': +dateParts[1],
            'entry.1408651527_day': +dateParts[2],
            'entry.1174471405': d.category,
            'entry.1664190829': d.comment
          };
          const formBody = Object.keys(params)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
          fetch('https://docs.google.com/forms/d/e/' + config.google_form_key + '/formResponse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: formBody
          }).then(response => {
            // error checks
            if (response.status >= 200 && response.status < 300) {
              // this is the ~best~ only way I could think of to see if there was a form validation issue
              if (response['_bodyText'].indexOf('i.err.') > 0) {
                let error = new Error('I *think* there was an issue with form validation');
                throw error;
              } else {
                resolve(response);
              }
            } else {
              let error = new Error(response.statusText);
              error.response = response;
              throw error;
            }
          }).then(() => AsyncStorage.removeItem(key))
          .catch(e => {
            // I am not rejecting on purpose - so promise.all will still process the others
            console.log('there was an issue uploading an expense.');
            console.log(e);
          });
        });
      }))
      .then(() => {
        this.updateDisplay({uploading: false, uploadStage: null});
      })
      .catch(e => {
        console.log('there was an issue uploading expenses.');
        console.log(e);
        Alert.alert('there was an issue uploading expenses.');
        this.updateDisplay({uploading: false});
      });
    })
    .catch(e => {
      console.log('Unable to get conversion rates or access expense data.');
      console.log(e)
      Alert.alert('Unable to get conversion rates or access expense data.');
      this.updateDisplay({uploading: false});
    });
  }
  render() {
    if (this.state.uploading) {
      return (
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center'}}>
          <ActivityIndicator
            animating={this.state.uploading}
            size="large"
          />
          <Text style={{textAlign: 'center'}}>
            {this.state.uploadStage === 1 ? 'Step 1 - Retrieving currency info' : 'Step 2 - Uploading transactions'}
          </Text>
        </View>
      );
    }
    if (this.state.noExpenses) {
      // removing the second button causes issues. I have no idea why...
      return (
        <View style={[styles.container, {backgroundColor: '#7baaf7'}]}>
          <View style={[styles.header]}>
            <Text style={[styles.title]}>{this.props.title}</Text>
          </View>

          <View style={[{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}]}>
            <Image source={require('./ic_zero_inbox.png')} />
          </View>

          <View style={[styles.footer]}>
            <View style={[styles.box]}>
              <Button
                onPress={() => {this.props.navigator.push({ id: 'detail', title: 'Enter New Expense'});}}
                title="New Expense 2"
              />
            </View>
            <View style={[styles.box]}>
              <Button
                onPress={() => {this.props.navigator.push({ id: 'detail', title: 'Enter New Expense'});}}
                title="New Expense"
              />
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <View style={[styles.header]}>
          <Text style={[styles.title]}>{this.props.title}</Text>
        </View>
        <View style={[styles.content]}>

          <ListView
            dataSource={this.state.dataSource}
            renderRow={(rowData) => {
              if (!rowData) return <View style={[styles.row]}><Text>shucks</Text></View>
              if (typeof rowData === 'string') {
                return <View style={[styles.row]}><Text style={{fontWeight: 'bold'}}>{rowData}</Text></View>
              }
              if (!rowData[1]) return <View style={[styles.row]}><Text>Nuts</Text></View>
              let [key, expData] = rowData;
              return (
                <View style={[styles.row]}>
                  <Text
                    onPress={() => {
                      this.props.navigator.push({ id: 'detail', title: 'Edit Expense', dataKey: key});
                    }}
                    onLongPress={() => {
                      Alert.alert(
                        'Delete expense?', 'Are you sure you want to delete the '+expData.amount+' '+expData.currencyCode+' expense?',
                        [
                          {text: 'Cancel', onPress: () => console.log('delete canceled'), style: 'cancel'},
                          {text: 'Confirm', onPress: () => {
                            AsyncStorage.removeItem(key).then(this.updateDisplay())
                            .catch(e => {
                              console.log('there was an issue deleting the expense.');
                              console.log(e);
                              Alert.alert('there was an issue deleting the expense.');
                            })
                          }}
                        ],
                        { cancelable: true }
                      );
                    }}
                  >
                    { expData.needsReview && <Text style={{color: 'red'}}>! </Text> }
                    <Text>{expData.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {expData.currencyCode}</Text>&nbsp;
                    <Text style={styles.category}> {expData.category} </Text>&nbsp;
                    <Text>{expData.comment}</Text>
                  </Text>
                </View>
              );
            }}
          />

        </View>
        <View style={[styles.footer]}>
          <View style={[styles.box]}>
            <Button
              onPress={this.uploadExpenses.bind(this)}
              title="Upload"
              color="gray"
            />
          </View>
          <View style={[styles.box]}>
            <Button
              onPress={() => {this.props.navigator.push({ id: 'detail', title: 'Enter New Expense'});}}
              title="New Expense"
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
    marginBottom: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
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
});

var getConversionRatesPromise = function() {
  return new Promise((resolve, reject) => {
      fetch('http://apilayer.net/api/live?access_key=' + config.apilayer_access_key)
      .then(resp => resp.json())
      .then(data => resolve(data.quotes))
      .catch(reject);
  });
};

var getExpenseDataPromise = function() {
  return new Promise((resolve, reject) => {
    AsyncStorage.getAllKeys()
    .then(keys => {
      return AsyncStorage.multiGet(keys);
    })
    .then(stores => {
      // parse the stored data here instead of everywhere!
      return stores.map(store => {
        return [store[0], JSON.parse(store[1])];
      })
    })
    .then(resolve)
    .catch(reject);
  });
};

function round(value, exp) {
  if (typeof exp === 'undefined' || +exp === 0)
    return Math.round(value);

  value = +value;
  exp = +exp;

  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
    return NaN;

  // Shift
  value = value.toString().split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

module.exports = ExpenseList;
