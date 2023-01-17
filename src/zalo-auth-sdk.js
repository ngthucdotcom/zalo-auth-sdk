// const ZALO_AUTH_SCOPES = {
// 	USER_ID_BY_APP: 'id',
// 	DISPLAY_NAME: 'name',
// 	SMALL_PICTURE: 'picture.type(small)',
// 	NORMAL_PICTURE: 'picture.type(normal)',
// 	LARGE_PICTURE: 'picture.type(large)',
// }
const ZaloAuth = (() => {
	const host = 'https://oauth.zaloapp.com/v4';
	const POPUP_WIDTH = 480;
	const POPUP_HEIGHT = 600;
	function ZaloProfile({id, name, picture}, credentials = {accessToken: '', refreshToken: ''}) {
		return {
			...credentials,
			userId: id || '',
			displayName: name || '',
			photoUrl: picture?.data?.url || ''
		}
	}
	function openSizedPopup(urlNavigation, popupName) {
		const screenLeft = window.screenLeft || window.screenX; // IE8 compatibility
		const screenTop = window.screenTop || window.screenY; // IE8 compatibility

		const width = window.outerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		const height = window.outerHeight || document.documentElement.clientHeight || document.body.clientHeight;

		const left = Math.max(0, (width / 2) - (POPUP_WIDTH / 2) + screenLeft);
		const top = Math.max(0, (height / 2) - (POPUP_HEIGHT / 2) + screenTop);

		const config = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes`;

		return window.open(urlNavigation, popupName, config);
	}
	function handleErrors(reject, error, extrasData = {}) {
		if (typeof reject !== 'function') return;
		switch (error) {
			case 'pkce_unavailable':
				return reject({error: 'pkce_unavailable', message: 'PKCE unavailable', ...extrasData});
			case 'popup_blocked':
				return reject({error: 'popup_blocked', message: 'Popup blocked', ...extrasData});
			case 'popup_closed':
				return reject({error: 'popup_closed', message: 'Popup closed', ...extrasData});
			case 'popup_timeout':
				return reject({error: 'popup_timeout', message: 'Popup timeout', ...extrasData});
			case 'invalid_auth_code':
				return reject({error: 'invalid_auth_code', message: 'Invalid auth code', ...extrasData});
			case 'invalid_client_id':
				return reject({error: 'invalid_client_id', message: 'Invalid client id', ...extrasData});
			case 'invalid_grant_type':
				return reject({error: 'invalid_grant_type', message: 'Invalid grant type', ...extrasData});
			case 'invalid_access_token':
				return reject({error: 'invalid_access_token', message: 'Invalid access token', ...extrasData});
			case 'invalid_refresh_token':
				return reject({error: 'invalid_refresh_token', message: 'Invalid refresh token', ...extrasData});
			case 'invalid_scope':
				return reject({error: 'invalid_scope', message: 'Invalid scope', ...extrasData});
			case 'invalid_profile':
				return reject({error: 'invalid_profile', message: 'Invalid profile', ...extrasData});
			default:
				return reject({error: 'unknown', message: 'Unknown error', trace: error, ...extrasData});
		}
	}
	function injectScriptSheet(name, url) {
		return new Promise((resolve, reject) => {
			if (name === null || name === undefined) return resolve();
			const head = document.head || document.getElementsByTagName("head")[0];
			const id = "".concat(name.toUpperCase(), "_SCRIPT");
			if (document.getElementById(id)) return resolve();
			const script = document.createElement("script");
			script.id = id;
			script.type = "text/javascript";
			script.src = url;
			script.onload = resolve;
			script.onerror = reject;
			head.appendChild(script);
		});
	}
	async function injectDebugger() {
		await injectScriptSheet(
			"ERUDA_DEBUGGER",
			"https://cdn.jsdelivr.net/npm/eruda"
		);
		window.eruda && window.eruda.init();
	}
	function pkceChallenge(reject) {
		return new Promise((resolve) => {
			injectScriptSheet(
				"OAUTH_PKCE",
				"https://cdn.jsdelivr.net/npm/oauth-pkce@0.0.2/dist/oauth-pkce.min.js"
			)
				.then(() => {
					if (typeof getPkce !== 'function') {
						return handleErrors(reject, 'pkce_unavailable');
					}
					getPkce(43, (error, {verifier, challenge}) => {
						if (!error) {
							return resolve({codeVerifier: verifier, codeChallenge: challenge});
						}
						return handleErrors(reject, `pkce_unavailable: ${error}`);
					});
				})
				.catch((error) => {
					return handleErrors(reject, `injectOauthPkce: ${error}`);
				});
		});
	}
	function getZaloToken(reject, {clientId, grantType, codeVerifier, authCode, refreshToken}) {
		return new Promise((resolve) => {
			if (!clientId) return handleErrors(reject, 'invalid_client_id');
			if (!grantType) return handleErrors(reject, 'invalid_grant_type');
			const myHeaders = new Headers();
			myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

			const urlencoded = new URLSearchParams({"app_id": clientId});
			switch (grantType) {
				case 'authorization_code':
					urlencoded.append("code", authCode);
					urlencoded.append("grant_type", "authorization_code");
					urlencoded.append("code_verifier", codeVerifier);
					break;
				case 'refresh_token':
					urlencoded.append("refresh_token", refreshToken);
					urlencoded.append("grant_type", "refresh_token");
					break;
				default:
					break
			}

			const requestOptions = {
				method: 'POST',
				headers: myHeaders,
				body: urlencoded,
				redirect: 'follow'
			};

			fetch("https://oauth.zaloapp.com/v4/access_token", requestOptions)
				.then(response => response.json())
				.then(result => {
					// console.log('getZaloToken result: ', result);
					if (!result.error) {
						return resolve(result);
					}
					return handleErrors(reject, result.error, result);
				})
				.catch(error => handleErrors(reject, `getZaloToken: ${error}`));
		});
	}
	function getZaloProfile(reject, {accessToken, scopes}) {
		const defaultScopes = ["id", "name", "picture.type(large)"];
		scopes = scopes || defaultScopes;
		return new Promise((resolve) => {
			const myHeaders = new Headers({"access_token": accessToken});

			const requestOptions = {
				method: 'GET',
				headers: myHeaders,
				redirect: 'follow'
			};

			fetch(`https://graph.zalo.me/v2.0/me?fields=${scopes.toString()}`, requestOptions)
				.then(response => response.json())
				.then(result => {
					// console.log('getZaloProfile result: ', result);
					if (!result) {
						return handleErrors(reject, 'invalid_profile');
					}
					return resolve(result);
				})
				.catch(error => handleErrors(reject, `getZaloProfile: ${error}`));
		});
	}

	return {
		login: ({clientId, redirectUri, state, scopes, popupTimeOut}) => {
			state = state || 'zalo_auth';
			popupTimeOut = popupTimeOut || 60000;
			// console.log('Initial state: ', {clientId, redirectUri, state, scopes, popupTimeOut});
			return new Promise(async (resolve, reject) => {
				const {codeVerifier, codeChallenge} = await pkceChallenge(reject);
				const url = `${host}/permission?app_id=${clientId}&redirect_uri=${redirectUri}&code_challenge=${codeChallenge}&state=${state}`;
				// console.log('Login url: ', {url, codeVerifier, codeChallenge});
				const windowPopup = openSizedPopup(url, 'Zalo Auth');

				if (!windowPopup) {
					return handleErrors(reject, 'popup_blocked');
				}

				// User experience: set autofocus on popup
				if (windowPopup.focus) {
					windowPopup.focus();
				}

				// Listen for message from child window
				const eventListener = setInterval(async () => {
					// Listen for event close popup by user
					if (windowPopup && windowPopup.closed) {
						clearInterval(eventListener);
						return handleErrors(reject, 'popup_closed');
					}

					let hrefCallback = '';
					try {
						hrefCallback = windowPopup.location.href;
					} catch (error) {
						// Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
					}

					if (!hrefCallback || hrefCallback === 'about:blank') {
						return;
					}

					if (hrefCallback.startsWith(redirectUri)) {
						clearInterval(eventListener);
						windowPopup.close();
						const url = new URL(hrefCallback);
						const code = url.searchParams.get('code');
						// TODO: validate auth code
						if (!code) {
							return handleErrors(reject, 'invalid_auth_code');
						}
						const {access_token, refresh_token} = await getZaloToken(reject, {
							clientId,
							grantType: 'authorization_code',
							codeVerifier: codeVerifier,
							authCode: code
						});
						if (!access_token) {
							return handleErrors(reject, 'invalid_access_token');
						}
						const {id, name, picture} = await getZaloProfile(reject, {accessToken: access_token, scopes});
						return resolve(ZaloProfile({id, name, picture}, {
							accessToken: access_token,
							refreshToken: refresh_token
						}));
					}
				}, 50);

				// Set timeout to prevent infinite loop
				const timeOut = setTimeout(() => {
					if (!windowPopup || windowPopup.closed) {
						clearTimeout(timeOut);
						return;
					}
					clearInterval(eventListener);
					clearTimeout(timeOut);
					windowPopup.close();
					return handleErrors(reject, 'popup_timeout');
				}, popupTimeOut);
			});
		},
		refreshSession: ({clientId, refreshToken, scopes}) => {
			return new Promise(async (resolve, reject) => {
				const {access_token, refresh_token} = await getZaloToken(reject, {
					clientId,
					grantType: 'refresh_token',
					refreshToken: refreshToken
				});
				if (!access_token) {
					return handleErrors(reject, 'invalid_access_token');
				}
				const {id, name, picture} = await getZaloProfile(reject, {accessToken: access_token, scopes});
				return resolve(ZaloProfile({id, name, picture}, {
					accessToken: access_token,
					refreshToken: refresh_token
				}));
			});
		}
	}
})();