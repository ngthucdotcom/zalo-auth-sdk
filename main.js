const clientId = '3850903547114980520';
const redirectUri = `${window.location.href}`;

function handleLogin() {
	showLoading();
	const refreshToken = sessionStorage.getItem('zalo_refresh_token');
	if (!refreshToken) {
		ZaloAuth
			.login({clientId, redirectUri})
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
			})
			.finally(() => {
				console.log('Login done, hide loading');
				hideLoading();
			});
		return;
	}
	handleRefreshSession();
}

function handleRefreshSession() {
	const refreshToken = sessionStorage.getItem('zalo_refresh_token');
	ZaloAuth
		.refreshSession({clientId, refreshToken})
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
		})
		.finally(() => {
			console.log('Refresh session done, hide loading');
			hideLoading();
		});
}

function handleLogout() {
	sessionStorage.removeItem('zalo_access_token');
	sessionStorage.removeItem('zalo_user_profile');

	handleUserProfile();
}

function handleUserProfile() {
	const beforeLoginEl = document.getElementById('sign-in');
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

function createLoadingElement(parentId = 'root') {
	const rootEl = document.getElementById(parentId);
	const loadingEl = document.createElement('div');
	loadingEl.id = 'loading-overlay';
	loadingEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
	loadingEl.style.position = 'fixed';
	loadingEl.style.top = '0';
	loadingEl.style.left = '0';
	loadingEl.style.right = '0';
	loadingEl.style.bottom = '0';
	loadingEl.style.margin = 'auto';
	loadingEl.style.width = '100%';
	loadingEl.style.height = '100%';

	// Insert loading overlay as a first child
	rootEl.insertBefore(loadingEl, rootEl.firstChild);
}

function showLoading() {
	createLoadingElement('root');
}

function visibleLoading() {
	createLoadingElement('root');

	setTimeout(() => {
		hideLoading();
	}, 3000);
}

function hideLoading() {
	const loadingEl = document.getElementById('loading-overlay');
	if (loadingEl) {
		loadingEl.remove();
	}
}