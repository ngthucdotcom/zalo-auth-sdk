const authAzure = (() => {
	const host = 'http://localhost:4000/login';
	const POPUP_WIDTH = 480;
	const POPUP_HEIGHT = 600;

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

	return {
		login: ({clientId, redirectUri}) => {
			return new Promise((resolve, reject) => {
				const url = `${host}?client_id=${clientId}&redirect_uri=${redirectUri}`;
				const windowPopup = openSizedPopup(url, 'Azure Auth');

				if (!windowPopup) {
					return reject({error: 'popup_blocked', message: 'Popup blocked'});
				}

				// User experience: set autofocus on popup
				if (windowPopup.focus) {
					windowPopup.focus();
				}

				// Listen for message from child window
				const eventListener = setInterval(() => {
					// Listen for event close popup by user
					if (windowPopup && windowPopup.closed) {
						clearInterval(eventListener);
						return reject({error: 'popup_closed', message: 'Popup closed'});
					}

					// Set timeout to prevent infinite loop
					setTimeout(() => {
						clearInterval(eventListener);
						windowPopup.close();
						return reject({error: 'timeout', message: 'Timeout'});
					}, 15000);

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
						const token = url.searchParams.get('token');
						// TODO: validate token
						if (!token) {
							return reject({error: 'invalid_token', message: 'Invalid token'});
						}
						return resolve({error: null, token});
					}
				}, 50);
			});
		}
	}
})()