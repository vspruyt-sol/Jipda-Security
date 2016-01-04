/**
 * Globals
 */
//var PENDING = 0;

function ThompsonConstruction(regex){
	this.regex = new regex;
}

ThompsonConstruction.prototype.toNFA = function(){
	var fsm, offset, acc, machines;

	var orig = new FiniteStateMachine	(	{ 0 : ''},			//Accept states
											{ 0 : 	{ 			//Graph
														0 : [0] //PENDING : [0]
													}
											}
										) 

	machines = this.buildMachineStack(regex);
	machines = this.kleeneUp(machines);
    machines = this.catify(machines);
    machines = this.handleAlternation(machines);

    for(var i = 0; i < machines.length; i++){
    	fsm = machines[i][0];					//Tuple, 0 = fsm, 1 = edges that need to be filled in by cannibalizing an adjacent NFA
    	offset = orig.getNodeCount - 1;
    	acc = keyAt(orig.acceptStates, 0) || 0;	//Attachment point

    	orig.impAttachGraph(acc, fsm);

		for(var prop in orig.acceptStates) {
		   	if(!m.acceptStates[prop - offset]){
		   		delete orig.acceptStates[prop]; //remove the property
		   	}
		}
    }

    orig.deleteEdge(0, 0, 0); // (0, PENDING, 0);

    return new FiniteStateMachine(orig.acceptStates, orig.graph);
}

ThompsonConstruction.prototype.buildMachineStack = function(regex){
	//TODO
}

ThompsonConstruction.prototype.kleeneUp = function(machines){
	//TODO
}

ThompsonConstruction.prototype.catify = function(machines){
	//TODO
}

ThompsonConstruction.prototype.handleAlternation = function(machines){
	//TODO
}

/**
 * HELPERS
 */

//BEWARE: USE ONLY IF OBJECT HAS PROPERTIES THAT ONLY YOU HAVE DEFINED 
//E.g. var x = {prop1: '1', prop2: '2'} would be fine.
function keyAt = function(obj, idx){
	return obj[Object.keys(obj)[idx]];
}