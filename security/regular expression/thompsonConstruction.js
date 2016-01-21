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

//TODO: Clean up escaped chars
ThompsonConstruction.prototype.buildMachineStack = function(regex){
	//Regex is an array of RegexPart's
	var skip = 0;
    //var escaped = false;
    var machines = [];
    var regexPart, nextChar, succRegexPart, nextSuccChar, subExpression, nestingDepth, subGraph, charClass;
    for(var i = 0; i < regex.length; i++){
    	if(skip > 0){ //Advance pointer until past () group
    		skip--;
    		continue; //Next iteration
    	}
    	regexPart = regex[i];
    	nextChar = regexPart.symbol; //TODO SYMBOL TABLE
    	//if(escaped){
    	//	switch(nextChar){
    	//		case 'n': machines.push([CAT_MACHINE("\n"),     null]); break;
    	//		default : machines.push([CAT_MACHINE(nextChar), null]); break;
    	//	}
    	//	escaped = false; 
    	//	continue; //Next iteration
    	//}

    	switch(nextChar){
    		case '*': machines.push([KLEENE_MACHINE(), 	[1,2]]); 		break;
    		case '+': machines.push([PLUS_MACHINE(), 	[1,2]]); 		break;
			case '|': machines.push([ALT_MACHINE(), 	[1,2,3,4]]);	break;
    		
    		case ')': throw 'Closed paren before opening it.'
			case '(': subExpression = [];
					  nestingDepth = 0;
					  succRegexPart = regex[++i]; //Pointer incremented correctly?
					  nextSuccChar = succRegexPart.symbol;
					  while(nextSuccChar !== ')' && nestingDepth !== 0){
					  	if(nextSuccChar === ')') nestingDepth -= 1;
					  	if(nextSuccChar === '(') nestingDepth += 1;
					  	subExpression.push(succRegexPart);
					  }
					  subGraph = toNFA(subExpression);
					  skip = subExpression.length + 1;
					  machines.push([subGraph, null]);
    				  break;
    		//THESE COULD BE ADDED TO SUPPORT CHARACTER CLASSES.
    		//case ']': throw 'Closed bracket before opening it.'
    		//case '[': charClass = getCharClass(); //ARGUMENT is range: regex[ii..-1] (SYMBOL, tot aan 0 dus)
        	//		  machines.push([CAT_MACHINE(charClass), nil])
        	//		  skip = charClassss.length - 1 + charClass.match(\\).length //Compensate for 2 backslashes counting as 1
    		//case '\\':break; //TODO: do some escaping logic, not needed here.
    		default:  machines.push([CAT_MACHINE(nextChar), null]);
    				  break;
    	}

    }
    return machines;
}

ThompsonConstruction.prototype.kleeneUp = function(machines){
	//TODO
}

ThompsonConstruction.prototype.catify = function(machines){
	//TODO
}

ThompsonConstruction.prototype.handleAlternation = function(machines){
	machines = absorbLeftAlternation(machines);
    return absorbRightAlternation(machines);
}

ThompsonConstruction.prototype.absorbLeftAlternation = function(machines){
	//TODO
}

ThompsonConstruction.prototype.absorbRightAlternation = function(machines){
	//TODO
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