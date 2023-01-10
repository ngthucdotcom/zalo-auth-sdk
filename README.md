# Zalo Auth SDK using sign in with popup flow

## Installation

```bash
npm run install
```

## Running

```bash
npm run start
```

## Flow

* Step 1: User click on the button "Sign in with Zalo"

* Step 2: The client app initialize environment, and call `login` function from `libs/zalo-auth-sdk.js`

* Step 3: On then `zalo-auth-sdk.js`, a function `login` is called. It build the url of the auth host, and open a popup
  window with the url.

* Step 4: The popup window is opened on client side, and the user will input his/her credentials to sign in.

* Step 5: After the user sign in, auth host will validate the app registration, user credentials, and create a token for
  the client app with user's information. Then, the auth host will redirect the popup window to the client app with the
  token.

* Step 6: The `zalo-auth-sdk.js` will listen to the event from the popup window, process some logic to get the token, and
  close the popup window.

* Step 7: The client app will receive the token from the `zalo-auth-sdk.js`, and store it in the local storage. If have any
  problem, the client app will show the error message.