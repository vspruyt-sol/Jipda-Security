/**
 * Globals
 */
//var PENDING = 0;

function ThompsonConstruction(){
}

ThompsonConstruction.prototype.toNFA = function(regex){
	var m, offset, acc, machines;

	var orig = new FiniteStateMachine	(	{ 0 : 'eh'},			//Accept states
											{ 0 : 	{ 			//Graph
														0 : [0] //PENDING : [0]
													}
											}, 0, 'Initial'
										) 

	machines = this.buildMachineStack(regex);
	console.log(machines);
	machines = this.kleeneUp(machines);

	/*
  	machines = this.catify(machines);
  	machines = this.handleAlternation(machines);

  	for(var i = 0; i < machines.length; i++){
	    m = machines[i][0];					//Tuple, 0 = fsm, 1 = edges that need to be filled in by cannibalizing an adjacent NFA
	  	offset = orig.getNodeCount - 1;
	  	acc = keyAt(orig.acceptStates, 0) || 0;	//Attachment point

	  	orig.attachGraph(acc, m);

	  	for(var prop in orig.acceptStates) {
	  	   	if(!m.acceptStates[prop - offset]){
	  	   		delete orig.acceptStates[prop]; //remove the property
	  	   	}
	  	}
  	}

  orig.deleteEdge(0, 0, 0); // (0, PENDING, 0);

  return new FiniteStateMachine(orig.acceptStates, orig.graph, 0, 'Final');*/
}

ThompsonConstruction.prototype.buildMachineStack = function(regex){
	//Regex is an array of RegexPart's
	var skip = 0;
    var machines = [];
    var regexPart, nextChar, succRegexPart, nextSuccChar, subExpression, nestingDepth, subGraph, ctr;
    for(var i = 0; i < regex.length; i++){
    	if(skip > 0){ //Advance pointer until past parentheses
    		skip-=1;
    		continue; //Next iteration
    	}
    	regexPart = regex[i];
    	nextChar = regexPart.symbol;


    	//TODO: Nextchar is negation (e.g. -a)
    	switch(nextChar){
    		case '*': machines.push([KLEENE_MACHINE(), 	[1,2]]); 		break;
    		case '+': machines.push([PLUS_MACHINE(), 	[1,2]]); 		break;
			case '|': machines.push([ALT_MACHINE(), 	[1,2,3,4]]);	break;
    		case ')': throw 'closed paren before opening it.'
			case '(': subExpression = [];
					  nestingDepth = 0;
					  ctr = i + 1;
					  succRegexPart = regex[ctr];
					  nextSuccChar = succRegexPart.symbol;
					  while(!(nextSuccChar === ')' && nestingDepth === 0)){
				  		if(nextSuccChar === ')') nestingDepth -= 1;
					  	if(nextSuccChar === '(') nestingDepth += 1;					  		
					  	subExpression.push(succRegexPart); //negation?
						ctr += 1;
					  	succRegexPart = regex[ctr];
					  	nextSuccChar = succRegexPart.symbol;
					  }
					  //console.log(subExpression);
					  console.log('start subgraph');
					  subGraph = this.toNFA(subExpression);
					  console.log(subGraph);
					  console.log('end subgraph');
					  skip = subExpression.length + 1;
					  machines.push([subGraph, null]);
  				  	  break;
			  //case '¬': succRegexPart = regex[++i]; //Negation
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
		if(curMachine[1] === null || curMachine[1].length === 0){ //Complete machines
			newMachines.push([curMachine[0], null]);
			console.log('I AM COMPLETE');
		}
		else{
			if(curMachine[1].length === 2){ //precedence of * and +
				console.log('I am star or plus')
				from = curMachine[1].shift();
				to = curMachine[1].shift();
				replaced = curMachine[0].replaceEdge(from, 0, to, newMachines.pop()[0]); //PENDING
				newMachines.push([replaced, curMachine[1]]);
			}
			else{ // dealing with |
				console.log('OR? something else?');
				newMachines.push([curMachine[0],curMachine[1]])
			}
		}
	}
	console.log(newMachines);
	console.log('Werkt ut kleene ding?'); //IK DENK UT WEL
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
    	fsm.attachGraph(acc, curMachine[0]);
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
	machines = this.absorbLeftAlternation(machines);
    return this.absorbRightAlternation(machines);
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
			replaced = curMachine[0].replaceEdge(from, 0, to, newMachines.pop()[0]); //PENDING
			newMachines.push([replaced, curMachine[1]]);
		}
	}

    return newMachines;
}

ThompsonConstruction.prototype.absorbRightAlternation = function(machines){
	return this.absorbLeftAlternation(machines.reverse()).reverse()
}

/**
 * HELPERS
 */

//BEWARE: USE ONLY IF OBJECT HAS PROPERTIES THAT ONLY YOU HAVE DEFINED 
//E.g. var x = {prop1: '1', prop2: '2'} would be fine.
var keyAt = function(obj, idx){
	return obj[Object.keys(obj)[idx]];
}