define(['backbone','underscore'], function(Backbone, undef) {
	var ProxyModel = Backbone.ProxyModel = Backbone.Model.extend({
		initialize: function(attributes, proxies) {
			/**
			 * attributes: the Backbone Model's attributes
			 * proxies: proxies from which to proxy attributes
			 */ 

			/**
			 * Save proxy options by cid (Backbone.Model client id, specified in docs).
			 */
			this.proxies = {};

			var _this = this,
				proxies = _.isArray(proxies) ? proxies : [proxies];

			_.each(proxies, function(p) {
				_this.proxy(p.model, p.attributes, p.processor);
			});
		},

		// define proxies
		proxy: function(model, attributes, processor) {
			/**
			 * Model: The Backbone Model to be proxied from
			 * Attributes:
			 	- array: list of attributes to be proxied
			 	- string: single attribute to be proxied (transform into array)
			 	- undefined, false, null: all current attributes from the model.
			 * Processor: the function that will process the change
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
				processor: processor
			};

			// copy all the proxied attributes from the model
			this._modelChange(model);

			return this;
		},

		unproxy: function(model, unproxiedAttributes) {
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