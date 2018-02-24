//machine and its model
// ref to function objToString
// ref to trace_options
var trace_options = {
	 command:true,
	 regs:false,
	 stack:false,
	 reg_filter:['exp','val']
 };
 
function objToString(obj,n){	
	var type = typeof(obj);
	var strValue ='';
	if(type =='object'){
		if(Array.isArray(obj)){
				strValue += '[ ';
				strValue += allKeys(obj, n);
				strValue += ' ]';	
			
		}else{
				strValue +=  '{ ';
				strValue += allKeys(obj, n);
				strValue +=  ' }';				
		}
		
	}else if(type ==='function'){
		strValue = 'user_function';		
	} 
	else{
		strValue = obj;
	}
	return strValue;
}

function allKeys(parent,n){
	if(parent == null) return '';
	
	var keys = Object.keys(parent);
	var elements='';
	keys.forEach(function(key){
		var ele = parent[key];
		if(ele!=null){
			if(n > 6){ 
			     return 'cutoff';
			}else{				
				var s = objToString(key,n+1) +':' +objToString(parent[key], n+1) +' , ';
				elements += s;
			}
                      			
		}
	});
	elements = elements.substring(0, elements.length -3);
	return elements;
}

//
function counter(){
	var index = 0;
	return function(){
		return index++;
	}
}
var count = counter();
//
function make_machine(reg_names){
	var _machine = new Machine_base();	
	reg_names.forEach(function(reg){
		_machine.registers[reg] = 'unassigned';
	});	
	return _machine;
}

//
function Machine_base(){
  this.registers = {};
  this.pc = null;
  this.pcindex = 0;
  this.flag = false;
  this.stack = [];
  this.ops = [];
  this.controller_text ='';
  this.libs = {};
  this.counting = 0;
  this.trace = true;
  this.maxStack = 0;
  this.numPush = 0;
  this.debugstack = [];
  
  this.get_reg = function get_reg(reg){	 
	  return this.registers[reg];
  }
  
  this.set_reg = function set_reg(reg,value){
	  this.registers[reg] = value;
  }

  this.start = function start(){
	  console.log('Machine started!');
	  this.pc = this.ops[this.pcindex];
	  var i = 0;
	  while(this.pc != null && i < 1000){	   	
		i++;
		if(this.trace){
			var m ='';
			var keys = Object.keys(this.registers);
			for(var i = 0; i< keys.length;i++){
				var key = keys[i];
				//if(key==='env') continue;   //skip env
				if(trace_options.reg_filter.indexOf(key) ==-1) continue;
				var val = this.get_reg(key);
				if(val !== 'unassigned'){
					var  content =  this.get_reg(key);					
					m += '\n' +key +':' + objToString(content, 0) + ';';	
				}				
			}
			var sta ='';
			for(var i=0;i< this.stack.length;i++){
				sta += '\n' + objToString(this.stack[i],0)  + '--> ' + objToString(this.debugstack[i],0) ;
			}
			//print pc command
			var sn = count();
			console.log(sn + 'command: ' + this.pc.cmdtext);			
			console.log(sn+'registers:     ' +m);
			console.log(sn+'     '+ 'stack' + sta);
			tohtml( sn, this.pc.cmdtext,m,sta);
		}
		if(this.stack.length > this.maxStack){
			this.maxStack = this.stack.length;
		}
		this.pc.func();
		this.counting++;
	  }

     // after the execution, print the statistics
        console.log('Total steps: ' + this.counting);
        console.log('Max stack depth: ' + this.maxStack);	
        console.log('Num of push: ' + this.numPush);		

  }
  
  this.get_stack = function getstack(){ return this.stack;}
  this.get_operations = function getops(){return this.ops;}	
  this.set_flag = function setflag(value){ this.flag = value;}
  this.advance_pc = function advance_pc(machine){	                           
								  this.pcindex += 1;
								  this.pc =  this.ops[this.pcindex];
                             }	
  this.install_libs  = function(libs){
	                                this.libs = libs;
                               }							 
						 
   this.printcounting = function(){ return this.counting;}	
   this.resetcounting = function(){  this.counting = 0; }   
}


var machine_code =
'eval_dispatch;\
(test (op self_eval00) (reg  exp));\
(branch  (label eval_self));\
(test (op variable00) (reg exp));\
(branch (label eval_variable));\
(test (op quoted00) (reg exp));\
(branch (label eval_quote));\
(test (op assign00) (reg exp));\
(branch (label ev_assign));\
(test (op define00) (reg exp));\
(branch (label ev_define));\
(test (op if00) (reg exp));\
(branch (label ev_if));\
(test (op lambda00) (reg exp));\
(branch (label eval_lambda));\
(test (op begin00) (reg exp));\
(branch (label ev_begin));\
(test (op application00) (reg exp));\
(branch (label eval_application));\
eval_self;\
(assign val (op self_value) (reg exp));\
(goto (reg continue));\
eval_variable;\
(assign val (op lookup_var_env) (reg exp) (reg env));\
(goto (reg continue));\
eval_quote;\
(assign val (op quote_text) (reg exp));\
(goto (reg continue));\
eval_lambda;\
(assign unev (op lambda_parameters) (reg exp));\
(assign exp (op lambda_body) (reg exp));\
(assign val (op make_procedure) (reg unev) (reg exp) (reg env));\
(goto (reg continue));\
eval_application;\
(save continue);\
(save env);\
(assign unev (op app_oprands) (reg exp));\
(save unev);\
(assign exp (op app_operator) (reg exp) );\
(assign  continue (label ev_app_did_operator));\
(goto (label eval_dispatch));\
ev_app_did_operator;\
(restore unev);\
(restore env);\
(assign argl (op empty_list));\
(assign proc (reg val));\
(test (op is_no_operands) (reg unev));\
(branch (label apply_dispatch));\
(save proc);\
ev_app_oprand_loop;\
(save argl);\
(assign exp (op first_sequence) (reg unev));\
(test (op is_last_exp) (reg unev));\
(branch (label ev_app_last_arg));\
(save env);\
(save unev);\
(assign continue (label ev_app_accumulate));\
(goto (label eval_dispatch));\
ev_app_accumulate;\
(restore unev);\
(restore env);\
(restore argl);\
(assign argl (op adjoin_arg) (reg val) (reg argl));\
(assign unev (op rest_sequence) (reg unev));\
(goto (label ev_app_oprand_loop));\
ev_app_last_arg;\
(assign continue (label ev_app_accum_last_arg));\
(goto (label eval_dispatch));\
ev_app_accum_last_arg;\
(restore argl);\
(assign argl (op adjoin_arg) (reg val) (reg argl));\
(restore proc);\
(goto (label apply_dispatch));\
apply_dispatch;\
(test (op is_prim_procedure) (reg proc));\
(branch (label prim_procedure));\
(test (op is_compound_procedure) (reg proc));\
(branch (label compound_procedure));\
(goto (label unknown_procedure));\
prim_procedure;\
(assign val (op apply_prim_procedure) (reg proc) (reg argl));\
(restore continue);\
(goto (reg continue));\
compound_procedure;\
(assign unev (op procedure_parameters) (reg proc));\
(assign env (op procedure_env) (reg proc));\
(assign env (op extend_env) (reg unev) (reg argl) (reg env));\
(assign unev (op procedure_body) (reg proc));\
(goto (label ev_sequence));\
ev_begin;\
(assign unev (op begin_actions) (reg exp));\
(save continue);\
(goto (label ev_sequence));\
ev_sequence;\
(assign exp (op first_sequence) (reg unev));\
(test (op is_last_exp) (reg unev));\
(branch (label ev_sequence_last));\
(save unev);\
(save env);\
(assign continue (label  ev_sequence_continue));\
(goto (label eval_dispatch));\
ev_sequence_continue;\
(restore env);\
(restore unev);\
(assign unev (op rest_sequence) (reg unev));\
(goto (label ev_sequence));\
ev_sequence_last;\
(restore continue);\
(goto (label eval_dispatch));\
ev_if;\
(save exp);\
(save env);\
(save continue);\
(assign continue (label ev_if_decide));\
(assign exp (op if_pred) (reg exp));\
(goto (label eval_dispatch));\
ev_if_decide;\
(restore continue);\
(restore env);\
(restore exp);\
(test (op true00) (reg val));\
(branch (label ev_if_conseq));\
(assign exp (op if_alt) (reg exp));\
(goto (label eval_dispatch));\
ev_if_conseq;\
(assign exp (op if_conseq) (reg exp));\
(goto (label eval_dispatch));\
ev_assign;\
(assign unev (op assign_var) (reg exp));\
(save unev);\
(save env);\
(save continue);\
(assign continue (label assign_continue));\
(assign exp (op assign_value) (reg exp));\
(goto (label eval_dispatch));\
assign_continue;\
(restore continue);\
(restore env);\
(restore unev);\
(perform (op set_var_value) (reg unev) (reg val) (reg env));\
(assign val (const ok));\
(goto (reg continue));\
ev_define;\
(assign unev (op define_var) (reg exp));\
(save unev);\
(save env);\
(save continue);\
(assign continue (label define_continue));\
(assign exp (op define_value) (reg exp));\
(goto (label eval_dispatch));\
define_continue;\
(restore continue);\
(restore env);\
(restore unev);\
(perform (op define_variable) (reg unev) (reg val) (reg env));\
(assign val (const ok));\
(goto (reg continue));\
done;\
'
