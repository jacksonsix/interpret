// high level language


function setup_parser(){
var env = {};
env.read_exp_text = 
    // parser to  instruction object
	function read_exp_text(scheme_text){			
		var commands = [];
		// assume each command on each line;
		var line ='';
		for(var i=0; i< scheme_text.length;i++){
			line = scheme_text[i];
			var inst =  gen(line);
			inst.cmdtext = line;
			commands.push(inst);		
		}
		return commands;	
	}

// generate proc
env.gen  = function (info){
	var text = info;
	var seprator = ['(',')',' '];
	var stack =[];
	
	function getNextToken(){
		//eat up space	
		while(text.length>0 && (text[0] ===' ' || text[0] ==='\t')){
			text = text.substring(1);
		}
		if(text.length == 0) return null;
		var ch = text[0];
		if(seprator.indexOf(ch) != -1){
			text = text.substring(1);
			return ch;
		}else{
			var word ='';
			while(seprator.indexOf(ch) == -1){
				word += ch;				
				if(text.length ==0 ){
					break;
				}else if(text.length ==1 ){
					text = '';
					break;
				}else{
					text = text.substring(1);				
				    ch = text[0];
				} 
			}
			return word;
		}
	}

	function parse(){
		var token ='';		
		do{
				token = getNextToken();
				// return the last element on stack ?
				if(token == null) return;
				
				if(token ==='('){
				   // push to stack
				   // the first token is operator				 
				   stack.push(token);				   
				} else if(token===')'){
				   // begin to pop until operator, close
				   // then  apply operator on operands
				   var out = stack.pop();
				   var proc = [];
				   while(out !== '('){		
						proc.push(out);
						out = stack.pop();
				   }
				   var result = applyv(proc);
				   stack.push(result);
				   
				}else if(token[0] =='\''){
					var proc = [];					
					proc.push(token.slice(1));	
					proc.push(token[0]);					
					var result = applyv(proc);
					stack.push(result);
				} else{				
					stack.push(token);
				}
				
		}while(token != null )

	}
		function isNumeric(n) {
		  return !isNaN(parseFloat(n)) && isFinite(n);
		}
		function  applyv(proc){
		// return an object, as the parse result
		 // pop out operator, 	 	   
		 // apply again in case number, vaiable, check here
		 if(typeof(proc) =='object'){
			 if(proc.type){
				 return proc;  // already parsed
			 }
		 }
  		  var obj = {};
		  if(!Array.isArray(proc)){
			  // expression has only 1 part. ,  self_eval, variable.
			  if(isNumeric(proc)  ){
				  obj.type = 'self';
				  obj.value = parseFloat(proc);
			  }else{
				  obj.type = 'variable';
				  obj.value = proc;
			  }
			  
		  }else{
			   var op = proc.pop();
			   switch(op){
				 case 'if':
					 obj.type = 'if';
					 obj.pred = applyv(proc.pop());
					 obj.conseq = applyv(proc.pop()); 
					 obj.alt = applyv(proc.pop());
					 break;
				 case 'begin':
					 obj.type = 'begin';
					 obj.exps =[];
					 while(proc.length>0){
						 var p = proc.pop();
						 obj.exps.push(applyv(p));
					 }				 
					 break;		 
				 case 'lambda':
					 obj.type = 'lambda';
					 var tmp = proc.pop();
					 if(tmp.type ==='application'){
						 var ta =[];
						 ta.push(tmp.operator);
						 while(tmp.oprands.length>0){
							 ta.unshift(tmp.oprands.pop());  // keep the same sequence
						 }
						obj.parameters = ta;
					 }else{
						obj.parameters = proc.pop();
					 }					 
					 obj.body =[];
					 while(proc.length>0){
						 // check  exception: if exists  a string , as a single expression 
						 var exp = proc.pop();
						 if(typeof(exp) ==='string'){
							 var  v ={};
							 v.type='variable';
							 v.value = exp;
							 obj.body.push(v);
						 }else{
							  obj.body.push(exp);
						 }						
					 }					 
					 // for each expression
					 break;				 
				 case 'define':
					 obj.type ='definition';
					 obj.variable = proc.pop();
					 // test if variable part is application object, which means it is a definition of procedure
					 if(obj.variable.type && obj.variable.type ==='application'){
						 var tmp = obj.variable;
						 obj.variable = tmp.operator;
						 var convert ={};
						 convert.type ='lambda';
						 convert.parameters = [];
						 while(tmp.oprands.length>0){
							 convert.parameters.unshift(tmp.oprands.pop()); // keep the same sequence
						 }
						 convert.body = [];
						 while(proc.length>0){
							 convert.body.unshift(applyv(proc.pop()));  // keep the same sequence
						 }
						 obj.value = applyv(convert);
						 
					 }else{
						  obj.value = applyv(proc.pop());
						  var t = obj.variable;
                          obj.variable={};						 
						  obj.variable.value = t;
					 }					 
					 break;
				 case 'set!':
					 obj.type = 'assign';
					 obj.variable = proc.pop();
					 // test if variable part is application object, which means it is a definition of procedure
					 if(obj.variable.type && obj.variable.type ==='application'){
						 var tmp = obj.variable;
						 obj.variable = tmp.operator;
						 var convert ={};
						 convert.type ='lambda';
						 convert.parameters = [];
						 while(tmp.oprands.length>0){
							 convert.parameters.unshift(tmp.oprands.pop());  // keep the same sequence
						 }
						 convert.body = [];
						 while(proc.length>0){
							 convert.body.unshift(applyv(proc.pop())); // keep the same sequence
						 }
						 obj.value = applyv(convert);
						 
					 }else{
						 obj.value = applyv(proc.pop());						
					 }	
					 break;
				 case '\'':
					 obj.type ='quote';
					 obj.text = proc.pop();
					 break;		 
			   default:   // default as application (operator) (operator operands) , but parameters (para1)  or (para1,para2) 
			         obj.type ='application';
					 obj.operator = applyv(jsmapping(op));
					 obj.oprands = [];
					 while(proc.length>0){
						 var p = proc.pop();
						 obj.oprands.push(applyv(p));
					 }						
					break;	   
			   }  
		  }	
		  return  obj; 	   	   
	}
	
	parse();	
	var result = stack.pop();
	return applyv(result);
}

  return env;	
}



// evaluator
function setup_eval(){
	var env={};
	env.self_eval00 = function(exp){
		return  exp.type === 'self';
	}
	env.variable00 = function(exp){
		return exp.type ==='variable';
	}
	env.quoted00 = function(exp){
		return exp.type ==='quote';
	}
	env.assign00 = function(exp){
		return exp.type ==='assign';
	}
	env.define00 = function(exp){
		return exp.type ==='definition';
	}
	env.if00 = function(exp){
		return  exp.type ==='if';
	}
	env.lambda00 = function(exp){
		return exp.type ==='lambda';
	}	
	env.begin00 = function(exp){
		return exp.type ==='begin';
	}	
	env.application00 = function(exp){
		return exp.type ==='application';		
	}	
	env.self_value = function(exp){
		return exp.value;
	}
	env.quote_text = function(exp){
		return exp.text;
	}
	
	function search_variable(variable,env){
		for(var i=0; i< env.length;i++){
			var frame = env[i];    
			var keys = Object.keys(frame);
			for(var j=0; j< keys.length;j++){
				if(keys[j] === variable){
					return frame;
				}
			}
		}
		return null;
	}
	env.lookup_var_env = function(variable,env){		
		var frame = search_variable(variable.value,env);
		if(frame != null){
			return frame[variable.value]
		}else{
			return 'undefined';
		}		
	}
	env.define_var = function(exp){
		return exp.variable;
	}
	env.define_value = function(exp){
		return exp.value;
	}
	env.define_variable = function(variable,val,env){
		var frame = env[0];		
		frame[variable.value] = val;
		if(val.type ==='procedure'){  // modify  procedure env
			val.env[0] = frame;
		}
		return  'ok';
	}
	env.assign_var = function(exp){
		return exp.variable;
	}
	env.assign_value = function(exp){
		return exp.value;
	}
	env.set_var_value = function(variable,val,env){
		var frame = search_variable(variable,env);		
		frame[variable] = val;
		return  'ok';
	}
	env.begin_actions = function(exp){
		return exp.exps;
		
	}
	env.first_sequence = function(sequence){
		// expression should be evaluate to object
		if(sequence.length>0){
			return sequence[0];
		}else{
			return null;
		}
	}
	env.is_last_exp = function(sequence){
		return sequence.length == 1;
	}
	env.rest_sequence = function(sequence){
		if(sequence.length >1){
			return sequence.slice(1);
		}else{
			return null;
		}
	}
	env.lambda_parameters = function(exp){
		return exp.parameters;
	}
	env.lambda_body  = function(exp){
		return exp.body;
	}
	env.make_procedure = function(paras,body,env){
		var procedure = {};
		procedure.parameters = paras;
		procedure.body = body;
		//procedure.env = env;  // this will create cycle. break it.
		//procedure.env = JSON.stringify(env);   // stringfy does not work for function
		var copy = []; // copy each frame
		for(var i=0;i<env.length;i++){
			var frame = env[i];
			var cf = {};
			Object.keys(frame).forEach(function(key){
				cf[key] = frame[key];				
			});
			copy.push(cf);
		}
		procedure.env = copy;
		procedure.type = 'procedure';
		return procedure;
	}
	env.procedure_parameters = function(procedure){
		return procedure.parameters;
	}
	env.procedure_body = function(procedure){
		return procedure.body;
	}
	env.procedure_env = function(procedure){		
		return procedure.env;
	}
	env.is_no_operands = function(sequence){
		if(sequence == null || sequence.length<1){
			return true;
		}
		return false;
	}
	env.empty_list = function(){
		var s = [];
		return s;
	}
	env.extend_env = function(parameters,argl,env){
		var newframe = {};
		for(var i=0;i< parameters.length;i++){
			var para = parameters[i];
			newframe[para.value] = argl[i];
		}
		env.unshift(newframe);
		return env;
	}
	env.adjoin_arg = function(val, argl){
		argl.push(val);
		return argl;
	}
	function inEnvLibs(name,env){
		var keys = Object.keys(env);
		for(var i=0;i< keyslength;i++){
			var proc = keys[i];
			if(proc === name) return true;
		}
		return false;
	}
	env.is_prim_procedure = function(proc){		
		if(proc.type ==='prim'){
			return true;
		}else{
			return false;
		}		
	}
	env.is_compound_procedure = function(proc){
		if(proc.type ==='prim'){
			return false;
		}else{
			return true;
		}	
	}
	env.apply_prim_procedure = function(proc,argl){
		// test if the proc is a function name only as string		
		return proc.func.apply(this, argl);		
	}
	env.app_oprands = function(exp){
		return exp.oprands;
	}
	env.app_operator = function(exp){	
		return  exp.operator;
	}
	
	env.if_conseq = function(exp){
		return exp.conseq;
	}
	env.if_pred = function(exp){
		return exp.pred;
	}
	env.if_alt = function(exp){
		return exp.alt;
	}
	
	env.true00 = function(val){
		return val !== false;
	}
	
	return env;
}


