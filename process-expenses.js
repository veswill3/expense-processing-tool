const config = require('./config');
const filename = process.argv[2] ? process.argv[2]: config.default_filename;

// Download current currency conversion rates
var getConversionRatesPromise = new Promise(function(resolve, reject) {
    const http = require('http');
    return http.get('http://apilayer.net/api/live?access_key=' + config.apilayer_access_key, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            // Data reception is done
            var parsed = JSON.parse(body);
            console.log('currency conversion rates retrived');
            resolve(parsed.quotes);
        });
    }).on('error', function(e) {
        reject('Error retriving currency conversion rates:' + e);
    });
});

// Read expense file
var getExpenseFilePromise = new Promise(function(resolve, reject) {
    const fs = require('fs');
    fs.readFile(filename, 'utf8', function processData(err, response) {
        if (err) {
            reject('Error reading file:' + err);
        } else {
            console.log('file contents read');
            resolve(response.split('\n'));
        }
    });
});

Promise.all([getConversionRatesPromise, getExpenseFilePromise])
.then(function(dataArr) {
    var region = null;
    if (config.default_region) {
        region = config.default_region;
    }
    var date = null;
    var conversionRates = dataArr[0];
    var expenseFile = dataArr[1];
    if (config.debug) {
        console.log({
            'conversionRates': conversionRates,
            'expenseFile': expenseFile
        });
    }

    console.log('---------- copy below here ----------');
    expenseFile.forEach(function(line) {
        if (line === '') return; // skip blank lines
        if (line.substr(0,3) === '###') {
            // define current region
            region = /[^#]+/.exec(line)[0].trim();
            if (config.debug) console.log('Switching region to ' + region);
        } else if (line.substr(0,3) === '---') {
            // define current date
            var dateStr = /[^-]+/.exec(line)[0].trim().split('/');
            var month = pad(dateStr[0]);
            var day = pad(dateStr[1]);
            date = '2017-' + month + '-' + day;
            if (config.debug) console.log('Switching date to ' + date);
        } else {
            // process normal line
            // ### [code] [comment] > [region]\t[date]\t[$$$]\t\t[comment]
            var amount = /[\d|.]+/.exec(line)[0];
            var ret = /[A-Z]+/.exec(line);
            var code = ret[0];
            var conversion = 1 / conversionRates['USD' + code];
            amount = round(amount * conversion, 2).toFixed(2);
            var comment = line.substr(ret.index + code.length + 1).trim();
            var category = '';

            switch (comment.toLowerCase()) {
                case 'dinner':
                    comment = '';
                    category = 'Dinner';
                    break;
                case 'lunch':
                    comment = '';
                    category = 'Lunch';
                    break;
                case 'water':
                case 'breakfast':
                    category = 'Food';
                    break;
                case "groceries":
                    comment = '';
                    category = 'Groceries';
                    break;
                default:
                    if (comment.toLowerCase().indexOf('beer') !== -1) {
                        category = 'Bar/Alcohol';
                    }
            }

            console.log(region + '\t' + date + '\t' + amount + '\t' + category + '\t' + comment);
        }
    });
    console.log('---------- copy above here ----------');
})
.catch(function(err) {
    console.log(err);
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

function pad(n) {
    return (n < 10) ? ("0" + n) : n;
}
