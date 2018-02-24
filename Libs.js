//Envionment, Libraries, Memory mgt. Math prims

///////////////////////////////////////////////////////////  memory management //////////////////////////////////////////////
////////// car,cdr ,cons treat as prim procedure. It is in a higher level than machine code ///

function Memory(){
	var  the_cars = [];
	var  the_cdrs = [];
	var  new_cars = [];
	var  new_cdrs = [];
	var  free =0;
	var  scan = 0;
	var  root = 0;
	var  newreg = 0;
	var  old = root;
	var  the_stack = null;

	function vect_ref(vect,offset){
		 return vect[offset];
	}
	function vect_set(vect,offset,value){
		vect[offset] = value;
	}

	this.car = function  car(data){
		if(data[0] ==='p'){
			var i =  parseInt(data.slice(1));
			return  the_cars[i];
		}
		return null;
	}

	this.cdr = function cdr(data){
			if(data[0] ==='p'){
			var i = parseInt(data.slice(1));
			return  the_cdrs[i];
		}
		return null;
	}

	this.set_car = function set_car(reg,value){
		if(reg[0] ==='p'){
			var i =  parseInt(reg.slice(1));
			the_cars[i] = value;
		}else{
			return null;
		}	
	}
	this.set_cdr = function set_cdr(reg,value){
		if(reg[0] ==='p'){
			var i =  parseInt(reg.slice(1));
			the_cdrs[i] = value;
		}else{
			return null;
		}	
	}

	this.cons = function cons(x,y){
		the_cars[free] = x;
		the_cdrs[free] = y;
		var index = 'p' + free;
		free++;
		return index;
	}
	function inner(address){
			var result ='';
			if(address[0] ==='p'){
				var i =  parseInt(address.slice(1));
				result = '(' + inner(the_cars[i])  +',' + inner(the_cdrs[i])+')'; 
			}else{
				result = address;
			}
			return result;
	}
	this.display = inner;

	function init_stack(){
		the_stack = null;
	}

	function stack_push(val){
		var n = cons(val,the_stack);
		the_stack = n;
	}

	function stack_pop(){
		var element = car(the_stack);
		the_stack = cdr(the_stack);
		return element;
	}


	// garbage collection
	this.collect = function stop_and_copy(){
		free = 0;
		scan = 0;
		old = root = 'p2';
		relocate_to_new(old);
		root = newreg;
		copy_loop();
		gc_flip();
	}

	function copy_loop(){
		var i = 0;
		while(free != scan  && i< 50){
			old = vect_ref(new_cars,scan);
			relocate_to_new(old);
			vect_set(new_cars,scan,newreg);
			old = vect_ref(new_cdrs,scan);	
			relocate_to_new(old);
			vect_set(new_cdrs,scan, newreg);
			scan += 1;	
			i++;
		}
	}

	function gc_flip(){
		var tmp = the_cars;
		the_cars = new_cars;
		new_cars = tmp;
		tmp = the_cdrs;
		the_cdrs = new_cdrs;
		new_cdrs = tmp;
	}

	function brokenheart(val){
		return val === 'broken';
	}

	function relocate_to_new(oldvalue){
		if(oldvalue[0] === 'p'){
			var oldindex = oldvalue.slice(1);
			var oldcr = vect_ref(the_cars,oldindex);
			if(brokenheart(oldcr)){
				newreg = vect_ref(the_cdrs,oldindex);
			}else{
				var newindex =  free;
				newreg = 'p' + newindex;
				free += 1;
				vect_set(new_cars,newindex,oldcr);
				oldcr = vect_ref(the_cdrs,oldindex);
				vect_set(new_cdrs,newindex,oldcr);
				vect_set(the_cars,oldindex,'broken');
				vect_set(the_cdrs,oldindex,newreg);
				
			}
		}else{
			newreg = oldvalue;
		}
	}

	
}



//libs for evaluator
//prim procedures in environment
function setup_global_environment(){
	var env = {};
	var memory = new Memory();
	env.cons = memory.cons;
	env.car = memory.car;
	env.cdr = memory.cdr;
	env.set_car = memory.set_car;
	env.set_cdr = memory.set_cdr;
	env.display = memory.display;
	
	env.lessthan = function(left,right){
		return left < right;
	}
	env.equal = function(left,right){
		return left == right;
	}
	env.bigthan = function(left,right){
		return left > right;
	}
	env.add = function(left,right){
		return parseFloat(left) + parseFloat(right);
	}
	env.rem = function(a,b){
		return a % b;
	}
	env.mul = function(a,b){
		return a * b;
	}
	env.sub = function(a,b){
		return a - b;
	}	
	// convert  to procedure  object
	Object.keys(env).forEach(function(funcName){
		 var obj ={};
		 obj.type = 'prim';
		 obj.func = env[funcName];
		 env[funcName] = obj;
	});
	env.false = false;  // false as vaiable , its value is false
	env.true = true;
	return env;
}

function jsmapping(shortName){
	var longName=shortName;
	switch(shortName){
		case '+':
		longName='add';
		break;
		case '-':
		longName='sub';
		break;
		case '*':
		longName='mul';
		break;
		case '%':
		longName='rem';
		break;
		case '<':
		longName='lessthan';
		break;
		case '>':
		longName='bigthan';
		break;	
		case '=':
		longName='equal';
		break;			
		default:
		break;
	}
	return longName;
}
