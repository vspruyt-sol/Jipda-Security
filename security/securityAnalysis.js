function SecurityAnalysis(codeSrc, regexSrc){
	//Jipda part
	this.states = [];
	this.transitions = [];
	this.codeSrc = codeSrc;
	//Query part
	this.tripleStore = [];
	//Regular path expressions part
	this.regexSrc = regexSrc;
	this.nfa = false;
	this.dfa = false;
}

SecurityAnalysis.prototype.initialize = function(){
	//Jipda
	var ast = Ast.createAst(this.codeSrc, {loc:true});
    var cesk = createCesk(ast);
    var system = cesk.explore(ast);
    this.generateStates(system.initial);
    this.graphToTriples(system);

    console.log(this.states);

    //regex
    try {
		var rpe = eval('var rpe = new RegularPathExpression(); rpe.' + this.regexSrc);
		//console.log(rpe);
		this.nfa = rpe.toNFA();
		this.dfa = rpe.toDFA();
		console.log(this.dfa);
		output.innerHTML = '';
	}
	catch(err) {
		this.nfa = false;
		this.dfa = false;
	    output.innerHTML = err;
	}
}

//TEST GRAPHS
SecurityAnalysis.prototype.detect = function(){
	/*
	 * G = States van JIPDA graph
	 * P = Pattern (RPE)
	 * F = Final states
	 * v0 = initial state van G
	 * s0 = initial state van P
	 */
	var eq = new ExistentialQuery(this.tripleStore, this.dfa.triples, this.dfa.acceptStates, this.tripleStore[0].from, this.dfa.startingNode);
	//var eq = new ExistentialQuery(this.tripleStore, test1, [new DummyNode(4)], this.tripleStore[0].from, new DummyNode(0));
	
	console.log(this.processQueryResult(eq.runNaive()));
	
}

SecurityAnalysis.prototype.processQueryResult = function(queryResult){
	var processed = [];
	//1. Strip empty substitutions?
	for(var i = 0; i < queryResult.length; i++){
		if(queryResult[i].theta.length > 0) {
			processed.push(queryResult[i]);
		}
	}


	this.markQueryResult(processed, 'violation');

	return processed;
}

//GRAPHICS
SecurityAnalysis.prototype.markQueryResult = function(results, marker){
	//var ids = _fromStateIds(triples);
	var ids = results.map(function(x){ return x.v._id; });
	var info;
	for(var i = 0; i < ids.length; i++){
			info = this.states[ids[i]].marker ? this.states[ids[i]].marker.info + ' | '+ objToString(results[i].theta) : objToString(results[i].theta);
			this.states[ids[i]].marker = {
										'className'	: marker,
										'info'		: info
									 };
	}
}

function createCesk(ast){
	return jsCesk({a:createTagAg(), l:new JipdaLattice()});
}

//SETTING UP DATA
SecurityAnalysis.prototype.graphToTriples = function(g){
	//initialization
	this.tripleStore = [];
	var doneList = [];
	var t;

	//initial node only has 1 successor
	this.tripleStore.push(new GraphTriple(
			new DummyNode(g.initial._id), 
			g.initial,
			new DummyNode(g.initial._successors[0].state._id), true)
	);

	for(var j = 0; j < this.tripleStore.length; j++){
		
		var triple = this.tripleStore[j];
		//if we already treated the triple, don't do it again
		if(containsTriple(doneList,triple)){
			continue;
		}

		//avoid infinite loops
		doneList.push(triple);		

		var state = triple.edge;
		
		
		for (var k = 0; k < state._successors.length; k++){
			var tState = state._successors[k].state;
			if(tState._successors.length > 0){ 
				for (var h = 0; h < tState._successors.length; h++){
					t = new GraphTriple(
							new DummyNode(tState._id), 
							tState,
							new DummyNode(tState._successors[h].state._id)
						);
					if(!containsTriple(this.tripleStore,t)){
						this.tripleStore.push(t);
					}
				}
			}				
		}		
	}
	return this.tripleStore;
}

SecurityAnalysis.prototype.generateStates = function(initial){
	this.states = [];
	this.transitions = [];
	var todo = [initial];
	while (todo.length > 0){
		var s = todo.pop();
		this.states[s._id] = s;
		s._successors.forEach(function (t){
			if (isFinite(t._id))
			{
			  return;
			}
			t._id = this.transitions.push(t) - 1;
			todo.push(t.state);
		}, this);  
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

function objToString(obj){
	var str = '&nbsp;&nbsp;&nbsp;&nbsp;';
	for(var i = 0; i < obj.length; i++){
		for(var key in obj[i]){
			str += '<b class="resultKey">' + key + '</b>' + ': ' + obj[i][key] + '&nbsp;&nbsp;&nbsp;&nbsp;'; 
		}
	}
	
	return str;
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
	addSuccessors(this.states[id]);
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
		for(var i = 0; i < this.tripleStore.length; i++){
			if(this.tripleStore[i].final) continue;
			if(this.tripleStore[i].target._id === id) pred.push(this.tripleStore[i].from._id);
		}
		return pred;
	}

	return pred;
}


//Navigation example
function findNodesExample(){
	//DEFINE SPECIFIC NODES
	var variableDeclarations = findNodes(this.states, function(x){
		return 	(x.node
				&& x.node.type === 'VariableDeclaration');
	});

	var variableDeclarationsNoValues = findNodes(this.states, function(x){
		return 	(x.node
				&& x.node.type === 'VariableDeclaration'
				&& !x.node.declarations[0].init);
	});

	var variableDeclarationsAlias = findNodes(this.states, function(x){
		return 	(x.node && x.node.declarations && x.node.declarations[0].init
				&& x.node.type === 'VariableDeclaration'
				&& x.node.declarations[0].init.type === 'Identifier'
				);
	});

	var functionCalls = findNodes(this.states, function(x){
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
}
