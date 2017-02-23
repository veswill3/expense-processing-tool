An expense tracking tool for my travels, written in react native.

To make this work, create a `config.js` file in the root directory like this:
```js
module.exports = {
    apilayer_access_key: 'secret', // to convert currencies
    google_form_key: 'secret', // to upload
};
```

to build and install an APK for debug:
```sh
./buildAPK.sh
```