function Automaton(acceptStates, triples, startingNode, negatedPairs){
	this.acceptStates = acceptStates || [];
	this.triples = triples || [];
	this.startingNode = startingNode || 0;
	this.negatedPairs = negatedPairs || [];
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
	var subgraph, toNodes, label, negationMap, from, to, curNeg, marker;

	//Negated pairs
	this.negatedPairs = fsm.negatedPairs;

	//Test negation pairs
	negationMap = this.buildNegationPaths(fsm);
	//TODO: go over triples and add negation marker

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
				this.triples.push(new GraphTriple(
									new DummyNode(parseInt(key)),
									label,
									new DummyNode(parseInt(toNodes[i])),
									(this.startingNode._id === parseInt(key)),
									contains(this.acceptStates, new DummyNode(parseInt(toNodes[i])))));
			}
		}
	}

	//add negation markers to triples
	for(var j = 0; j < this.triples.length; j++){
		//See in which negated paths the triple is
		for(var idx in negationMap){ //negationMap[idx] is [[path1],[path2],[path3]]
			for(var k = 0; k < negationMap[idx].length; k++){
				curNeg = negationMap[idx][k];
				from = curNeg[0];
				to = curNeg[curNeg.length - 1];
				marker = new NegationMarker(from, 
							to, 
							parseInt(idx),
							this.triples[j].target._id === to);
				if(this.inNegationPath(this.triples[j], curNeg) && !contains(this.triples[j].edge.negationMarkers, marker)){
					this.triples[j].edge.negationMarkers.push(marker);
				}
			}
		}
	}
}

Automaton.prototype.buildNegationPaths = function(fsm){
	var from, to, map = {}, cnt = 0;
	for(var i = 0; i < this.negatedPairs.length; i++){
		from = this.negatedPairs[i][0];
		to = fsm.negatedPairs[i][1][0];
		map[cnt++] = this.findPathsBetween(from, to, fsm);
	}
	return map;
}

//http://code.activestate.com/recipes/576675/
Automaton.prototype.findPathsBetween = function(from, to, fsm){
	var lastNode, queue = [], result = [], toNodes, node, newPath;
	var path = [from];
	queue.push(path);

	while(queue.length > 0){
		path = queue.shift();

		lastNode = path[path.length-1];

		if(lastNode === to) {
			result.push(path.slice());
		}
		
		toNodes = [];
		for(var key in fsm.graph[lastNode]){
			toNodes.push.apply(toNodes, flatten([fsm.graph[lastNode][key]]));
		}
		toNodes = toNodes.getUnique();
		for(var i = 0; i < toNodes.length; i++){
			node = toNodes[i];
			if(!contains(path,node)){
				newPath = path.slice();
				newPath.push(node);
				queue.push(newPath);
			}
		}

	}	
	return result;
}

Automaton.prototype.inNegationPath = function(triple, negatedPath){
	var cur, next;
	for(var i = 0; i < negatedPath.length - 1; i++){
		cur = negatedPath[i];
		next= negatedPath[i+1];
		if(triple.from._id === cur && triple.target._id === next) return true;
	}
	return false;
}




