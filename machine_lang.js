//machine
 
///////////////////////////// Assembler 
function asseble(controller_text,machine,libs){
	var commands = read_controller_text(controller_text);	
	var analyzer = analyze(commands);
	// install libs to machine
	//var libs = setup();	
	machine.install_libs(libs);
	machine.ops = update_insts(commands, machine);
}

function update_insts(insts,machine){
	insts.forEach(function(inst){
		inst.func = make_exe_proc(inst,machine);
	});
	return insts;
}

// from instruction to procedure
function deepcopy(source){
	var keeprecord = [];
	var flagrecord =[];
	var index = 0;
	function copy(sr){
		if(keeprecord.indexOf(sr) != -1){
			return sr;
		}
		if(typeof(sr) !=='object'){
			return sr;
		}
		var dst;
		if(Array.isArray(sr)){
			dst =[];
			
		}else{	
	       dst ={};		
		}	
		
		keeprecord.push(sr);
		flagrecord.push('gray');	
		var keys = Object.keys(sr);
		keys.forEach(function(key){			
			var ele = sr[key];
			if(typeof(ele) ==='object'){
				dst[key] = copy(ele);
			}else{
				dst[key] = ele;
			}
		});				
		
        var i = keeprecord.indexOf(sr);
		flagrecord[i] = 'black';
		return dst;
	}
	var nc = copy(source);
	return nc;
}

function make_exe_proc(inst,machine){
	var operator = inst.type;
	switch(operator){
		case 'assign':
		   return make_assign(inst,machine);
		break;
		case 'test':
		   return make_test(inst,machine);
		break;
		case 'branch':
		   return make_branch(inst,machine);
		break;
		case 'goto':
		   return make_goto(inst,machine);
		break;
		case 'save':
		   return make_save(inst,machine);
		break;
		case 'restore':
		   return make_restore(inst,machine);
		break;
		case 'perform':
		   return  make_perform(inst,machine);
		break;		
		case 'label':
		   return  make_label(inst,machine);
		break;	
		default:
		   console.log('cannot find inst ' + inst);
		break;
	}
}


// parser to  instruction object
function read_controller_text(controller_text){
	function isLabel(line){
		return line.indexOf('(') ==-1;
	}

	function make_label(text){
		var obj ={};
		obj.type ='label';
		obj.name = text;
		return obj;
	}	
	var commands = [];
	// assume each command on each line;
	var line ='';
	for(var i=0; i< controller_text.length;i++){
		line = controller_text[i];
		if(line == null) break;
		// check is label or inst
		if(isLabel(line)){			
			var label = make_label(line);
			label.cmdtext = line;
			commands.push(label);
		}else{
			var inst =  gen(line);
			inst.cmdtext = line;
			commands.push(inst);		
		}
	}
	return commands;	
}

// generate proc
function gen(info){
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
				if(text.length ==0) break;
				text = text.substring(1);
				ch = text[0];
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
				   
				} else{				
					stack.push(token);
				}
				
		}while(token != null )

	}
	
		function  applyv(proc){
		// return an object, as the parse result
		 // pop out operator, 	 	   
		   var obj = {};
		  
		   var op = proc.pop();
		   switch(op){
			 case 'assign':
				 obj.type = 'assign';
				 obj.dest = proc.pop();
				 obj.src = proc.pop(); 
				 if(obj.src.type ==='operation'){
					 obj.params =[];
					 while(proc.length>0){
						 obj.params.push(proc.pop());
					 }
				 }
				 break;
			 case 'perform':
                 obj.type = 'perform';
				 obj.operator = proc.pop();
				 obj.params =[];
				 while(proc.length>0){
					 obj.params.push(proc.pop());
				 }
                 break;				 
			 case 'reg':
				 obj.type = 'reg';
				 obj.name = proc.pop();
				 break;		 
			 case 'label':
				 obj.type = 'label';
				 obj.name = proc.pop();
				 break;
			 case 'test':
				 obj.type ='test';
				 obj.operation = proc.pop();
				 obj.left = proc.pop();
				 obj.right = proc.pop();
				 break;
			 case 'const':
				 obj.type ='const';
				 obj.value = proc.pop();
				 break;
			 case 'op':
				 obj.type = 'operation';
				 obj.functionName = proc.pop();
				 break;
			 case 'branch':
				 obj.type ='branch';
				 obj.dest = proc.pop();
				 break;
			 case 'save':
				 obj.type = 'save';
				 obj.reg = proc.pop();
				 break;
			 case 'restore':
				 obj.type = 'restore';
				 obj.reg = proc.pop();
				 break;
			 case 'goto':
				 obj.type = 'goto';
				 obj.dest = proc.pop();
				 break;			 
		   default:
				break;	   
		   }  
		   
		   return  obj; 	   	   
	}
	
	parse();	
	var result = stack.pop();
	return result;
}


function make_operation_exp(exp,params,machine){
	var  opfunc = machine.libs[exp.functionName];
	var operands = params.map(function(oprand){
		 return make_primitive_exp(oprand,machine);
	});

	return function(){
		var ss = operands.map(function(p){
		                return p();
	       });
		return opfunc.apply(this, ss);
	}
	
}

function make_primitive_exp(exp, machine){
	var operation = exp.type;
	var result ={};
	switch(exp.type){
		case 'const':
		   result = function(){
                 return exp.value;			   
		    }
			break;
      case 'label':
          result  = function(){
			  return exp.name;
		  }	  
		  break;
	 case 'reg':
         result  = function(){
			  return machine.get_reg(exp.name);
		 }
        break;
    default:
	   console.log('wrong exp ' + exp);
       break;	
	}
	
	return result;
}

//basic operation on machine
function make_assign(cmdobj,machine){
	var src = cmdobj.src;	
	var dest =  cmdobj.dest;	
	var calculate ={};
	
	if(src.type ==='operation'){
		calculate = make_operation_exp(src,cmdobj.params, machine);
	}else{
		calculate = make_primitive_exp(src,machine);
	}
	return function(){		
		var val = calculate();
		machine.set_reg(dest,val);
		machine.advance_pc();
	}
}
function make_test(inst,machine){	
	var operation = inst.operation;
	var func = machine.libs[operation.functionName];
	
	return function(){
		var left = inst.left;
		var right = inst.right;
		// valueOf  , if left is const, or reg.
		if(left.type ==='const'){
			left = left.value;
		}else{
			left = machine.get_reg(left.name);
		}
		
		if(typeof(right) ==='undefined'){
			// do nothing
		}else if(right.type ==='const'){
			right = right.value;
		}else {
			right = machine.get_reg(right.name);
		}
	
		if(func != null){
			 var cond = func(left,right);
			 if(cond){
				 machine.flag = true;
			 }else{
				 machine.flag = false;
			 }
		}		
		machine.advance_pc();
	};
}

function make_goto(inst,machine){
	// find label,
	var dest = inst.dest;	
		
	return function(){
		var index = -1;
		var staticname = '';
		if(dest.type==='reg'){			
			staticname = machine.get_reg(dest.name);
		}else if(dest.type ==='label'){
			staticname = dest.name;
		}
		for(var i=0; i< machine.ops.length;i++) {
			var cmd = machine.ops[i];
            if(cmd.type ==='label'){
				if(cmd.name === staticname){
					index = i;
					break;
				}
			}			
		}
		machine.pcindex = index;
	    machine.pc = machine.ops[index];
		trace('->' + staticname);
	}
}

function make_label(inst,machine){
	return function(){
		machine.advance_pc();
	};
}

function make_branch(inst,machine){
	var dst = inst.dest;
	return function(){
		if(machine.flag){
		   	var index = -1;
			for(var i=0; i< machine.ops.length;i++) {
				var cmd = machine.ops[i];
				if(cmd.type ==='label'){
					if(cmd.name === dst.name){
						index = i;
						break;
					}
				}			
			}
			machine.pcindex = index;
			machine.pc = machine.ops[index];
		}else{
			machine.advance_pc();
		}	
	};
}

function make_save(inst,machine){
	
	return function(){
		var val = machine.get_reg(inst.reg);
		//machine.stack.push(val);
		var copy = deepcopy(val);
		machine.stack.push(copy);
		machine.debugstack.push(inst);
		machine.numPush++;
		machine.advance_pc();
	}
}

function make_restore(inst,machine){
	var regName =  inst.reg;
	return function(){
		var old = machine.stack.pop();
		machine.debugstack.pop();
		machine.set_reg(regName,old);
		machine.advance_pc();
	}
}

function make_perform(inst,machine){
	var perform = inst.operator;
	var paras = inst.params;
	var proc = make_operation_exp(perform,paras,machine);

	return function(){
			if(proc != null){
		         proc();
	       }
		   machine.advance_pc();
	}
}


function analyze(cmds){
	var instructions = cmds.slice();
	result = {};
	result.insts = 	instructions.sort(function(a,b){
								  if( a.type < b.type) return -1;
								  else if (a.type > b.type) return 1;
								  else return 0;
							});
	result.entries = instructions.filter(function(inst){
		 return inst.type === 'goto';
	}).map(function(item){
		 return item.dest.name;
	});			
   	
	result.onstacks = instructions.filter(function(inst){
		return inst.type ==='save';
	}).map(function(item){
		return item.reg;
	});
	
	result.sources =  instructions.filter(function(inst){
		return inst.type ==='assign';
	}).sort(function(a,b){
		if(a.dest.name < b.dest.name ) return -1;
		else if (a.dest.name > b.dest.name) return 1;
		else return 0;
	});
	
	return result;
}
