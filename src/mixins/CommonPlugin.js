/**
 * @class CommonPlugin
 * @brief VUE Mixin providing POTENTIAL shared OFS functionality. Tracking these in each project independently for now, will compare and merge later.
 * @author John Povall <john.povall@speridian.com>
 * @version 1.0
 *
 */

export default {

	data: () => ({

		// local cache prefix for global data
		localStoragePrefix: "CanonGlobalData",
		runningWithinOfs: null,
		ofsParentOrigin: null,

	}),

	methods: {

		/**
		 * Method to check the expected OFS config and properties as defined by the "ofs" object structure.
		 *
		 * @return (boolean)
		 */
		validatePluginConfiguration: function () {
			this.log('validatePluginConfiguration() - BEGIN');
			let self = this;


			// CHECK CONFIG VALUES

			// Assume all are valid
			let isValid = true;

			// Determine if any required config values are undefined, null, or empty strings
			Object.entries(this.ofs.config).forEach(function (entry) {
				if (entry[1].required === true && (typeof entry[1].value === 'undefined' || entry[1].value === null || entry[1].value.length === 0)) {
					isValid = false;
				}
			});

			// If any configuration values are invalid....
			if (isValid === false) {

				// Build message for logging to the console.  Don't output the values as they could contain sensitive invormation.
				self.log('==== OFS CONFIG ISSUE ====');
				Object.entries(this.ofs.config).forEach(function (entry) {

					let entryIsValid = true;

					if (entry[1].required === true && (typeof entry[1].value === 'undefined' || entry[1].value === null || entry[1].value.length === 0)) {
						entryIsValid = false;
					}

					self.log(entry[0] + ' --- ' + entry[1].description + ' --- [REQUIRED: ' + entry[1].required + '] --- [VALID: ' + entryIsValid + ']');
				});

			} else {

				// CONFIG APPEARS TO BE VALID, CHECK EXPECTED PROPERTIES

				// Determine if any required config values are undefined, null, or empty strings
				Object.entries(this.ofs.props).forEach(function (entry) {
					if (entry[1].required === true && (typeof entry[1].value === 'undefined' || entry[1].value === null || entry[1].value.length === 0)) {
						isValid = false;
					}
				});

				// If any properties are invalid....
				if (isValid === false) {

					// Build message for logging to the console.  Don't output the values as they could contain sensitive invormation.
					self.log('==== OFS PROPERTY ISSUE ====');
					Object.entries(this.ofs.props).forEach(function (entry) {

						let entryIsValid = true;

						if (entry[1].required === true && (typeof entry[1].value === 'undefined' || entry[1].value === null || entry[1].value.length === 0)) {
							entryIsValid = false;
						}

						self.log(entry[0] + ' --- ' + entry[1].description + ' --- [REQUIRED: ' + entry[1].required + '] --- [VALID: ' + entryIsValid + ']');
					});
				}

			}

			return isValid;

		},
	

		/**
		 * Method to handle post message events sent between frames.  Member of VUE methods object.
		 *
		 * This method performs various functions related to data and messages being sent between frames (usually VUE components)
		 * on the page.  Examples are, applying the address or credit card information to the order.
		 *
		 * @param e (object) The postMessage() event object.
		 * @return (void)
		 */
		handleOfsPostMessage: function (e)
		{

			this.log('handleOfsPostMessage() - postMessage IN <--');

			if (typeof e.data === 'undefined') {
				this.log(window.location.host + ' <- NO DATA ' + this._getDomain(e.origin), null, null, true);

				return false;
			}

			if (!this._isJson(e.data)) {
				this.log(window.location.host + ' <- NOT JSON ' + this._getDomain(e.origin), null, null, true);

				return false;
			}

			var ofsData = JSON.parse(e.data);
			// Create a second object used for the console log (so we can mask any sensitive info).
			var ofsDataToLog = JSON.parse(e.data);

			if(typeof ofsDataToLog.securedData !== 'undefined'){
				ofsDataToLog.securedData.oicUser = '<REMOVED>';
				ofsDataToLog.securedData.oicPassword = '<REMOVED>';
			}
			

			switch (ofsData.method) {
			case 'init':
				this.log('handleOfsPostMessage() - FS INIT method');
				this.log(ofsDataToLog);
				this.pluginInitEnd(ofsData);
				break;

			case 'open':
				this.log('handleOfsPostMessage() - FS open method');
				this.log(ofsDataToLog);
				this.pluginOpen(ofsData);
				break;

			case 'wakeup':
				this.pluginWakeup(ofsData);
				break;

			case 'error':
				this.showSnackBar('red', 'Error ' + ofsData.errors[0].code);
				break;

			case 'updateResult':
				this.processUpdateResult(document, e.data);
				break;

			case 'callProcedureResult':
				this.processProcedureResult(ofsData);
				break;

			default:
				//	this.processProcedureResult(document, e.data);
				this.log(window.location.host + ' <- UNKNOWN METHOD: ' + ofsData.method + ' ' + this._getDomain(e.origin), null, null, true);
				break;
			}
		},


		/**
		 * Method to fire a postMessage event.  Used to communicate between frames, components, etc.
		 *
		 * @param msg (object) The data to include in the postMessage event.
		 * @param targetOrigin (string) The target origin.
		 * @return (void)
		 */
		postMessage: function (msg, targetOrigin)
		{
			var isString = 'string' === typeof msg;
			// ignore non-ofs message
			if (!isString) {
				if (!isString && msg.type) return;
			}
			this.log('postMessage() - BEGIN');
			this.log(msg);
			if (targetOrigin === '') {
				var originUrl = document.referrer || (document.location.ancestorOrigins && document.location.ancestorOrigins[0]) || '';
				var domain = originUrl ? this._getDomain(originUrl) : '*OFS*';
				var targetOrigin = originUrl ? this._getOrigin(originUrl) : '*';
			}
			if (targetOrigin) {
				this.log(window.location.host + ' -> ' + (isString ? '' : msg.method) + ' ' + domain, isString ? msg : JSON.stringify(msg, null, 4));
			} else {
				this.log(window.location.host + ' -> ' + (isString ? '' : msg.method) + ' ERROR. UNABLE TO GET REFERRER');
			}

			if (typeof window !== 'undefined' && window !== null)
			{
				window.top.postMessage(msg, targetOrigin);

			}
			else
			{
				this.log('postMessage() - ERROR: window or window is undefined or null!');
			}

			this.log('postMessage() END');

		},

		/**
		 * Check for string is valid JSON
		 * @param {*} str - String that should be validated
		 * @returns {boolean}
		 */
		_isJson: function (str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		},
		/**
		 * Return domain of URL
		 * @param {String} url
		 * @returns {String}
		 *
		 */
		_getDomain: function (url) {
			if (url != '') {
				if (url.indexOf("://") > -1) {
					return url.split('/')[2];
				} else {
					return url.split('/')[0];
				}
			}

			return '';
		},

		/**
	 * Return origin of URL (protocol + domain)
	 * @param {String} url
	 * @returns {String}
	 */
		_getOrigin: function (url) {
			if (url != '') {
				if (url.indexOf("://") > -1) {
					return 'https://' + url.split('/')[2];
				} else {
					return 'https://' + url.split('/')[0];
				}
			}

			return '';
		},
		/**
		 * Business login on plugin init end
		 *
		 * @param {Object} data - JSON object that contain data from OFS
		 */
		pluginInitEnd: function (data) {
			this.saveToLocalStorage(data)

			var msg = {
				apiVersion: 1,
				method: "initEnd",
				wakeupNeeded: false,
				"wakeOnEvents": {
					"timer": { wakeupDelay: 15, sleepTimeout: 1800 }
				}
			};
			this.postMessage(msg, '');

		},


		localStorageGetItem: function (key) {
			return localStorage.getItem(this.localStoragePrefix + '-' + key);
		},

		localStorageSetItem: function (key, value) {
			return localStorage.setItem(this.localStoragePrefix + '-' + key, value);
		},

		localStorageRemoveItem: function (key) {
			return localStorage.removeItem(this.localStoragePrefix + '-' + key);
		},

		/**
		* Business login on plugin init
		*/
		saveToLocalStorage: function (data) {
			this.log(window.location.host + ' INIT. SET DATA TO LOCAL STORAGE', JSON.stringify(data, null, 4));
			this.localStorageSetItem('attributeDescriptions', JSON.stringify(data.attributeDescription) );
		},


		/**
		 * Business login on plugin wakeup (background open for sync)
		 *
		 * @param {Object} receivedData - JSON object that contain data from OFS
		 */
		pluginWakeup: async function (receivedData) {
			this.log(window.location.host + ' WAKEUP', JSON.stringify(receivedData, null, 4));

		},
		generateCallId () {
			return btoa(String.fromCharCode.apply(null, window.crypto.getRandomValues(new Uint8Array(16))));
		},
		isObject: function(o) { return typeof o == "object" },

		padTo2Digits(num) {
			return num.toString().padStart(2, '0');
		},
		formatDate(date) {
			return [
				this.padTo2Digits(date.getMonth() + 1),
				this.padTo2Digits(date.getDate()),
				date.getFullYear(),
			].join('/');
		},
		formatDateTime(date) {
			return (
				[
					date.getFullYear(),
					this.padTo2Digits(date.getMonth() + 1),
					this.padTo2Digits(date.getDate()),
				].join('-') +
    ' ' +
    [
    	this.padTo2Digits(date.getHours()),
    	this.padTo2Digits(date.getMinutes()),
    	this.padTo2Digits(date.getSeconds()),
    ].join(':')
			);
		}
	},
};

