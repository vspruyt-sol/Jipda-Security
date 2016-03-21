function SubsetConstruction(){
}

SubsetConstruction.prototype.toDFA = function(nfa){
	var nfaGraph = nfa.graph;
	var newGraph = {};
	var newAcceptStates = {};
	var newLabels = {};
	var states = [nfa.closureOf(nfa.origin)]; //overal waar je met lambda aankan
	var edgeLabels = nfa.getEdgeLabels();
	var state, label, closuresThroughLabel, node, closure, tmp;

	for(var i = 0; i < states.length; i++){
		state = states[i];
		newGraph[state] = {};
		for(var j = 0; j < edgeLabels.length; j++){
			label = edgeLabels[j];
			if(label === 'lambda') continue;
			closuresThroughLabel = [];
			for(var k = 0; k < state.length; k++){
				node = state[k];
				if(nfaGraph[node] === undefined || nfaGraph[node][label] === undefined) continue;
				closure = nfa.closureOf(nfaGraph[node][label]);
				if(!Utilities.arrayContainsArray(closuresThroughLabel, closure)) closuresThroughLabel.push(closure);
			}

			if(closuresThroughLabel.length === 0) continue;
			closuresThroughLabel = flatten(closuresThroughLabel); //flatten closures
			newGraph[state][label] = closuresThroughLabel;
			if(!Utilities.arrayContainsArray(states, closuresThroughLabel)) states.push(closuresThroughLabel);
		}

		tmp = nfa.acceptStateOfClosure(state);
		if(tmp) newAcceptStates[state] = nfa.acceptStateOfClosure(state);
		if(_.keys(newGraph[state]).length === 0) delete newGraph[state];
	}

	return this.cleanUpStates(new FiniteStateMachine(newAcceptStates,newGraph, nfa.origin, 'DFA', nfa.negatedPairs));
}

SubsetConstruction.prototype.cleanUpStates = function(nfa){
	var newGraph = {};
	var newAcceptStates = {};
	var tmp = {};
	var count = -1;
	var subGraph, toNode, newKey, label, pairL, pairR, tmpVal, tmpVal2, tmpL, tmpR, newOrigin = 0;
	var newNegatedPairs = [];

	//Number closures
	for(var key in nfa.graph){
		subGraph = nfa.graph[key];
		if(tmp[key] === undefined) tmp[key] = ++count; //todo check correct increment
		for(var edge in subGraph){
			toNode = subGraph[edge];
			if(tmp[toNode] === undefined) tmp[toNode] = ++count;			
		}
	}

	//Map old pairs to new ones
	for(var i = 0; i < nfa.negatedPairs.length; i++){
		pairL = nfa.negatedPairs[i][0];
		pairR = nfa.negatedPairs[i][1][0];
		for(var key in tmp){
			tmpVal = tmp[key];
			if(contains(nodeRepToArray(key), pairL)) {
				tmpL = tmpVal;
				for(var key2 in tmp){
					tmpVal2 = tmp[key2];
					if(contains(nodeRepToArray(key2), pairR)) {
						
						tmpR = tmpVal2;
						newNegatedPairs.push([tmpL, [tmpR]]);
					}
				}
			}
		}
	}

	//Replace closures with their new node numbers
	for(var key in nfa.graph){
		newKey = tmp[key];
		newGraph[newKey] = {};
		for(var edge in nfa.graph[key]){
			toNode = nfa.graph[key][edge];
			newGraph[newKey][edge] = tmp[toNode];
		}
	}

	//Fill in accept states
	for(var key in nfa.acceptStates){
		label = nfa.acceptStates[key];
		newAcceptStates[tmp[key]] = label;
	}

	//origin
	for(var key in tmp){
		if(contains(nodeRepToArray(key), nfa.origin)) {
			newOrigin = tmp[key];
		}
	}

	//Return the cleaned up fsm
	return new FiniteStateMachine(newAcceptStates, newGraph, newOrigin, nfa.tpe, newNegatedPairs);
}

var nodeRepToArray = function(rep){
	if(rep.split(',').length > 1){
		//console.log(rep.split(',').map(function(x){return parseInt(x);}));
		return rep.split(',').map(function(x){return parseInt(x);});
	}
	return [parseInt(rep)];
}
