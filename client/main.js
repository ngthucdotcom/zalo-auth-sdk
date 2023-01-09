const clientId = '0da96206511c3297fc9dfe3ee6602bbd';
const redirectUri = `${window.location.protocol}//${window.location.host}/callback/index.html`;
function handleLogin() {
	authAzure
		.login({clientId, redirectUri})
		.then((res) => {
			console.log('Login response: ', res);
		})
		.catch((err) => {
			console.error('Login error: ', err);
		});
}