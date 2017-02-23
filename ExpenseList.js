import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Button,
  ListView,
  Alert,
  AsyncStorage
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
    };
    this.updateDisplay();
  }
  updateDisplay() {
    AsyncStorage.getAllKeys((err, keys) => {
      AsyncStorage.multiGet(keys, (err, stores) => {
        if (stores.length === 0) {
          this.setState({dataSource: this.state.ds.cloneWithRows(['No expenses.'])});
          return;
        } else {
          this.setState({dataSource: this.state.ds.cloneWithRows(stores)});
        }
      });
    }).catch(e => {console.warn(e)});
  }
  uploadExpenses() {
    // AsyncStorage.clear().then(() => {
    //   Alert.alert('Data cleared');
    //   this.updateDisplay();
    // });
    // return;

    AsyncStorage.getAllKeys()
      .then(keys => {
        if (keys.length === 0) {
          Alert.alert('No expenses to upload.');
          return;
        }
        // Download current currency conversion rates
        fetch('http://apilayer.net/api/live?access_key=' + config.apilayer_access_key)
          .then(resp => resp.json()).then(data => {
            let conversionRates = data.quotes;
            AsyncStorage.multiGet(keys)
              .then(stores => {
                stores.forEach(store => {
                  let key = store[0];
                  let d = JSON.parse(store[1]);
                  let newAmt = +round(d.amount * 1/conversionRates['USD' + d.currencyCode], 2).toFixed(2);
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
                      'Accept': 'application/json',
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formBody
                  }).then(response => {
                      // check status is ok
                      if (response.status >= 200 && response.status < 300) {
                        return response;
                      } else {
                        let error = new Error(response.statusText);
                        error.response = response;
                        throw error;
                      }
                    })
                    .then(response => {
                      // this is the ~best~ only way I could think of to see if there was a form validation issue
                      if (response['_bodyText'].indexOf('i.err.') > 0) {
                        let error = new Error('I *think* the form validation had an error');
                        throw error;
                      } else {
                        return response;
                      }
                    })
                    .then(r => {
                      // console.log(r);
                      AsyncStorage.removeItem(key)
                        .then(this.updateDisplay());
                    })
                    .catch(e => {
                      console.log('there was an issue uploading an expense.');
                      console.log(e);
                      Alert.alert('there was an issue uploading an expense.');
                    });
                });
              })
              .catch(e => {
                console.log('there was an issue processing an expense.');
                console.log(e);
                Alert.alert('there was an issue processing an expense.');
              });
          })
          .catch(e => {
            console.log('there was an issue retrieving currency conversion info.');
            console.log(e)
            Alert.alert('there was an issue retrieving currency conversion info.');
          });
      })
      .catch(e => {
        console.log('there was an issue retrieving storage keys.');
        console.log(e);
        Alert.alert('there was an issue retrieving storage keys.');
      });
  }
  render() {
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
                return <View style={[styles.row]}><Text>{rowData}</Text></View>
              }
              if (!rowData[1]) return <View style={[styles.row]}><Text>Nuts</Text></View>
              let expData = JSON.parse(rowData[1]);
              return (
                <View style={[styles.row]}>
                  <Text
                    onPress={() => {
                      this.props.navigator.push({ id: 'detail', title: 'Edit Expense', dataKey: rowData[0]});
                    }}
                    onLongPress={() => {
                      Alert.alert(
                        'Delete expense?', 'Are you sure you want to delete the '+expData.amount+' '+expData.currencyCode+' expense?',
                        [
                          {text: 'Cancel', onPress: () => console.log('delete canceled'), style: 'cancel'},
                          {text: 'Confirm', onPress: () => {
                            AsyncStorage.removeItem(rowData[0]).then(this.updateDisplay())
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
                    {expData.amount} {expData.currencyCode} {expData.location} {expData.date} [{expData.category}] {expData.comment}
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
    marginBottom: 40,
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
