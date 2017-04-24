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
		t(['call1', 'call2', 'call3', 'call4', 'call5', 'timeout'], [])(null, data.value);
	})
	.create({
		name: "call1"
	}, (data, t) => {
		mochcall(data.value, t(["final:port1"], ["error"]));
	})
	.create({
		name: "call2"
	}, (data, t) => {
		mochcall(data.value, t(["final:port2"], ["error"]));
	})
	.create({
		name: "call3"
	}, (data, t) => {
		mochcall(data.value, t(["final:port3"], ["error"]));
	})
	.create({
		name: "call4"
	}, (data, t) => {
		mochcall(data.value, t(["final:port4"], ["error"]));
	})
	.create({
		name: "call5"
	}, (data, t) => {
		mochcall(data.value, t(["final:port5"], ["error"]));
	})
	.create({
		name: 'timeout'
	}, (data, t) => {
		setTimeout(() => {
			t(['final:timeout'], [])(null, "Timed out");
		}, 10);
	})
	.create({
		name: "error"
	}, (err, t) => {
		console.error(err);
		throw new Error("some error");
	})
	.create({
		name: 'final',
		ports: ['port1', 'port2', 'port3', 'port4', 'port5', 'timeout'],
		expression: '(port1 & port2 & port3 & port4 & port5) ^ timeout'
	}, (data, t, state) => {
		console.log("final data: ", data);
	})
	.fire("start", 100);
