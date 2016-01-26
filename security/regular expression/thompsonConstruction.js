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
	//Regex is an array of RegexPart's
	var skip = 0;
    var machines = [];
    var regexPart, nextChar, succRegexPart, nextSuccChar, subExpression, nestingDepth, subGraph;
    for(var i = 0; i < regex.length; i++){
    	if(skip > 0){ //Advance pointer until past parentheses
    		skip--;
    		continue; //Next iteration
    	}
    	regexPart = regex[i];
    	nextChar = regexPart.symbol; //TODO SYMBOL TABLE


    	console.log("nextChar: " + nextChar);
    	console.log("machines: " + machines);

    	//TODO: Nextchar is negation (e.g. -a)
    	switch(nextChar){
    		case '*': machines.push([KLEENE_MACHINE(), 	[1,2]]); 			break;
    		case '+': machines.push([PLUS_MACHINE(), 		[1,2]]); 			break;
				case '|': machines.push([ALT_MACHINE(), 		[1,2,3,4]]);	break;
    		case ')': throw 'Closed paren before opening it.'
				case '(': subExpression = [];
								  nestingDepth = 0;
								  succRegexPart = regex[++i]; //Pointer incremented correctly?
								  nextSuccChar = succRegexPart.symbol;
								  while(nextSuccChar !== ')' && nestingDepth !== 0){
								  	if(nextSuccChar === ')') nestingDepth -= 1;
								  	if(nextSuccChar === '(') nestingDepth += 1;					  		
								  	subExpression.push(succRegexPart); //negation?
								  	succRegexPart = regex[++i]; //Check if correct + possibly shorter
								  	nextSuccChar = succRegexPart.symbol;
								  }
								  subGraph = toNFA(subExpression);
								  skip = subExpression.length + 1;
								  machines.push([subGraph, null]);
			  				  break;
			  //case '-': succRegexPart = regex[++i]; //Negation
				//				  nextSuccChar = succRegexPart.symbol;
				//			  	skip = 1; //moet dit?
				//				  machines.push([CAT_MACHINE('-' + nextSuccChar), null]);
    		//		  		break;
    		default:  machines.push([CAT_MACHINE(nextChar), null]);
    				  		break;
    	}

    }
    return machines;
}

ThompsonConstruction.prototype.kleeneUp = function(machines){
	var newMachines = [];
	var curMachine, from, to, replaced;
	for(var i = 0; i < machines.length; i++){
		curMachine = machines[i];
		if(curMachine[1] === null || curMachine[1].lenght === 0){ //No more edges to be replaced/edited
			newMachines.push([curMachine[0], null]);
		}
		else{
			if(curMachine[1].length === 2){ //precedence of * and +
				from = curMachine[1].shift();
				to = curMachine[1].shift();
				replaced = curMachine[0].replaceEdge(from, 0, to, newMachines.pop()); //PENDING
				newMachines.push([replaced, curMachine[1]]);
			}
			else{ // dealing with |
				newMachines.push([curMachine[0],curMachine[1]])
			}
		}
	}

	return newMachines;
}

ThompsonConstruction.prototype.catify = function(machines){
	var newMachines = [];
	var curMachine, fsm, offset, acc;
	for(var i = 0; i < machines.length; i++){
		curMachine = machines[i];
    if(i === 0){
    	newMachines.push([curMachine[0], null]);
    }
    else if(curMachine[1] === null || machines[i-1][1] === 0){
    	fsm = newMachines.pop()[0];
    	offset = fsm.getNodeCount() - 1;
    	acc = keyAt(fsm.acceptStates, 0) || 0;	//Attachment point
    	fsm.impAttachGraph(acc, curMachine[0]);
    	for(var prop in fsm.acceptStates) {
  	   	if(!curMachine[0].acceptStates[prop - offset]){
  	   		delete fsm.acceptStates[prop]; //remove the property
  	   	}
  		}
  		newMachines.push([fsm, null]);
    }
    else{
    	newMachines.push([curMachine[0], curMachine[1]]);
    }
  }

  return newMachines;
}

ThompsonConstruction.prototype.handleAlternation = function(machines){
	machines = absorbLeftAlternation(machines);
    return absorbRightAlternation(machines);
}

ThompsonConstruction.prototype.absorbLeftAlternation = function(machines){
	var newMachines = [];
	var curMachine, from, to, replaced;
	for(var i = 0; i < machines.length; i++){
		curMachine = machines[i];
		if(curMachine[1] === null || curMachine[1].lenght === 0){ //No more edges to be replaced/edited
			newMachines.push([curMachine[0], null]);
		}
		else{
			from = curMachine[1].shift();
			to = curMachine[1].shift();
			replaced = curMachine[0].replaceEdge(from, 0, to, newMachines.pop()); //PENDING
			newMachines.push([replaced, curMachine[1]]);
		}
	}

    return newMachines;
}

ThompsonConstruction.prototype.absorbRightAlternation = function(machines){
	return absorbLeftAlternation(machines.reverse()).reverse()
}

/**
 * HELPERS
 */

//BEWARE: USE ONLY IF OBJECT HAS PROPERTIES THAT ONLY YOU HAVE DEFINED 
//E.g. var x = {prop1: '1', prop2: '2'} would be fine.
var keyAt = function(obj, idx){
	return obj[Object.keys(obj)[idx]];
}

var clone = function(obj){
	return JSON.parse(JSON.stringify(obj));
} 