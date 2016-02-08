function dummyGraph(){
	// 1 -> assignFunc(a) -> 2
	// 2 -> fCall(a) -> 3
	// Should be 1 -> assignFunc('a') -> x, x -> wildcard('*') -> x1, x1 -> fCall(['a']) -> y
	return [
		new GraphTriple(new DummyNode(0), 
						new EdgeLabel('ExpressionStatement',	{	
																	node: {
																		expression: {
																			type: 'AssignExpression',
																			left: {
																				name: 'a'
																			}
																		}
																	}
																}), 
						new DummyNode(1)),
		new GraphTriple(new DummyNode(1), 
						new EdgeLabel('ExpressionStatement',	{
																	node: {
																		expression: {
																			type: 'AssignExpression',
																			left: {
																				name: 'a'
																			}
																		}
																	}
																}), 
						new DummyNode(2)),
		new GraphTriple(new DummyNode(2), 
						new EdgeLabel('CallExpression', 		{
																	node: {
																		arguments: [{
																			type: 'Literal',
																			name: 'a'
																		}],
																		callee: {name: 'sink2'}
																	}
																}), 
						new DummyNode(3)),
		new GraphTriple(new DummyNode(2), 
						new EdgeLabel('CallExpression', 		{
																	node: {
																		arguments: [{
																			type: 'Literal',
																			name: 'a'
																		}],
																		callee: {name: 'sink'}
																	}
																}), 
						new DummyNode(4)),
		new GraphTriple(new DummyNode(3), 
						new EdgeLabel('ExpressionStatement',	{
																	node: {
																		expression: {
																			type: 'AssignExpression',
																			left: {
																				name: 'a'
																			}
																		}
																	}
																}), 
						new DummyNode(5)),
		new GraphTriple(new DummyNode(4), 
						new EdgeLabel('ExpressionStatement',	{
																	node: {
																		expression: {
																			type: 'AssignExpression',
																			left: {
																				name: 'a'
																			}
																		}
																	}
																}), 
						new DummyNode(5)),
		new GraphTriple(new DummyNode(5), 
						new EdgeLabel('ExpressionStatement',	{
																	node: {
																		expression: {
																			type: 'AssignExpression',
																			left: {
																				name: 'a'
																			}
																		}
																	}
																}), 
						new DummyNode(6)),
	];
}

function dummyLeak(){
	//  var eq = new ExistentialQuery(d1, d2, [d2[2].target], d1[0].from, d2[0].from);
	return [
		new GraphTriple(new DummyNode(1), 
						new EdgeLabel('assign', {leftName: 'x'}), 
						new DummyNode(2)),
		new GraphTriple(new DummyNode(2), 
						new EdgeLabel('fCall', 	{argument: 'x', callee: 'callee'}), 
						new DummyNode(3)),
		new GraphTriple(new DummyNode(3), 
						new EdgeLabel('assign', {leftName: 'x'}), 
						new DummyNode(4))
	];
}

function dummyNFA(){ 
	/* 	
		var d1 = dummyGraph();
		var d2 = dummyNFA();
		var eq = new ExistentialQuery(d1, d2, [new DummyNode(5)], d1[0].from, d2[0].from);
		var z = eq.runNaive();
		z.toString();
	*/
	// 	assign(y)*.fCall(y,callee).assign(y)
	return [
		new GraphTriple(new DummyNode(0), 
						new EdgeLabel('lambda', {}), 
						new DummyNode(1)),
		new GraphTriple(new DummyNode(0), 
						new EdgeLabel('lambda', {}), 
						new DummyNode(3)),
		new GraphTriple(new DummyNode(2), 
						new EdgeLabel('lambda', {}), 
						new DummyNode(1)),
		new GraphTriple(new DummyNode(2), 
						new EdgeLabel('lambda', {}), 
						new DummyNode(3)),
		new GraphTriple(new DummyNode(1), 
						new EdgeLabel('assign', 	{leftName : 'x'}), 
						new DummyNode(2)),
		new GraphTriple(new DummyNode(3), 
						new EdgeLabel('fCall', 		{argument: 'x', callee: 'callee'}), 
						new DummyNode(4)),
		new GraphTriple(new DummyNode(4), 
						new EdgeLabel('assign', 	{leftName: 'x'}), 
						new DummyNode(5)),
	];
}

function dummyDFA(){
	return [
		new GraphTriple(new DummyNode(0), 
						new EdgeLabel('assign', 	{leftName : 'x'}), 
						new DummyNode(1)),
		new GraphTriple(new DummyNode(1), 
						new EdgeLabel('assign', 	{leftName : 'x'}), 
						new DummyNode(1)),
		new GraphTriple(new DummyNode(1), 
						new EdgeLabel('fCall', 		{argument: 'x', callee: 'callee'}), 
						new DummyNode(2)),
		new GraphTriple(new DummyNode(2), 
						new EdgeLabel('assign', 	{leftName : 'x'}), 
						new DummyNode(3)),
		new GraphTriple(new DummyNode(0), 
						new EdgeLabel('fCall', 		{argument: 'x', callee: 'callee'}), 
						new DummyNode(2)),
	];
}