const dataflow = require('../src/dataflow');

function mochcall(param, cb) {
		if(!param) {
				setTimeout(function() {
					cb("error", false);
				}, 0);
		} else {
				setTimeout(function() {
					cb(null, {"body": "some object"});
				}, param);
		}
}

new dataflow.Dataflow()
    .create({ name: "start"}, (data, t) => {
			t(['s0', 's0t'], [])(null, data['begin']);
		})
    .create({name: "s0"}, 	(data, t) => {
			mochcall(data[0].value, t(["final:p1"], ["e1"]));
    })
    .create({name: 's0t'}, (data, t) => {
        setTimeout(() => {
            t(['final:p2'], [])(null, "Timed out");
        }, 1000);
    })
    .create({name: "e1"}, (err, t) => {
		console.error(err);
        throw new Error("some error");
    })
    .create({name:'final',
			ports:['p1', 'p2'],
			expression: '(!p1&p2) | (p1&!p2)'
	}, (data, t, state) => {
        console.log("final data: ", data);
        //console.log("final state: ", state);
    })
    .fire("start", 100);
