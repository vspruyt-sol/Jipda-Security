var states, transitions, tripleStore;

function securityAnalysis(src){
	var ast = Ast.createAst(src, {loc:true});
    var cesk = createCesk(ast);
    var system = cesk.explore(ast);
    generateStates(system.initial);
    //for backward nodes
    graphToTriples(system);

	//DEFINE SPECIFIC NODES
	var variableDeclarations = findNodes(states, function(x){
		return 	(x.node
				&& x.node.type === 'VariableDeclaration');
	});

	var variableDeclarationsNoValues = findNodes(states, function(x){
		return 	(x.node
				&& x.node.type === 'VariableDeclaration'
				&& !x.node.declarations[0].init);
	});

	var variableDeclarationsAlias = findNodes(states, function(x){
		return 	(x.node && x.node.declarations && x.node.declarations[0].init
				&& x.node.type === 'VariableDeclaration'
				&& x.node.declarations[0].init.type === 'Identifier'
				);
	});

	var functionCalls = findNodes(states, function(x){
		return 	(x.node
			&&  ((x.node.type === 'CallExpression')
				||	(x.node.type === 'ExpressionStatement' && x.node.expression.type === 'CallExpression')
				||	(x.node.type === 'BlockStatement' && x.node.body.length === 1 
													  && x.node.body[0].type === 'ExpressionStatement' 
													  && x.node.body[0].expression.type === 'CallExpression' )));
	});
	//END SPECIFIC NODES

    //mark with css classes	
	//var fws = followingNodes(variableDeclarations[2], system.initial);
	//var prev = previousNodes(variableDeclarations[2]);
	//var next = nextNodes(variableDeclarations[3]);
	//_markStates(functionCalls, 'fCall'); 
	//_markStates(variableDeclarationsAlias, 'vDecl');
	//_markStates(prev, 'violation');
	var d1 = dummyGraph();
	var d2 = dummyLeak();
	var eq = new ExistentialQuery(d1, d2, [d2[1].target], d1[2].from, d2[0].from);

	return states;
}

//GRAPHICS
function _markStates(ids, marker){
	//var ids = _fromStateIds(triples);
	for(var i = 0; i < states.length; i++){
		if(ids.indexOf(states[i]._id) > -1) states[i].marker = marker;
	}
}

function createCesk(ast){
	return jsCesk({a:createTagAg(), l:new JipdaLattice()});
}

//SETTING UP DATA

function dummyGraph(){
	// 1 -> assignFunc(a) -> 2
	// 2 -> fCall(a) -> 3
	// Should be 1 -> assignFunc('a') -> x, x -> wildcard('*') -> x1, x1 -> fCall(['a']) -> y
	return [
	new GraphTriple(new DummyNode(1), 
						new EdgeLabel('dummy', 		{}), 
						new DummyNode(2)),
		new GraphTriple(new DummyNode(2), 
						new EdgeLabel('dummy', 		{}), 
						new DummyNode(3)),
		new GraphTriple(new DummyNode(3), 
						new EdgeLabel('ExpressionStatement',	{
																	expression: {
																		type: 'AssignExpression',
																		left: {
																			name: 'a'
																		}
																	}
																}), 
						new DummyNode(4)),
		new GraphTriple(new DummyNode(4), 
						new EdgeLabel('CallExpression', 		{
																	arguments: [{
																		type: 'Literal',
																		name: 'a'
																	}],
																	callee: {name: 'sink'}
																}), 
						new DummyNode(5)),
		new GraphTriple(new DummyNode(4), //simulate branching
						new EdgeLabel('CallExpression', 		{
																	arguments: [{
																		type: 'Literal',
																		name: 'a'
																	}],
																	callee: {name: 'sink2'}
																}), 
						new DummyNode(6)),
	];
}

function dummyLeak(){
	// 1 -> assignFunc(a) -> 2
	// 2 -> fCall(a) -> 3
	// Should be 1 -> assignFunc('a') -> x, x -> wildcard('*') -> x1, x1 -> fCall(['a']) -> y
	return [
		new GraphTriple(new DummyNode(1), 
						new EdgeLabel('assign', {leftName: 'x'}), 
						new DummyNode(2)),
		new GraphTriple(new DummyNode(2), 
						new EdgeLabel('fCall', 	{argument: 'x', callee: 'callee'}), 
						new DummyNode(3))
	];
}

function graphToTriples(g){
	//initialization
	tripleStore = [];
	var doneList = [];

	for (var i = 0; i < g.initial._successors.length; i++){
		
		tripleStore.push(new GraphTriple(g.initial, g.initial.node.edgelabel, g.initial._successors[i].state, true));
	}

	for(var j = 0; j < tripleStore.length; j++){
		
		var triple = tripleStore[j];
		//if we already treated the triple, don't do it again
		if(containsTriple(doneList,triple)){
			continue;
		}

		//avoid infinite loops
		doneList.push(triple);		

		var state = triple.target;
		if(state){
			if(state._successors.length > 0){	
				for (var k = 0; k < state._successors.length; k++){
					var t = new GraphTriple(state, (state.node ? state.node.edgelabel : false) , state._successors[k].state);
					if(!containsTriple(tripleStore,t)){
						tripleStore.push(t);
					}
				}
			}
			else {
				tripleStore.push(new GraphTriple(state, new EdgeLabel('ResultState'), false, false, true));
			}
		}	
		
	}
	return tripleStore;
}

function generateStates(initial){
	states = [];
	transitions = [];
	var todo = [initial];
	while (todo.length > 0){
		var s = todo.pop();
		states[s._id] = s;
		s._successors.forEach(function (t){
			if (isFinite(t._id))
			{
			  return;
			}
			t._id = transitions.push(t) - 1;
			todo.push(t.state);
		});  
	}
}


//UTILITIES

function containsTriple(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i].equals(obj)) {
            return true;
        }
    }
    return false;
}



//NAVIGATION

function findNodes(g, check){
	var result = g.map(function(x){
		if(check(x)){
			return x._id;
		}
		return false;
	});
	return result.filter(Boolean);
}

function nextNodes(id){
	var next = [id];
	addSuccessors(states[id]);
	function addSuccessors(state){
		var succs = state._successors || [];
		//foreach successor add its successors
		for(var i = 0; i < succs.length; i++){
			if(next.indexOf(succs[i].state._id) < 0) next.push(succs[i].state._id);
			addSuccessors(succs[i].state);
		}
	}
	return next;
}

function previousNodes(id){
	var pred = [id];
	addPredecessors(findPredecessors(id));

	function addPredecessors(ids){
		//foreach successor add its successors
		for(var i = 0; i < ids.length; i++){
			pred.push(ids[i]);
			addPredecessors(findPredecessors(ids[i]));
		}
	}

	function findPredecessors(id){
		var pred = [];
		for(var i = 0; i < tripleStore.length; i++){
			if(tripleStore[i].final) continue;
			if(tripleStore[i].target._id === id) pred.push(tripleStore[i].from._id);
		}
		return pred;
	}

	return pred;
}
