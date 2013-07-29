define(['proxymodel','backbone'], function(ProxyModel, Backbone) {

return function() {
	
	test('proxy simple proxy', function() {
		var f1 = new Backbone.Model({
			p1: 'bananas',
			p2: 'apples',
			p3: 'watermelons',
		});

		var proxiedFilter = new ProxyModel(
			{ p1: 'anything-but-bananas' },
			// proxy definer:
			{
				model: f1,
				attributes: 'p2',
				processor: undefined		// no processor.
			}
		);

		// expect the proxiedFilter p2 to be equal to f1's p2
		equal(proxiedFilter.get('p2'), f1.get('p2'), 'expect initialization to be correct');

		// set values on the f1
		f1.set({
			p1: 'modified-p1',
			p2: 'modified-p2',
			p3: 'modified-p3'
		});

		equal(proxiedFilter.get('p1'), 'anything-but-bananas', 'expect p1 to be unaltered');
		equal(proxiedFilter.get('p2'), f1.get('p2'), 'expect proxiedFilter proeprtites to be altered too');
	});


	test('multi property proxy, with processor', function() {
		var f1 = new Backbone.Model({
				p1: 'bananas',
				p2: 'apples',
				p3: 'watermelons',
			}),
			f2 = new Backbone.Model({
				p4: 'lalala',
				p5: 'lerolero'
			});

		var proxiedFilter = new ProxyModel(
			{ p1: 'anything-but-bananas' },

			// array of proxies
			[
				{
					model: f1,
					attributes: ['p2','p3'],
					processor: function(value, name) {
						return value + '-proxied-version';
					}
				},
				{
					model: f2,
					attributes: 'p4',
					// no processor
				}
			]
		);


		// expect the proxiedFilter p2 to be equal to f1's p2
		equal(proxiedFilter.get('p1'), 'anything-but-bananas', 'p1 initialization');
		equal(proxiedFilter.get('p2'), f1.get('p2') + '-proxied-version', 'p2 initialization');
		equal(proxiedFilter.get('p3'), f1.get('p3') + '-proxied-version', 'p3 initialization');

		// set values on the f1
		f1.set({
			p1: 'modified-p1',
			p2: 'modified-p2',
			p3: 'modified-p3'
		});

		equal(proxiedFilter.get('p1'), 'anything-but-bananas', 'expect p1 to be unaltered');
		equal(proxiedFilter.get('p2'), f1.get('p2') + '-proxied-version', 'expect proxiedFilter proeprtites to be altered too');
		equal(proxiedFilter.get('p3'), f1.get('p3') + '-proxied-version', 'expect proxiedFilter proeprtites to be altered too');

		// set values on the f2
		f2.set({
			p1: 'f2-mod-p1',
			p2: 'f2-mod-p2',
			p3: 'f2-mod-p3',
			p4: 'f2-mod-p4',
			p5: 'f2-mod-p5',
		});

		deepEqual(proxiedFilter.attributes, {
			p1: 'anything-but-bananas',
			p2: f1.get('p2') + '-proxied-version',
			p3: f1.get('p3') + '-proxied-version',
			p4: f2.get('p4'),
		//	p5: undefined (not proxied neither set on the proxied model)
		}, 'final');
	});

}
});