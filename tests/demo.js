define(['proxymodel','backbone','jquery'], function(ProxyModel, Backbone, $) {
	origin1 = new Backbone.Model({
		p1: 'bananas',
		p2: 'aaaaa',
		p3: 'assadasdas',
	});

	origin1.on('change', function(model) {
		var jsonStr = JSON.stringify(model.toJSON());

		$('.origin1 .display').html( jsonStr );
	});


	origin2 = new Backbone.Model({
		p1: 'aaa',
		p2: 'grapes',
		p3: 'aasdkq qwe qjwoe joqw e',
	});

	origin2.on('change', function(model) {
		var str = JSON.stringify(model.toJSON());

		$('.origin2 .display').html(str);
	});



	proxyModel = new Backbone.ProxyModel({
		ownParam: 'apples'
	});

	proxyModel.on('change', function(model) {
		var str = JSON.stringify(model.toJSON());

		$('.proxy .display').html(str);
	})


	proxyModel.proxy(origin1, 'p1');

	// proxy multiple parameters
	// and using a processor that returns undefined.
	proxyModel.proxy(origin2, ['p2','p3'], function(value, name) {
		this.set(name + '-modified', value);
	});

});