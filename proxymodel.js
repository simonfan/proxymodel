define(['backbone','underscore'], function(Backbone, undef) {
	var ProxyModel = Backbone.ProxyModel = Backbone.Model.extend({
		initialize: function(attributes, origins, options) {
			/**
			 * attributes: the Backbone Model's attributes
			 * origins: origins from which to proxy attributes
			 * options: 
			 * 
			 */ 
			var _this = this,
				origins = _.isArray(origins) ? origins : [origins],
				options = options || {};

			// loop through the origins passed
			// and proxy each one of them.
			_.each(origins, function(o, index) {
				_this.proxy(o.model, o.attributes, o.processor)
			});

			// locked properties
			this.locked = [];
		},

		proxy: function(model, attributes, processor) {
			/**
			 * Model: The Backbone Model to be proxied from
			 * Attributes:
			 	- array: list of attributes to be proxied
			 	- string: single attribute to be proxied (transform into array)
			 	- undefined: all attributes from the model.
			 * Processor: the function that will process the change
			 */
			var _this = this;

			if (!attributes || typeof attributes === 'function') {
				// the second argument should be the processor.
				var processor = attributes;

				// proxy all changes using the processor
				model.on('change', function(model) {
					_this._proxyChanges(model, processor);
				});

			} else {
				var attributes = _.isArray(attributes) ? attributes : [attributes];

				_.each(attributes, function(name, index) {

					// link up the models through eventing
					model.on('change:' + name, function(model, value) {
						_this._proxyChanges(name, value, processor);
					});

					// get the current value and proxy it.
					_this._proxyChanges(name, model.get(name), processor);
				});
			}
		},

		_proxyChanges: function(name, value, processor) {
			if (typeof name === 'object') {
				// the name var actually holds a model.
				// and the value should be holding the processor function
				var _this = this,
					model = name,
					processor = value;

				// loop through each of the model's attributes
				_.each(model.attributes, function(value, attrname) {
					_this._proxyChanges(attrname, value, processor)
				});

			} else if (typeof name === 'string' && typeof value !== 'undefined') {

				if (!this.isLocked(name)) {
					// only attempt to set value if 
					// the value is not in the locked values list.

					if (typeof processor === 'function') {
						// if there is a processor, only set the value if it returns 
						// something. Otherwise, assume that there should be no
						// setting at all.
						value = processor.call(this, value, name);
						if (typeof value !== 'undefined') {
							this.set(name, value);
						}

					} else {
						// if there is no processor, just set the value!
						this.set(name, value);
					}
				}
			}
		},

		isLocked: function(propname) {
			return _.indexOf(this.locked, propname) !== -1;
		},

		lock: function(propname) {
			var props = _.isArray(propname) ? propname : [propname];
			this.locked = _.union(this.locked, props);

			return this;
		},

		unlock: function(propname) {
			var props = _.isArray(propname) ? propname : [propname];
			this.locked = _.difference(this.locked, props);

			return this;
		}
	});
	
	return ProxyModel;
});