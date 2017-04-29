# dataflowjs
An Javascript dataflow model for asynchronous programming. Using this model, one creates task graphs which are lazily evaluated on fire function. It is best explained by example.

Let's say you want to make multiple I/O calls to a DB or whatever and want all the results when all calls complete. Furthermore if the calls take too much time, timeout the whole set of calls and raise a warning. The following schematic depicts the dataflow graph.


![parallel](/documentation/parallel_example.png)

What we can see from the graph is that 6 functions are called in parallel. Each task defines input ports and an activation expression. The evaluation of the expression determines if the task function is called or not. In the example the final function is only fired after the expression (p1 & p2 & p3 & p4 & p5) ^ p6 evaluates to True which means either all p1-5 are True or p6 which is the timeout is True. 

The above is implemented as follows:

```javascript
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
  ````

`create(options, function)` registers a function, the options is a JSON object
```javascript
{
  name: [task name: required],
  ports: [array with port names: optional],
  expression: [activation boolean port expression: optional]
}
```
Each registered function takes 2 parameters; a data parameter and a transfer callback. Since the tasks are asynchronous, results are returned through the transfer callback whereby the ports array indicate to which ports the data is being transferred. the transfer callback takes an array of success ports, an array of error ports, an error data object and a success data object `t([array of success ports], [array of error ports])(errorObject, successObject)`. This pattern allows functions using the callback pattern to be used immediately just like the `mochcall()`.

To start evaluating the graph, `fire(taskName, data)` is called on the dataflow object.

