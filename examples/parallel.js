const dataflow = require('../src/dataflow');

function mochcall(params, cb) {
	if (!params) {
		setTimeout(function() {
			cb("error", false);
		}, 0);
	} else {
		setTimeout(function() {
			cb(null, "hello from " + params.text);
		}, params.timeout);
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
		const params = {
				timeout: data.value,
				text: "call 1"
		};
		mochcall(params, t(["final:port1"], ["error"]));
	})
	.create({
		name: "call2"
	}, (data, t) => {
		const params = {
				timeout: data.value,
				text: "call 2"
		};
		mochcall(params, t(["final:port2"], ["error"]));
	})
	.create({
		name: "call3"
	}, (data, t) => {
		const params = {
				timeout: data.value,
				text: "call 3"
		};
		mochcall(params, t(["final:port3"], ["error"]));
	})
	.create({
		name: "call4"
	}, (data, t) => {
		const params = {
				timeout: data.value,
				text: "call 4"
		};
		mochcall(params, t(["final:port4"], ["error"]));
	})
	.create({
		name: "call5"
	}, (data, t) => {
		const params = {
				timeout: data.value,
				text: "call 5"
		};
		mochcall(params, t(["final:port5"], ["error"]));
	})
	.create({
		name: 'timeout'
	}, (data, t) => {
		setTimeout(() => {
			t(['final:timeout'], [])(null, "Timed out");
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
		ports: ['port1', 'port2', 'port3', 'port4', 'port5', 'timeout'],
		expression: '(port1 & port2 & port3 & port4 & port5) ^ timeout'
	}, (data, t, state) => {
		console.log("final data: ", data);
	})
	.fire("start", 100);
