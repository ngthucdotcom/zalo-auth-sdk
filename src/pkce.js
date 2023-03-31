"use strict";

function b64Uri(r) {
	return btoa(r).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function getPkce(r, n) {
	r = r || 43;
	for (var t = window.msCrypto || window.crypto, e = b64Uri(Array.prototype.map.call(t.getRandomValues(new Uint8Array(r)), function (r) {
		return String.fromCharCode(r)
	}).join("")).substring(0, r), a = new Uint8Array(e.length), o = 0; o < e.length; o++) a[o] = e.charCodeAt(o);
	var i = t.subtle.digest("SHA-256", a);
	window.CryptoOperation ? (i.onerror = n, i.oncomplete = function (r) {
		runCallback(n, e, r.target.result)
	}) : i.then(function (r) {
		runCallback(n, e, r)
	}).catch(n)
}

function runCallback(r, n, t) {
	r(null, {verifier: n, challenge: b64Uri(String.fromCharCode.apply(null, new Uint8Array(t)))})
}