function ThompsonConstruction(){
}

ThompsonConstruction.prototype.toNFA = function(regex){
	var m, offset, acc, machines, curMachine;

	var orig = new FiniteStateMachine	(	{ 0 : 'eh'},		//Accept states
											{ 0 : 	{ 			//Graph
														0 : [0] //PENDING : [0]
													}
											}, 0, 'Initial'
										) 

	machines = this.buildMachineStack(regex);  	
	machines = this.kleeneUp(machines); //Deze herpt om een (.|.) te absorben in een kleene 
	//console.log(JSON.stringify(machines));
  	machines = this.catify(machines);
  	machines = this.handleAlternation(machines);

  	for(var i = 0; i < machines.length; i++){
  		curMachine = machines[i];
	    m = curMachine[0];						
	    offset = orig.getNodeCount() - 1;
	  	acc = Utilities.keyAt(orig.acceptStates, 0) || 0;	//Attachment point

	  	orig.attachGraph(acc, m);

	  	for(var prop in orig.acceptStates) {
	  	   	if(m.acceptStates[parseInt(prop) - offset] === undefined){;
	  	   		delete orig.acceptStates[prop]; //remove the property
	  	   	}
	  	}
  	}

  	orig.deleteEdge(0, 0, 0); // (0, PENDING, 0);

 	return new FiniteStateMachine(orig.acceptStates, orig.graph, 0, 'Final');
}

ThompsonConstruction.prototype.buildMachineStack = function(regex){
	//Regex is an array of RegexPart's
	var skip = 0;
    var machines = [];
    var negated = false;
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
    		case ')': throw 'Closed paren before opening it.'
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
					  skip = subExpression.length + 1;
					  if(negated){
					  	subExpression = modifyForNegation(subExpression);
					  	if(!subExpression) throw 'Incorrect usage of negation. Correct usage: ¬a or ¬(a|b). These terms can be wrapped in multiple braces.'
						negated = false;
					  }
					  subGraph = this.toNFA(subExpression);
					  machines.push([subGraph, null]);
					  break;
			case '¬': negated = true;
			  		  break;
    		default:  if(negated){
    				  	machines.push([CAT_MACHINE('¬' + nextChar), null]);
    				  	negated = false;
    				  }
    				  else{
    				  	machines.push([CAT_MACHINE(nextChar), null]);
    				  }
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
		if(curMachine[1] == null || curMachine[1].length === 0){ //Complete machines
			newMachines.push([curMachine[0], null]);
		}
		else{
			if(curMachine[1].length === 2){ //precedence of * and +
				from = curMachine[1].shift();
				to = curMachine[1].shift();
				replaced = curMachine[0].replaceEdge(from, 0, to, newMachines.pop()[0], true); //PENDING
				newMachines.push([replaced, curMachine[1]]);
			}
			else{ // dealing with |
				//console.log('ALTERNATION IN KLEENEUP');
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
	    else if(curMachine[1] == null && machines[i-1][1] == null){
	    	fsm = newMachines.pop()[0];
	    	offset = fsm.getNodeCount() - 1;
	    	acc = Utilities.keyAt(fsm.acceptStates, 0) || 0;	//Attachment point
	    	fsm.attachGraph(acc, curMachine[0]);
	    	for(var prop in fsm.acceptStates) {
		  	   	if(curMachine[0].acceptStates[parseInt(prop) - offset] === undefined){
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
	machines = this.absorbRightAlternation(machines);
    return machines;
}

ThompsonConstruction.prototype.absorbLeftAlternation = function(machines){ //CONTAINS A BUG (I think)
	var newMachines = [];
	var curMachine, from, to, replaced;
	for(var i = 0; i < machines.length; i++){
		curMachine = machines[i];
		if(curMachine[1] == null || curMachine[1].length === 0){ //No more edges to be replaced/edited
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
 * Negation
 */

 //UGLY CODE ALERT
var modifyForNegation = function(expression){
	var negation = new RegexPart('not', undefined, '¬');
	var foundOr = false;
	var left = [];
	var right = [];
	var stripped = stripBraces(expression);

	//something like ¬((((a))))
	if (stripped.length === 1) return [negation, stripped[0]];

	//something like ¬((((((a)|(b)))))
	for(var i = 0; i < expression.length; i++){
		if(expression[i].symbol === '|') {
			foundOr = expression[i]; 
			continue;
		}
		if(foundOr){
			right.push(expression[i]);
		}
		else{
			left.push(expression[i]);
		}
	}

	//Found 'or', see of it is a valid negation
	if (foundOr && left.length > 0 && right.length > 0){
		left = stripBraces(left);
		right = stripBraces(right);
		//insert negation in front
		left.unshift(negation);
		left.push(foundOr);
		left.push(negation);
		left.push.apply(left, right);
		return left.length === 5 ? left : false;
	}
	//Not an allowed negation
	return false;

}

var stripBraces = function(expression){
	if(expression.length < 2) return expression;
	if(expression[0].symbol === '(' && expression[expression.length - 1].symbol === ')'){
		return stripBraces(expression.slice(1,-1));
	}
	return expression;
}

