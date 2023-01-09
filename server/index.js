const express = require('express');
const app = express();
const port = 4000;
const path = require('path');

app.use(express.static('public'));
app.use(express.urlencoded());

app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname + '/pages/signin.html'));
});

app.post('/login', (req, res) => {
	const {client_id, redirect_uri, username, password} = req.body;
	let token = '';
	const HARDCODED_CREDENTIALS = 'test@domain.com';
	const APP_INFO = {
		client_id: '0da96206511c3297fc9dfe3ee6602bbd',
		redirect_uri: 'http://localhost:3000/callback/index.html'
	}

	// Validate client_id and redirect_uri
	if (client_id === APP_INFO.client_id && redirect_uri === APP_INFO.redirect_uri) {

	}

	// Validate credentials
	if (username === HARDCODED_CREDENTIALS && password === HARDCODED_CREDENTIALS) {
		token = 'xxx.yyy.zzz';
	}

	// Redirect to redirect_uri with token
	res.statusCode = 301;
	res.setHeader('Location', `${redirect_uri}?token=${token}`);
	res.json({error: false, message: 'Redirecting...'});
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));