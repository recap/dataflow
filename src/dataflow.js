const parser = require('./parsers/states').parser;

var Dataflow = function() {
    this.fMap = {};
    this.tMap = {};
    this.dMap = {};
    this.dMap['default'] = {
        state: {
			aux: null,
            pstate: null,
            cstate: null,
            stack: [],
			barrier: []
        },
        value: null,
		values: []
    }
	this.deepCopy = function(dObj) {
		var tmpValue = dObj.values;
		dObj.values = null;
		var dCopy = JSON.parse(JSON.stringify(dObj));
		dCopy.values = tmpValue;
		dObj.values = tmpValue;
		return dCopy;
	}
    this.lookUp = function(context) {
		return function(state) {
			return context.state.barrier.filter(v => {
				return v == state;
            }).length > 0 ? true : false;
        }
    };

    this.dObj = this.dMap['default'];

}

Dataflow.prototype = {
    create: function(details, f) {
        this.fMap[details.name] = {
            func: f,
            details: details
        };
        this.dMap[details.name] = this.dObj;
        return this;
    },
    fire: function(resource, data, pstate='begin') {
		var state = resource.split(':')[0];
		var port = resource.split(':')[1];
        var fObj = this.fMap[state] ? this.fMap[state] : void(0);
        var f = fObj.func;
        var cntx = this.dMap[state] || this.dObj;
		this.dMap[state] = cntx;
		//console.log(state ," ",this.dObj);
        var pcntx = this.dMap[pstate] || this.dObj;
		var deepCopy = this.deepCopy;
		var lookUp = this.lookUp(cntx);
		//console.log("pstate: ",pstate);
        cntx.state.cstate = state;
        cntx.state.pstate = pstate;
        cntx.state.stack.push(state);
		//cntx.values[pstate] = data;
		//cntx.values = [];
		cntx.values.push({
							value: data,
							state: pstate
		});
        if (fObj.details.expression) {
			cntx.state.barrier.push(port);
			//console.log(cntx);
            var l = parser.parse(fObj.details.expression);
            //console.log(l);
            var r = eval(l);
            //console.log(r);
			this.dMap[state] = cntx;
            if (!r) { return; }
        }
		
		//console.log(cntx.value);
        var that = this;
        f(cntx.values, function(progressStates, errorStates) {
            return function(e, d) {
                progressStates.forEach((s) => {
					var cp = deepCopy(cntx);
					cp.state.pstate = state
					//console.log("cntx: ", cntx, " cp: ", cp);
					
                    that.dMap[state] = cp
					//console.log("fire: ", s, " ", d[cntx.state.pstate], " ", state);
					//console.log(d);
                    that.fire(s, d, state);
                });
                if (e) {
                    errorStates.forEach((s) => {
                        that.dMap[state] = deepCopy(cntx);
                        that.dMap[state].pstate = state;
                        that.fire(s, e, state);
                    });
                }
            }
        }, cntx.state);
    }
}

module.exports.Dataflow = Dataflow;
