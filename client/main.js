const clientId = '3850903547114980520';
const redirectUri = `${window.location.protocol}//${window.location.host}`;
const profileScopes = [ZALO_AUTH_SCOPES.USER_ID_BY_APP, ZALO_AUTH_SCOPES.DISPLAY_NAME, ZALO_AUTH_SCOPES.LARGE_PICTURE];

function handleLogin() {
	const refreshToken = sessionStorage.getItem('zalo_refresh_token');
	if (!refreshToken) {
		zaloAuth
			.login({clientId, redirectUri, scopes: profileScopes, popupTimeOut: 15000})
			.then((res) => {
				console.log('Login response: ', res);
				sessionStorage.setItem('zalo_access_token', res.accessToken);
				sessionStorage.setItem('zalo_refresh_token', res.refreshToken);
				sessionStorage.setItem('zalo_user_profile', JSON.stringify({
					userId: res.userId,
					displayName: res.displayName,
					photoUrl: res.photoUrl
				}));

				handleUserProfile();
			})
			.catch((err) => {
				console.error('Login error: ', err);
			});
		return;
	}
	handleRefreshSession();
}

function handleRefreshSession() {
	const refreshToken = sessionStorage.getItem('zalo_refresh_token');
	zaloAuth
		.refreshSession({clientId, refreshToken, scopes: profileScopes})
		.then((res) => {
			console.log('Refresh session response: ', res);
			sessionStorage.setItem('zalo_access_token', res.accessToken);
			sessionStorage.setItem('zalo_refresh_token', res.refreshToken);
			sessionStorage.setItem('zalo_user_profile', JSON.stringify({
				userId: res.userId,
				displayName: res.displayName,
				photoUrl: res.photoUrl
			}));

			handleUserProfile();
		})
		.catch((err) => {
			console.error('Refresh session error: ', err);
		});
}

function handleLogout() {
	sessionStorage.removeItem('zalo_access_token');
	sessionStorage.removeItem('zalo_user_profile');

	handleUserProfile();
}

function handleUserProfile() {
	const beforeLoginEl = document.getElementById('login-button');
	const afterLoginEl = document.getElementById('login-success');
	const userProfile = sessionStorage.getItem('zalo_user_profile') ? JSON.parse(sessionStorage.getItem('zalo_user_profile')) : null;

	if (!userProfile) {
		beforeLoginEl.style.display = 'block';
		afterLoginEl.style.display = 'none';
	} else {
		beforeLoginEl.style.display = 'none';
		afterLoginEl.style.display = 'block';
		document.getElementById('welcome').innerText = `Welcome ${userProfile.displayName}`;
		document.getElementById('user-avatar').src = userProfile.photoUrl;
	}
}