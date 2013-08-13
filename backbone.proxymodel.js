define(['backbone','underscore'], function(Backbone, undef) {
	var ProxyModel = Backbone.ProxyModel = Backbone.Model.extend({
		initialize: function(attributes, proxies) {
			/**
			 * attributes: the Backbone Model's attributes
			 * proxies: proxies from which to proxy attributes
			 */ 

			var _this = this;

			/**
			 * save proxies by Backbone Model cid.
			 */
			this._proxies = {};

			if (proxies) {
				var proxies = _.isArray(proxies) ? proxies : [proxies];

				_.each(proxies, function(proxy) {
					_this.proxy(proxy);
				});
			}
		},

		// define proxies
		proxy: function(proxy) {
			/**
			 * Proxy:
			 *		Model: The Backbone Model to be proxied from
			 *		Attributes:
			 			- array: list of attributes to be proxied
			 			- string: single attribute to be proxied (transform into array)
			 			- undefined, false, null: all current attributes from the model.
			 		Options: attribute setting options.
			 		Events: 
			 			- array: list of events to be proxied
			 			- string: single event to be proxied
			 			- undefined, false, null: no events proxied.
			 * 		Processor: the function that will process the change
			 */


			var _this = this,
				model = proxy.model,
				attributes = proxy.attributes,
				events = proxy.events,
				options = proxy.options,
				processor = proxy.processor;

			// normalize attributes
			attributes = attributes ? attributes : _.keys(model.attributes);
			// force attributes into array
			proxy.attributes = attributes = _.isArray(attributes) ? attributes : [ attributes ];

			// normalize events
			if (events) {
				// transform events into NON EMPTY array
				proxy.events = events = (_.isArray(events) && events.length > 0) ? events : [ events ];
			}

			// save the proxy
			this._getsetProxy(model.cid, proxy);

			// setup attribute proxy
			this._setAttrProxy(model, attributes, options, processor);

			// setup event proxy
			this._setEventProxy(model, events);


			return this;
		},

		/**
		 * gets and sets proxies on this._proxies object
		 */
		_getsetProxy: function(cid, proxy) {
			if (!proxy) {
				// getter
				return this._proxies[ cid ];
			} else {
				// setter
				this._proxies[ cid ] = proxy;
			}
		},

		/**
		 * Sets an attribute proxy: 
		 	- listen to the change events
		 */
		_setAttrProxy: function(model, attributes, settingOptions, processor) {
			var _this = this;

			// listen to change:attribute events
			_.each(attributes, function(attr) {
				// listen to events.
				_this.listenTo(model, 'change:' + attr, _this._proxyChange);
			});

			// copy the model's attributes
			_this._proxyChange(model);
		},

		/**
		 * Sets up an event proxy:
		 	- listen to specified events
		 */
		_setEventProxy: function(model, events) {
			var _this = this;

			// listen to the events
			_.each(events, function(evt) {
				_this.listenTo(model, evt, function() {
					var args = Array.prototype.splice.call(arguments, 0);

					// add the evt to the argument list
					args.unshift(evt);

					// emit the event on this model
					_this.trigger.apply(_this, args);
				});
			});
		},

		unproxy: function(options) {
			/**
			 * Proxy:
			 		Model:
			 			- object: backbone model
			 		Attributes:
			 			- array: attributes to be unproxied
			 			- string: single attribute to be unproxied
						- undefined, null, false: unproxy all attributes
					Events: 
						- array: events to be unproxied
						- string: single event to be unproxied
						- undefined, null, false: unproxy all events.
			 */

			var proxy = this._getsetProxy(options.model.cid),
				unproxyAttr = options.attributes ? options.attributes : proxy.attributes,
				unproxyEvts = options.events ? options.events : proxy.events;


			// transform attributes into array.
			unproxyAttr = _.isArray(unproxyAttr) ? unproxyAttr : [ unproxyAttr ];
			// unproxy attributes
			this._unsetAttrProxy(proxy, unproxyAttr);


			if (unproxyEvts) {
				// transform events into NON EMPTY array
				unproxyEvts = (_.isArray(unproxyEvts) && unproxyEvts.length > 0) ? unproxyEvts : [ unproxyEvts ];

				// unproxy events
				this._unsetEventProxy(proxy, unproxyEvts);
			}

			return this;
		},

		/**
		 * unsets the specified attribute proxies
		 */
		_unsetAttrProxy: function(proxy, attributes) {
			/**
			 * Proxy: the proxy object saved in _proxies
			 * Attributes: array of attributes to be unproxied
			 */
			var _this = this,
				model = proxy.model;

			// stop listening to change:attribute events
			_.each(attributes, function(attr) {
				// stop listening to events 
				_this.stopListening(model, 'change:' + attr, _this._proxyChange);
			});

			// remove the given attributes from the ones being proxied
			proxy.attributes = _.difference(proxy.attributes, attributes);
		},

		/**
		 * unsets the specified event proxies.
		 */
		_unsetEventProxy: function(proxy, events) {
			/**
			 * Proxy: the proxy object saved in _proxies
			 * Events: array of attributes to be unproxied
			 */
			var _this = this,
				model = proxy.model;

			// stop listening events
			_.each(events, function(evt) {

				/**
				 * Here it is impossible to "unListen" to only the proxy events, as 
				 * we need to know the event name..
				 */
				_this.stopListening(model, evt);
			});

			// remove the given events from the ones being proxied
			proxy.events = _.difference(proxy.events, events);
		},

		/**
		 * This is the event handler that deals with changes on the proxied model.
		 */
		_proxyChange: function(model) {
			var _this = this,
				proxy = this._getsetProxy(model.cid),
				proxiedAttributes = proxy.attributes,
				options = proxy.options,
				processor = proxy.processor;

			_.each(proxiedAttributes, function(attr) {

				// get the attribute's value from the model.
				var value = model.get(attr);

				if (typeof processor === 'function') {
					// if there is a processor, only set the value if it returns 
					// something. Otherwise, assume that there should be no
					// setting at all.
					value = processor.call(_this, value, attr);
					if (typeof value !== 'undefined') {
						_this.set(attr, value);
					}

				} else {
					// if there is no processor, just set the value!
					_this.set(attr, value);
				}
			});
		},
	});
	
	return ProxyModel;
});