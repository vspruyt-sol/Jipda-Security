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
	var subgraph, toNodes, label, map;

	//Negated pairs
	this.negatedPairs = fsm.negatedPairs;

	//Test negation pairs
	map = this.buildNegationPaths(fsm);
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
}

Automaton.prototype.buildNegationPaths = function(fsm){
	var from, to, map = {};
	for(var i = 0; i < this.negatedPairs.length; i++){
		from = this.negatedPairs[i][0];
		to = fsm.negatedPairs[i][1][0];
		map[[from, to]] = this.findPathsBetween(from, to, fsm);
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
/*
def BFS(graph,start,end,q):
	
	temp_path = [start]
	
	q.enqueue(temp_path)
	
	while q.IsEmpty() == False:
		tmp_path = q.dequeue()
		last_node = tmp_path[len(tmp_path)-1]
		print tmp_path
		if last_node == end:
			print "VALID_PATH : ",tmp_path
		for link_node in graph[last_node]:
			if link_node not in tmp_path:
				new_path = []
				new_path = tmp_path + [link_node]
				q.enqueue(new_path)
*/





