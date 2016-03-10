/**
 * EXTRACT INFO FROM JIPDA
 */

function JipdaInfo(){
}

//here for backwards supportability
JipdaInfo.lookup = function(exp, el){
	//if we lookup something that isn't a node
	if(!el && exp && !exp.type) return false;

	var nodeInfo = {};
	var kontInfo = {};

	var kont = el ? el.kont : false;
	if(exp && exp.type) nodeInfo = LOOKUP_INFO[exp.type](exp);
	if(kont){
		if(kont.ex) kontInfo.ex = LOOKUP_INFO[kont.ex.type](kont.ex);
	} 

	return {
		nodeInfo : nodeInfo,
		kontInfo : kontInfo,
	}
}

JipdaInfo.getInfo = function(exp){
	//if we lookup something that isn't a node
	if(!exp || (exp && !exp.type)) return exp;
	var nodeInfo = {};
	nodeInfo = LOOKUP_INFO[exp.type](exp);
	return nodeInfo;
}

JipdaInfo.assignmentExpression = function(exp){
	var l = JipdaInfo.getInfo(exp.left);
	var r = JipdaInfo.getInfo(exp.right);
	return {
		leftName	: l.name,
		left 		: l,
		operator	: exp.operator,
		rightName	: r.name,
		right 		: r,
		type 		: 'AssignmentExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.identifier = function(exp){
	return {
		name 	: exp.name,
		type 	: 'Identifier',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.literal = function(exp){
	return {
		name	: exp.raw,
		raw		: exp.raw,
		value	: exp.value,
		type 	: 'Literal',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.objectExpression = function(exp){
	var tmp = '{';
	var arr = [];
	//calculate name if nested
	for(var i = 0; i < exp.properties.length; i++){
		arr.push(properties[i]);
		tmp +=  JipdaInfo.getInfo(exp.properties[i]).name + ', ';
	}

	if (exp.properties.length > 0 )tmp = tmp.slice(0, -2);

	tmp += '}';

	return {
		name		: tmp,
		properties 	: arr,
		type 		: 'ObjectExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.arrayExpression = function(exp){
	var tmp = '[';
	//calculate name if nested
	for(var i = 0; i < exp.elements.length; i++){
		tmp += JipdaInfo.getInfo(exp.elements[i]).name + ', ';
	}

	if (exp.elements.length > 0) tmp = tmp.slice(0, -2);

	tmp += ']'

	return {
		name	: tmp,
		type 	: 'ArrayExpression',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.property = function(exp){
	var k = JipdaInfo.getInfo(exp.key);
	var v = JipdaInfo.getInfo(exp.value);
	return {
		name		: k.name + ' : '+ v.name,
		key 		: k,
		keyName		: k.name,
		value 		: v,
		valueName 	: v.name,
		kind		: exp.kind,
		type 		: 'Property',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.memberExpression = function(exp){
	var prop = [];
	var o = JipdaInfo.getInfo(exp.object);
	var p = JipdaInfo.getInfo(exp.property);
	
	if(o.properties) prop.push.apply(prop, o.properties);
	prop.push(p.name);

	//TODO VALUE?
	return {
		object	 	: o,
		objectName 	: o.name,
		propertyName: p.name,
		property 	: p,
		properties 	: prop,
		name 		: o.name + '['+ p.name + ']',
		type		: 'MemberExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.variableDeclaration = function(exp){
	var decl, decls = [];
	var tmp = '';
	//calculate name if nested
	for(var i = 0; i < exp.declarations.length; i++){
		decl = JipdaInfo.getInfo(exp.declarations[i]);
		tmp += decl.name + ', ';
		decls.push(decl);
	}

	tmp = tmp.slice(0, -2);

	return {
		name 		: tmp,
		declarations: decls,
		type 		: 'VariableDeclaration',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.variableDeclarator = function(exp){
	var i = JipdaInfo.getInfo(exp.id);
	var ini = JipdaInfo.getInfo(exp.init) || {name: 'not instantiated'};

	return {
		id 			: i,
		init 		: ini,
		left 		: i,
		right 		: ini,
		name 		: i.name + ' = ' + ini.name,
		operator 	: '=',
		isFunction 	: (exp.init && exp.init.type === 'FunctionExpression'),
		type		: 'VariableDeclarator',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.functionExpression = function(exp){
	var i = exp.id ? JipdaInfo.getInfo(exp.id) : { name : 'Lambda' };
	var body = JipdaInfo.getInfo(exp.body);
	var par = [];
	var def = [];

	for(var j = 0; j < exp.params.length; j++){
		par.push(JipdaInfo.getInfo(exp.params[j]));
	}

	for(var k = 0; k < exp.defaults.length; k++){
		def.push(JipdaInfo.getInfo(exp.defaults[k]));
	}

	return {
		//defaults en body!
		name 		: i.name,
		id 			: i,
		parameters 	: par,
		defaults 	: def,
		body 		: body,
		type		: 'FunctionExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.callExpression = function(exp){
	var c = JipdaInfo.getInfo(exp.callee);
	var tmp = c.name + '(';
	var arg, args = [];
	for(var i = 0; i < exp.arguments.length; i++){
		arg = exp.arguments[i];
		args.push(JipdaInfo.getInfo(arg));
		tmp += JipdaInfo.getInfo(arg).name + ', ';
	}

	if (exp.arguments.length > 0) tmp = tmp.slice(0, -2);
	tmp +=  ')';

	return {
		//name 		: tmp,
		name 		: c.name,
		arguments 	: args,
		callee 		: c,
		type		: 'CallExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.returnStatement = function(exp){
	var arg = JipdaInfo.getInfo(exp.argument);

	return {
		name 		: arg.name,
		argument 	: arg,
		type 		: 'ReturnStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.binaryExpression = function(exp){
	var l = JipdaInfo.getInfo(exp.left);
	var r = JipdaInfo.getInfo(exp.right);

	return {
		name 		: l.name + ' ' + exp.operator + ' ' + r.name,
		left 		: l,
		right 		: r,
		operator 	: exp.operator,
		type		: 'BinaryExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.expressionStatement = function(exp){
	var ex = JipdaInfo.getInfo(exp.expression);
	return {
		name 		: ex.name,
		expression	: ex,
		type		: 'ExpressionStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.blockStatement = function(exp){
	var elem, elems = [];
	//calculate name if nested
	for(var i = 0; i < exp.body.length; i++){
		elems.push(JipdaInfo.getInfo(exp.body[i]));
	}

	return {
		name 		: 'BlockStatement',
		body		: elems,
		type 		: 'BlockStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.breakStatement = function(exp){
	var lbl = JipdaInfo.getInfo(exp.label);

	return {
		name 		: lbl,
		label		: lbl,
		type		: 'BreakStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.catchClause = function(exp){
	var body = JipdaInfo.getInfo(exp.body);
	var par = JipdaInfo.getInfo(exp.param);

	return {
		name 	: body.name,
		body	: body,
		param 	: par,
		type	: 'CatchClause',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.conditionalExpression = function(exp){
	var test = JipdaInfo.getInfo(exp.test);
	var cons = JipdaInfo.getInfo(exp.consequent);
	var alt = JipdaInfo.getInfo(exp.alternate);

	return {
		name 		: '(' + test.name + ') ?'  + cons.name + ' : ' + alt.name,
		test		: test,
		consequent 	: cons,
		alternate 	: alt, 
		type		: 'ConditionalExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.doWhileStatement = function(exp){
	var test = JipdaInfo.getInfo(exp.test);
	var body = JipdaInfo.getInfo(exp.body);

	return {
		name 	: 'do {' + body.name + '} while ('  + test.name + ')',
		test	: test,
		body 	: body,
		type	: 'DoWhileStatement',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.emptyStatement = function(exp){
	return {
		name 	: 'Empty Statement',
		type	: 'EmptyStatement',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.forStatement = function(exp){
	var init = Jipdainfo.getInfo(exp.init);
	var test = Jipdainfo.getInfo(exp.test);
	var update = Jipdainfo.getInfo(exp.update);
	var body  = Jipdainfo.getInfo(exp.body);

	return {
		name 	: 'for(' + init.name + '; ' + test.name + '; ' + update.name + '){' + body.name + '}',
		init 	: init,
		test 	: test,
		update 	: update,
		body 	: body,
		type	: 'ForStatement',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.forInStatement = function(exp){
	var left = Jipdainfo.getInfo(exp.left);
	var right = Jipdainfo.getInfo(exp.right);
	var body  = Jipdainfo.getInfo(exp.body);

	return {
		name 	: 'for(' + left.name + ' in ' + right.name + '){' + body.name + '}',
		left 	: left,
		right 	: right,
		body 	: body,
		type	: 'ForInStatement',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.functionDeclaration = function(exp){
	var id = JipdaInfo.getInfo(exp.id);
	var body = JipdaInfo.getInfo(exp.body);
	var par = [];
	var def = [];

	for(var j = 0; j < exp.params.length; j++){
		par.push(JipdaInfo.getInfo(exp.params[j]));
	}

	for(var k = 0; k < exp.defaults.length; k++){
		def.push(JipdaInfo.getInfo(exp.defaults[k]));
	}

	return {
		//defaults en body!
		name 		: i.name,
		id 			: i,
		parameters 	: par,
		defaults 	: def,
		body 		: body,
		type		: 'FunctionDeclaration',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.labeledStatement = function(exp){
	var lbl = JipdaInfo.getInfo(exp.label);
	var body = Jipdainfo.getInfo(exp.body);

	return {
		name 		: lbl + ': ' + body.name,
		label		: lbl,
		body		: body,
		type		: 'LabeledStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.newExpression = function(exp){
	var c = JipdaInfo.getInfo(exp.callee);

	var arg, args = [];
	for(var i = 0; i < exp.arguments.length; i++){
		arg = exp.arguments[i];
		args.push(JipdaInfo.getInfo(arg));
	}

	return {
		name 		: 'new ' + c.name + '(' + arguments + ')',
		arguments 	: args,
		callee 		: c,
		type		: 'NewExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.postfixExpression = function(exp){
	var op = JipdaInfo.getInfo(exp.operator);
	var arg = JipdaInfo.getInfo(exp.argument);

	return {
		name 		: arg.name + op,
		argument 	: arg,
		operator 	: op,
		type		: 'PostfixExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.program = function(exp){
	var body = JipdaInfo.getInfo(exp.body);

	return {
		name 		: body.name,
		body 		: body,
		type 		: 'Program',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.sequenceExpression = function(exp){
	var ex, exps = [];

	for(var i = 0; i < exp.expressions.length; i++){
		ex = exp.expressions[i];
		exps.push(JipdaInfo.getInfo(ex));
	}

	return {
		name 		: 'Sequence Expression',
		expressions : exps,
		type		: 'SequenceExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.switchCase = function(exp){
	var test = JipdaInfo.getInfo(exp.test);
	var cons = JipdaInfo.getInfo(exp.consequent);

	return {
		name 		: test.name + ' : ' + cons.name,
		test		: test,
		consequent 	: cons,
		type		: 'SwitchCase',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.switchStatement = function(exp){
	var cse, cases = [];
	var disc = JipdaInfo.getInfo(exp.discriminant);

	for(var i = 0; i < exp.cases.length; i++){
		cse = exp.cases[i];
		cases.push(JipdaInfo.getInfo(cse));
	}

	return {
		name 		: 'SwitchStatement',
		discriminant: disc,
		cases 		: cases,
		type		: 'SwitchStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.thisExpression = function(exp){
	var body = JipdaInfo.getInfo(exp.body);

	return {
		name 		: 'this',
		type		: 'ThisExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.throwStatement = function(exp){
	var arg = JipdaInfo.getInfo(exp.argument);

	return {
		name 	 	: 'throw ' + arg.name,
		argument 	: arg,
		type		: 'ThrowStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.tryStatement = function(exp){
	var gh, ghs = [];
	var h, hs = [];
	var block = JipdaInfo.getInfo(exp.block);
	var fin = Jipdainfo.getInfo(exp.finalizer);

	for(var i = 0; i < exp.guardedHandlers.length; i++){
		gh = exp.guardedHandlers[i];
		ghs.push(JipdaInfo.getInfo(gh));
	}

	for(var j = 0; j < exp.handlers.length; j++){
		h = exp.handlers[j];
		hs.push(JipdaInfo.getInfo(h));
	}

	return {
		name 				: 'Try Statement',
		block 				: block,
		finalizer 			: fin,
		guardedHandlers 	: ghs,
		handlers 			: hs,
		type				: 'TryStatement',
		location 			: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.unaryExpression = function(exp){
	var op = JipdaInfo.getInfo(exp.operator);
	var arg = JipdaInfo.getInfo(exp.argument);

	return {
		name 		: op + arg.name,
		argument 	: arg,
		operator 	: op,
		type		: 'UnaryExpression',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.whileStatement = function(exp){
	var test = JipdaInfo.getInfo(exp.test);
	var body = JipdaInfo.getInfo(exp.body);

	return {
		name 		: 'while(' + test.name + '){' + body.name + '}',
		test 		: test,
		body 		: body,
		type		: 'WhileStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.withStatement = function(exp){
	var obj = JipdaInfo.getInfo(exp.object);
	var body = JipdaInfo.getInfo(exp.body);

	return {
		name 		: 'with(' + obj.name + '){' + body.name + '}',
		object 		: obj,
		body 		: body,
		type		: 'WithStatement',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

var LOOKUP_INFO = {
	'AssignmentExpression' 	: JipdaInfo.assignmentExpression,
	'Identifier'			: JipdaInfo.identifier,
	'Literal'				: JipdaInfo.literal,
	'ObjectExpression'		: JipdaInfo.objectExpression,
	'ArrayExpression'		: JipdaInfo.arrayExpression,
	'Property'				: JipdaInfo.property,
	'MemberExpression'		: JipdaInfo.memberExpression,
	'VariableDeclaration'	: JipdaInfo.variableDeclaration,
	'VariableDeclarator'	: JipdaInfo.variableDeclarator,
	'FunctionExpression' 	: JipdaInfo.functionExpression,
	'CallExpression' 		: JipdaInfo.callExpression,
	'ReturnStatement' 		: JipdaInfo.returnStatement,
	'BinaryExpression' 		: JipdaInfo.binaryExpression,
	'ExpressionStatement'	: JipdaInfo.expressionStatement,
	'BlockStatement'		: JipdaInfo.blockStatement,
	'BreakStatement' 		: JipdaInfo.breakStatement,
	'CatchClause'			: JipdaInfo.catchClause,
	'ConditionalExpression' : JipdaInfo.conditionalExpression,
	'DoWhileStatement' 		: JipdaInfo.doWhileStatement,
	'EmptyStatement'		: JipdaInfo.emptyStatement,
	'ForStatement' 			: JipdaInfo.forStatement,
	'ForInStatement' 		: JipdaInfo.forInStatement,
	'FunctionDeclaration' 	: JipdaInfo.functionDeclaration,
	'IfStatement' 			: JipdaInfo.conditionalExpression, //same
	'LabeledStatement'		: JipdaInfo.labeledStatement,
	'NewExpression'			: JipdaInfo.newExpression,
	'PostfixExpression' 	: JipdaInfo.postfixExpression,
	'Program'				: JipdaInfo.program,
	'SequenceExpression' 	: JipdaInfo.sequenceExpression,
	'SwitchCase' 			: JipdaInfo.switchCase,
	'SwitchStatement' 		: JipdaInfo.switchStatement,
	'ThisExpression' 		: JipdaInfo.thisExpression,
	'ThrowStatement' 		: JipdaInfo.throwStatement,
	'TryStatement' 			: JipdaInfo.tryStatement,
	'UnaryExpression' 		: JipdaInfo.unaryExpression,
	'WhileStatement' 		: JipdaInfo.whileStatement,
	'WithStatement' 		: JipdaInfo.withStatement,
};
