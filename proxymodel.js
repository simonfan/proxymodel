define(['backbone','underscore','_.mixins'], function(Backbone, undef, undef) {
	var ProxyModel = Backbone.ProxyModel = Backbone.Model.extend({
		initialize: function(attributes, proxies) {
			/**
			 * attributes: the Backbone Model's attributes
			 * proxies: proxies from which to proxy attributes
			 */ 

			var _this = this;

			if (proxies) {
				var proxies = _.isArray(proxies) ? proxies : [proxies];

				_.each(proxies, function(p) {
					_this.proxy(p.model, p.attributes, p.events, p.processor);
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
				attributes = attributes ? attributes : _.keys(model.attributes);

			// transform attributes into array.
			attributes = _.isArray(attributes) ? attributes : [ attributes ];
			// listen to change:attribute events
			_.each(attributes, function(attr) {
				// listen to events.
				_this.listenTo(model, 'change:' + attr, _this._modelChange);
			});

			// save the proxy options
			this.proxies[ model.cid ] = {
				attributes: attributes,
				processor: processor,
				events: events,
			};

			// copy all the proxied attributes from the model
			this._modelChange(model);

			return this;
		},

		/**
		 * getset proxies
		 */
		_proxy: function(cid, proxy) {
			/**
			 * Save proxy options by cid (Backbone.Model client id, specified in docs).
			 */
			return _.getset({
				context: this,
				obj: '_proxies',
				name: cid,
				value: proxy,
				options: {
					// function to be called when any proxy is set.
					iterate: function(cid, proxy) {

						var _this = this,
							attributes = proxy.attributes ? proxy.attributes : _.keys(model.attributes);

						// transform attributes into array.
						attributes = _.isArray(attributes) ? attributes : [ attributes ];
						// listen to change:attribute events
						_.each(attributes, function(attr) {
							// listen to events.
							_this.listenTo(model, 'change:' + attr, _this._modelChange);
						});

						// save the proxy options
						this.proxies[ model.cid ] = {
							attributes: attributes,
							processor: processor,
							events: events,
						};

						// copy all the proxied attributes from the model
						this._modelChange(model);

					}
				}
			});
		},

		unproxy: function(proxy) {
			/**
			 * Proxy:
			 		Model:
			 			- object: backbone model
			 			- string: cid
			 		Attributes:
			 			- array: attributes to be unproxied
			 			- string: single attribute to be unproxied
						- undefined, null, false: unproxy all attributes
					Events: 
						- array: events to be unproxied
						- string: single event to be unproxied
						- undefined, null, false: unproxy all events.
			 */

			var proxy = this.proxies[ model.cid ],
				unproxiedAttributes = unproxiedAttributes ? unproxiedAttributes : proxy.attributes;

			unproxiedAttributes = _.isArray(unproxiedAttributes) ? unproxiedAttributes : [unproxiedAttributes];

			// remove event listeners.			
			var _this = this;
			_.each(unproxiedAttributes, function(attrname, index) {
				// stop listening to events 
				_this.stopListening(model, 'change:' + attrname, _this._modelChange);
			});

			// remove the given attributes from the ones being proxied
			proxy.attributes = _.difference(proxy.attributes, unproxiedAttributes);

			return this;
		},

		// handles change events on the proxied model
		_modelChange: function(model) {
			var _this = this,
				proxy = this.proxies[ model.cid ],
				proxiedAttributes = proxy.attributes,
				processor = proxy.processor;

			_.each(proxiedAttributes, function(attr) {
				// get the attribute's value from the model.
				var value = model.get(attr);

				if (typeof processor === 'function') {
					// if there is a processor, only set the value if it returns 
					// something. Otherwise, assume that there should be no
					// setting at all.
					value = processor.call(this, value, attr);
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