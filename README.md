A simple expense processing tool to convert my travel expense notes into something useable

Create a `config.js` file like this:
```js
module.exports = {
    apilayer_access_key: 'my-secret-api-key',
    default_filename: 'raw-data',
    default_region: 'Murica',
    debug: false
};
```

to run:
```sh
$ node process-expenses.js filename
```
