/* gen_g.js - hand-written MCQ banks for the BCA course (VMSB UTU Bachelor of Computer Applications):
   BCA-001 Programming using C, BCA-002 Basic Mathematics, BCA-003 Digital Electronics, BCA-006 Data Structures,
   BCA-007 Computer Organization & Architecture, BCA-008 Object-Oriented Programming using Java, BCA-009 Software Engineering.
   Units follow src/content/syllabus/BCA-0NN.json. Static questions are written by hand (right answer, three plausible
   wrong answers, one-line explanation); the parametrised ones compute their answer and, when globalThis.__GEN_VERIFY__ is set,
   re-check it with a second (brute-force) method. Helpers are prefixed bc. Uses mcq/rnd/pick from the shared module scope. */
const BC_VERIFY=(ok,msg)=>{if(globalThis.__GEN_VERIFY__&&!ok)throw new Error("gen_g verify failed: "+msg)};
const bq=(q,ok,bad,why)=>()=>mcq(q,ok,bad,why);
/* numeric answer with computed distractors: `cand` are plausible wrong values, padded with nearby numbers if too few */
const bcN=(q,ans,cand,why)=>{const a=String(ans),set=[];for(const c of cand){const s=String(c);if(s!==a&&!set.includes(s))set.push(s)}
 let k=1;while(set.length<3){const base=Math.max(1,Math.round(Math.abs(Number(ans))*0.1)),s=isNaN(Number(ans))?a+" ("+k+")":String(Number(ans)+(k%2?1:-1)*Math.ceil(k/2)*base);if(s!==a&&!set.includes(s))set.push(s);k++}
 return mcq(q,a,set.slice(0,3),why)};
const bcGcd=(a,b)=>b?bcGcd(b,a%b):a;
const bcFact=n=>n<=1?1:n*bcFact(n-1);
const bcBin=(n,w)=>n.toString(2).padStart(w,"0");

/* =========================================================== BCA-001 PROGRAMMING USING C */
genAdd("BCA-001",{
1:[
 bq("Which of the following is a valid identifier in C?","_total2",["2total","total-2","float"],"An identifier may use letters, digits and underscores, must not start with a digit, and must not be a keyword; _total2 satisfies all three rules."),
 bq("Which of these is a keyword of the C language?","register",["integer","string","boolean"],"register is a C storage-class keyword; integer, string and boolean are not C keywords (the type is called int, and C has no built-in string or boolean type in the classic language)."),
 ()=>{const a=rnd(11,29),b=rnd(2,6),q=Math.trunc(a/b),r=a%b;BC_VERIFY(q*b+r===a,"intdiv");
  return bcN(`In C, with <b>int a = ${a}, b = ${b};</b> what does printf("%d", a / b) print?`,q,[Math.round(a/b)===q?q+1:Math.round(a/b),r,q-1],`Both operands are int, so C performs integer division and drops the fractional part: ${a} / ${b} = ${q} (and ${a} % ${b} = ${r}).`)},
 bq("What is the value of the expression 5 + 3 * 2 - 4 / 2 in C?","9",["14","12","7"],"Multiplication and division bind tighter than + and -: 5 + 6 - 2 = 9."),
 bq("Which format specifier is used with printf to print a value of type double?","%f",["%d","%c","%s"],"%f prints floating-point values (a float is promoted to double in printf); %d is for int, %c for char and %s for strings."),
 ()=>{const a=rnd(1,15),b=rnd(1,15),op=pick(["&","|","^"]),v=op==="&"?a&b:op==="|"?a|b:a^b;
  const others=["&","|","^"].filter(o=>o!==op).map(o=>o==="&"?a&b:o==="|"?a|b:a^b);
  return bcN(`What is the value of <b>${a} ${op} ${b}</b> in C (bitwise operator on int values)?`,v,[...others,v+1],`${a} = ${bcBin(a,4)} and ${b} = ${bcBin(b,4)} in binary; applying ${op} bit by bit gives ${bcBin(v,4)} = ${v}.`)},
 bq("What is the result of the expression (5 > 3) && (2 > 4) in C?","0",["1","5","2"],"5 > 3 is true (1) but 2 > 4 is false (0); true && false is false, and C represents false as 0."),
 bq("After executing int a = 5; int b = a++; what are the values of a and b?","a = 6, b = 5",["a = 5, b = 5","a = 6, b = 6","a = 5, b = 6"],"Post-increment assigns the old value of a to b first and only then increases a."),
 bq("What is stored in m after: int m = (4 > 9) ? 4 : 9; ?","9",["4","0","1"],"The condition 4 > 9 is false, so the conditional operator yields its third operand, 9."),
 bq("What does printf(\"%f\", f) show after the declaration float f = 7 / 2; ?","3.000000",["3.500000","4.000000","3"],"7 / 2 is integer division and equals 3 before it is converted to float, so f holds 3.0 and %f prints 3.000000."),
 bq("Which escape sequence moves the cursor to the beginning of the next line when used in printf?","\\n",["\\t","\\b","\\0"],"\\n is the newline character; \\t is a tab, \\b a backspace and \\0 the null character."),
],
2:[
 ()=>{const s=rnd(0,3),k=rnd(2,4),n=rnd(12,30),c=Math.floor((n-s)/k)+1;let it=0;for(let i=s;i<=n;i+=k)it++;BC_VERIFY(it===c,"forcount");
  return bcN(`How many times does the body of <b>for (i = ${s}; i &lt;= ${n}; i += ${k})</b> execute?`,c,[c-1,c+1,Math.floor(n/k)],`i takes the values ${s}, ${s+k}, ${s+2*k}, ... while it is at most ${n}, which gives ${c} iterations.`)},
 bq("What does this code print: switch (2) { case 1: printf(\"A\"); case 2: printf(\"B\"); case 3: printf(\"C\"); break; default: printf(\"D\"); } ?","BC",["B","ABC","BCD"],"Execution starts at case 2 and, because there is no break after it, falls through into case 3, which ends with break."),
 bq("How many times is the message printed by: int i = 10; do { printf(\"hi\"); } while (i &lt; 5); ?","1",["0","5","10"],"A do-while loop tests its condition after the body, so the body always runs at least once."),
 bq("For int a[5] = {2, 4, 6}; what is the value of a[4]?","0",["6","a garbage value","2"],"When an array is partly initialised, the remaining elements are set to zero."),
 ()=>{const R=rnd(3,6),C=rnd(3,6),i=rnd(1,R-1),j=rnd(1,C-1),B=pick([1000,2000,3000,4000]),sz=pick([2,4,8]);const addr=B+(i*C+j)*sz;
  let pos=0,found=-1;for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(r===i&&c===j)found=pos;pos++}
  BC_VERIFY(B+found*sz===addr,"rowmajor");
  return bcN(`An array of ${sz}-byte elements declared as a[${R}][${C}] is stored in row-major order from base address ${B}. What is the address of a[${i}][${j}]?`,addr,[B+(j*R+i)*sz,B+(i*C+j),B+(i*C+j+1)*sz],`Row-major address = base + (i × columns + j) × size = ${B} + (${i} × ${C} + ${j}) × ${sz} = ${addr}.`)},
 bq("What is the valid range of subscripts for the array int a[10]?","0 to 9",["1 to 10","0 to 10","1 to 9"],"C arrays are zero-based, so an array of 10 elements has subscripts 0 through 9."),
 bq("What does the continue statement do inside a loop?","Skips the rest of the current iteration and goes on with the next one",["Leaves the loop completely","Stops the whole program","Restarts the loop from its first iteration"],"continue jumps to the loop's next iteration test (or update); break is the statement that leaves the loop."),
 bq("What is special about a static local variable inside a function?","It keeps its value between calls",["It is visible in every function","It is created on each call and destroyed on return","It cannot be modified"],"A static local variable is initialised once and lives for the whole program, so its value survives from one call to the next."),
 bq("Which of these loops is an exit-controlled loop, i.e. tests its condition after the body?","do-while",["for","while","nested if"],"do-while checks the condition at the bottom of each pass; for and while check it before the body."),
 bq("What does this code print: int x = 5, y = 0; if (x &gt; 3) if (y &gt; 0) printf(\"A\"); else printf(\"B\"); ?","B",["A","AB","nothing"],"The else belongs to the nearest if (y &gt; 0); x &gt; 3 is true and y &gt; 0 is false, so the else part prints B."),
 bq("What is the value of s after: int a[] = {3, 5, 7, 9}; int s = a[1] + a[3]; ?","14",["12","16","10"],"Subscripts start at 0, so a[1] = 5 and a[3] = 9, and their sum is 14."),
],
3:[
 bq("A function void swap(int x, int y) swaps its two parameters. After swap(a, b) is called from main, what happens to a and b?","They stay unchanged",["They are swapped","They both become 0","The program fails to compile"],"C passes arguments by value, so the function works on copies; the caller's variables are not changed unless pointers are used."),
 ()=>{const n=rnd(3,7),f=bcFact(n);let p=1;for(let i=2;i<=n;i++)p*=i;BC_VERIFY(p===f,"fact");
  return bcN(`What does <b>f(${n})</b> return for: int f(int n) { if (n &lt;= 1) return 1; return n * f(n - 1); } ?`,f,[f/n,f+n,bcFact(n-1)+n],`f(n) computes n!; so f(${n}) = ${Array.from({length:n},(_,i)=>n-i).join(" × ")} = ${f}.`)},
 bq("What is the purpose of a function prototype (declaration)?","To tell the compiler the function's name, return type and parameter types before it is used",["To allocate memory for the function's local variables","To run the function at compile time","To make the function recursive"],"A prototype lets the compiler check calls to a function that is defined later in the file or in another file."),
 ()=>{const n=rnd(5,10),a=[0,1];for(let i=2;i<=n+1;i++)a.push(a[i-1]+a[i-2]);
  const rec=m=>m<2?m:rec(m-1)+rec(m-2);BC_VERIFY(rec(n)===a[n],"fib");
  return bcN(`For the recursive function fib(n) = fib(n-1) + fib(n-2) with fib(0) = 0 and fib(1) = 1, what is fib(${n})?`,a[n],[a[n-1],a[n+1],a[n]+1],`The sequence runs 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, ...; the term with index ${n} is ${a[n]}.`)},
 bq("In the definition int add(int x, int y) { return x + y; } called as add(4, 5), the names x and y are called:","formal parameters",["actual arguments","global variables","return values"],"Parameters in the function definition are formal; the values supplied in the call (4 and 5) are the actual arguments."),
 bq("When an array name is passed to a function, what does the function actually receive?","The address of the first element",["A full copy of the array","The array's size only","The last element"],"An array name decays to a pointer to its first element, so changes made inside the function affect the caller's array."),
 bq("Which return type do you give to a function that does not return any value?","void",["null","int *","empty"],"void means that the function returns nothing."),
 bq("What happens if a recursive function has no base case?","It keeps calling itself until the stack overflows",["It returns 0 after one call","It runs once and stops","The compiler rejects it"],"Each call adds a stack frame; without a stopping condition the stack is eventually exhausted and the program crashes."),
 bq("A variable declared inside a function body (without static) is:","visible only inside that function",["visible in the whole file","stored for the lifetime of the program","shared by all functions"],"Such a local (auto) variable has block scope and is destroyed when the function returns."),
 ()=>{const p=pick([[48,18],[84,36],[100,75],[56,42],[90,27]]),g=bcGcd(p[0],p[1]);let h=1;for(let d=1;d<=Math.min(p[0],p[1]);d++)if(p[0]%d===0&&p[1]%d===0)h=d;BC_VERIFY(h===g,"gcd");
  return bcN(`What does gcd(${p[0]}, ${p[1]}) return for: int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); } ?`,g,[g*2,p[0]%p[1]||1,1+g],`This is Euclid's algorithm: the greatest common divisor of ${p[0]} and ${p[1]} is ${g}.`)},
 bq("How many values can a C function return directly through a single return statement?","One",["Two","As many as there are parameters","None"],"return hands back a single value; to give back more, a function uses pointers (output parameters) or a structure."),
],
4:[
 bq("What is printed by: int x = 10, *p = &x; *p = 20; printf(\"%d\", x); ?","20",["10","the address of x","30"],"p points to x, so assigning through *p changes x itself."),
 ()=>{const t=pick([["char",1],["short",2],["int",4],["double",8]]),base=pick([1000,2000,5000]),k=rnd(2,6),v=base+k*t[1];
  return bcN(`A ${t[0]} pointer p holds the address ${base}. Assuming a ${t[0]} occupies ${t[1]} byte${t[1]>1?"s":""}, what address does p + ${k} hold?`,v,[base+k,base+k*8,base+(k+1)*t[1]],`Pointer arithmetic scales by the size of the pointed-to type: ${base} + ${k} × ${t[1]} = ${v}.`)},
 ()=>{const w=pick(["HELLO","COMPUTER","POINTER","LANGUAGE","STRING","KEYBOARD"]);
  return bcN(`What does strlen("${w}") return?`,w.length,[w.length+1,w.length-1,w.length*2],`strlen counts the characters before the terminating '\\0'; "${w}" has ${w.length} of them (sizeof would give ${w.length+1}).`)},
 bq("How many bytes does the array char s[] = \"abc\"; occupy?","4",["3","2","5"],"The three characters plus the terminating null character make 4 bytes."),
 bq("If a is an int array, the expression *(a + 2) is equivalent to:","a[2]",["a[3]","&a[2]","a + 2"],"The subscript operator is defined through pointer arithmetic: a[i] means *(a + i)."),
 bq("What does a variable declared as int **pp store?","The address of a pointer to int",["The address of an int","An int value","The address of a char"],"A pointer to pointer holds the address of another pointer variable, which in turn points to an int."),
 bq("What does strcmp(s1, s2) return when the two strings are equal?","0",["1","-1","the length of the string"],"strcmp returns zero for equal strings, a negative value if s1 is smaller and a positive value if s1 is greater."),
 bq("What usually happens when a program dereferences a NULL pointer?","It crashes with a segmentation fault",["It reads the value 0 safely","It allocates new memory","The compiler fixes the pointer"],"NULL points to no valid object; accessing memory through it is an error that the operating system normally stops with a segmentation fault."),
 bq("Which header file declares string functions such as strcpy, strlen and strcat?","string.h",["stdio.h","stdlib.h","math.h"],"The standard string-handling functions are declared in string.h."),
 bq("What does the unary operator & do when applied to a variable?","It gives the address of the variable",["It gives the value stored at an address","It performs a bitwise OR","It declares a pointer"],"&x is the address-of operator; the dereference operator * is its opposite."),
],
5:[
 bq("On a typical compiler with 4-byte int and natural alignment, what is sizeof(struct { char c; int i; })?","8",["5","4","1"],"The char is followed by 3 padding bytes so that the int starts on a 4-byte boundary: 1 + 3 + 4 = 8."),
 bq("On a typical compiler, what is sizeof(union { int i; double d; char c; })?","8",["13","4","1"],"A union is as large as its largest member, here the 8-byte double; all members share the same memory."),
 bq("If p is a pointer to a structure, how do you access its member roll?","p->roll",["p.roll","*p->roll","p::roll"],"The arrow operator dereferences the pointer and selects the member, same as (*p).roll."),
 bq("Which fopen mode opens a text file so that new data is added at its end?","\"a\"",["\"r\"","\"w\"","\"rb\""],"Mode \"a\" (append) writes at the end and creates the file if it does not exist."),
 bq("What happens to an existing file when it is opened with fopen(name, \"w\")?","Its old contents are discarded",["Its contents are kept and new data is appended","It is opened read-only","It is deleted after reading"],"Write mode truncates the file to zero length (or creates it)."),
 bq("What does fopen return when the file cannot be opened?","NULL",["0 as an int","-1","EOF"],"fopen returns a null FILE pointer on failure, which should always be checked."),
 ()=>{const n=rnd(1,6);return bcN(`A program is started as <b>./prog${Array.from({length:n},(_,i)=>" arg"+(i+1)).join("")}</b>. What is the value of argc inside main?`,n+1,[n,n+2,n-1<1?n+3:n-1],`argc counts the program name itself plus the ${n} argument${n>1?"s":""}, i.e. ${n+1}.`)},
 ()=>{const k=pick([["enum {RED, GREEN, BLUE, WHITE}","WHITE",3],["enum {A, B, C, D, E}","E",4],["enum {X = 5, Y, Z}","Z",7],["enum {P = 10, Q, R, S}","S",13]]);
  return bcN(`In ${k[0]};, what integer value does ${k[1]} have?`,k[2],[k[2]+1,k[2]-1,0],"Enumeration constants count up from 0 unless a value is given; each later name is one more than the previous.")},
 bq("What is the main purpose of typedef?","To give a new name (alias) to an existing type",["To create a new memory block","To define a macro","To open a file"],"typedef does not create a new type; it just gives a convenient alternative name to an existing one."),
 bq("In a union, the members:","share the same memory location",["are stored one after another","can only be of type int","are always initialised to zero"],"All members of a union overlap, so only one of them holds a meaningful value at a time."),
 bq("Why should a program call fclose() when it has finished with a file?","To flush buffered data and release the file",["To delete the file","To rewind to the first line","To check if the file exists"],"fclose writes out any buffered output and frees the resources tied to the FILE object."),
],
});

/* =========================================================== BCA-002 BASIC MATHEMATICS */
const bcPhi=n=>{let c=0;for(let k=1;k<=n;k++)if(bcGcd(n,k)===1)c++;return c};
const bcC=(n,r)=>{if(r<0||r>n)return 0;let x=1;for(let i=1;i<=r;i++)x=x*(n-r+i)/i;return Math.round(x)};
const bcP=(n,r)=>{let x=1;for(let i=0;i<r;i++)x*=n-i;return x};
genAdd("BCA-002",{
1:[
 bq("What is the contrapositive of the statement p → q?","¬q → ¬p",["q → p","¬p → ¬q","p → ¬q"],"The contrapositive swaps and negates both parts; it is always logically equivalent to the original implication."),
 bq("In which single case is the implication p → q false?","p is true and q is false",["p is false and q is true","p and q are both false","p and q are both true"],"A promise is broken only when the condition holds but the conclusion does not."),
 bq("Which of the following is a tautology?","p ∨ ¬p",["p ∧ ¬p","p → ¬p","p ∧ q"],"p ∨ ¬p is true whatever the truth value of p; p ∧ ¬p is a contradiction."),
 ()=>{const n=rnd(2,6);return bcN(`How many rows does the truth table of a compound statement with ${n} distinct variables have?`,2**n,[n*n,2*n,2**(n-1)],`Each variable can be true or false, so there are 2<sup>${n}</sup> = ${2**n} combinations.`)},
 bq("By De Morgan's law, ¬(p ∧ q) is equivalent to:","¬p ∨ ¬q",["¬p ∧ ¬q","p ∨ q","¬p → q"],"De Morgan: the negation of a conjunction is the disjunction of the negations."),
 bq("What is the negation of the statement \"for every x, P(x)\", written ∀x P(x)?","∃x ¬P(x)",["∀x ¬P(x)","∃x P(x)","¬∃x P(x)"],"To deny that P holds for all x, it is enough that there is some x for which P fails."),
 bq("When is the biconditional p ↔ q true?","When p and q have the same truth value",["Only when both are true","Only when p is true","When p and q have different truth values"],"p ↔ q means (p → q) ∧ (q → p), which is true for TT and FF."),
 bq("A formula in two variables is true in exactly three rows of its truth table. How many minterms are there in its PDNF?","3",["1","2","4"],"The principal disjunctive normal form has one minterm for every row in which the formula is true."),
 bq("The statement ¬(p → q) is logically equivalent to:","p ∧ ¬q",["¬p ∧ q","¬p ∨ q","p ∨ ¬q"],"p → q is ¬p ∨ q; negating it gives p ∧ ¬q."),
 bq("From the premises \"p → q\" and \"p\", which rule of inference lets you conclude q?","Modus ponens",["Modus tollens","Hypothetical syllogism","Disjunctive syllogism"],"Modus ponens: if p implies q and p is true, then q is true."),
],
2:[
 ()=>{const a=rnd(8,30),b=rnd(8,30),c=rnd(2,Math.min(a,b)-1),u=a+b-c;
  return bcN(`If |A| = ${a}, |B| = ${b} and |A ∩ B| = ${c}, what is |A ∪ B|?`,u,[a+b,u+c,a+b+c],`Inclusion-exclusion: |A ∪ B| = |A| + |B| − |A ∩ B| = ${a} + ${b} − ${c} = ${u}.`)},
 ()=>{const n=rnd(3,8);return bcN(`How many subsets does a set with ${n} elements have?`,2**n,[n*n,2*n,2**n-1],`Each element is either in or out of a subset, so there are 2<sup>${n}</sup> = ${2**n} subsets (the empty set and the whole set included).`)},
 ()=>{const n=pick([2,3,4]),v=2**(n*(n-1));return bcN(`How many reflexive relations can be defined on a set with ${n} elements?`,v,[2**(n*n),2**n,2**(n*(n+1)/2)],`All ${n} pairs (a, a) are forced; each of the other ${n*(n-1)} ordered pairs may be present or not, giving 2<sup>${n*(n-1)}</sup> = ${v}.`)},
 bq("A relation that is reflexive, symmetric and transitive is called a(n):","equivalence relation",["partial order","function","lattice"],"These three properties define an equivalence relation; it splits the set into equivalence classes (a partition)."),
 bq("A relation that is reflexive, antisymmetric and transitive is called a:","partial order",["equivalence relation","total function","tautology"],"A set together with such a relation is a partially ordered set (poset); its picture is a Hasse diagram."),
 bq("For the poset of divisors of 12 under divisibility, how many elements does its Hasse diagram have?","6",["4","5","12"],"The divisors of 12 are 1, 2, 3, 4, 6 and 12."),
 bq("On A = {1, 2, 3}, the relation R = {(1,1), (2,2), (3,3), (1,2)} is:","reflexive and antisymmetric, but not symmetric",["symmetric and transitive only","an equivalence relation","not reflexive"],"All (a, a) are present, (1,2) has no reverse pair (so it is antisymmetric but not symmetric)."),
 bq("Which algorithm is used to compute the transitive closure of a relation?","Warshall's algorithm",["Euclid's algorithm","Kruskal's algorithm","Booth's algorithm"],"Warshall's algorithm builds the transitive closure of a relation from its Boolean matrix."),
 bq("The set difference A − B is equal to:","A ∩ B′",["A ∪ B′","A′ ∩ B","A′ ∪ B′"],"A − B contains the elements of A that are not in B, i.e. A intersected with the complement of B."),
 ()=>{const a=rnd(10,20),b=rnd(10,20),c=rnd(10,20),ab=rnd(2,6),bc=rnd(2,6),ac=rnd(2,6),abc=rnd(1,2),u=a+b+c-ab-bc-ac+abc;
  return bcN(`For three sets, |A| = ${a}, |B| = ${b}, |C| = ${c}, |A∩B| = ${ab}, |B∩C| = ${bc}, |A∩C| = ${ac} and |A∩B∩C| = ${abc}. Find |A ∪ B ∪ C|.`,u,[u-abc,a+b+c,u+abc],`|A∪B∪C| = ${a}+${b}+${c} − ${ab} − ${bc} − ${ac} + ${abc} = ${u}.`)},
 bq("In the lattice of all subsets of {a, b, c} ordered by ⊆, what is the complement of {a}?","{b, c}",["{a, b, c}","{a}","{b}"],"The complement of a set is the one that joins it to the top element {a, b, c} and meets it at the empty set; that is {b, c}."),
],
3:[
 bq("What is the inverse of the function f(x) = 2x + 3?","(x − 3)/2",["(x + 3)/2","2x − 3","1/(2x + 3)"],"Put y = 2x + 3, solve for x: x = (y − 3)/2."),
 ()=>{const n=rnd(4,7),m=rnd(2,3),v=bcP(n,m);let c=1;for(let i=0;i<m;i++)c*=n-i;BC_VERIFY(c===v,"inj");
  return bcN(`How many one-to-one (injective) functions are there from a set with ${m} elements to a set with ${n} elements?`,v,[n**m,bcC(n,m),m**n],`The first element has ${n} choices, the next ${n-1}${m>2?", and so on":""}: ${n}P${m} = ${v}.`)},
 bq("A function that is both injective and surjective is called:","bijective",["constant","periodic","idempotent"],"A bijection pairs every element of the domain with exactly one element of the codomain, and vice versa, so an inverse exists."),
 bq("Why is f: R → R defined by f(x) = x² not one-to-one?","Because f(2) = f(−2)",["Because it is not defined at 0","Because it is not continuous","Because f(x) is always positive"],"Two different inputs, 2 and −2, give the same output 4."),
 ()=>{const a=rnd(2,5),b=rnd(1,6),c=rnd(2,4),d=rnd(1,5),t=rnd(1,5),v=a*(c*t+d)+b;
  return bcN(`If f(x) = ${a}x + ${b} and g(x) = ${c}x + ${d}, what is (f ∘ g)(${t})?`,v,[c*(a*t+b)+d,a*t+b+c*t+d,v+a],`(f ∘ g)(${t}) = f(g(${t})) = f(${c*t+d}) = ${a} × ${c*t+d} + ${b} = ${v}.`)},
 bq("Which property is NOT required for a set with a binary operation to be a group?","Commutativity",["Closure","Associativity","Existence of an inverse for every element"],"A group needs closure, associativity, an identity and inverses; if it is also commutative it is called an abelian group."),
 bq("Which of the following is a group?","The integers under addition",["The natural numbers under addition","The integers under multiplication","The integers under subtraction"],"(Z, +) has closure, associativity, identity 0 and inverses −a; the others lack an identity, inverses or associativity."),
 ()=>{const n=pick([6,8,9,10,12]),a=pick([2,3,4]).valueOf(),g=bcGcd(a,n),v=n/g;let o=1,x=a%n;while(x!==0){x=(x+a)%n;o++}BC_VERIFY(o===v,"order");
  return bcN(`What is the order of the element ${a} in the group (Z<sub>${n}</sub>, + mod ${n})?`,v,[n,n-a>0?n-a:1,g],`The order is the smallest k with k × ${a} ≡ 0 (mod ${n}); it equals ${n}/gcd(${a}, ${n}) = ${v}.`)},
 bq("Which of these cannot be the order of a subgroup of a group of order 12?","5",["3","4","6"],"By Lagrange's theorem the order of a subgroup divides the order of the group, and 5 does not divide 12."),
 ()=>{const n=pick([7,8,9,10,12]),v=bcPhi(n);return bcN(`How many generators does a cyclic group of order ${n} have?`,v,[n-1,n/2|0,v+1],`The generators are the powers a<sup>k</sup> with gcd(k, ${n}) = 1; there are φ(${n}) = ${v} of them.`)},
],
4:[
 ()=>{const n=rnd(6,12),r=rnd(2,4),v=bcP(n,r);return bcN(`In how many ways can ${r} different prizes be given to ${n} students if no student gets more than one prize?`,v,[bcC(n,r),n**r,v+n],`The number of ordered selections is <sup>${n}</sup>P<sub>${r}</sub> = ${v}.`)},
 ()=>{const n=rnd(6,12),r=rnd(2,4),v=bcC(n,r);const t=[1];for(let i=1;i<=n;i++){const nx=[1];for(let j=1;j<i;j++)nx.push(t[j-1]+t[j]);nx.push(1);t.length=0;t.push(...nx)}BC_VERIFY(t[r]===v,"pascal");
  return bcN(`A committee of ${r} members is to be chosen from ${n} people. In how many ways can this be done?`,v,[bcP(n,r),v+n,bcC(n,r+1)],`Order does not matter, so the count is <sup>${n}</sup>C<sub>${r}</sub> = ${v}.`)},
 ()=>{const w=pick(["LEVEL","BANANA","TOOTH","APPLE","SEVEN"]);const c={};for(const ch of w)c[ch]=(c[ch]||0)+1;let v=bcFact(w.length);for(const k in c)v/=bcFact(c[k]);
  const seen=new Set();const perm=(s,cur)=>{if(!s.length){seen.add(cur);return}for(let i=0;i<s.length;i++)perm(s.slice(0,i)+s.slice(i+1),cur+s[i])};perm(w,"");BC_VERIFY(seen.size===v,"anagram");
  return bcN(`How many different arrangements can be made from all the letters of the word ${w}?`,v,[bcFact(w.length),v*2,v/2],`${w.length}! divided by the factorials of the repeated letters' counts gives ${v}.`)},
 ()=>{const n=rnd(5,9);return bcN(`In how many ways can ${n} people sit around a circular table (rotations count as the same seating)?`,bcFact(n-1),[bcFact(n),bcFact(n-2),n*(n-1)],`Fixing one person removes the rotations, leaving (${n} − 1)! = ${bcFact(n-1)}.`)},
 ()=>{const n=rnd(20,60),k=rnd(5,12),v=Math.ceil(n/k);return bcN(`What is the least number of people among ${n} people who must share the same birth month if there are ${k} months (boxes)? (pigeonhole principle)`,v,[Math.floor(n/k),v+1,k],`By the pigeonhole principle at least ⌈${n}/${k}⌉ = ${v} people must fall in one box.`)},
 ()=>{const n=rnd(5,9),k=rnd(2,4);return bcN(`What is the coefficient of x<sup>${k}</sup> in the expansion of (1 + x)<sup>${n}</sup>?`,bcC(n,k),[bcP(n,k),bcC(n,k+1),n*k],`By the binomial theorem the coefficient is <sup>${n}</sup>C<sub>${k}</sub> = ${bcC(n,k)}.`)},
 ()=>{const n=rnd(4,10);return bcN(`What is the sum of all the binomial coefficients <sup>${n}</sup>C<sub>0</sub> + <sup>${n}</sup>C<sub>1</sub> + ... + <sup>${n}</sup>C<sub>${n}</sub>?`,2**n,[2**n-1,n*n,2**(n+1)],`Putting x = 1 in (1 + x)<sup>${n}</sup> gives 2<sup>${n}</sup> = ${2**n}.`)},
 ()=>{const s=rnd(3,5),t=rnd(3,5);return bcN(`A shop has ${s} kinds of shirts and ${t} kinds of trousers. In how many ways can one shirt and one pair of trousers be chosen?`,s*t,[s+t,s*t*2,s*t-1],`Fundamental counting principle: ${s} × ${t} = ${s*t}.`)},
 ()=>{const n=rnd(4,12);let c=0;for(let a=0;a<=n;a++)for(let b=0;b<=n-a;b++)c++;BC_VERIFY(c===bcC(n+2,2),"stars");
  return bcN(`How many non-negative integer solutions does x<sub>1</sub> + x<sub>2</sub> + x<sub>3</sub> = ${n} have?`,bcC(n+2,2),[bcC(n,2),bcC(n+3,3),n*3],`Stars and bars: <sup>${n}+2</sup>C<sub>2</sub> = ${bcC(n+2,2)}.`)},
 ()=>{const n=rnd(8,40);return bcN(`If every one of ${n} people shakes hands exactly once with each of the others, how many handshakes take place?`,n*(n-1)/2,[n*(n-1),n*n,n*(n+1)/2],`Each pair shakes hands once: <sup>${n}</sup>C<sub>2</sub> = ${n}×${n-1}/2 = ${n*(n-1)/2}.`)},
],
5:[
 ()=>{const g=pick([2,3,4,5,6,7]),a=g*pick([3,4,5,7,8]),b=g*pick([2,5,9,11]);let h=1;for(let d=1;d<=Math.min(a,b);d++)if(a%d===0&&b%d===0)h=d;BC_VERIFY(h===bcGcd(a,b),"gcd");const v=bcGcd(a,b);
  return bcN(`Find gcd(${a}, ${b}).`,v,[a%b||b,v*2,a*b/v],`Euclid's algorithm repeatedly replaces the pair (a, b) by (b, a mod b) until the remainder is 0; the last non-zero value is ${v}.`)},
 ()=>{const p=pick([[12,18],[8,20],[15,25],[14,21],[9,12]]),v=p[0]*p[1]/bcGcd(p[0],p[1]);return bcN(`What is lcm(${p[0]}, ${p[1]})?`,v,[p[0]*p[1],bcGcd(p[0],p[1]),v/2],`lcm(a, b) = a × b / gcd(a, b) = ${p[0]*p[1]} / ${bcGcd(p[0],p[1])} = ${v}.`)},
 ()=>{const b=rnd(5,9),a=b*rnd(4,9)+rnd(1,b-1),q=Math.floor(a/b),r=a%b;BC_VERIFY(b*q+r===a,"div");
  return bcN(`By the division algorithm, dividing ${a} by ${b} leaves the quotient q and the remainder r (a = bq + r, 0 ≤ r &lt; b). What is the remainder?`,r,[q,b-r,r+1],`${a} = ${b} × ${q} + ${r}, so the remainder is ${r}.`)},
 ()=>{const a=rnd(2,9),e=rnd(3,9),m=pick([5,7,11,13]);let v=1;for(let i=0;i<e;i++)v=v*a%m;
  return bcN(`What is ${a}<sup>${e}</sup> mod ${m}?`,v,[(v+1)%m,(v+2)%m,a%m===v?(v+3)%m:a%m],`Multiply step by step, reducing mod ${m} each time: ${a}<sup>${e}</sup> ≡ ${v} (mod ${m}).`)},
 ()=>{const p=pick([5,7,11,13]),a=pick([2,3,4]);let v=1;for(let i=0;i<p-1;i++)v=v*a%p;BC_VERIFY(v===1,"fermat");
  return bcN(`Using Fermat's little theorem, what is ${a}<sup>${p-1}</sup> mod ${p}?`,1,[0,a,p-1],`For a prime p that does not divide a, a<sup>p−1</sup> ≡ 1 (mod p); here p = ${p}.`)},
 ()=>{const n=pick([14,15,21,22,26,35]),v=bcPhi(n);return bcN(`What is Euler's totient φ(${n}), the count of integers from 1 to ${n} that are coprime to ${n}?`,v,[n-1,n/2|0,v+2],`${n} is a product of two primes p and q, and φ(pq) = (p − 1)(q − 1) = ${v}.`)},
 ()=>{const m=pick([5,7,11]),a=rnd(2,m-1),b=rnd(1,m-1);let x=-1;for(let i=0;i<m;i++)if(a*i%m===b){x=i;break}BC_VERIFY(x>=0,"cong");
  return bcN(`Solve the linear congruence ${a}x ≡ ${b} (mod ${m}) for x in {0, 1, ..., ${m-1}}.`,x,[(x+1)%m,(x+2)%m,(m-x)%m===x?(x+3)%m:(m-x)%m],`Because ${m} is prime, ${a} has an inverse mod ${m}; trying x = ${x} gives ${a}×${x} = ${a*x} ≡ ${b} (mod ${m}).`)},
 bq("The Fundamental Theorem of Arithmetic says that every integer greater than 1:","can be written as a product of primes in exactly one way (apart from order)",["is a prime number","is divisible by 2 or 3","has exactly two divisors"],"Prime factorisation exists and is unique up to the order of the factors."),
 bq("Which of the following numbers is prime?","83",["91","87","57"],"91 = 7 × 13, 87 = 3 × 29 and 57 = 3 × 19, but 83 has no divisor other than 1 and itself."),
 bq("Which pair (x, y) satisfies 35x + 15y = 5, as given by the extended Euclidean algorithm?","(1, −2)",["(2, −1)","(−1, 2)","(1, 2)"],"35 × 1 + 15 × (−2) = 35 − 30 = 5, and gcd(35, 15) = 5."),
 bq("Which pair of numbers is coprime?","8 and 15",["12 and 18","9 and 27","14 and 21"],"gcd(8, 15) = 1, while the other pairs share a factor of 6, 9 and 7 respectively."),
],
});

/* =========================================================== BCA-003 DIGITAL ELECTRONICS */
genAdd("BCA-003",{
1:[
 ()=>{const n=rnd(17,63),s=bcBin(n,6);return bcN(`Convert the binary number ${s} to decimal.`,n,[n+1,n-2,parseInt(s.split("").reverse().join(""),2)],`Add the place values of the 1 bits (32, 16, 8, 4, 2, 1): ${s}<sub>2</sub> = ${n}.`)},
 ()=>{const n=rnd(20,200),s=bcBin(n,8).replace(/^0+/,"");BC_VERIFY(parseInt(s,2)===n,"d2b");
  return bcN(`Convert the decimal number ${n} to binary.`,s,[bcBin(n+1,8).replace(/^0+/,""),bcBin(n-1,8).replace(/^0+/,""),bcBin(n+3,8).replace(/^0+/,"")],`Repeated division by 2 (or subtracting powers of two) gives ${s}.`)},
 ()=>{const n=rnd(32,250),h=n.toString(16).toUpperCase();BC_VERIFY(parseInt(h,16)===n,"hex");
  return bcN(`What is the decimal value of the hexadecimal number ${h}<sub>16</sub>?`,n,[n+16,n-1,parseInt(h.split("").reverse().join(""),16)],`Each hex digit is worth 16 times the next one: ${h}<sub>16</sub> = ${n}.`)},
 ()=>{const n=rnd(5,100),v=bcBin(256-n,8);BC_VERIFY(((~n+1)&255)===256-n,"twos");
  return bcN(`What is the 8-bit 2's complement representation of −${n}?`,v,[bcBin(n,8),bcBin(255-n,8),bcBin(257-n,8)],`Invert the bits of ${bcBin(n,8)} and add 1, giving ${v} (which equals 256 − ${n}).`)},
 bq("By the absorption law, A + A·B simplifies to:","A",["B","A·B","A + B"],"A + AB = A(1 + B) = A, so B has no influence."),
 bq("According to De Morgan's theorem, (A·B)′ equals:","A′ + B′",["A′ · B′","A + B","A · B′"],"The complement of an AND is the OR of the complements."),
 bq("Simplify the expression AB + AB′.","A",["B","AB","A + B"],"AB + AB′ = A(B + B′) = A."),
 ()=>{const n=rnd(5,15),g=n^(n>>1),b4=bcBin(n,4),gs=bcBin(g,4);
  return bcN(`What is the 4-bit Gray code equivalent of the binary number ${b4}?`,gs,[bcBin(n+1,4).length===4?bcBin(n+1,4):b4,bcBin(g^1,4),bcBin(g^8,4)],`Keep the MSB, then XOR each bit with the previous binary bit: ${b4} → ${gs}.`)},
 ()=>{const k=rnd(1,3);return bcN(`In a Karnaugh map, a group of ${2**k} adjacent 1s eliminates how many variables from the product term?`,k,[k+1,2**k,Math.max(0,k-1)],`A group of 2<sup>k</sup> cells removes k variables; ${2**k} cells remove ${k}.`)},
 bq("Which gate (or pair of gates) is called a universal gate because any logic function can be built from it alone?","NAND",["XOR","AND","OR"],"NAND (and NOR) can be combined to produce NOT, AND and OR, so they are universal."),
 ()=>{const n=rnd(12,98),t=Math.floor(n/10),u=n%10,v=bcBin(t,4)+" "+bcBin(u,4);return bcN(`Write the decimal number ${n} in 8421 BCD.`,v,[bcBin(n,8).slice(0,4)+" "+bcBin(n,8).slice(4),bcBin(u,4)+" "+bcBin(t,4),bcBin(t+1,4)+" "+bcBin(u,4)],`Each decimal digit is coded separately in 4 bits: ${t} → ${bcBin(t,4)}, ${u} → ${bcBin(u,4)}.`)},
],
2:[
 ()=>{const n=rnd(2,4);return bcN(`How many output lines does a decoder with ${n} input lines have?`,2**n,[n,2*n,n*n],`An n-to-2<sup>n</sup> decoder activates exactly one of 2<sup>${n}</sup> = ${2**n} outputs.`)},
 ()=>{const k=rnd(2,4);return bcN(`How many select lines does a ${2**k}:1 multiplexer need?`,k,[2**k,k+1,2**k-1],`${2**k} data inputs need log<sub>2</sub>(${2**k}) = ${k} select bits.`)},
 bq("In a half adder, the Sum and Carry outputs are given by:","Sum = A ⊕ B, Carry = A · B",["Sum = A · B, Carry = A ⊕ B","Sum = A + B, Carry = A + B","Sum = A′B, Carry = AB′"],"Adding two bits gives 0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 10: the sum bit is XOR and the carry is AND."),
 ()=>{const a=rnd(0,1),b=rnd(0,1),c=rnd(0,1),t=a+b+c,s=t&1,co=t>>1;const v=`Sum = ${s}, Carry = ${co}`;
  const alt=[`Sum = ${1-s}, Carry = ${co}`,`Sum = ${s}, Carry = ${1-co}`,`Sum = ${1-s}, Carry = ${1-co}`];
  return bcN(`A full adder has inputs A = ${a}, B = ${b} and Cin = ${c}. What are its outputs?`,v,alt,`${a} + ${b} + ${c} = ${t} = ${bcBin(t,2)} in binary, so the sum bit is ${s} and the carry-out is ${co}.`)},
 bq("A full adder can be built from:","two half adders and an OR gate",["one half adder and an AND gate","three half adders","two OR gates and an inverter"],"The first half adder adds A and B, the second adds the result to Cin, and an OR gate combines the two carries."),
 bq("What does a priority encoder do when more than one input is high?","It encodes the input with the highest priority",["It outputs all-zeros","It encodes the lowest input","It turns itself off"],"A priority encoder resolves multiple active inputs by giving the code of the highest-priority one."),
 bq("What are the outputs of a 1-bit magnitude comparator?","A &gt; B, A = B and A &lt; B",["Sum and Carry","Difference and Borrow","Q and Q′"],"A comparator has three outputs, exactly one of which is high for any pair of inputs."),
 bq("Why is a ripple-carry adder slow for many bits?","Each stage must wait for the carry from the previous stage",["It uses more gates than any other adder","It cannot add negative numbers","It works only on BCD"],"The carry propagates through all the stages in turn, so delay grows with the number of bits; a carry-look-ahead adder shortens it."),
 ()=>{const k=pick([16,64]),v=k===16?5:21;return bcN(`How many 4:1 multiplexers are needed to build a ${k}:1 multiplexer?`,v,[k/4,v-1,k/2],k===16?"Four 4:1 muxes pick one input from each group of four, and a fifth 4:1 mux selects among their outputs: 4 + 1 = 5.":"16 first-level muxes, 4 second-level and 1 final mux: 16 + 4 + 1 = 21.")},
 bq("In a half subtractor, the Difference and Borrow outputs are:","Difference = A ⊕ B, Borrow = A′·B",["Difference = A · B, Borrow = A ⊕ B","Difference = A + B, Borrow = A · B′","Difference = A′ + B, Borrow = A ⊕ B"],"A − B differs when the bits differ (XOR), and a borrow is needed only when A = 0 and B = 1."),
],
3:[
 bq("What is the invalid (forbidden) input condition of an SR flip-flop built from NOR gates?","S = 1 and R = 1",["S = 0 and R = 0","S = 1 and R = 0","S = 0 and R = 1"],"With both inputs high both outputs are forced to 0, and the next state is unpredictable when they are released together."),
 bq("What does a JK flip-flop do when J = K = 1 and a clock pulse arrives?","It toggles its output",["It resets","It sets","It holds its state"],"J = K = 1 makes the next state equal to the complement of the present state."),
 bq("For a D flip-flop, the next state Q(t+1) equals:","D",["D′","Q(t)","Q(t)′"],"A D flip-flop simply copies the input D into Q at the clock edge."),
 bq("A T flip-flop with T = 1 and a clock of frequency f gives an output frequency of:","f/2",["f","2f","f/4"],"The output toggles once per clock pulse, so it completes one cycle every two clock cycles."),
 ()=>{const N=pick([5,6,10,12,16,60,100]);let k=0;while(2**k<N)k++;BC_VERIFY(2**k>=N&&2**(k-1)<N,"ff");
  return bcN(`What is the minimum number of flip-flops needed to build a mod-${N} counter?`,k,[k+1,k-1,N],`n flip-flops give 2<sup>n</sup> states; the smallest n with 2<sup>n</sup> ≥ ${N} is ${k}.`)},
 ()=>{const f=pick([64,128,256,640,1600]);return bcN(`A 4-bit ripple counter is clocked at ${f} kHz. What is the frequency (in kHz) of its most significant output bit?`,f/16,[f/8,f/4,f/32],`Each stage halves the frequency; four stages divide by 2<sup>4</sup> = 16, giving ${f/16} kHz.`)},
 ()=>{const n=rnd(4,12);return bcN(`How many clock pulses are needed to load an ${n}-bit word into a serial-in shift register?`,n,[n-1,n+1,2*n],`One bit enters per clock pulse, so ${n} bits need ${n} pulses.`)},
 ()=>{const n=rnd(3,8);return bcN(`How many distinct states does an ${n}-bit Johnson (twisted-ring) counter have?`,2*n,[n,2**n,n+1],`A Johnson counter feeds back the complement of the last stage, giving 2n = ${2*n} states (a plain ring counter has only ${n}).`)},
 bq("What problem does a master-slave JK flip-flop solve?","The race-around condition when J = K = 1",["The invalid state of the SR flip-flop","Contact bounce","Power-supply noise"],"Master-slave construction makes the output change only once per clock pulse, so the output cannot toggle repeatedly while the clock is high."),
 bq("How can a JK flip-flop be converted into a T flip-flop?","Connect J and K together to form the input T",["Connect J to Q and K to Q′","Tie J = 1 and K = 0","Tie J to K′"],"With J = K = T, the flip-flop toggles when T = 1 and holds when T = 0."),
],
4:[
 bq("In a Moore machine the output depends on:","the present state only",["the present state and the present input","the input only","the clock frequency"],"A Mealy machine uses both state and input; a Moore machine's output is a function of the state alone."),
 bq("What is the aim of state reduction in sequential circuit design?","To remove equivalent states and save flip-flops and gates",["To add redundant states","To increase the clock rate","To remove the clock"],"Two states with identical outputs and equivalent next-states can be merged, giving a cheaper circuit."),
 ()=>{const m=rnd(5,30);let k=0;while(2**k<m)k++;return bcN(`A synchronous sequential circuit has ${m} states. What is the minimum number of flip-flops needed to encode them?`,k,[k+1,m,k-1],`The smallest k with 2<sup>k</sup> ≥ ${m} is ${k}.`)},
 bq("A critical race occurs in an asynchronous circuit when:","the final stable state depends on the order in which state variables change",["two flip-flops share the same clock","the output is always 1","the inputs are changed slowly"],"If different change orders lead to different stable states, the circuit is unreliable; state assignment is used to avoid it."),
 bq("A static-1 hazard is a situation in which:","an output that should stay at 1 briefly drops to 0",["an output stays at 0 forever","an output toggles on every clock","two outputs become equal"],"It appears when one input changes and two gates, covering the 1, switch at slightly different times."),
 bq("How can a static-1 hazard in a sum-of-products circuit be removed?","By adding a redundant (consensus) product term that covers the transition",["By removing all inverters","By lowering the supply voltage","By using a slower clock"],"The extra term keeps the output high while the other terms change over."),
 bq("What is fundamental mode operation of an asynchronous circuit?","Only one input changes at a time and the circuit is allowed to settle first",["All inputs change together","A clock is applied to every gate","Outputs change only on a rising edge"],"This assumption keeps the circuit analysis simple and free of multiple-input races."),
 bq("What are the JK flip-flop excitation inputs for a transition of Q from 0 to 1?","J = 1, K = X (don't care)",["J = 0, K = 1","J = X, K = 1","J = 0, K = 0"],"To reach 1 from 0, either set (J = 1, K = 0) or toggle (J = 1, K = 1) works, so K is a don't-care."),
 bq("In an asynchronous design, why is state assignment important?","Adjacent states should differ in one bit to avoid critical races",["It reduces the clock rate","It removes the need for flip-flops","It makes the circuit synchronous"],"A single-bit change per transition cannot cause a race between state variables."),
 bq("What does it mean when a counter 'locks out'?","It enters an unused state and never returns to the valid sequence",["It counts too fast","It stops when the clock stops","It resets every cycle"],"Unused states in a counter must be steered back to the main sequence to make it self-starting."),
],
5:[
 bq("What is the purpose of the totem-pole output stage in a TTL gate?","Active pull-up for a low output impedance and fast switching",["To store charge","To raise the supply voltage","To work as a clock"],"The upper transistor actively pulls the output up and the lower one pulls it down, giving fast edges in both directions."),
 bq("What is the main advantage of CMOS logic over TTL?","Very low static power consumption",["Higher switching speed than ECL","No power supply needed","Higher output current"],"A CMOS gate draws appreciable current only while it switches."),
 bq("What does the fan-out of a logic gate mean?","The maximum number of gate inputs its output can drive",["The number of inputs of the gate","Its propagation delay","The number of transistors in it"],"Fan-out is limited by the output's current capability."),
 ()=>{const voh=pick([2.4,2.7,3.0]),vih=pick([2.0,1.8,2.2]);const v=Math.round((voh-vih)*10)/10;
  return bcN(`A logic family has V<sub>OH(min)</sub> = ${voh} V and V<sub>IH(min)</sub> = ${vih} V. What is its high-level noise margin (in volts)?`,v,[Math.round((voh+vih)*10)/10,Math.round((vih-voh+1)*10)/10,voh],`NM<sub>H</sub> = V<sub>OH(min)</sub> − V<sub>IH(min)</sub> = ${voh} − ${vih} = ${v} V.`)},
 bq("Open-collector outputs allow which special connection?","Wired-AND (with an external pull-up resistor)",["Direct connection to the power supply","Series connection of gates","Use without any supply"],"Several open-collector outputs can share one line with a pull-up; the line is high only if all outputs are off."),
 bq("In which programmable device are both the AND plane and the OR plane programmable?","PLA",["PROM","PAL","ROM"],"A PROM has a fixed AND plane (a decoder), a PAL has a fixed OR plane, and a PLA programs both."),
 ()=>{const k=rnd(3,6),w=pick([4,8]),v=2**k*w;return bcN(`How many bits can a ROM with ${k} address lines and ${w}-bit words store?`,v,[k*w,2**k+w,2**(k+w)],`2<sup>${k}</sup> = ${2**k} words of ${w} bits each = ${v} bits.`)},
 bq("What is the third state of a tri-state buffer?","High impedance (output disconnected)",["Logic 2","Short circuit","Oscillation"],"In the high-impedance state the buffer neither drives the line high nor low, so several buffers can share a bus."),
 bq("Propagation delay of a gate is:","the time between a change at the input and the resulting change at the output",["the supply voltage","the number of gates it can drive","the power it consumes"],"It is usually measured between the 50 % points of the input and output transitions."),
 bq("Which major logic family has the lowest power dissipation?","CMOS",["TTL","ECL","DTL"],"CMOS uses almost no power when idle; ECL is the fastest but the most power-hungry."),
 bq("What size of ROM is needed to implement a combinational circuit with 3 inputs and 2 outputs?","8 × 2",["3 × 2","2 × 3","6 × 8"],"Three inputs need 2<sup>3</sup> = 8 addresses and each address stores a 2-bit output word."),
],
});

/* =========================================================== BCA-006 DATA STRUCTURES */
genAdd("BCA-006",{
1:[
 bq("Which of these is a non-linear data structure?","Tree",["Stack","Queue","Array"],"In a tree, one element can be connected to many others; stacks, queues and arrays store elements in a single sequence."),
 bq("What is the time complexity of this code: for (i = 0; i &lt; n; i++) for (j = 0; j &lt; n; j++) count++; ?","O(n<sup>2</sup>)",["O(n)","O(log n)","O(n log n)"],"The inner statement runs n × n times."),
 bq("What is the worst-case time complexity of binary search on a sorted array of n elements?","O(log n)",["O(n)","O(1)","O(n log n)"],"Each step halves the remaining range, so about log<sub>2</sub> n steps are needed."),
 bq("A program has two sequential parts, one taking O(n) time and the other O(n<sup>2</sup>). Its overall time complexity is:","O(n<sup>2</sup>)",["O(n)","O(n<sup>3</sup>)","O(2n)"],"The term that grows fastest dominates, so lower-order terms are dropped."),
 bq("Which asymptotic notation gives a tight bound (both upper and lower) on a function?","Θ (theta)",["O (big-oh)","Ω (omega)","o (little-oh) only"],"f(n) = Θ(g(n)) means f is both O(g) and Ω(g)."),
 bq("What is an abstract data type (ADT)?","A description of data and its operations without saying how they are implemented",["A data type that cannot be used","A type with a fixed size","A type that stores only numbers"],"An ADT such as a stack specifies what push and pop do, not how the memory is organised."),
 ()=>{const k=rnd(3,10),n=2**k;let c=0;for(let i=1;i<n;i*=2)c++;BC_VERIFY(c===k,"loop");
  return bcN(`How many times does the loop body run for: for (i = 1; i &lt; n; i *= 2) with n = ${n}?`,k,[k+1,n/2,n],`i takes the values 1, 2, 4, ..., ${n/2}; that is log<sub>2</sub>(${n}) = ${k} values.`)},
 bq("Which of these is a primitive data type?","int",["array","stack","graph"],"Primitive types such as int, char and float are built into the language; arrays, stacks and graphs are built from them."),
 bq("The function f(n) = 3n<sup>2</sup> + 5n + 2 is:","Θ(n<sup>2</sup>)",["Θ(n)","Θ(n<sup>3</sup>)","Θ(2<sup>n</sup>)"],"Dropping constants and lower-order terms leaves n<sup>2</sup>."),
 bq("What is the space used by the stack of a recursive factorial function for input n?","O(n)",["O(1)","O(log n)","O(n<sup>2</sup>)"],"There are n pending calls at the deepest point, each holding one stack frame."),
 bq("A hash table that stores precomputed results to avoid recomputing them is an example of:","a time-space trade-off",["a space-only optimisation","a sorting technique","an ADT"],"More memory is spent to make the running time shorter."),
],
2:[
 ()=>{const a=[];while(a.length<4){const x=rnd(1,9);if(!a.includes(x))a.push(x)}const st=[];for(const x of a)st.push(x);st.pop();const top=st[st.length-1];
  return bcN(`Elements ${a.join(", ")} are pushed on to an empty stack in this order and then one pop is done. What is now on the top of the stack?`,top,[a[a.length-1],a[0],a[1]],`A stack is last-in-first-out: ${a[a.length-1]} is popped, so ${top} is on top.`)},
 bq("Elements a, b, c are added to a queue in this order. After one dequeue operation, which element is at the front?","b",["a","c","none"],"A queue is first-in-first-out: a leaves first, so b is the new front."),
 ()=>{const x=rnd(2,6),y=rnd(2,6),z=rnd(2,5);const e=`${x} ${y} + ${z} *`;const st=[];for(const t of e.split(" ")){if(t==="+"){const b=st.pop(),a=st.pop();st.push(a+b)}else if(t==="*"){const b=st.pop(),a=st.pop();st.push(a*b)}else st.push(Number(t))}
  const v=(x+y)*z;BC_VERIFY(st[0]===v,"postfix");return bcN(`Evaluate the postfix expression: ${e}`,v,[x+y*z,x*z+y,x+y+z],`Push ${x} and ${y}, add to get ${x+y}; push ${z}, multiply: ${x+y} × ${z} = ${v}.`)},
 bq("What is the postfix form of the infix expression A + B * C?","A B C * +",["A B + C *","+ A * B C","A B C + *"],"Multiplication has higher precedence, so B * C is formed first (B C *), then added to A."),
 bq("In a circular queue of array size n which keeps one cell empty to tell full from empty, what is the 'full' condition?","(rear + 1) % n == front",["rear == front","rear == n","front == 0"],"If advancing rear by one (with wrap-around) would reach front, the queue is full."),
 bq("What is the time complexity of inserting a node at the beginning of a singly linked list?","O(1)",["O(n)","O(log n)","O(n<sup>2</sup>)"],"Only the new node's next pointer and the head pointer have to be changed."),
 bq("Each node of a doubly linked list contains:","data, a previous pointer and a next pointer",["only data","data and an index","two data fields"],"The two links allow traversal in both directions."),
 ()=>{const B=pick([1000,2000,4000]),w=pick([2,4,8]),i=rnd(3,12),lo=pick([0,1]);const addr=B+(i-lo)*w;return bcN(`An array with lower bound ${lo} is stored from base address ${B} and each element takes ${w} bytes. What is the address of element A[${i}]?`,addr,[B+i*w+w*(lo?0:1),B+i,B+(i-lo+1)*w],`Address = base + (index − lower bound) × size = ${B} + (${i} − ${lo}) × ${w} = ${addr}.`)},
 bq("What is the error called when you try to remove an element from an empty stack?","Underflow",["Overflow","Deadlock","Segmentation"],"Underflow is removal from an empty structure; overflow is insertion into a full one."),
 bq("In a priority queue, which element is removed first?","The one with the highest priority",["The one added first, always","The one added last, always","A random one"],"Priority decides the order; equal priorities are usually served in arrival order."),
 bq("Which structure allows insertion and deletion at both ends?","Deque (double-ended queue)",["Stack","Simple queue","Binary tree"],"A deque supports push and pop at the front and at the rear."),
 bq("Which technique detects a loop in a linked list using two pointers moving at different speeds?","Floyd's slow-and-fast pointer method",["Dijkstra's method","Binary search","Radix sort"],"If a cycle exists, the fast pointer eventually catches up with the slow one."),
],
3:[
 ()=>{const h=rnd(2,6);let s=0;for(let l=0;l<=h;l++)s+=2**l;BC_VERIFY(s===2**(h+1)-1,"nodes");
  return bcN(`What is the maximum number of nodes in a binary tree of height ${h} (a tree with only the root has height 0)?`,2**(h+1)-1,[2**h,2**(h+1),2**h-1],`Level l holds at most 2<sup>l</sup> nodes; summing levels 0..${h} gives 2<sup>${h+1}</sup> − 1 = ${2**(h+1)-1}.`)},
 bq("Which traversal of a binary search tree produces the keys in ascending order?","Inorder",["Preorder","Postorder","Level-order only"],"Inorder visits left subtree, node, right subtree; in a BST that gives sorted order."),
 bq("For a tree with root 1, left child 2 and right child 3, what is the preorder traversal?","1 2 3",["2 1 3","2 3 1","3 2 1"],"Preorder visits the root first, then the left subtree, then the right subtree."),
 bq("For the same tree (root 1, left child 2, right child 3), what is the postorder traversal?","2 3 1",["1 2 3","2 1 3","3 1 2"],"Postorder visits the left subtree, the right subtree and finally the root."),
 ()=>{const n=rnd(3,15);return bcN(`A full binary tree has ${n} internal nodes. How many leaf nodes does it have?`,n+1,[n,n-1,2*n],`In a full binary tree (every node has 0 or 2 children), leaves = internal nodes + 1 = ${n+1}.`)},
 bq("What is the height of the BST obtained by inserting the keys 1, 2, 3, 4, 5 in this order into an empty tree (root height 0)?","4",["2","3","5"],"Each key is larger than all previous ones, so the tree degenerates into a chain of 5 nodes with height 4."),
 bq("In an AVL tree, the balance factor of a node is:","height of left subtree − height of right subtree",["number of nodes in the left subtree","the node's key value","its depth from the root"],"Every node of an AVL tree must have a balance factor of −1, 0 or +1."),
 bq("Inserting 30, 20, 10 into an empty AVL tree makes the root unbalanced (left-left case). Which rotation fixes it?","Single right rotation",["Single left rotation","Left-right double rotation","No rotation is needed"],"The left-left imbalance is repaired by one rotation to the right around the root, making 20 the new root."),
 ()=>{const n=rnd(5,40);return bcN(`How many edges does a tree with ${n} nodes have?`,n-1,[n,n+1,n/2|0],`A tree is connected and has no cycles, so it has exactly n − 1 = ${n-1} edges.`)},
 bq("What is the degree of a node in a tree?","The number of children it has",["Its depth","The number of its ancestors","Its key value"],"The degree of a node is the count of its subtrees (children)."),
 bq("When a node with two children is deleted from a BST, it is usually replaced by:","its inorder successor (or predecessor)",["the root","a new leaf with the same key","its sibling"],"The inorder successor is the smallest key in the right subtree, so the BST order is preserved."),
],
4:[
 ()=>{const e=rnd(4,15);return bcN(`The sum of the degrees of all vertices of an undirected graph is ${2*e}. How many edges does the graph have?`,e,[2*e,e+1,e*e],`Every edge adds 2 to the total degree (handshaking lemma), so edges = ${2*e}/2 = ${e}.`)},
 ()=>{const n=rnd(5,12);return bcN(`What is the maximum number of edges in a simple undirected graph with ${n} vertices?`,n*(n-1)/2,[n*(n-1),n*n,n*(n+1)/2],`Every pair of vertices can be joined once: <sup>${n}</sup>C<sub>2</sub> = ${n*(n-1)/2}.`)},
 bq("The adjacency-matrix representation of a graph with V vertices needs space of order:","O(V<sup>2</sup>)",["O(V)","O(V + E)","O(E log V)"],"The matrix always has V × V entries regardless of the number of edges."),
 bq("Which data structure does breadth-first search (BFS) use?","A queue",["A stack","A heap","A hash table"],"BFS visits vertices in order of distance, which needs first-in-first-out handling."),
 bq("Which data structure does an iterative depth-first search (DFS) use?","A stack",["A queue","A priority queue","A linked list of edges only"],"DFS goes as deep as possible before backtracking, which is last-in-first-out."),
 ()=>{const v=rnd(5,15);return bcN(`How many edges does a spanning tree of a connected graph with ${v} vertices have?`,v-1,[v,v+1,v*(v-1)/2],`A spanning tree connects all ${v} vertices without a cycle, so it has ${v}−1 = ${v-1} edges.`)},
 bq("How does Kruskal's algorithm build a minimum spanning tree?","It adds the cheapest remaining edge that does not form a cycle",["It always starts at a vertex and adds its nearest neighbour","It removes the heaviest edge from every cycle","It sorts vertices by degree"],"Kruskal sorts the edges by weight and keeps an edge only if it joins two different components."),
 bq("How does Prim's algorithm grow a minimum spanning tree?","It repeatedly adds the cheapest edge joining the tree to a new vertex",["It adds edges in random order","It sorts all edges first and adds them if no cycle appears","It deletes edges"],"Prim starts from one vertex and extends the tree by the minimum-weight crossing edge each time."),
 ()=>{const a=rnd(1,4),b=a+rnd(1,3),c=b+rnd(1,3);return bcN(`A triangle graph has edge weights ${a}, ${b} and ${c}. What is the total weight of its minimum spanning tree?`,a+b,[a+b+c,a+c,b+c],`A spanning tree of a triangle needs 2 of the 3 edges; the cheapest two are ${a} and ${b}.`)},
 bq("A graph has edges A–B, A–C, B–D, C–D. Visiting neighbours in alphabetical order, what is the BFS order starting at A?","A B C D",["A B D C","A C B D","A D B C"],"From A we visit B and C, then D, which is reached from B."),
 bq("For the same graph (edges A–B, A–C, B–D, C–D), what is the DFS order from A (alphabetical neighbours)?","A B D C",["A B C D","A C D B","A D C B"],"DFS goes A → B → D, then backtracks and visits C from D."),
 bq("An adjacency list is preferred over an adjacency matrix when the graph is:","sparse (few edges)",["dense (almost complete)","empty of vertices","a complete graph"],"An adjacency list uses space proportional to V + E, which is small when E is small."),
],
5:[
 ()=>{const n=pick([8,16,100,1000,1024,5000]);let c=0,m=n;while(m>0){m=Math.floor(m/2);c++}BC_VERIFY(c===Math.floor(Math.log2(n))+1,"bs");
  return bcN(`What is the maximum number of comparisons binary search needs on a sorted array of ${n} elements?`,c,[c-1,c+1,Math.ceil(n/2)],`The worst case takes ⌊log<sub>2</sub> ${n}⌋ + 1 = ${c} comparisons.`)},
 ()=>{const n=rnd(5,20);return bcN(`How many comparisons does simple bubble sort (without early exit) make in total on ${n} elements?`,n*(n-1)/2,[n*n,n*(n+1)/2,n-1],`It makes (n − 1) + (n − 2) + ... + 1 = n(n − 1)/2 = ${n*(n-1)/2} comparisons.`)},
 ()=>{const a=[];while(a.length<5){const x=rnd(1,9);if(!a.includes(x))a.push(x)}const b=a.slice();for(let i=0;i<b.length-1;i++)if(b[i]>b[i+1]){const t=b[i];b[i]=b[i+1];b[i+1]=t}
  const mx=Math.max(...a);BC_VERIFY(b[4]===mx,"bubble");
  return bcN(`Bubble sort is applied to [${a.join(", ")}]. What is the array after the first pass?`,`[${b.join(", ")}]`,[`[${a.slice().sort((x,y)=>x-y).join(", ")}]`,`[${a.slice(1).concat(a[0]).join(", ")}]`,`[${a.slice().reverse().join(", ")}]`,`[${a.join(", ")}]`,`[${[a[1],a[0],...a.slice(2)].join(", ")}]`].filter(s=>s!==`[${b.join(", ")}]`),`In the first pass adjacent pairs are compared and swapped if out of order, so the largest element (${mx}) moves to the end: [${b.join(", ")}].`)},
 bq("What is the best-case time complexity of insertion sort?","O(n), when the array is already sorted",["O(n log n)","O(n<sup>2</sup>) always","O(log n)"],"With sorted input each element needs just one comparison."),
 bq("Which statement about merge sort is correct?","It takes O(n log n) time in every case and needs O(n) extra space",["It sorts in place with O(1) space","Its worst case is O(n<sup>2</sup>)","It works only on sorted data"],"Merge sort always splits in half and merges in linear time, but merging uses a temporary array."),
 bq("When does quick sort take O(n<sup>2</sup>) time?","When the pivot is always the smallest or largest element",["When the array has random values","When n is small","When the array has duplicates only"],"Such pivots give very unbalanced partitions, so the recursion depth becomes n."),
 bq("What is the maximum number of swaps selection sort performs on n elements?","n − 1",["n(n − 1)/2","n<sup>2</sup>","log n"],"It places one element in its final position per pass using at most one swap, and the last element needs none."),
 ()=>{const m=pick([7,10,11,13]),k=rnd(20,99);return bcN(`With the hash function h(k) = k mod ${m}, which table index does the key ${k} map to?`,k%m,[Math.floor(k/m),(k%m+1)%m,m-k%m],`${k} = ${m} × ${Math.floor(k/m)} + ${k%m}, so the remainder ${k%m} is the index.`)},
 bq("A hash table of size 10 uses h(k) = k mod 10 and linear probing. Keys 15 and then 25 are inserted. At which index is 25 stored?","6",["5","7","0"],"Both keys hash to 5; 25 finds slot 5 occupied and moves to the next free slot, 6."),
 bq("In separate chaining, collisions are handled by:","storing colliding keys in a linked list at the same table slot",["moving to the next empty slot","discarding the new key","rehashing the whole table every time"],"Each slot holds the head of a list of all keys that hash to it."),
 bq("Which of these sorting algorithms is stable?","Merge sort",["Selection sort","Heap sort","Quick sort (usual in-place version)"],"A stable sort keeps equal keys in their original order; merge sort does when merging takes from the left half first."),
 ()=>{const n=rnd(5,40),m=pick([10,20,50]),v=Math.round(n/m*100)/100;return bcN(`A hash table with ${m} slots holds ${n} keys. What is its load factor?`,v,[Math.round(m/n*100)/100,n+m,Math.round((n-m)/m*100)/100],`Load factor = number of keys / table size = ${n}/${m} = ${v}.`)},
],
});

/* =========================================================== BCA-007 COMPUTER ORGANIZATION & ARCHITECTURE */
genAdd("BCA-007",{
1:[
 bq("What is the key idea of the Von Neumann architecture?","Instructions and data are stored in the same memory",["Instructions and data use separate memories","Only data is stored in memory","The CPU has no registers"],"This stored-program concept lets a program be loaded like data; Harvard machines keep separate memories."),
 ()=>{const n=pick([4,6,8,12,16]);return bcN(`What is the largest positive number that can be stored in an ${n}-bit 2's complement integer?`,2**(n-1)-1,[2**n-1,2**(n-1),2**(n-1)-2],`The range is −2<sup>${n-1}</sup> to 2<sup>${n-1}</sup> − 1, so the maximum is ${2**(n-1)-1}.`)},
 ()=>{const n=rnd(10,100),v=bcBin(256-n,8);BC_VERIFY(parseInt(v,2)+n===256,"twos");return bcN(`How is −${n} written as an 8-bit 2's complement number?`,v,[bcBin(n,8),bcBin(255-n,8),"1"+bcBin(n,7)],`Take ${bcBin(n,8)}, invert every bit and add 1: ${v}.`)},
 bq("In the IEEE 754 single-precision format, how many bits are used for the sign, exponent and fraction respectively?","1, 8 and 23",["1, 11 and 52","1, 7 and 24","8, 1 and 23"],"Single precision is 32 bits: 1 + 8 + 23; double precision uses 1 + 11 + 52."),
 ()=>{const e=rnd(-4,8),v=127+e;return bcN(`A normalised single-precision number is 1.f × 2<sup>${e}</sup>. What is the value of its stored (biased) exponent field?`,v,[e,128+e,126+e],`The stored exponent is the true exponent plus the bias 127: ${e} + 127 = ${v}.`)},
 bq("How does overflow show up when two 2's complement numbers are added?","The carry into the sign bit differs from the carry out of it",["The result is zero","The carry out is always 1","The sign bit is 0"],"Overflow happens when the two carries at the sign-bit position are different."),
 bq("What is Booth's algorithm used for?","Multiplying signed binary numbers in 2's complement form",["Detecting parity errors","Dividing decimal numbers","Converting binary to BCD"],"Booth's method recodes runs of 1s in the multiplier so fewer additions are needed and the sign is handled automatically."),
 ()=>{const m=pick([4,7,8,11,12]);let r=1;while(2**r<m+r+1)r++;BC_VERIFY(2**r>=m+r+1&&2**(r-1)<m+r,"ham");
  return bcN(`How many parity (check) bits are needed in a single-error-correcting Hamming code for ${m} data bits?`,r,[r+1,r-1,m/2|0],`The smallest r with 2<sup>r</sup> ≥ m + r + 1 is r = ${r}.`)},
 ()=>{const k=rnd(8,20);return bcN(`A CPU has ${k} address lines. How many different memory locations can it address?`,2**k,[k*k,2*k,2**k-1],`${k} address bits can form 2<sup>${k}</sup> = ${2**k} distinct addresses.`)},
 bq("What is the 1's complement of the 8-bit number 01101010?","10010101",["10010110","01101010","11111111"],"Invert every bit; the 2's complement would be this value plus 1."),
 bq("What is the main difference between multiprocessor and multicomputer systems?","Multiprocessors share one memory; multicomputers have private memory for each node",["Multiprocessors have only one CPU","Multicomputers share one memory","There is no difference"],"Multicomputer nodes communicate by passing messages, multiprocessors through shared memory."),
 ()=>{const ic=pick([200,500,1000,2000]),cpi=pick([1,2,4]),f=pick([500,1000,2000]);const t=ic*cpi/f;return bcN(`A program executes ${ic} million instructions with an average CPI of ${cpi} on a ${f} MHz processor. How many seconds does it take?`,t,[ic/f,ic*cpi*f/1000,t*2],`Time = instruction count × CPI / clock rate = ${ic}×10<sup>6</sup> × ${cpi} / (${f}×10<sup>6</sup>) = ${t} s.`)},
],
2:[
 bq("What is the correct order of the basic instruction cycle?","Fetch, decode, execute",["Decode, fetch, execute","Execute, fetch, decode","Fetch, execute, decode"],"The instruction is first read from memory, then decoded, then carried out."),
 bq("The program counter (PC) holds:","the address of the next instruction to be fetched",["the instruction being executed","the result of the last operation","the address of the stack top"],"After each fetch the PC is incremented (or loaded by a jump)."),
 bq("In immediate addressing the operand is:","contained in the instruction itself",["in a register named by the instruction","at the memory address in the instruction","at the address held in a register"],"The operand value is part of the instruction, so no extra memory access is needed for it."),
 bq("In register-indirect addressing mode, the register contains:","the memory address of the operand",["the operand","the offset only","the opcode"],"The CPU uses the register contents as an address and fetches the operand from there."),
 bq("Zero-address instructions are used by which kind of machine?","Stack organised machines",["Accumulator machines","General register machines only","Memory-to-memory machines"],"Operands are implicitly on the top of the stack, so ADD or MUL name no operands."),
 bq("How many instructions does a one-address (accumulator) machine need to compute X = (A + B) * C?","4: LOAD A, ADD B, MUL C, STORE X",["2","3","6"],"Load A into the accumulator, add B, multiply by C, and store the result in X."),
 bq("Which of the following is a typical feature of a RISC processor?","Fixed-length instructions and a load/store architecture",["Very many addressing modes","Variable-length instructions","Heavy use of microcode"],"RISC designs keep instructions simple so they can be pipelined easily."),
 bq("Which feature is typical of CISC processors?","Complex, variable-length instructions with many addressing modes",["Only a few simple instructions","Fixed 32-bit instructions only","No microprogram control"],"CISC instructions can do several low-level steps, which reduces the program length but complicates the decoder."),
 ()=>{const a=rnd(8,14);return bcN(`An instruction has a 4-bit opcode field and a ${a}-bit address field. How many memory words can it address directly?`,2**a,[a*a,2*a,2**(a+4)],`A ${a}-bit address field selects one of 2<sup>${a}</sup> = ${2**a} words.`)},
 bq("When data is pushed onto a descending stack, the stack pointer is:","decremented",["incremented","unchanged","cleared"],"A descending stack grows towards lower addresses, so SP is decreased on a push and increased on a pop."),
 bq("When does the CPU normally respond to an interrupt request?","After finishing the current instruction",["Immediately in the middle of an instruction","Only when the program ends","Only at power-on"],"The CPU saves the return address (PC), then branches to the interrupt service routine."),
],
3:[
 bq("In register transfer language, what does R2 ← R1 mean?","The contents of R1 are copied into R2",["R2 is cleared and R1 is set","R1 and R2 are swapped","R1 is copied into memory"],"The arrow shows a transfer of the source register's contents to the destination; the source is unchanged."),
 bq("Why are three-state buffers used in a common bus system?","They allow many registers to share one bus by disconnecting the unselected ones",["They speed up the clock","They store data","They perform addition"],"Only one buffer drives the bus at a time; the others are in the high-impedance state."),
 ()=>{const r=pick([4,8]),n=pick([4,8,16]);return bcN(`A common bus connects ${r} registers of ${n} bits each using multiplexers. How many ${r}×1 multiplexers are needed?`,n,[r,r*n,n*2],`One ${r}×1 multiplexer is needed per bit line, so ${n} multiplexers are used.`)},
 ()=>{const op=pick(["selective-set (A ← A ∨ B)","selective-clear (A ← A ∧ B′)","selective-complement (A ← A ⊕ B)","mask (A ← A ∧ B)"]),a=rnd(1,14),b=rnd(1,14);
  const r=op.startsWith("selective-set")?a|b:op.startsWith("selective-clear")?a&(~b&15):op.startsWith("selective-comp")?a^b:a&b;
  const alt=[a|b,a&(~b&15),a^b,a&b].filter(x=>x!==r);
  return bcN(`With A = ${bcBin(a,4)} and B = ${bcBin(b,4)}, what is A after the ${op} micro-operation?`,bcBin(r,4),alt.map(x=>bcBin(x,4)),`Apply the operation bit by bit on ${bcBin(a,4)} and ${bcBin(b,4)}: the result is ${bcBin(r,4)}.`)},
 bq("What does a logical shift left by one position do to an unsigned binary number (without overflow)?","Multiplies it by 2",["Divides it by 2","Adds 1","Complements it"],"Every bit moves to a higher place value, doubling the number."),
 bq("What is the result of an arithmetic shift right by one on the 4-bit signed number 1010?","1101",["0101","0100","1010"],"An arithmetic shift right keeps the sign bit, so 1010 (−6) becomes 1101 (−3)."),
 bq("What does the control memory of a microprogrammed control unit store?","The microprogram (microinstructions)",["User data","The operating system","Cache tags"],"Each machine instruction is executed by a routine of microinstructions held in control memory (usually a ROM)."),
 bq("How does a hardwired control unit compare with a microprogrammed one?","It is faster but harder to modify",["It is slower but easier to modify","It uses a control memory","It has no logic gates"],"Hardwired control uses fixed logic circuits, which are fast but costly to change."),
 bq("Which is NOT a way of choosing the next micro-instruction address in address sequencing?","Reversing the clock",["Incrementing the control address register","Conditional branching","Mapping from the opcode"],"Next addresses come from incrementing, branches, subroutine returns or mapping the opcode."),
 bq("What chooses the operation performed by an arithmetic logic shift unit (ALSU)?","Its mode-select lines",["The memory address","The program counter","The cache"],"Select inputs decide whether the unit adds, applies a logic function, or shifts."),
],
4:[
 bq("Which of these lists the memory hierarchy from fastest to slowest?","Registers, cache, main memory, disk",["Disk, main memory, cache, registers","Cache, registers, disk, main memory","Main memory, cache, registers, disk"],"Speed falls (and capacity and distance from the CPU grow) as we move down the hierarchy."),
 ()=>{const h=pick([0.8,0.9,0.95]),tc=pick([10,20]),tm=pick([100,200]);const v=Math.round((h*tc+(1-h)*tm)*100)/100;
  return bcN(`A cache has an access time of ${tc} ns and a hit ratio of ${h}. A miss costs the main-memory time of ${tm} ns. What is the average access time (in ns)?`,v,[Math.round(((tc+tm)/2)*100)/100,Math.round((h*tm+(1-h)*tc)*100)/100,tc+tm],`Average time = h × t<sub>cache</sub> + (1 − h) × t<sub>memory</sub> = ${h}×${tc} + ${Math.round((1-h)*100)/100}×${tm} = ${v} ns.`)},
 ()=>{const L=pick([8,16,32]),j=rnd(20,200);return bcN(`In a direct-mapped cache with ${L} lines, main-memory block ${j} is placed in which cache line?`,j%L,[Math.floor(j/L),(j%L+1)%L,L-j%L],`Line number = block number mod number of lines = ${j} mod ${L} = ${j%L}.`)},
 bq("In fully associative mapping, a memory block can be placed:","in any cache line",["only in one fixed line","in any line of one set","only in the first line"],"This gives the best flexibility but needs every tag compared in parallel."),
 bq("What does the write-through policy do on a write hit?","It updates both the cache and main memory",["It updates only the cache","It updates only memory","It ignores the write"],"Memory is always up to date, at the price of more memory traffic; write-back postpones the memory update."),
 bq("In a write-back cache, what does the dirty bit show?","The cached block was modified and must be written back on replacement",["The block is invalid","The block is read-only","The block is most recently used"],"Only dirty blocks need to be copied to memory when they are evicted."),
 bq("What does the page table of a virtual memory system store?","The mapping from virtual pages to physical frames",["The program instructions","The cache contents","Disk sectors"],"The memory management unit uses it to translate every virtual address."),
 bq("A process uses the page reference string 1, 2, 3, 1, 4 with 3 frames and FIFO replacement. How many page faults occur?","4",["3","5","2"],"Pages 1, 2, 3 each fault; the second 1 is a hit; 4 faults and replaces the oldest page (1): 4 faults."),
 ()=>{const k=pick([10,12,16,20]);return bcN(`A memory has ${k} address lines. Its capacity in words is:`,2**k,[k*k,2*k,2**k-1],`A ${k}-bit address selects 2<sup>${k}</sup> = ${2**k} words.`)},
 bq("Why does DRAM need to be refreshed periodically?","It stores bits as charge on capacitors that leaks away",["It overheats when idle","Its clock is too slow","It has no address lines"],"SRAM uses flip-flops and needs no refresh, but DRAM cells lose charge."),
 bq("The principle that programs tend to reuse recently accessed data and instructions is called:","locality of reference",["Moore's law","Amdahl's law","pipelining"],"Caches work because of temporal and spatial locality."),
 ()=>{const m=pick([16,20,24]),c=pick([8,10]),b=pick([2,4]);return bcN(`Main memory has 2<sup>${m}</sup> words, the cache has 2<sup>${c}</sup> lines of 2<sup>${b}</sup> words each, and mapping is direct. How many bits does the tag field have?`,m-c-b,[m-c,m-b,c+b],`Address = tag + line index + word offset, so tag = ${m} − ${c} − ${b} = ${m-c-b} bits.`)},
],
5:[
 bq("What is the main advantage of DMA (direct memory access)?","Data moves between I/O device and memory without CPU involvement for each word",["The CPU executes faster","No memory is needed","Interrupts are not required at all"],"The DMA controller takes over the bus, so the CPU is free for other work during the block transfer."),
 bq("What happens in programmed I/O?","The CPU repeatedly checks the device status until it is ready",["The device interrupts the CPU","The DMA controller does the transfer","The CPU sleeps until done"],"This busy waiting wastes CPU time."),
 bq("What happens in interrupt-driven I/O?","The device signals the CPU when it is ready for a transfer",["The CPU polls the device continuously","The data bypasses the CPU in blocks","The CPU never handles data"],"The CPU can do other work and only serves the device on request."),
 bq("What does handshaking offer compared with strobe control in asynchronous data transfer?","Acknowledgement from the receiver, so each side knows the transfer happened",["No control signals","A faster clock","Only one direction"],"A strobe is sent without confirmation; handshaking adds a reply signal."),
 bq("In daisy-chain priority arbitration, which device has the highest priority?","The one closest to the CPU or arbiter in the chain",["The one farthest away","The one with the largest number","A random device"],"The grant signal passes through the devices in series, so nearer devices see it first."),
 ()=>{const c=pick([[0.5,2],[0.75,3],[0.8,4],[0.9,9],[0.6,3]]),p=c[0],n=c[1];const s=Math.round(1/((1-p)+p/n)*100)/100;
  return bcN(`By Amdahl's law, what speed-up is obtained when ${p*100}% of a program is perfectly parallelised on ${n} processors?`,s,[n,Math.round(1/(1-p)*100)/100,Math.round((n*p)*100)/100],`Speed-up = 1 / ((1 − p) + p/n) = 1 / (${Math.round((1-p)*100)/100} + ${p}/${n}) = ${s}.`)},
 bq("What is cycle stealing in DMA?","The DMA controller takes a bus cycle from the CPU to move one word",["The CPU skips instruction fetch","The clock is stopped","Memory is erased"],"The CPU is delayed by one memory cycle, but is not interrupted for a long time."),
 bq("In memory-mapped I/O:","device registers share the same address space as memory",["there is a separate I/O address space","devices cannot be read","all I/O is done through DMA"],"The same load and store instructions are used for memory and for device registers."),
 bq("In a symmetric multiprocessing (SMP) system:","all processors are peers sharing memory and run the operating system equally",["one master processor runs all tasks","each processor has private memory only","processors cannot communicate"],"In asymmetric multiprocessing, one master processor assigns work to slaves."),
 bq("What happens when two devices raise interrupts at the same time in a priority interrupt system?","The higher-priority device is served first",["The lower-priority device is served first","Both are ignored","The program restarts"],"Priority logic selects the highest-priority request."),
 bq("What do the status and control registers of an I/O interface do?","The status register reports device state; the control register configures its operation",["Both store program data","They hold the CPU's PC","They store the cache tags"],"The CPU reads status to know if a device is ready and writes control to start or configure it."),
],
});

/* =========================================================== BCA-008 OBJECT-ORIENTED PROGRAMMING USING JAVA */
genAdd("BCA-008",{
1:[
 bq("Which component of Java executes the compiled bytecode?","The Java Virtual Machine (JVM)",["The javac compiler","The JDK documentation tool","The operating system loader only"],"javac turns source into bytecode; the JVM interprets or JIT-compiles that bytecode on the target machine."),
 bq("Why is Java called platform independent?","Source code is compiled to bytecode that runs on any machine having a JVM",["It is compiled to native code for every machine","It works without any runtime","It only runs on one operating system"],"The same .class file runs on Windows, Linux or macOS because each has its own JVM."),
 bq("What is the size and range of Java's byte type?","8 bits, −128 to 127",["8 bits, 0 to 255","16 bits, −32768 to 32767","4 bits, 0 to 15"],"A byte is a signed 8-bit two's complement integer."),
 ()=>{const a=rnd(11,39),b=rnd(2,6);const q=Math.floor(a/b);return bcN(`What does System.out.println(${a} / ${b}); print in Java?`,q,[Math.round(a/b*10)/10,a%b,q+1],`Both operands are int, so Java performs integer division and discards the fraction: ${a} / ${b} = ${q}.`)},
 bq("What type does Math.pow(2, 3) return, and what is its value?","double, 8.0",["int, 8","long, 8","double, 6.0"],"Math.pow takes and returns double values, so the result is 8.0."),
 bq("Which is the correct way to compare the contents of two String objects s1 and s2?","s1.equals(s2)",["s1 == s2","s1.compare(s2)","s1 = s2"],"== compares references, whereas equals compares the characters."),
 bq("What is method overloading?","Several methods with the same name but different parameter lists in one class",["A subclass redefining a parent method","A method calling itself","A method with no return type"],"The compiler picks the right version from the number and types of the arguments."),
 bq("How do you get the number of elements in a Java array named arr?","arr.length",["arr.length()","arr.size()","length(arr)"],"length is a field of every array, not a method."),
 bq("What is the correct signature of the entry point of a Java application?","public static void main(String[] args)",["public void main(String args)","static int main()","public static main(String[] args)"],"The JVM looks for exactly this method to start the program."),
 bq("What does System.out.println('A' + 1); print?","66",["A1","B","65"],"The char 'A' (code 65) is promoted to int, so 65 + 1 = 66 is printed."),
 bq("What is the value of the last element's index in the array int[] a = new int[6]; ?","5",["6","7","1"],"Array indexes start at 0, so the last valid index is length − 1 = 5."),
],
2:[
 bq("What are the rules for a Java constructor's declaration?","Same name as the class and no return type",["Any name and returns void","Same name as the class and returns int","Always static"],"Constructors are special methods called by new to initialise an object."),
 bq("When does the Java compiler supply a default constructor?","Only when the class declares no constructor",["Always","Never","Only for abstract classes"],"As soon as you write any constructor, the default one is no longer generated."),
 bq("What does the keyword this refer to inside an instance method?","The current object",["The parent class","The class's static data","The main method"],"this is commonly used to separate a field from a parameter with the same name."),
 bq("A member declared private can be accessed:","only inside its own class",["from every class","from subclasses only","from the same package only"],"private gives the strictest access, which is how encapsulation is achieved."),
 bq("What does the new operator do?","Allocates memory for an object on the heap and calls its constructor",["Deletes an object","Declares a variable","Imports a package"],"It returns a reference to the newly created object."),
 bq("What does the garbage collector do?","Reclaims memory of objects that are no longer reachable",["Deletes all static variables","Compiles the program","Closes all files"],"The programmer does not free objects explicitly in Java."),
 bq("What does this print: String s = \"a\"; s.concat(\"b\"); System.out.println(s); ?","a",["ab","b","error"],"Strings are immutable; concat returns a new string that is thrown away here, so s is unchanged."),
 ()=>{const n=rnd(2,6);return bcN(`A class has a static int count that is incremented in its constructor (starting from 0). After creating ${n} objects, what is Counter.count?`,n,[1,n+1,0],`A static field is shared by the whole class, so every constructor call adds 1: ${n} objects give ${n}.`)},
 bq("What does new StringBuffer(\"ab\").append(\"cd\").reverse().toString() return?","dcba",["abcd","cdab","badc"],"append changes the buffer to \"abcd\" (StringBuffer is mutable), and reverse flips it to \"dcba\"."),
 bq("What are the default values of an int instance variable, a boolean instance variable and an object reference?","0, false and null",["0, true and 0","null, null and null","1, false and empty"],"Fields (unlike local variables) get default values when an object is created."),
 bq("Which method returns the number of characters of a String s?","s.length()",["s.length","s.size()","s.count()"],"For strings length is a method; for arrays it is a field."),
],
3:[
 bq("Which keyword is used for a class to inherit another class?","extends",["implements","inherits","super"],"class B extends A makes B a subclass of A; implements is for interfaces."),
 bq("Where must a call to super(...) appear in a constructor?","As the first statement",["As the last statement","Anywhere","In the main method only"],"The parent part of the object has to be initialised before the child's own code runs."),
 bq("What is method overriding?","A subclass provides its own version of a method inherited from its parent with the same signature",["Two methods with the same name but different parameters","A method that calls itself","Hiding a variable"],"Overriding is the basis of runtime polymorphism."),
 bq("Given Animal a = new Dog(); and both classes define sound(), which version does a.sound() run?","Dog's version",["Animal's version","Neither; it fails to compile","Both, one after another"],"Dynamic method dispatch chooses the method from the actual object type at run time."),
 bq("Which statement about abstract classes is true?","They cannot be instantiated directly",["They cannot have any methods","They must have no constructors","They can be created with new"],"An abstract class is meant to be extended, and may contain abstract and concrete methods."),
 bq("How does Java allow a class to get behaviour from more than one source?","By implementing multiple interfaces",["By extending several classes","By using the super keyword twice","It does not allow anything like this"],"A class can implement any number of interfaces but extends only one class."),
 bq("What does a final method mean?","It cannot be overridden by subclasses",["It cannot be called","It must be overridden","It runs only once"],"final classes cannot be extended and final variables cannot be reassigned."),
 bq("Which access modifier makes a member visible in its own package and to subclasses?","protected",["private","public only","none, i.e. the keyword abstract"],"protected allows access within the package and from subclasses in other packages."),
 bq("What is the main purpose of a package?","To group related classes and avoid name conflicts",["To speed up execution","To create objects","To declare threads"],"Packages act as namespaces and also provide access protection."),
 bq("When is a call to an overloaded method resolved?","At compile time",["At run time","While loading the JVM","Never"],"The compiler picks the version from the argument types, whereas overriding is resolved at run time."),
 bq("Variables declared in a Java interface are implicitly:","public, static and final",["private and static","protected and final","instance variables"],"Interface fields are constants."),
],
4:[
 bq("What is the main difference between AWT and Swing components?","Swing components are lightweight and written in Java, AWT uses native peers",["AWT is newer than Swing","Swing is used only for console programs","AWT components are drawn by Java only"],"Lightweight Swing components look the same on every platform."),
 bq("Which method must a class implementing ActionListener define?","actionPerformed(ActionEvent e)",["mouseClicked(MouseEvent e)","run()","itemStateChanged(ItemEvent e)"],"It is called when a button is pressed, a menu item chosen, or Enter pressed in a text field."),
 bq("In the delegation event model, an event is sent from:","an event source to registered listeners",["the listener to the source","the JVM to the OS","a frame to a package"],"A component generates events and delivers them to the listeners that were added with addXxxListener."),
 bq("Why are adapter classes (like MouseAdapter) provided?","So you need not implement every method of a listener interface",["To create windows","To speed up painting","To store data"],"An adapter implements all methods with empty bodies; you override only those you need."),
 bq("What is the default layout manager of a JFrame's content pane?","BorderLayout",["FlowLayout","GridLayout","CardLayout"],"JPanel defaults to FlowLayout; frames and their content panes use BorderLayout."),
 ()=>{const r=rnd(2,4),c=rnd(2,5);return bcN(`How many components fit in a container using new GridLayout(${r}, ${c})?`,r*c,[r+c,r*c+1,r*c-1],`The grid has ${r} rows and ${c} columns, so ${r*c} equal cells.`)},
 bq("Which is the order of the applet life-cycle methods when an applet starts?","init(), start(), then paint()",["start(), init(), destroy()","paint(), init(), stop()","destroy(), init(), start()"],"init runs once, start every time the applet becomes active, and paint draws the output."),
 bq("What is the effect of adding setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE) to a JFrame?","The application ends when the window is closed",["The window can never be closed","The window minimises","The frame becomes invisible but keeps running"],"Without it, closing the window only hides it and the JVM may keep running."),
 bq("How do you connect a JButton b to a listener object l?","b.addActionListener(l)",["b.setListener(l)","l.add(b)","b.register(l)"],"Listeners are registered with the addXxxListener methods of the event source."),
 bq("Which methods belong to the KeyListener interface?","keyPressed, keyReleased and keyTyped",["mousePressed, mouseReleased and mouseMoved","focusGained and focusLost","windowOpened and windowClosed"],"They report key events for the component that has focus."),
 bq("Which Swing class is used to hold other components in a window and is the common lightweight container?","JPanel",["JButton","JLabel","JTextField"],"A JPanel groups components and can have its own layout manager."),
],
5:[
 bq("Which pair of abstract classes sits at the top of Java's byte-stream hierarchy?","InputStream and OutputStream",["Reader and Writer","File and Path","Scanner and Printer"],"Reader and Writer are the roots of the character streams."),
 bq("What does FileInputStream's read() method return at the end of the file?","-1",["0","null","the last byte again"],"read() returns the next byte as an int from 0 to 255, or −1 when the stream is exhausted."),
 bq("What is needed for an object to be written by ObjectOutputStream?","Its class must implement Serializable",["It must extend Thread","It must be abstract","It must be final"],"Serializable is a marker interface that says the object's state can be converted into a byte stream."),
 bq("What effect does the transient keyword have on a field?","The field is not saved during serialization",["The field becomes constant","The field is shared by all objects","The field can only be read"],"Transient fields are skipped and get default values when the object is read back."),
 bq("What does RandomAccessFile.seek(pos) do?","Moves the file pointer to the given byte position",["Closes the file","Deletes the byte at pos","Reads the whole file"],"It allows reading and writing at any position instead of only sequentially."),
 bq("What does BufferedReader.readLine() return when there is no more input?","null",["an empty string","-1","an exception object"],"readLine returns the line without its terminator, or null at the end of the stream."),
 bq("What is the benefit of try-with-resources?","Resources such as streams are closed automatically",["The program runs faster","Exceptions are never thrown","Files are encrypted"],"Resources declared in the try header implement AutoCloseable and are closed at the end of the block."),
 bq("Which exception (a checked one) may be thrown by new FileReader(\"x.txt\") when the file does not exist?","FileNotFoundException",["ArithmeticException","NullPointerException","ArrayIndexOutOfBoundsException"],"It extends IOException, so it must be caught or declared."),
 bq("Which class represents a file or directory path and offers methods such as exists() and length()?","java.io.File",["java.io.Stream","java.lang.Path","java.util.Scanner"],"File does not read or write data itself; it describes the path and its properties."),
 bq("Which statement about FileReader and FileInputStream is correct?","FileReader reads characters, FileInputStream reads raw bytes",["Both read only text","FileReader reads bytes only","They are identical"],"Use Reader/Writer for text and InputStream/OutputStream for binary data."),
 bq("What type is System.in?","InputStream",["Reader","Scanner","String"],"It is a standard byte input stream, usually wrapped in a Scanner or InputStreamReader."),
],
6:[
 bq("Which method starts a new thread of execution?","start()",["run()","begin()","execute()"],"start() creates the new thread, which then calls run(); calling run() directly just runs it in the current thread."),
 bq("Which of these is a valid thread state in Java?","Runnable",["Sleeping only","Executing","Dead-locked"],"States are NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING and TERMINATED."),
 bq("What does the synchronized keyword achieve?","Only one thread at a time can execute the protected code on the same lock",["It makes the thread faster","It starts a new thread","It stops garbage collection"],"It protects shared data from simultaneous modification."),
 bq("What is the default priority of a Java thread, and what is the range of priorities?","5, with a range of 1 to 10",["1, with a range of 1 to 5","0, with a range of 0 to 10","10, with a range of 1 to 10"],"Thread.NORM_PRIORITY is 5, MIN_PRIORITY is 1 and MAX_PRIORITY is 10."),
 bq("Where must wait() and notify() be called?","Inside a synchronized block or method",["Only in main","Only outside synchronized code","In a constructor only"],"They need the object's monitor; otherwise IllegalMonitorStateException is thrown."),
 bq("What does this print: try { int x = 10 / 0; } catch (ArithmeticException e) { System.out.print(\"A\"); } finally { System.out.print(\"F\"); } ?","AF",["A","F","FA"],"Division by zero throws ArithmeticException; the catch runs, then finally always runs."),
 bq("What is the difference between throw and throws?","throw raises an exception; throws declares the exceptions a method may pass on",["They are identical","throws raises an exception; throw declares it","throw is used only in constructors"],"Example: void f() throws IOException { throw new IOException(); }"),
 bq("Which exception type is unchecked?","NullPointerException",["IOException","FileNotFoundException","InterruptedException"],"Unchecked exceptions extend RuntimeException and need not be declared or caught."),
 bq("In a try statement with several catch blocks, how should catch clauses be ordered?","Subclass exceptions before their superclasses",["Superclass first","Alphabetical order","Any order works"],"If a superclass is caught first, a later subclass catch would be unreachable and the compiler reports an error."),
 bq("What does t.join() do when called by the main thread?","Waits until thread t has finished",["Starts t","Stops t immediately","Joins t to the main thread's priority"],"join() blocks the caller until the other thread terminates."),
 bq("Which collection does NOT allow duplicate elements?","HashSet",["ArrayList","LinkedList","Vector"],"A Set contains unique elements; Lists allow duplicates."),
],
});

/* =========================================================== BCA-009 SOFTWARE ENGINEERING */
genAdd("BCA-009",{
1:[
 bq("Which process model is a linear, sequential flow of phases with little room for going back?","Waterfall model",["Spiral model","Prototyping model","Incremental model"],"Each phase must be finished before the next starts."),
 bq("When is the prototyping model most useful?","When the customer cannot state the requirements clearly",["When requirements are fully fixed","When there is no customer","When only maintenance is left"],"A quick prototype lets users react to something real and clarifies the requirements."),
 bq("What is the main distinguishing feature of Boehm's spiral model?","Risk analysis in every loop",["A single pass through the phases","No planning","Coding without design"],"Each loop of the spiral plans, analyses risk, engineers and evaluates."),
 bq("What does the incremental model deliver?","A working product in small increments, each adding functionality",["Only the final product","Only documents","Only a prototype that is thrown away"],"The first increment is the core product and later ones add features."),
 bq("Which is the highest maturity level in CMMI (staged representation)?","Level 5: Optimizing",["Level 3: Defined","Level 4: Managed","Level 1: Initial"],"Level 5 focuses on continuous process improvement; Level 1 is ad hoc."),
 bq("Which of these is a common software myth?","Adding more people to a late project always makes it finish sooner",["Requirements change","Testing finds defects","Documentation helps maintenance"],"Brooks's law says adding people to a late project makes it later, because of training and communication overhead."),
 bq("Which phases make up the Unified Process?","Inception, elaboration, construction and transition",["Analysis, design, code and test only","Plan, do, check and act","Requirements, release and retire"],"The phases cover the project from idea to delivery."),
 bq("Which of these is a generic process framework activity?","Communication, planning, modelling, construction and deployment",["Cooking, serving and cleaning","Hiring and firing","Selling and billing"],"These five activities appear in every software process, whatever the model."),
 bq("Which statement about software is true?","It does not wear out, but it deteriorates as changes are made",["It wears out like hardware","It never needs maintenance","It is manufactured like a car"],"Software failure curves rise because of changes, not because of physical wear."),
 bq("Which process models are suited to a product whose requirements keep changing?","Evolutionary models such as prototyping and spiral",["The pure waterfall model","No model","Only formal verification"],"They allow the product to grow in step with understanding."),
],
2:[
 bq("What do functional requirements describe?","What the system should do",["How fast it must respond","What colour the screen is","Which language it is written in"],"Non-functional requirements describe qualities and constraints such as performance and security."),
 bq("Which of these is a non-functional requirement?","The system shall respond to any query within 2 seconds",["The system shall let users register","The system shall print an invoice","The system shall send a reminder email"],"Response time is a performance quality, not a function."),
 bq("Which IEEE standard describes the recommended structure of a Software Requirements Specification?","IEEE 830",["IEEE 802.11","IEEE 754","IEEE 1394"],"IEEE 830 lists the parts of a good SRS."),
 bq("Which of the following is a requirements elicitation technique?","Interviews",["Compiling","Debugging","Linking"],"Interviews, questionnaires, observation and prototypes help to discover what stakeholders need."),
 bq("Which is a type of feasibility study?","Technical, economic and operational feasibility",["Only legal feasibility","Syntax feasibility","Colour feasibility"],"A feasibility study asks if the system can be built, afforded and used."),
 bq("What is checked during requirements validation?","That the requirements are complete, consistent and what the customer really wants",["That the code compiles","That the test cases pass","That the database is normalised"],"Errors found here are far cheaper to fix than those found after coding."),
 bq("Which is a quality of a good SRS?","Unambiguous and verifiable",["Written in poetic language","Full of vague words","Contains design secrets only"],"Each requirement should have one meaning and be testable."),
 bq("What does a context model show?","The boundary of the system and its interactions with the environment",["Internal class details","The test plan","The database schema"],"It shows the system as a whole with the external actors and systems around it."),
 bq("Why is the requirement 'The system should be user-friendly' considered weak?","It is not verifiable",["It is too detailed","It is a functional requirement","It uses technical language"],"Good requirements are measurable, e.g. 'a new user can place an order in under 3 minutes'."),
 bq("What is the difference between user requirements and system requirements?","User requirements are high-level, in the user's language; system requirements are detailed technical descriptions",["They are the same","User requirements are for coders only","System requirements are written by users only"],"User requirements say what services are expected; system requirements define them precisely for developers."),
 bq("What helps to manage changing requirements?","Traceability and change control",["Ignoring all changes","Skipping the SRS","Deleting the test cases"],"Linking each requirement to design and tests shows the impact of a change."),
],
3:[
 bq("What is the design goal regarding cohesion and coupling?","High cohesion and low coupling",["Low cohesion and high coupling","High cohesion and high coupling","Low cohesion and low coupling"],"Modules should do one job well and depend on others as little as possible."),
 bq("Which UML diagram shows classes, their attributes, operations and relationships?","Class diagram",["Use case diagram","Sequence diagram","Deployment diagram"],"It is the main structural diagram of an object-oriented design."),
 bq("What does a use case diagram show?","Actors and the functions (use cases) the system offers them",["The order of messages in time","Class inheritance","Hardware nodes"],"It gives a high-level picture of the system's functionality from the user's viewpoint."),
 bq("Which UML diagram shows the time-ordered exchange of messages between objects?","Sequence diagram",["Class diagram","Component diagram","Package diagram"],"Time runs downwards along the lifelines of the objects."),
 bq("A hollow diamond on a UML association line stands for:","aggregation",["composition","generalisation","dependency"],"A filled diamond is composition, the stronger whole-part relationship."),
 bq("What does a UML deployment diagram show?","The physical nodes on which software components run",["The user stories","The class attributes","The message order"],"Nodes include servers, devices and execution environments."),
 bq("Which of these is an architectural style?","Client-server",["Waterfall","Black-box","Boundary value"],"Others include layered, MVC, pipe-and-filter and repository."),
 bq("In UML, what do the visibility symbols +, − and # mean?","public, private and protected",["add, subtract and hash","static, final and abstract","input, output and internal"],"They precede attribute and operation names in a class diagram."),
 bq("Which coupling is the loosest (most desirable) between two modules?","Data coupling",["Content coupling","Common coupling","Control coupling"],"With data coupling modules share only simple parameters; content coupling (one module changing another's internals) is the worst."),
 bq("What is a component diagram used for?","Showing the software parts and the interfaces between them",["Showing message order","Listing test cases","Showing user roles"],"It models how the system is organised into replaceable components."),
 bq("In a UML class diagram, inheritance (generalisation) is drawn as:","a line with a hollow triangle arrowhead pointing at the parent",["a dashed line with an open arrow","a line with a filled diamond","a plain line with a number"],"The triangle points from the subclass to the superclass."),
],
4:[
 bq("What is the difference between verification and validation?","Verification checks that we build the product right; validation checks that we build the right product",["They are the same","Verification is done only by users","Validation is done only on source code"],"Verification compares against the specification; validation compares against real needs."),
 bq("Black-box testing is based on:","the specified behaviour, without looking at the code",["the program's internal paths","the compiler output","the database schema only"],"White-box testing uses knowledge of the code structure."),
 bq("An input field accepts whole numbers from 1 to 100. With equivalence partitioning, how many partitions (classes) are normally tested?","3: below 1, 1 to 100, above 100",["1","2","100"],"One valid class and two invalid classes (too small and too large)."),
 bq("Which test values does boundary value analysis suggest for a valid range 10 to 20?","9, 10, 11, 19, 20, 21",["0, 15, 30","10 and 20 only","12, 14, 16, 18"],"Errors tend to occur at the edges, so values just inside, on and just outside each boundary are tested."),
 ()=>{const e=rnd(8,20),n=rnd(6,e-1),v=e-n+2;return bcN(`A control flow graph has ${e} edges and ${n} nodes. What is its cyclomatic complexity V(G) = E − N + 2?`,v,[e-n,e+n,v+1],`V(G) = ${e} − ${n} + 2 = ${v}, the number of independent paths.`)},
 ()=>{const p=rnd(1,6);return bcN(`A module contains ${p} simple decision points (if statements, no loops). What is its cyclomatic complexity?`,p+1,[p,p+2,2*p],`V(G) = number of predicate nodes + 1 = ${p} + 1 = ${p+1}.`)},
 bq("Which level of testing checks that individual modules work correctly by themselves?","Unit testing",["System testing","Acceptance testing","Regression testing"],"Unit tests are usually written and run by the developer."),
 bq("In top-down integration testing, what replaces modules that are not yet written?","Stubs",["Drivers","Prototypes","Patches"],"Bottom-up testing uses drivers to call the lower-level modules."),
 bq("What is the difference between testing and debugging?","Testing finds failures; debugging locates and removes their cause",["They are the same activity","Debugging finds failures","Testing removes errors"],"Debugging starts after a test has shown that a failure exists."),
 bq("What is regression testing?","Re-running tests after a change to make sure nothing else broke",["Testing only the new feature","Testing the network","Testing the first release only"],"It protects existing behaviour from being damaged by modifications."),
 bq("Basis path testing is a technique of:","white-box testing using the control flow graph",["black-box testing","user acceptance testing","requirements review"],"It designs one test per independent path of the graph."),
],
5:[
 bq("Software quality is best described as:","conformance to requirements and fitness for use",["the number of lines of code","how fast the program was written","the price of the product"],"Quality means the product does what is needed and can be depended on."),
 bq("What is ISO 9000?","A family of quality management system standards",["A programming language","A hardware interface","A cost model"],"ISO 9001 certifies that an organisation follows a documented quality system."),
 bq("What does RMMM stand for in risk management?","Risk Mitigation, Monitoring and Management",["Risk Measurement, Money and Maintenance","Requirements, Models, Methods and Metrics","Review, Manage, Modify and Merge"],"The RMMM plan documents how each risk is avoided, tracked and handled if it occurs."),
 bq("What is a proactive risk strategy?","Identify risks early and plan for them before they cause trouble",["Wait until the problem occurs","Ignore risks","Blame the team"],"A reactive strategy deals with problems only after they appear."),
 ()=>{const p=pick([0.1,0.2,0.25,0.3,0.4,0.5]),c=pick([20000,40000,50000,80000,100000]);const v=Math.round(p*c);
  return bcN(`A risk has a probability of ${p} and would cost ${c} currency units if it occurred. What is the risk exposure (probability × cost)?`,v,[c,Math.round(c/p),Math.round(c*(1-p))],`Risk exposure = ${p} × ${c} = ${v}.`)},
 bq("What is done during risk projection (estimation)?","The likelihood and the consequences of each risk are rated",["The code is compiled","The users are trained","The database is backed up"],"It follows identification and leads to prioritising the risks."),
 bq("How many maturity levels does the SEI-CMM have?","5",["3","4","7"],"Initial, Repeatable, Defined, Managed and Optimizing."),
 bq("Which metric measures software size independently of the programming language?","Function points",["Lines of code","Number of bugs","Compile time"],"Function points count the user-visible functionality: inputs, outputs, inquiries, files and interfaces."),
 bq("A program is changed so that it works on a new operating system. What type of maintenance is this?","Adaptive maintenance",["Corrective maintenance","Perfective maintenance","Preventive maintenance"],"Adaptive maintenance modifies software for a changed environment; corrective fixes bugs; perfective improves features."),
 bq("Software reliability is the probability that software will:","operate without failure for a specified time in a specified environment",["be delivered on time","cost less than the budget","be free of any comments"],"It is a statistical measure of failure-free operation."),
 bq("Which of these is a project risk rather than a technical risk?","Staff leaving the team",["The chosen database cannot handle the load","A new compiler has bugs","The interface is hard to use"],"Project risks concern budget, schedule, resources and staffing."),
],
});
