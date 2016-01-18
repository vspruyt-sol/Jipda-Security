function FiniteStateMachine(acceptStates, graph){
	this.acceptStates = acceptStates;
	this.graph = graph;
}

FiniteStateMachine.prototype.getNodeCount = function(){
	//TODO
	return 1;
}

FiniteStateMachine.prototype.impAttachGraph = function(){
	//TODO
}

FiniteStateMachine.prototype.deleteEdge = function(from, edge, to){
	//TODO
}

/**
 * MACHINES
 */

var CAT_MACHINE = function(label){
 	var obj = {};
 	obj[label] = [1];
 	return new FiniteStateMachine(	{ 1 : 'end' },
 									{ 0 : obj }	
 								 );
}

var ALT_MACHINE = function(){
 	return new FiniteStateMachine(	{ 5 : 'end' },
 									{ 
 										0 : { 'lambda' : [1,3] },
 										1 : { 0		   : [2]   }, //PENDING
 										2 : { 'lambda' : [5]   },
 										3 : { 0        : [4]   }, //PENDING
 										4 : { 'lambda' : [5]   }
 									}	
 								 );
}

var KLEENE_MACHINE = function(){
 	return new FiniteStateMachine(	{ 3 : 'end' },
 									{ 
 										0 : { 'lambda' : [1,3] },
 										1 : { 0		   : [2]   }, //PENDING
 										2 : { 'lambda' : [1,3] }
 									}	
 								 );
}

var PLUS_MACHINE = function(){
 	return new FiniteStateMachine(	{ 3 : 'end' },
 									{ 
 										0 : { 'lambda' : [1] },
 										1 : { 0		   : [2]   }, //PENDING
 										2 : { 'lambda' : [1,3] }
 									}	
 								 );
}