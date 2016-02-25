/**
 * EXTRACT INFO FROM JIPDA
 */

function JipdaInfo(){
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
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.identifier = function(exp){
	return {
		name 	: exp.name,
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.literal = function(exp){
	return {
		name	: exp.raw,
		raw		: exp.raw,
		value	: exp.value,
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
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.functionExpression = function(exp){
	var i = exp.id ? JipdaInfo.getInfo(exp.id) : { name : 'Lambda' };
	var par = [];

	for(var j = 0; j < exp.params.length; j++){
		par.push(JipdaInfo.getInfo(exp.params[j]));
	}

	return {
		name 		: i.name,
		id 			: i,
		parameters 	: par,
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
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.returnStatement = function(exp){
	var arg = JipdaInfo.getInfo(exp.argument);

	return {
		name 		: arg.name,
		argument 	: arg,
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
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.expressionStatement = function(exp){
	var ex = JipdaInfo.getInfo(exp.expression);

	return {
		name 		: ex.name,
		expression	: ex,
		location 	: ex.loc.start.line + ' - ' + ex.loc.end.line,
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
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

//here for backward support
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
};
