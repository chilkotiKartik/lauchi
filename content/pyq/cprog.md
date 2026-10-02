# PROGRAMMING FOR PROBLEM SOLVING (CST-001)
## PYQ Archive with Marks & Repetition Counts, Predicted Topics (Units I to V)

---

# UNIT I: INTRODUCTION TO PROGRAMMING & C BASICS

## 1. Syllabus Topics
* **Introduction to Programming:** Components of a computer system, computing environments, computer languages (machine, assembly, high-level), assembler, compiler, interpreter, syntax and logical errors, creating and running programs, algorithms, flowcharts.
* **Introduction to C:** History and basic structure of C programs, compilation and execution stages (pre-processing, compiling, assembling, linking, loading).
* **C Tokens:** Keywords, identifiers, constants (integer, real, character), strings, special symbols, variables, data types (primary, derived, user-defined; size and range modifiers: short, long, signed, unsigned, volatile).
* **I/O Statements:** Formatted and unformatted console input/output statements (printf(), scanf(), getchar(), putchar()).

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q1.1 [Theory - 10 Marks | Repeated 4x]:** Illustrate and explain the step-by-step process of compiling and running a C program.
* **Q1.2 [Theory - 10 Marks | Repeated 6x]:** Discuss the difference between an algorithm and a program in detail. What do you mean by Algorithms? Explain.
* **Q1.3 [Theory - 5 Marks | Repeated 6x]:** Explain the purpose and utility of flowcharts in programming. Provide an example of a simple algorithm represented by a flowchart. Differentiate between flowchart and pseudo code using an example.
* **Q1.4 [Theory - 5 Marks | Repeated 3x]:** Differentiate among Assembler, Compiler, and Interpreter. Differentiate between syntax error and logical error.
* **Q1.5 [Theory - 10 Marks | Repeated 3x]:** What is a programming language? Explain the types of programming languages with suitable examples of each language.
* **Q1.6 [Theory - 10 Marks | Repeated 3x]:** Define a digital computer and illustrate its block diagram. Elaborate on how digital computers operate and discuss their distinctive features.
* **Q1.7 [Theory - 5 Marks | Repeated 5x]:** Define C tokens and classify them into categories such as keywords, identifiers, constants, strings, and special symbols with examples.
* **Q1.8 [Theory - 10 Marks | Repeated 5x]:** Explain the basic rules for constructing identifiers, integer constants, real constants, and variables.
* **Q1.9 [Theory - 10 Marks | Repeated 5x]:** What do you understand by datatypes in C? Explain different types of data types in detail with suitable examples. What is the size of data types and on what factors does it depend?
* **Q1.10 [Theory - 10 Marks | Repeated 5x]:** Discuss the use of the short, long, signed, unsigned, and volatile keywords in C with suitable examples.
* **Q1.11 [Theory - 5 Marks | Repeated 3x]:** How are input and output operations handled in C programs? Discuss the usage of I/O statements such as printf() and scanf().

### B. Coding & Flowchart Problems
* **Q1.12 [Coding - 5 Marks | Repeated 3x]:** Write an algorithm and draw the flowchart to calculate basic arithmetic operations.
* **Q1.13 [Coding - 5 Marks | Repeated 4x]:** Write a program in C language to find the factorial value of a number. Also write the algorithm and draw the flowchart.

## 3. Predicted Must-Do Exam Topics
1. **Compilation Stages of a C Program:** Pre-processing (#include), Compiling (.c to .s), Assembling (.s to .o), and Linking (.o + libraries to executable binary).
2. **C Tokens & Data Types:** Token classifications, identifier rules, and size/sign modifiers (short, long, signed, unsigned, volatile).
3. **Algorithms vs. Flowcharts & Translators:** Flowchart geometrical symbols, writing step-by-step algorithms, and distinguishing compilers from interpreters and assemblers.

---

# UNIT II: OPERATORS, EXPRESSIONS & CONTROL STRUCTURES

## 1. Syllabus Topics
* **Operators & Expressions:** Arithmetic, relational, logical, assignment, increment and decrement, bitwise, conditional/ternary, and special operators.
* Operator precedence and associativity, evaluation of expressions, type conversions (implicit promotion vs. explicit casting).
* **Decision Statements:** if, if-else, nested if-else, switch-case.
* **Loop Control Statements:** while, for, do-while.
* **Jump Statements:** break, continue, goto.

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q2.1 [Theory - 10 Marks | Repeated 6x]:** Discuss the role of loop control statements in programming and explain/differentiate between while, for, and do-while loops with syntax and flowcharts.
* **Q2.2 [Theory - 5 Marks | Repeated 5x]:** Explain the purpose of jump statements in programming, including break, continue, and goto. Differentiate between break and continue with a C program.
* **Q2.3 [Theory - 10 Marks | Repeated 5x]:** Explain the difference between arithmetic, relational, and logical operators, providing examples of each. Explain bitwise, logical, and conditional operators in C with examples.
* **Q2.4 [Theory - 5 Marks | Repeated 5x]:** Explain ternary operators with a suitable example.
* **Q2.5 [Theory - 5 Marks | Repeated 4x]:** Explain if and else statements with suitable examples.
* **Q2.6 [Theory - 5 Marks | Repeated 3x]:** Explain the difference between implicit and explicit type casting in detail.
* **Q2.7 [Theory - 5 Marks | Repeated 2x]:** Differentiate between postfix and prefix increment operators.

### B. Output Tracing & Code Prediction Problems
* **Q2.8 [Output Tracing - 5 Marks]:** What will be the output of the following program? `int i = 4, j = -1, k = 0, y, z; y = i + 5 && j + 1 || k + 2; z = i + 5 || j + 1 && k + 2; printf("y=%d z=%d", y, z);`
* **Q2.9 [Output Tracing - 5 Marks | Repeated 2x]:** What will be the output of this program? `int a = 14; while (a < 20) { ++a; if (a >= 16 && a <= 18) { break; } printf("%d ", a); }`
* **Q2.10 [Output Tracing - 5 Marks | Repeated 2x]:** What will be the output of this program? `int k; for (k = 1; k <= 5; k++); { printf("%d ", k); }`
* **Q2.11 [Output Tracing - 5 Marks]:** What will be the output of the following program? `int a = 3, b, c, d; b = a++ * a++; c = ++a * ++a; d = a++ * ++a; printf("a=%d b=%d c=%d d=%d", a, b, c, d);`

### C. Standard Exam Coding Problems
* **Q2.12 [Coding - 10 Marks | Repeated 5x]:** Write a program to print all the prime numbers between 1 to 100 (or print prime numbers from 2 to N numbers where the value of N will be entered at runtime).
* **Q2.13 [Coding - 5 Marks | Repeated 3x]:** Write a program to find if a number is even or odd using a switch-case statement.
* **Q2.14 [Coding - 5 Marks | Repeated 2x]:** Write a program to check whether a year is a leap year or not.
* **Q2.15 [Coding - 10 Marks | Repeated 2x]:** Write a program to print the reverse of a given number.
* **Q2.16 [Coding - 5 Marks]:** Write a program to find the greatest among three numbers using the conditional operator.
* **Q2.17 [Coding - 10 Marks]:** Write a program in C language to generate the following output: 1 / 1 2 / 1 2 3 / 1 2 3 4 / 1 2 3 4 5 (each row on its own line).

## 3. Predicted Must-Do Exam Topics
1. **Prime Number Generation (1 to N):** Loop construct with divisibility condition up to the square root of N.
2. **Loop Mechanics (while vs. do-while vs. for):** Entry-controlled vs. exit-controlled loops, syntax, and flowcharts.
3. **Operator Precedence & Evaluation:** Tracing increment/decrement operators and short-circuit evaluation of logical operators.
4. **Conditional Branching:** Leap year algorithm and menu-driven switch-case constructs.

---

# UNIT III: ARRAYS & FUNCTIONS

## 1. Syllabus Topics
* **Arrays:** Contiguous memory allocation, 1D array declaration, initialization, and access, basic algorithms, multidimensional arrays.
* **Sorting:** Bubble sort, Insertion sort, Selection sort (algorithms, complexities, and tracing).
* **Functions:** User-defined and built-in functions, declaration vs. definition, parameter passing (call by value, call by reference, passing arrays).
* **Recursion:** Mechanics of recursion, base condition, call stack, applications (factorial, Fibonacci, Ackermann, Quick sort, Merge sort).
* **Storage Classes:** auto, register, static, extern (scope, lifetime, default values, storage).

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q3.1 [Theory - 10 Marks | Repeated 7x]:** What is the difference between call by value and call by reference? Explain parameter passing methods with suitable examples. Write a program of swapping two integers using call by value and call by reference methods.
* **Q3.2 [Theory - 10 Marks | Repeated 6x]:** Discuss the concept of recursive functions in detail. Define recursion in programming and illustrate its application in solving problems, discussing advantages and limitations.
* **Q3.3 [Theory - 5 Marks | Repeated 4x]:** Describe the different storage classes in C programming and discuss their scope, storage, and lifetime. Write short notes on: (i) static, (ii) extern.
* **Q3.4 [Theory - 5 Marks | Repeated 3x]:** Explain the differences between function definition and function declaration with suitable examples. What is a function and why is it needed?
* **Q3.5 [Theory - 10 Marks | Repeated 6x]:** Explain how the number of comparisons and swaps grows with input size in Bubble Sort. Write an algorithm for Bubble sort.
* **Q3.6 [Theory - 10 Marks | Repeated 4x]:** Write an algorithm for Insertion sort and analyze its complexity.

### B. Sorting Tracing Problems
* **Q3.7 [Sorting Trace - 10 Marks | Repeated 4x]:** Explain the step-by-step procedure of the Bubble sort method for the following elements: [3, 5, 2, 6, 4, 1, 8]; [5, 1, 4, 2, 8, 7]; [56, 21, 2, 31, 23, -8, 7]; [54, 26, 93, 17, 77, 31, 44, 55, 20].
* **Q3.8 [Sorting Trace - 10 Marks | Repeated 3x]:** Explain the step-by-step methodology using Insertion sort for the array: [-8, 23, 31, 7, 2, 21, 56].
* **Q3.9 [Sorting Trace - 10 Marks]:** Write steps/algorithm for Quick sort for the data: [54, 26, 93, 17, 77, 31, 44, 55, 20].

### C. Standard Coding Problems
* **Q3.10 [Coding - 10 Marks | Repeated 5x]:** Write a program that calculates the factorial of an entered number by using a recursive function.
* **Q3.11 [Coding - 10 Marks | Repeated 4x]:** Write a program to calculate/print the Fibonacci series up to n terms using recursion.
* **Q3.12 [Coding - 5 Marks | Repeated 2x]:** Write a program to find the HCF (Highest Common Factor) of numbers using recursion.
* **Q3.13 [Coding - 10 Marks | Repeated 3x]:** Write a C program to create a 1D integer array to accept numbers and find their sum, average, and mean.
* **Q3.14 [Coding - 10 Marks | Repeated 3x]:** Write a C program to find out and print the smallest and largest number from an array.
* **Q3.15 [Coding - 10 Marks | Repeated 2x]:** Construct a function perfect_square(number) that returns a number if it is a perfect square, otherwise it returns -1 (e.g., perfect_square(1) returns 1, perfect_square(2) returns -1).
* **Q3.16 [Coding - 10 Marks | Repeated 2x]:** Differentiate between binary search and linear search. Write a program using binary search to search a number entered by a user in an array of 10 elements.
* **Q3.17 [Coding - 5 Marks]:** Write a program in C language to find out whether a number is an Armstrong number or not using functions.

## 3. Predicted Must-Do Exam Topics
1. **Call by Value vs. Call by Reference:** Parameter passing mechanisms and variable swapping using pointer addresses.
2. **Step-by-Step Sorting Tracing:** Pass-by-pass tracing for Bubble Sort and Insertion Sort with element states.
3. **Recursive Algorithms:** Factorial and Fibonacci implementations, identifying base conditions and call stack operations.
4. **Storage Classes in C:** Contrasting auto, static, register, and extern on scope, memory location, default values, and lifespan.

---

# UNIT IV: STRINGS & POINTERS

## 1. Syllabus Topics
* **Strings:** Arrays of characters, null terminator, variable-length character strings, inputting strings, character library functions, string handling functions (strlen, strcpy, strrev, strcmp, strcat).
* **Pointers:** Pointer basics, declaration, address-of (&) and dereferencing (*) operators, pointer arithmetic, pointers to pointers, generic pointers (void*), array of pointers, functions returning pointers.
* **Dynamic Memory Allocation (DMA):** Memory management in C, malloc(), calloc(), realloc(), and free().

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q4.1 [Theory - 10 Marks | Repeated 6x]:** What is dynamic memory allocation? Discuss the role of all functions used in dynamic memory allocation (malloc, calloc, realloc, free) with suitable examples.
* **Q4.2 [Theory - 5 Marks | Repeated 6x]:** How does memory management work in C programming, and what are some common pitfalls to avoid when dealing with memory allocation and deallocation (memory leaks, dangling pointers)?
* **Q4.3 [Theory - 5 Marks | Repeated 5x]:** What is a pointer in C? How are pointers and arrays related?
* **Q4.4 [Theory - 5 Marks | Repeated 5x]:** Write a short note on generic pointers (void*) in C.
* **Q4.5 [Theory - 10 Marks | Repeated 6x]:** What is a string? Explain the standard library functions of strings with suitable examples of each: (i) strlen(), (ii) strcpy(), (iii) strrev(), (iv) strcmp(), (v) strcat().

### B. Output Tracing & Pointer Code Prediction Problems
* **Q4.6 [Output Tracing - 10 Marks | Repeated 3x]:** What will be the output of the following programs? Program 1: `int arr[] = {10, 20, 30, 40, 50, 60}; int *ptr1 = arr; int *ptr2 = arr + 5; printf("ptr2 - ptr1 = %d\n", ptr2 - ptr1); printf("(char*)ptr2 - (char*)ptr1 = %d\n", (char*)ptr2 - (char*)ptr1);` Program 2: a 4x4 array holding 1 to 16 row by row, printed twice using the subscript-inversion forms j[i[arr]] and i[j[arr]] in nested loops.

### C. Standard Coding Problems
* **Q4.7 [Coding - 5 Marks | Repeated 2x]:** Write a C program to convert a lowercase string to uppercase.
* **Q4.8 [Coding - 10 Marks]:** Write a program to replace all occurrences of a character in a string with another character.
* **Q4.9 [Coding - 5 Marks | Repeated 2x]:** Write a program to find the length of "HELLO" using a while loop.
* **Q4.10 [Coding - 10 Marks]:** Write a custom function xstrstr() that will return the position where one string is present within another string; if the second string does not occur in the first string, xstrstr() should return 0.

## 3. Predicted Must-Do Exam Topics
1. **Dynamic Memory Allocation (DMA):** Syntax, operation, and differences between malloc(), calloc(), realloc(), and free().
2. **Standard String Handling Functions:** Principles and coding patterns using strlen(), strcpy(), strcmp(), and strcat().
3. **Pointer Arithmetic Output Tracing:** Pointer subtraction mechanics (ptr2 - ptr1 vs. (char*)ptr2 - (char*)ptr1).
4. **Generic Pointers (void*):** Declaration and type casting before dereferencing.

---

# UNIT V: STRUCTURES & FILE HANDLING

## 1. Syllabus Topics
* **Structures & Unions:** Structure definition, initialization, accessing members using dot and arrow operators, nested structures, arrays of structures, structures and functions, self-referential structures, unions, typedef, enumerations (enum).
* **File Handling:** Streams, file pointers (FILE *fp), command line arguments (argc, argv[]), file modes (r, w, a, r+, w+, a+), basic file operations (open, close, read, write, append), error handling.

## 2. Previous Years Questions (PYQs)

### A. Core Conceptual & Theoretical Questions
* **Q5.1 [Theory - 10 Marks | Repeated 7x]:** Differentiate between structure and union with suitable examples. Compare their memory allocation mechanisms with diagrams.
* **Q5.2 [Theory - 10 Marks | Repeated 6x]:** Introduce the concept of file handling in C. Explain the modes of files and write the proper syntax of each mode (r, w, a, r+, w+, a+). Explain what happens if a file opened in "r", "w", or "a" mode does not already exist.
* **Q5.3 [Theory - 10 Marks | Repeated 5x]:** Describe the procedure of creating a file, reading, and writing a file in detail with error-checking using FILE * pointers.
* **Q5.4 [Theory - 5 Marks | Repeated 3x]:** Explain command line arguments in C (argc, argv[]) with a suitable example.
* **Q5.5 [Theory - 5 Marks | Repeated 3x]:** Write a short note on enumerations (enum) and typedef in C with examples.
* **Q5.6 [Theory - 5 Marks | Repeated 2x]:** What do you mean by linked lists? What is a self-referential structure? Explain with an example.

### B. Standard Coding Problems
* **Q5.7 [Coding - 10 Marks | Repeated 5x]:** Write a C program to create a structure that stores the records of students (such as Student Name, Roll Number, Marks Percentage / Fees, and Department Name) and print all records.
* **Q5.8 [Coding - 10 Marks | Repeated 5x]:** Define a structure in C having name, roll no, percentage, and address as elements. Input 10 records. Write a function in C that takes an array of structures and returns the record of the student having the maximum percentage.
* **Q5.9 [Coding - 10 Marks | Repeated 3x]:** Write a program to write "Hello UTU" to a file named "file1.txt". Provide examples of C programs demonstrating file handling operations, such as reading from a text file, writing to a text file, and appending data to an existing file.
* **Q5.10 [Coding - 10 Marks | Repeated 2x]:** A file named "RAM.txt" contains a series of integer numbers. Write a C program to read these numbers and then write all odd numbers to a file called "ODD.txt" and all even numbers to a file called "EVEN.txt".

## 3. Predicted Must-Do Exam Topics
1. **Structures vs. Unions:** Memory allocation models, field sharing in unions, and member access operators.
2. **Array of Structures (Student Database):** Managing arrays of records and sorting/searching by grade percentage.
3. **File Modes & Operations:** Correct usage of "r", "w", "a", fscanf(), fprintf(), and file stream termination.
4. **Command-Line Arguments (argc, argv[]):** Capturing terminal command inputs into the main signature.

---

# CONSOLIDATED MASTER REPETITION & PRIORITY TABLE

| Rank | Topic / Question Title | Unit | Historical Frequency | Exam Marks Category |
|:---:|---|:---:|:---:|:---:|
| **1** | **Parameter Passing: Call by Value vs. Call by Reference** | Unit III | **7 Times** | 10 Marks |
| **2** | **Structure vs. Union: Concepts, Memory Layout & Student Database** | Unit V | **7 Times** | 10 Marks |
| **3** | **Bubble Sort & Insertion Sort: Tracing & Complexity** | Unit III | **6 Times** | 10 Marks |
| **4** | **Loop Control Statements: While, For, Do-While Differences** | Unit II | **6 Times** | 5 to 10 Marks |
| **5** | **Recursion: Mechanics, Call Stack, Factorial & Fibonacci** | Unit III | **6 Times** | 10 Marks |
| **6** | **Standard String Library Functions (strlen, strcpy, strcmp, etc.)** | Unit IV | **6 Times** | 10 Marks |
| **7** | **Dynamic Memory Allocation (malloc, calloc, realloc, free)** | Unit IV | **6 Times** | 10 Marks |
| **8** | **File Opening Modes & Basic File Operations (fopen, Read, Write)** | Unit V | **6 Times** | 5 to 10 Marks |
| **9** | **Prime Number Generator Programs (1 to N)** | Unit II | **5 Times** | 5 to 10 Marks |
| **10** | **C Tokens, Variables, Data Types & Size Modifiers** | Unit I | **5 Times** | 5 to 10 Marks |
| **11** | **Pointer Basics, Pointer Arithmetic & Output Tracing** | Unit IV | **5 Times** | 5 to 10 Marks |
| **12** | **Jump Statements: Break, Continue & Goto** | Unit II | **5 Times** | 5 Marks |
| **13** | **Algorithms, Flowcharts & Program Differences** | Unit I | **6 Times** | 5 Marks |
| **14** | **Compilation & Execution Stages of a C Program** | Unit I | **4 Times** | 10 Marks |
| **15** | **Storage Classes: Auto, Register, Static, Extern** | Unit III | **4 Times** | 5 Marks |
