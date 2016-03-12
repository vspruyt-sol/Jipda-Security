function Automaton(acceptStates, triples, startingNode){
	this.acceptStates = acceptStates || [];
	this.triples = triples || [];
	this.startingNode = startingNode || 0;
}

Automaton.prototype.fromFSM = function(fsm, table){
	var _lookupEdge = function(edgeName){
		var neg = edgeName.charAt(0) === '¬';
		if(edgeName.indexOf('idx') < 0) return new EdgeLabel(edgeName, {});
		var idx = neg ? edgeName.substring(4, edgeName.length) : edgeName.substring(3, edgeName.length);
		var regexPart = table[idx];
		return new EdgeLabel(regexPart.name, regexPart.obj, neg, regexPart.expandFunction, regexPart.expandContext);
	}

	//variables
	var subgraph, toNodes, label;

	//collect accept states
	for(var acc in fsm.acceptStates){
		this.acceptStates.push(new DummyNode(parseInt(acc)));
	}

	//collect starting point
	this.startingNode = new DummyNode(parseInt(fsm.origin));

	//collect triples
	for(var key in fsm.graph){
		subgraph = fsm.graph[key];
		for(var edge in subgraph){
			toNodes = flatten([subgraph[edge]]);
			label = _lookupEdge(edge);
			for(var i = 0; i < toNodes.length; i++){
				//console.log(parseInt(key) === this.startingNode._id)
				this.triples.push(new GraphTriple(
									new DummyNode(parseInt(key)),
									label,
									new DummyNode(parseInt(toNodes[i])),
									(this.startingNode._id === parseInt(key)),
									contains(this.acceptStates, new DummyNode(parseInt(toNodes[i])))));
			}
		}
	}
}