An expense tracking tool for my travels, written in react native.

![Enter a new expense](screenshots/detail.png?raw=true "Enter a new expense")
![List of expenses](screenshots/list.png?raw=true "List of expenses")

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