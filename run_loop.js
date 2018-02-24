////////////////////////////////////////////////////////       test part     //////////////////////////////////////////////////////////////////
//
var prims = setup_eval();
var parser = setup_parser();
var libs = Object.assign({},parser,prims);

// debug tools
function trace(data){
	console.log(data);
	tohtml(0,data);
}

 function tohtml(index,cmd,reg,stack){	
    var nreg='';
	var nstack='';
    cmd = cmd.replace('\n','</br>');
	 if(typeof(reg) !=='undefined')
	    nreg =reg.replace(/\n/g,'</br>');
	 if(typeof(stack) !=='undefined')
	    nstack =stack.replace(/\n/g,'</br>');
	var a = document.createElement('li');
	a.innerHTML=index +':  '+ cmd;
	a.innerHTML += '</br>' +index + ':regs: ' + nreg;
	a.innerHTML += '</br>' + index + ':stack: ' +nstack;
	document.getElementById('log').append(a);	
	
	//var b = document.createElement('li');
	//b.innerHTML = count() + reg;
	//document.getElementById('regs').append(b);	
 }
//
function test_evaluator(){	
	// write machine code here , and load into controller_text	
	var command_text= machine_code;		
    var ss = command_text.split(';');
	var controller_text=[];	
    for(var i=0;i< ss.length;i++){
		controller_text.push(ss[i]);
	}
	// setup machine
	var regs = ['val','continue','exp','env','proc','argl','unev'];	

	var m =  make_machine(regs);	
    
	// assemble machine with libs and machine code
	asseble(controller_text,m,libs);
	// env has frames list.  new frame in front, like stack
	// frame is key/value pairs.  implement by object
	var global_env = [];	
	var prims = setup_global_environment();
	global_env[0] = prims;
	
	m.set_reg('env',global_env);
	var done ={};
	done.type = 'label';
	done.name = 'done';
	m.set_reg('continue',done);
	
	//var test_exp = m.libs.gen('(define (fib n) (if (< n 2) n (+ (fib (- n 1)) (fib (- n 2)))))');	
	//m.set_reg('exp',test_exp);
	//m.start();
	
	m.pcindex = 0;   // reset pcindex  to the beginning  index 0
    //test_exp = m.libs.gen('(fib 1)');
	test_exp = m.libs.gen('(define a (cons 2 3))');
	m.set_reg('exp',test_exp);
	m.start();
	
	//m.pcindex = 0;   // reset pcindex  to the beginning  index 0
    //test_exp = m.libs.gen('(fib 1)');
	//test_exp = m.libs.gen('(set! a 5)');
	//m.set_reg('exp',test_exp);
	//m.start();
	
	console.log('Machine finish!');
	console.log('result  is ' + m.get_reg('val'));
}
