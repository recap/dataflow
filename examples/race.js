const dataflow = require('../src/dataflow');

function mochcall(param, cb) {
	if (!param) {
		setTimeout(function() {
			cb("error", false);
		}, 0);
	} else {
		setTimeout(function() {
			cb(null, {
				"body": "some object"
			});
		}, param);
	}
}

new dataflow.Dataflow()
	.create({
		name: "start"
	}, (data, t) => {
		t(['call', 'timeout'], [])(null, data.value);
	})
	.create({
		name: "call"
	}, (data, t) => {
		mochcall(data.value, t(["final:port1"], ["error"]));
	})
	.create({
		name: 'timeout'
	}, (data, t) => {
		setTimeout(() => {
			t(['final:port2'], [])(null, "Timed out");
		}, 1000);
	})
	.create({
		name: "error"
	}, (err, t) => {
		console.error(err);
		throw new Error("some error");
	})
	.create({
		name: 'final',
		ports: ['port1', 'port2'],
		expression: 'port1 ^ port2'
		//expression: '(!port1 & port2) | (port1 & !port2)'
	}, (data, t, state) => {
		console.log("final data: ", data);
	})
	.fire("start", 100);
