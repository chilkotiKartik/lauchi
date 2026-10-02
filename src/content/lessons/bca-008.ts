import type { Lesson } from "./types";

const jvm: Lesson = {
  intro: "Java is called platform independent because a Java program is compiled not to machine code but to bytecode, which the Java Virtual Machine runs on any operating system. The JVM architecture and the roles of JDK, JRE and JVM are standard 5-mark questions. You will learn the compile-and-run path, the parts of the JVM and a bytecode trace.",
  sections: [
    { h: "JDK, JRE and JVM", p: ["JVM (Java Virtual Machine) is the abstract machine that executes bytecode. It is different for each operating system, but all JVMs run the same bytecode.", "JRE (Java Runtime Environment) = JVM + the standard class libraries. It is what you need to run a Java program.", "JDK (Java Development Kit) = JRE + development tools: javac (compiler), java (launcher), javadoc, jar, the debugger. It is what you need to write and compile programs."] },
    { h: "Compile and run: how bytecode gives portability", p: ["The compiler javac turns Hello.java into Hello.class, which holds platform-neutral bytecode instructions. This is the write once, run anywhere idea: the same class file runs on Windows, Linux or macOS because each has its own JVM.", "At run time the JVM loads the class, verifies it, and executes it either by interpreting bytecode instruction by instruction or by compiling hot methods into native code with the Just-In-Time (JIT) compiler."], formula: ["Hello.java --javac--> Hello.class (bytecode) --java--> JVM --> machine code", "JDK = JRE + tools,   JRE = JVM + libraries"] },
    { h: "JVM architecture", p: ["Class loader subsystem: loads .class files, links them (verify, prepare, resolve) and initialises them.", "Runtime data areas: the method area (class data, constants, static variables), the heap (all objects, shared by threads and cleaned by the garbage collector), the Java stack (one per thread, holds a frame per method call with local variables and an operand stack), the PC register (address of the current instruction, per thread) and the native method stack.", "Execution engine: interpreter, JIT compiler and garbage collector. The bytecode verifier checks that code cannot break type rules or access illegal memory, which gives security."] },
  ],
  examples: [
    { q: "Explain how a Java program achieves platform independence. Trace the compile and run steps for Hello.java.", steps: ["Write Hello.java. Run javac Hello.java; it produces Hello.class with bytecode.", "Run java Hello. The class loader loads Hello.class into the method area.", "The verifier checks the bytecode; the interpreter or JIT executes it on the local machine.", "The same Hello.class can be copied to another OS; its own JVM runs it. Only the JVM is platform-specific."], ans: "Bytecode + a JVM per platform = write once, run anywhere" },
    { q: "Show how the JVM evaluates int c = a * b + 2; with a = 3, b = 4 (locals 1, 2 and 3).", steps: ["iload_1 pushes 3 on the operand stack. iload_2 pushes 4: stack 3 4.", "imul pops both and pushes 12.", "iconst_2 pushes 2: stack 12 2. iadd pops both and pushes 14.", "istore_3 pops 14 into local variable 3, which is c."], ans: "c = 14 using a stack-based execution" },
  ],
  mistakes: ["Saying Java source code is platform independent. The bytecode is; the JVM is platform dependent.", "Confusing JDK, JRE and JVM; remember JDK contains JRE contains JVM.", "Claiming the compiler produces machine code. javac produces bytecode.", "Forgetting the class loader and verifier when asked to draw the JVM architecture.", "Saying objects are stored on the stack. Objects live on the heap, only references and primitives of locals are on the stack."],
  check: [
    { q: "Bytecode is stored in a file with extension", o: [".java", ".class", ".exe", ".jar only"], a: 1, why: "javac writes .class files." },
    { q: "Which of these contains the compiler javac?", o: ["JVM", "JRE", "JDK", "JIT"], a: 2, why: "The JDK has the development tools." },
    { q: "Objects are allocated in the", o: ["stack", "heap", "PC register", "method area only"], a: 1, why: "The heap is shared by all threads and garbage collected." },
    { q: "The JIT compiler", o: ["converts hot bytecode into native code", "converts Java source to bytecode", "removes objects", "loads classes"], a: 0, why: "It speeds up execution." },
  ],
  lab: { id: "jvm", label: "Open the JVM lab" },
};

const arrays: Lesson = {
  intro: "Arrays store many values of the same type under one name. Java programs in the exam nearly always use a one-dimensional array for searching or sorting and a two-dimensional array for matrices. You will learn declaration, creation, the length field, 2-D arrays and the typical programs: maximum, matrix addition and transpose.",
  sections: [
    { h: "One dimensional arrays", p: ["An array is an object. Declare it with int[] a; and create it with a = new int[5]; or in one line int[] a = new int[5];. The elements are numbered from 0 to length − 1 and are given default values (0 for numbers, false for boolean, null for references).", "You can also write the values directly: int[] a = {4, 9, 2, 7}. The size is available as the field a.length, not a method, so no brackets. Reading outside the range throws ArrayIndexOutOfBoundsException at run time.", "An enhanced for loop for (int x : a) visits each element in order without an index."], formula: ["int[] a = new int[5];", "int[] b = {4, 9, 2, 7};", "for (int i = 0; i < b.length; i++) System.out.println(b[i]);", "for (int x : b) System.out.println(x);"] },
    { h: "Two dimensional arrays", p: ["A 2-D array is an array of arrays. int[][] m = new int[3][4]; has 3 rows and 4 columns. m.length is the number of rows and m[0].length is the number of columns. Rows may have different lengths (jagged arrays): int[][] j = new int[3][]; j[0] = new int[2];.", "Nested loops visit every element: the outer loop over rows i, the inner loop over columns j."], formula: ["int[][] m = {{1, 2, 3}, {4, 5, 6}};", "for (int i = 0; i < m.length; i++)", "  for (int j = 0; j < m[i].length; j++)", "    System.out.print(m[i][j] + \" \");"] },
  ],
  examples: [
    { q: "Write a program fragment to find the largest element of an int array a.", steps: ["Assume the first element is the largest: int max = a[0];", "Loop from i = 1 to a.length − 1.", "If a[i] > max then max = a[i].", "Print max after the loop."], ans: "int max = a[0]; for (int i = 1; i < a.length; i++) if (a[i] > max) max = a[i];" },
    { q: "Add the matrices A and B (both 2 × 3) into C and show the result for A = {{1, 2, 3}, {4, 5, 6}} and B = {{6, 5, 4}, {3, 2, 1}}.", steps: ["Declare int[][] c = new int[2][3];", "for i in 0..1, for j in 0..2: c[i][j] = a[i][j] + b[i][j];", "Row 0: 1 + 6, 2 + 5, 3 + 4 = 7 7 7.", "Row 1: 4 + 3, 5 + 2, 6 + 1 = 7 7 7."], ans: "C = {{7, 7, 7}, {7, 7, 7}}" },
    { q: "Transpose the 2 × 3 matrix {{1, 2, 3}, {4, 5, 6}}.", steps: ["The transpose t has 3 rows and 2 columns: int[][] t = new int[3][2];", "Assign t[j][i] = m[i][j] for all i, j.", "t[0] = {1, 4}, t[1] = {2, 5}, t[2] = {3, 6}."], ans: "{{1, 4}, {2, 5}, {3, 6}}" },
  ],
  mistakes: ["Writing a.length() for an array. It is a field; length() belongs to String.", "Looping with i <= a.length, which goes one past the end and throws an exception.", "Forgetting that new int[n] has indices 0 to n − 1.", "Using the wrong dimension for the transpose array, new int[2][3] instead of new int[3][2].", "Using == to compare two arrays' contents. It compares references; use Arrays.equals."],
  check: [
    { q: "int[] a = new int[4]; a[2] holds initially", o: ["null", "0", "garbage", "4"], a: 1, why: "Numeric arrays are zero-initialised." },
    { q: "For int[][] m = new int[3][5], m[0].length is", o: ["3", "5", "15", "0"], a: 1, why: "Each row has 5 columns." },
    { q: "Accessing a[a.length] throws", o: ["NullPointerException", "ArrayIndexOutOfBoundsException", "ArithmeticException", "nothing"], a: 1, why: "The last valid index is length − 1." },
    { q: "The number of rows in matrix m is", o: ["m.length", "m.length()", "m[0].size", "m.rows"], a: 0, why: "length is a field of the array object." },
  ],
};

const ctors: Lesson = {
  intro: "A constructor is the special method that runs when an object is created and gives its fields their first values. Constructors and constructor overloading appear in almost every Java programming question. You will learn the rules, the default constructor, overloading, this(...) chaining and what the output of typical code looks like.",
  sections: [
    { h: "What a constructor is", p: ["A constructor has the same name as the class and no return type, not even void. It runs automatically with new. If a class defines no constructor, the compiler supplies a default (no-argument) constructor that sets fields to default values. As soon as you write any constructor yourself, the default one is no longer supplied.", "A constructor cannot be static, final or abstract, and it is not inherited. It can be private (used in the singleton pattern)."] },
    { h: "Constructor overloading and this(...)", p: ["A class may have several constructors with different parameter lists. Java chooses one by the number and types of arguments, the same rule as method overloading.", "Inside a constructor this(...) calls another constructor of the same class. It must be the first statement. It avoids repeating code. The keyword this itself refers to the current object and separates a field from a parameter of the same name."], formula: ["class Student {", "  int roll; String name;", "  Student() { this(0, \"unknown\"); }", "  Student(int roll) { this(roll, \"unknown\"); }", "  Student(int roll, String name) { this.roll = roll; this.name = name; }", "}", "Student s = new Student(7, \"Asha\");"] },
    { h: "Order of events when you write new", p: ["Memory for the object is allocated on the heap with default values, the instance initialisers and field initialisers run, then the selected constructor body runs. In inheritance the superclass constructor runs first, so the first statement of a subclass constructor is an implicit or explicit super(...)."] },
  ],
  examples: [
    { q: "Write a class Rectangle with a default constructor (1 × 1), a one-argument constructor (square) and a two-argument constructor, and a method area().", steps: ["Fields: int l, b.", "Rectangle() { this(1, 1); }  Rectangle(int s) { this(s, s); }", "Rectangle(int l, int b) { this.l = l; this.b = b; }", "int area() { return l * b; }", "new Rectangle(4).area() is 16; new Rectangle().area() is 1; new Rectangle(3, 5).area() is 15."], ans: "Areas 1, 16 and 15" },
    { q: "What is wrong with: class A { A(int x) { } }  A a = new A();", steps: ["The class defines only a parameterised constructor, so the compiler does not add the default one.", "new A() looks for a constructor with no parameters and finds none.", "Fix: add A() { } or call new A(5)."], ans: "Compile error: no default constructor; add one or pass an argument" },
  ],
  mistakes: ["Giving the constructor a return type like void, which makes it an ordinary method that never runs automatically.", "Writing the class name in a different case. Constructor names are case-sensitive.", "Putting this(...) anywhere other than the first statement.", "Expecting the default constructor to exist after writing a parameterised one.", "Forgetting that the parameter hides the field, so x = x; changes nothing. Use this.x = x;."],
  check: [
    { q: "A constructor's return type is", o: ["void", "int", "the class type", "none"], a: 3, why: "A constructor has no return type at all." },
    { q: "this(...) must be", o: ["the last statement", "the first statement", "anywhere", "in a static method"], a: 1, why: "The constructor chain must be started first." },
    { q: "The compiler supplies a default constructor when", o: ["no constructor is declared", "any constructor is declared", "the class is abstract", "always"], a: 0, why: "Writing any constructor removes it." },
    { q: "Constructor overloading means", o: ["same parameters different names", "same name different parameter lists", "constructors in a subclass", "a static constructor"], a: 1, why: "It is resolved at compile time from the arguments." },
  ],
};

const strings: Lesson = {
  intro: "String and StringBuffer both hold text, but a String can never change after it is created, while a StringBuffer can be edited in place. The comparison of the two, often with the output of a small program, is a regular exam question. You will learn immutability, the string pool, == versus equals, StringBuffer methods and why StringBuffer wins in loops.",
  sections: [
    { h: "String is immutable", p: ["Every String object is immutable: methods like concat, toUpperCase and replace return a new String and leave the original unchanged. Because of this, the JVM can share strings safely in the string constant pool: two literals with the same text refer to the same object.", "== compares references, equals compares the characters. new String(\"Java\") always creates a new object outside the pool."], formula: ["String s1 = \"Java\";", "String s2 = \"Java\";", "String s3 = new String(\"Java\");", "s1 == s2 -> true;  s1 == s3 -> false;  s1.equals(s3) -> true"] },
    { h: "StringBuffer is mutable", p: ["A StringBuffer has an internal character array with extra capacity and changes it directly. Its important methods: append(x) adds at the end, insert(i, x), delete(start, end), reverse(), replace(start, end, str), length() and capacity(). The default capacity is 16.", "StringBuffer methods are synchronised, so it is thread-safe but a little slow. StringBuilder has the same methods without synchronisation and is faster in single-threaded code."] },
    { h: "Performance and comparison", p: ["Joining a String in a loop with + creates a new object each time, copying all earlier characters, so 10,000 iterations make 10,000 objects and about O(n²) work. A StringBuffer appends in place, which is about O(n) in total.", "Use String for fixed text, keys and constants; use StringBuffer or StringBuilder for building or modifying text."] },
  ],
  examples: [
    { q: "What is printed by: String s = \"Hello\"; s.concat(\" World\"); System.out.println(s); and by StringBuffer sb = new StringBuffer(\"Hello\"); sb.append(\" World\"); System.out.println(sb);", steps: ["s.concat returns a new String \" Hello World\" but the result is discarded.", "s is still \"Hello\" because Strings are immutable.", "sb.append changes the buffer itself, so sb now holds Hello World."], ans: "Hello  and  Hello World" },
    { q: "Predict the three comparisons: String a = \"Java\"; String b = \"Java\"; String c = new String(\"Java\"); a == b, a == c, a.equals(c).", steps: ["a and b are literals and share the pooled object, so a == b is true.", "c is a new object, so a == c is false.", "equals compares text, so a.equals(c) is true."], ans: "true, false, true" },
    { q: "Reverse a string and insert text: StringBuffer sb = new StringBuffer(\"abc\"); sb.reverse(); sb.insert(1, \"X\");", steps: ["reverse() changes the buffer to cba.", "insert(1, \"X\") puts X at index 1: cXba.", "The same object is changed throughout; no new objects are produced."], ans: "cXba" },
  ],
  mistakes: ["Using == to compare String contents. Use equals.", "Ignoring the return value of String methods, as in s.toUpperCase(); with s unchanged.", "Saying a String can be modified once created.", "Using String + in a long loop and claiming it is as fast as StringBuffer.", "Forgetting that StringBuffer has no equals that compares text; it inherits the reference comparison."],
  check: [
    { q: "Which class is mutable?", o: ["String", "StringBuffer", "Integer", "Math"], a: 1, why: "StringBuffer edits its characters in place." },
    { q: "s1 == s2 for two identical literals is", o: ["true", "false", "an error", "undefined"], a: 0, why: "Both refer to one pooled object." },
    { q: "The method that reverses a StringBuffer is", o: ["reverse()", "flip()", "invert()", "back()"], a: 0, why: "StringBuffer.reverse()." },
    { q: "StringBuilder differs from StringBuffer because it", o: ["is immutable", "is not synchronised", "has no append", "is part of java.sql"], a: 1, why: "It is faster but not thread-safe." },
  ],
  lab: { id: "jheap", label: "Open the heap and String lab" },
};

const dispatch: Lesson = {
  intro: "Dynamic method dispatch is how Java decides at run time which overridden method to call through a superclass reference. It is the mechanism behind runtime polymorphism and a 10-mark favourite with a code listing and its output. You will learn the rule, a complete example and the common traps with fields and static methods.",
  sections: [
    { h: "Overriding and the rule", p: ["A subclass overrides a method when it defines a method with the same name, parameters and return type as one in its superclass. The method must not be more restricted in access and cannot override final, static or private methods.", "A reference variable of the superclass type may refer to an object of any subclass: Shape s = new Circle(); This is upcasting.", "Dynamic method dispatch: when an overridden method is called through such a reference, Java chooses the version to run from the actual object type at run time, not from the declared type of the reference. This is runtime polymorphism."] },
    { h: "A complete example", p: ["The base class Shape has area(). Circle and Rectangle override it. One array of Shape references can hold any of them and a single loop calls the right area() for each.", "Compile-time check: the compiler allows only methods that exist in the declared type (Shape). Run-time choice: the JVM picks the override according to the object."], formula: ["class Shape { double area() { return 0; } }", "class Circle extends Shape { double r; Circle(double r) { this.r = r; }", "    double area() { return 3.14 * r * r; } }", "class Rect extends Shape { double l, b; Rect(double l, double b) { this.l = l; this.b = b; }", "    double area() { return l * b; } }", "Shape s; s = new Circle(2); System.out.println(s.area());", "s = new Rect(3, 4); System.out.println(s.area());"] },
    { h: "What is not dispatched dynamically", p: ["Fields: the field is chosen by the reference type. Static methods and private methods: chosen at compile time (they are hidden, not overridden). Overloaded methods: chosen at compile time from the argument types.", "To call a method that exists only in the subclass through a superclass reference you need a cast: ((Circle) s).radius()."] },
  ],
  examples: [
    { q: "Give the output of the Shape, Circle (r = 2) and Rect (3 × 4) code above.", steps: ["s = new Circle(2): the reference type is Shape but the object is a Circle, so Circle.area() runs: 3.14 × 2 × 2 = 12.56.", "s = new Rect(3, 4): the same call s.area() now runs Rect.area(): 3 × 4 = 12.0.", "The call statement is identical; the method chosen differs."], ans: "12.56 and 12.0" },
    { q: "class A { int x = 10; void show() { print(\"A\"); } } class B extends A { int x = 20; void show() { print(\"B\"); } } What do A a = new B(); a.show(); and a.x give?", steps: ["show() is overridden, so the object type B decides: B.", "Fields are not overridden. The reference type A decides: a.x = 10.", "Output: B and 10."], ans: "B and 10" },
  ],
  mistakes: ["Saying dispatch is decided by the reference type. It is decided by the object type for instance methods.", "Expecting field access to be polymorphic.", "Treating overloading as dynamic dispatch. Overloading is resolved at compile time.", "Changing the parameter list and calling it overriding.", "Forgetting @Override and silently creating a new method because of a spelling difference."],
  check: [
    { q: "Runtime polymorphism is achieved by", o: ["overloading", "overriding with a superclass reference", "static methods", "constructors"], a: 1, why: "The JVM selects the overridden method from the object." },
    { q: "In Shape s = new Circle(); s.area() runs the method of", o: ["Shape", "Circle", "Object only", "neither"], a: 1, why: "The actual object is a Circle." },
    { q: "Which cannot be overridden?", o: ["a public method", "a final method", "a protected method", "a method with a return value"], a: 1, why: "final methods are fixed." },
    { q: "Fields in a subclass with the same name as in the superclass are", o: ["overridden", "hidden, chosen by reference type", "illegal", "shared"], a: 1, why: "Only methods are polymorphic." },
  ],
  lab: { id: "jdispatch", label: "Open the dynamic dispatch lab" },
};

const interfaces: Lesson = {
  intro: "Java does not allow a class to extend two classes, but it allows a class to implement many interfaces. The difference between an abstract class and an interface, and how interfaces give a form of multiple inheritance, is a standard 10-mark answer. You will learn both constructs, the comparison table and a working example.",
  sections: [
    { h: "Abstract class", p: ["An abstract class is declared with the keyword abstract and may contain abstract methods (no body) as well as normal methods, fields, constructors and static members. It cannot be instantiated with new; a concrete subclass must implement all inherited abstract methods or itself be abstract. Use it for a base class that shares code among closely related classes."] },
    { h: "Interface", p: ["An interface is a contract: it declares what methods a class must have. Methods are public and abstract by default (and since Java 8 may also be default or static methods with a body). Fields are public static final constants. A class implements an interface with the keyword implements and must provide all its abstract methods. An interface can extend other interfaces.", "A class can implement several interfaces: class Duck implements Flyer, Swimmer. This gives multiple inheritance of type without the diamond problem for state, since interfaces hold no instance fields.", "If two interfaces provide the same default method, the class must override it and may choose one with Flyer.super.name()."], formula: ["interface Flyer { void fly(); }", "interface Swimmer { void swim(); }", "class Duck implements Flyer, Swimmer {", "  public void fly() { System.out.println(\"flying\"); }", "  public void swim() { System.out.println(\"swimming\"); }", "}"] },
    { h: "Comparison", p: ["Keyword: extends vs implements. Number: a class extends one abstract class but implements many interfaces. Members: abstract class may have instance fields, constructors, and concrete methods; interface has only constants and (mostly) abstract methods. Access: interface methods are public. Purpose: abstract class models an is-a relation with shared code; interface models a capability (can-do)."] },
  ],
  examples: [
    { q: "Differentiate between abstract classes and interfaces and show how Java supports multiple inheritance.", steps: ["Draw the table: single vs multiple, constructors, fields, method bodies, keyword.", "Explain that class C cannot extend A and B (ambiguity if both define the same method or field).", "Show interface Flyer and Swimmer and class Duck implements both, with the code above.", "Mention that Duck is a Flyer and a Swimmer: it can be used wherever either type is required."], ans: "Multiple inheritance of type through interfaces; single inheritance of implementation" },
    { q: "What happens if class X implements Flyer but forgets the method fly()?", steps: ["Flyer.fly() is abstract, so X must define it.", "If X does not, the compiler reports an error unless X is declared abstract.", "If X defines it with default (package) access, that is also an error because the interface method is public."], ans: "Compile-time error; the method must be implemented as public" },
  ],
  mistakes: ["Writing class Duck extends Flyer, Swimmer. Use implements for interfaces.", "Implementing an interface method without public.", "Trying to create an object of an interface or abstract class with new.", "Claiming interfaces can contain instance fields. They only hold constants.", "Saying Java has no multiple inheritance at all. It has multiple inheritance of interfaces."],
  check: [
    { q: "A class can implement", o: ["only one interface", "any number of interfaces", "no interface", "exactly two"], a: 1, why: "Multiple implements are allowed." },
    { q: "Interface variables are implicitly", o: ["private", "public static final", "protected", "volatile"], a: 1, why: "They are constants." },
    { q: "An abstract class can have", o: ["constructors", "no members", "only constants", "no methods"], a: 0, why: "It can have constructors, fields and concrete methods." },
    { q: "Interface methods (before default methods) are implicitly", o: ["public abstract", "private", "static", "final"], a: 0, why: "Hence implementing classes must use public." },
  ],
};

const events: Lesson = {
  intro: "A graphical program has to react to the user: a button click, a key press or a mouse move. Java handles this with the event delegation model: the component that produces the event delegates its handling to a listener object. This is the base of every AWT and Swing question. You will learn the three roles, the steps to follow and a complete example.",
  sections: [
    { h: "Source, event and listener", p: ["Event source: the component on which something happens (a Button, TextField, Frame). Event object: describes what happened, for example ActionEvent, MouseEvent, KeyEvent, WindowEvent. Event listener: an object of a class that implements the listener interface for that event type and is registered with the source.", "Delegation means the source does not handle the event itself. When the event occurs, the source calls a method of every registered listener and passes the event object. This separates the user interface from the logic."] },
    { h: "Steps to handle an event", p: ["Step 1: import java.awt.event.* (and java.awt.* or javax.swing.*). Step 2: create a class that implements the listener interface, for example ActionListener. Step 3: write the handler method, here actionPerformed(ActionEvent e). Step 4: register the listener with the source by source.addActionListener(listener).", "e.getSource() tells which component fired the event; e.getActionCommand() returns the button label.", "Listener interfaces with many methods, like WindowListener (seven methods), can be avoided by extending an adapter class such as WindowAdapter and overriding only the needed methods."], formula: ["Common pairs: ActionListener -> actionPerformed(ActionEvent)", "MouseListener -> mouseClicked, mousePressed, mouseReleased, mouseEntered, mouseExited", "KeyListener -> keyPressed, keyReleased, keyTyped", "WindowListener -> windowClosing and six others (use WindowAdapter)"] },
  ],
  examples: [
    { q: "Write a Swing program fragment where clicking a button increments a counter shown in a label.", steps: ["Create JButton b = new JButton(\"Click\"); JLabel l = new JLabel(\"0\"); int count held in a one-element array or a field.", "Register: b.addActionListener(new ActionListener() { public void actionPerformed(ActionEvent e) { count++; l.setText(\"\" + count); } });", "Add b and l to the frame and make it visible.", "Each click makes the button (source) call actionPerformed (listener) with an ActionEvent."], ans: "Label shows 1, 2, 3 on successive clicks" },
    { q: "Why is WindowAdapter used for closing a frame?", steps: ["WindowListener has seven methods and a class implementing it must define all of them.", "WindowAdapter gives empty bodies for all seven.", "Extend it and override only windowClosing: public void windowClosing(WindowEvent e) { System.exit(0); }", "Register with frame.addWindowListener(new MyAdapter())."], ans: "Only the method of interest is written" },
  ],
  mistakes: ["Forgetting to register the listener, so nothing happens when the button is clicked.", "Implementing the interface but leaving out one of its methods, which gives a compile error.", "Registering a listener of the wrong type, e.g. addMouseListener with an ActionListener.", "Updating the GUI from a non-event thread without invokeLater in larger programs.", "Writing 'inheritance model' for the event model. It is delegation."],
  check: [
    { q: "The component that generates an event is called the", o: ["source", "listener", "adapter", "container"], a: 0, why: "The listener only handles it." },
    { q: "Method of ActionListener is", o: ["actionPerformed", "actionDone", "onClick", "handle"], a: 0, why: "It receives an ActionEvent." },
    { q: "To avoid writing all methods of WindowListener use", o: ["WindowAdapter", "WindowEvent", "WindowFocus", "Window"], a: 0, why: "Adapters provide empty implementations." },
    { q: "A listener is attached to a source with", o: ["a constructor", "addXxxListener", "setListener only", "import"], a: 1, why: "For example addActionListener." },
  ],
};

const login: Lesson = {
  intro: "Designing a login window is the typical programming question in GUI unit: create a frame, place labels, a text field, a password field and buttons, and handle the button click. It combines UI controls, layout and the event model. You will learn the main Swing controls and see a complete program with a walk-through of what happens on a click.",
  sections: [
    { h: "Swing controls you need", p: ["JFrame is the top-level window; setSize, setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE) and setVisible(true) are used on it. JLabel shows text, JTextField takes one line of input, JPasswordField hides what is typed (getPassword returns a char array), JButton triggers an action, JCheckBox, JRadioButton, JComboBox and JTextArea cover other inputs.", "A layout manager arranges the components in the container: FlowLayout (left to right), BorderLayout (north, south, east, west, centre) and GridLayout (rows and columns). A form with label and field pairs uses GridLayout(3, 2)."] },
    { h: "Complete program", p: ["The class extends JFrame and implements ActionListener. The constructor builds the interface and registers this as the listener of the login button.", "In actionPerformed, read the text, compare it with the expected values using equals and show the result with JOptionPane.showMessageDialog."], formula: ["import javax.swing.*; import java.awt.*; import java.awt.event.*;", "public class Login extends JFrame implements ActionListener {", "  JTextField user = new JTextField(); JPasswordField pass = new JPasswordField();", "  JButton ok = new JButton(\"Login\");", "  Login() { setLayout(new GridLayout(3, 2));", "    add(new JLabel(\"User\")); add(user); add(new JLabel(\"Password\")); add(pass);", "    add(new JLabel()); add(ok); ok.addActionListener(this);", "    setSize(300, 150); setDefaultCloseOperation(EXIT_ON_CLOSE); setVisible(true); }", "  public void actionPerformed(ActionEvent e) {", "    String p = new String(pass.getPassword());", "    if (user.getText().equals(\"admin\") && p.equals(\"1234\"))", "      JOptionPane.showMessageDialog(this, \"Welcome\");", "    else JOptionPane.showMessageDialog(this, \"Invalid login\"); }", "  public static void main(String[] a) { new Login(); } }"] },
  ],
  examples: [
    { q: "Explain what happens when the user types admin / 1234 and presses Login in the program above.", steps: ["The click on ok creates an ActionEvent and calls actionPerformed of the registered listener (the Login object).", "user.getText() returns \"admin\"; pass.getPassword() returns the characters, converted to the String \"1234\".", "Both equals comparisons are true, so the dialog shows Welcome."], ans: "A dialog displays: Welcome" },
    { q: "What changes if the user enters admin / 0000?", steps: ["The click calls the same method.", "user matches but p.equals(\"1234\") is false, so the && condition fails.", "The else branch shows a dialog with Invalid login."], ans: "Dialog displays: Invalid login" },
  ],
  mistakes: ["Comparing strings with == in the login check. Use equals.", "Forgetting setVisible(true), so the window never appears.", "Forgetting to add the listener to the button, or forgetting to implement actionPerformed.", "Using getText() on a password field. It works but is deprecated; use getPassword().", "Missing imports for javax.swing and java.awt.event."],
  check: [
    { q: "Which control hides typed characters?", o: ["JTextField", "JPasswordField", "JLabel", "JTextArea"], a: 1, why: "It echoes a mask character." },
    { q: "To close the application on closing the frame use", o: ["setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE)", "setClose(true)", "frame.quit()", "System.close()"], a: 0, why: "It exits the program when the window is closed." },
    { q: "GridLayout(3, 2) arranges components in", o: ["3 rows and 2 columns", "3 columns and 2 rows", "a single row", "five regions"], a: 0, why: "The arguments are rows then columns." },
    { q: "A button click event is handled in", o: ["paint()", "actionPerformed()", "main()", "run()"], a: 1, why: "It is the ActionListener method." },
  ],
};

const serial: Lesson = {
  intro: "Serialization turns an object into a stream of bytes so that it can be saved in a file or sent over a network, and deserialization rebuilds the object from those bytes. The standard exam question asks you to write code that serializes and deserializes an object. You will learn the Serializable marker interface, the two stream classes, transient fields and the pitfalls.",
  sections: [
    { h: "The mechanism", p: ["A class whose objects are to be serialized must implement java.io.Serializable. It is a marker interface with no methods; it only tells the JVM the class may be serialized. All fields of the object must themselves be serializable (or be marked transient).", "ObjectOutputStream.writeObject(obj) writes the object and everything reachable from it. ObjectInputStream.readObject() reads it back; it returns Object, so you cast to the class. Both streams wrap a FileOutputStream or FileInputStream.", "Fields declared transient are skipped and come back as the default value (null, 0, false). Static fields belong to the class, not to the object, so they are not serialized either. serialVersionUID is a version number that must match on reading, otherwise InvalidClassException occurs."], formula: ["class Student implements Serializable {", "  int roll; String name; transient String password;", "  Student(int r, String n, String p) { roll = r; name = n; password = p; } }", "ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream(\"s.ser\"));", "out.writeObject(new Student(1, \"Asha\", \"pw\")); out.close();", "ObjectInputStream in = new ObjectInputStream(new FileInputStream(\"s.ser\"));", "Student s = (Student) in.readObject(); in.close();"] },
    { h: "Exceptions and uses", p: ["writeObject throws IOException (and NotSerializableException if some field is not serializable). readObject throws IOException and ClassNotFoundException, so place the code in a try-catch block or use throws.", "Uses: saving the state of a program, sending objects in RMI or between processes, caching and deep copying."] },
  ],
  examples: [
    { q: "Write a program to serialize a Student(roll 1, name Asha, password pw with transient) and then read it back and print the fields.", steps: ["Make Student implement Serializable; mark password as transient.", "Write: create ObjectOutputStream over FileOutputStream(\"s.ser\"), call writeObject and close it.", "Read: create ObjectInputStream over FileInputStream(\"s.ser\"), call readObject and cast to Student, close.", "Print s.roll, s.name, s.password."], ans: "1 Asha null (the transient field is not saved)" },
    { q: "What happens if Student has a field of a class Address that does not implement Serializable?", steps: ["writeObject tries to serialize the Address object reachable from Student.", "Address is not Serializable, so the stream throws NotSerializableException.", "Fix: make Address Serializable, or mark that field transient."], ans: "NotSerializableException at writeObject" },
  ],
  mistakes: ["Forgetting implements Serializable on the class.", "Expecting transient or static fields to be restored with their old values.", "Reading objects back in a different order than they were written.", "Forgetting the cast after readObject, or the ClassNotFoundException handler.", "Not closing the streams, so the data is not flushed to the file."],
  check: [
    { q: "Serializable is a", o: ["class", "marker interface", "annotation", "package"], a: 1, why: "It has no methods." },
    { q: "After deserialization a transient String field is", o: ["its old value", "null", "an empty string", "an exception"], a: 1, why: "Transient fields are not saved, so the default value is used." },
    { q: "Which method reads an object from a stream?", o: ["readObject()", "getObject()", "loadObject()", "input()"], a: 0, why: "ObjectInputStream.readObject()." },
    { q: "Static fields are", o: ["serialized", "not serialized", "serialized only if public", "serialized as null"], a: 1, why: "They belong to the class, not the object." },
  ],
};

const fileio: Lesson = {
  intro: "FileInputStream and FileOutputStream read and write raw bytes of a file. They are the basis for copying files, reading binary data such as images, and they appear in the I/O unit with questions on reading a file and counting characters. You will learn the read loop, the end-of-file value, try-with-resources and a complete copy program.",
  sections: [
    { h: "Byte streams", p: ["A stream is an ordered flow of data. Byte streams (InputStream, OutputStream and their subclasses) handle 8-bit bytes, good for any file type. Character streams (Reader, Writer) handle 16-bit Unicode characters, good for text.", "FileInputStream(String name) opens a file for reading and throws FileNotFoundException if it does not exist. read() returns the next byte as an int from 0 to 255, or −1 at the end of the file. read(byte[] b) fills an array and returns the number of bytes read (or −1).", "FileOutputStream(String name) creates or overwrites the file; FileOutputStream(name, true) appends. write(int b) writes one byte, write(byte[] b, int off, int len) writes a block."], formula: ["int b; while ((b = in.read()) != -1) { ... use b ... }", "byte[] buf = new byte[1024]; int n;", "while ((n = in.read(buf)) != -1) out.write(buf, 0, n);"] },
    { h: "Closing and exceptions", p: ["Streams must be closed to release the file and flush the buffered data. The try-with-resources statement closes them automatically: try (FileInputStream in = new FileInputStream(a); FileOutputStream out = new FileOutputStream(b)) { ... }.", "I/O methods throw the checked IOException, so catch it or declare it with throws."] },
  ],
  examples: [
    { q: "Write a program to copy the file a.txt to b.txt using byte streams.", steps: ["Open both streams in a try-with-resources block.", "Create byte[] buf = new byte[1024]; int n;", "Loop: while ((n = in.read(buf)) != -1) out.write(buf, 0, n);", "Catch IOException and print the message. Streams close automatically."], ans: "b.txt becomes a byte-for-byte copy of a.txt" },
    { q: "Count the number of characters (bytes) and lines in a text file with FileInputStream.", steps: ["int b, count = 0, lines = 0; open the stream.", "While ((b = in.read()) != -1): count++; if (b == '\\n') lines++;", "Print count and lines."], ans: "count = total bytes, lines = number of newline characters" },
  ],
  mistakes: ["Storing read() in a byte variable. It returns an int so that −1 can signal end of file.", "Writing out.write(buf) instead of write(buf, 0, n), which writes stale bytes at the end.", "Forgetting to close the streams or handle IOException.", "Using FileOutputStream on an existing file without realising it overwrites it.", "Using byte streams for text with non-English characters; use FileReader/FileWriter."],
  check: [
    { q: "read() returns what at the end of the file?", o: ["0", "−1", "null", "255"], a: 1, why: "−1 signals end of stream." },
    { q: "FileOutputStream(\"f.txt\", true) will", o: ["overwrite", "append", "delete", "throw an error"], a: 1, why: "The second argument selects append mode." },
    { q: "A byte stream class for reading a file is", o: ["FileReader", "FileInputStream", "FileWriter", "BufferedWriter"], a: 1, why: "FileReader is a character stream." },
    { q: "FileInputStream throws if the file", o: ["is empty", "does not exist", "is large", "is text"], a: 1, why: "FileNotFoundException." },
  ],
};

const exceptions: Lesson = {
  intro: "An exception is an event that disturbs the normal flow of a program, such as dividing by zero or opening a file that is missing. Java handles them with try, catch, finally, throw and throws, and lets you define your own exception classes. This is a guaranteed 10-mark topic. You will learn the hierarchy, the flow of control and a custom exception program.",
  sections: [
    { h: "Hierarchy", p: ["Throwable has two branches: Error (serious JVM problems such as OutOfMemoryError, not normally handled) and Exception. Exception has checked exceptions (the compiler forces you to handle or declare them: IOException, SQLException, and your own subclasses of Exception) and unchecked exceptions, subclasses of RuntimeException (ArithmeticException, NullPointerException, ArrayIndexOutOfBoundsException, NumberFormatException)."] },
    { h: "try, catch, finally, throw, throws", p: ["try holds the code that may fail. A catch block handles one exception type; several catch blocks are checked from top to bottom, so subclass catches must come before superclass catches. finally always runs, whether an exception occurred or not, and is used to release resources. throw creates and throws an exception object; throws in a method header declares that the method may pass a checked exception to its caller.", "When an exception is thrown, normal execution stops, the JVM looks for a matching catch in the current method and then in the callers up the stack (stack unwinding). If none is found the program terminates with a stack trace."], formula: ["try { int r = a / b; }", "catch (ArithmeticException e) { System.out.println(\"Divide by zero\"); }", "catch (Exception e) { System.out.println(e.getMessage()); }", "finally { System.out.println(\"done\"); }", "void read() throws IOException { ... }", "throw new IllegalArgumentException(\"bad value\");"] },
    { h: "User-defined exceptions", p: ["Extend Exception for a checked exception (or RuntimeException for an unchecked one), give a constructor that passes the message to super, then use throw. The caller must catch it or declare throws."] },
  ],
  examples: [
    { q: "Write a custom exception InsufficientFundsException and a withdraw method that throws it. Show the call handling.", steps: ["class InsufficientFundsException extends Exception { InsufficientFundsException(String m) { super(m); } }", "class Account { double bal = 500; void withdraw(double amt) throws InsufficientFundsException { if (amt > bal) throw new InsufficientFundsException(\"Balance is only \" + bal); bal -= amt; } }", "Caller: try { acc.withdraw(800); } catch (InsufficientFundsException e) { System.out.println(e.getMessage()); } finally { System.out.println(\"Transaction ended\"); }", "800 is greater than 500, so the exception is thrown, the catch prints the message and finally runs."], ans: "Balance is only 500.0 then Transaction ended" },
    { q: "Give the output: try { int a = 5 / 0; System.out.println(\"A\"); } catch (ArithmeticException e) { System.out.println(\"B\"); } finally { System.out.println(\"C\"); } System.out.println(\"D\");", steps: ["5 / 0 throws ArithmeticException immediately, so A is skipped.", "The matching catch prints B.", "finally prints C. Execution continues after the try statement and prints D."], ans: "B C D" },
  ],
  mistakes: ["Putting catch (Exception e) before catch (ArithmeticException e). This is a compile error: unreachable code.", "Confusing throw (statement that throws an object) with throws (declaration in the method header).", "Thinking finally does not run when an exception is caught. It always runs, except for System.exit or a JVM crash.", "Catching a checked exception that the try block cannot throw.", "Printing nothing in catch, hiding the error."],
  check: [
    { q: "Which is an unchecked exception?", o: ["IOException", "ArithmeticException", "SQLException", "FileNotFoundException"], a: 1, why: "It is a RuntimeException." },
    { q: "finally block is executed", o: ["only on exception", "only when there is no exception", "in both cases", "never"], a: 2, why: "Cleanup code always runs." },
    { q: "To pass a checked exception to the caller use", o: ["throw", "throws", "try", "final"], a: 1, why: "throws appears in the method header." },
    { q: "A user-defined checked exception extends", o: ["Error", "Exception", "RuntimeException", "Object"], a: 1, why: "Exception, not its RuntimeException subclass." },
  ],
  lab: { id: "jexc", label: "Open the exception flow lab" },
};

const threads: Lesson = {
  intro: "A thread is a separate path of execution inside a program. Java lets you create threads by extending Thread or, better, by implementing Runnable. The exam asks for a program that runs two threads and for the thread life cycle. You will learn both ways of creating threads, start versus run, join and a synchronised counter example.",
  sections: [
    { h: "Two ways to create a thread", p: ["Extending Thread: write class T extends Thread, override run(), create an object and call start(). Implementing Runnable: write class R implements Runnable with a run() method, wrap it with new Thread(new R()) and call start().", "Runnable is preferred because the class can still extend another class (Java has single inheritance) and the task is separated from the thread mechanics.", "start() asks the JVM to create a new thread of execution and call run() in it. Calling run() directly is just an ordinary method call in the current thread: no new thread appears."], formula: ["class Task implements Runnable {", "  String name; Task(String n) { name = n; }", "  public void run() { for (int i = 1; i <= 3; i++) {", "      System.out.println(name + \" \" + i);", "      try { Thread.sleep(100); } catch (InterruptedException e) { } } } }", "Thread t1 = new Thread(new Task(\"A\")); Thread t2 = new Thread(new Task(\"B\"));", "t1.start(); t2.start(); t1.join(); t2.join();"] },
    { h: "Useful methods and states", p: ["sleep(ms) pauses the current thread, join() makes the caller wait for the thread to finish, setPriority(1 to 10) is a hint to the scheduler, currentThread().getName() names the running thread.", "Life cycle: New (created) -> Runnable (after start) -> Running -> Blocked/Waiting/Timed waiting (sleep, wait, locked) -> Terminated (run finishes).", "Because the scheduler decides when each thread runs, the interleaving of output from two threads can differ from run to run."] },
    { h: "Synchronisation", p: ["When threads share data, updates like count++ are not atomic and may be lost. Mark the method synchronized so only one thread at a time can run it on a given object (a lock, or monitor, is held while it runs)."] },
  ],
  examples: [
    { q: "Write a program that runs two threads A and B using Runnable, each printing three lines, and waits for both to finish.", steps: ["Define class Task implements Runnable as above.", "In main create t1 and t2 as Thread objects.", "Call start() on both. They run concurrently.", "Call join() on both so main prints 'Done' only after both end."], ans: "Lines A 1..3 and B 1..3 appear interleaved (for example A 1, B 1, A 2, B 2, A 3, B 3), then Done" },
    { q: "Two threads each call counter.increment() 1000 times on a shared int count. Why can the result be below 2000 and how do you fix it?", steps: ["count++ is three steps: read, add, write. Two threads may read the same value before either writes.", "One update is then lost, so the final value may be below 2000.", "Declare the method synchronized void increment() { count++; }. Now only one thread can enter at a time.", "After join() on both threads, count is exactly 2000."], ans: "Use synchronized to get 2000" },
  ],
  mistakes: ["Calling run() instead of start(), which runs everything in the main thread.", "Calling start() twice on the same thread, which throws IllegalThreadStateException.", "Assuming a fixed order of output between threads.", "Forgetting to catch InterruptedException around sleep and join.", "Sharing data between threads without synchronization."],
  check: [
    { q: "Which method starts a new thread of execution?", o: ["run()", "start()", "begin()", "execute()"], a: 1, why: "start() creates the thread, which then calls run()." },
    { q: "The interface that has the run() method is", o: ["Threadable", "Runnable", "Callable only", "Executor"], a: 1, why: "A Runnable holds the code for a thread." },
    { q: "join() makes the calling thread", o: ["terminate", "wait for the other thread to finish", "sleep forever", "change priority"], a: 1, why: "It blocks until the target thread ends." },
    { q: "A thread that has finished run() is in state", o: ["New", "Runnable", "Waiting", "Terminated"], a: 3, why: "It cannot be restarted." },
  ],
  lab: { id: "jthread", label: "Open the thread life cycle lab" },
};

/** BCA-008 lessons. Keys are "BCA-008:unit:topic" (topic = 1-based index in the syllabus unit's topics). */
export const L_BCA008: Record<string, Lesson> = {
  "BCA-008:1:1": jvm,
  "BCA-008:1:13": arrays,
  "BCA-008:2:4": ctors,
  "BCA-008:2:9": strings,
  "BCA-008:3:4": dispatch,
  "BCA-008:3:6": interfaces,
  "BCA-008:4:2": events,
  "BCA-008:4:9": login,
  "BCA-008:5:7": serial,
  "BCA-008:5:3": fileio,
  "BCA-008:6:7": exceptions,
  "BCA-008:6:3": threads,
};
