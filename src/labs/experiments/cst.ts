import type { Experiment } from "./types";

/**
 * Guided experiments for the five flagship Programming for Problem Solving (CST-001) labs.
 * Every numeric answer is recomputed from src/labs/sim/cstx.ts in cst.test.ts.
 */

const cpipeline: Experiment = {
  labId: "cpipeline",
  title: "From C source to a running CPU",
  aim: "To follow a C program through the five stages preprocess, compile, assemble, link and load-and-run, and to watch a CPU fetch, decode and execute the machine code it produced.",
  objectives: [
    "Name the output file of each stage: .i, .s, .o and the executable.",
    "Say which stage pastes headers, which makes assembly, which makes bytes and which fixes jump addresses.",
    "Trace fetch, decode and execute on registers, RAM and the program counter.",
    "Count the instructions a loop executes from its structure.",
  ],
  equipment: [
    { name: "Five glass chambers", what: "Preprocess, Compile, Assemble, Link and Load-and-run, in that order. The active one glows and its LED turns gold; finished ones turn green.", where: "Back row of the bench" },
    { name: "Bus tracks and gold token", what: "Rails that carry the program from one stage to the next. The token stands on the active stage.", where: "Between the chambers" },
    { name: "Control unit (purple block)", what: "Fetches the 3 bytes at PC, decodes the opcode and sends the signals.", where: "Front left" },
    { name: "ALU (orange block)", what: "Glows when an add or cmp instruction is executed.", where: "Front, next to the control unit" },
    { name: "Register bars", what: "Four bars for eax, ebx, ecx and edx. Height grows with the value stored.", where: "Front centre" },
    { name: "RAM cells", what: "Eight memory words where the variables live; the cell touched by the last instruction glows gold.", where: "Front right" },
    { name: "Instruction strip", what: "One cell per instruction of the program; the gold cell is the program counter.", where: "Very front of the bench" },
  ],
  steps: [
    { id: "p1", title: "Pick the loop program", text: "Choose the C program 'Loop 1..n'. Later you will compile it and look for cmp, jg and jmp in the assembly listing.", hint: "Use the C program list, then the Stage list.", check: { kind: "param", key: "prog", op: "eq", value: "loop" } },
    { id: "p2", title: "Go to the Compile stage", text: "Set the Stage to Compile (.i to .s). The token moves to the second chamber.", check: { kind: "param", key: "stage", op: "eq", value: "compile" } },
    { id: "p3", title: "Make the loop longer", text: "Raise the loop bound n to 8 or more. The program text changes, but the assembly stays the same length: only the constant moved.", hint: "The loop bound slider appears when the loop program is chosen.", check: { kind: "param", key: "n", op: "gte", value: 8 } },
    { id: "p4", title: "Assemble it", text: "Set the stage to Assemble. Every instruction is now 3 bytes: an opcode and two operands, shown in hex.", check: { kind: "param", key: "stage", op: "eq", value: "assemble" } },
    { id: "p5", title: "Link it", text: "Set the stage to Link. Compare the jump instructions with the Assemble listing: their targets moved up by 0x40.", check: { kind: "param", key: "stage", op: "eq", value: "link" } },
    { id: "p6", title: "Load and run", text: "Set the stage to Load and run. The CPU is now live.", check: { kind: "param", key: "stage", op: "eq", value: "run" } },
    { id: "p7", title: "Execute 20 instructions", text: "Drag the instruction step to 20 or more. Watch eax, the RAM cells and the gold PC cell as the loop repeats.", hint: "The first slider under the readouts.", check: { kind: "param", key: "step", op: "gte", value: 20 } },
    { id: "p8", title: "Try the sum preset", text: "Press the 'Sum on the CPU' preset and read the output after the last step.", check: { kind: "preset", name: "Sum on the CPU" } },
    { id: "p9", title: "Reset the bench", text: "Press Reset to go back to the starting values.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "cpipeline-q1", type: "mcq", prompt: "Which stage of compiling a C program replaces <b>#include</b> lines by the text of the header files?", options: ["Compiler (code generation)", "Preprocessor", "Assembler", "Linker"], answer: 1, marks: 2, hint: "It runs first, before any C is translated.", solution: ["The first stage reads the lines that begin with # (include, define).", "It pastes the header text in place, producing the expanded source (.i).", "Only after that does the compiler translate C into assembly."], explanation: "Preprocessing is plain text substitution. You can see the line count of the source grow in the Preprocess stage.", commonMistake: "Thinking the compiler itself reads the header files first." },
    { id: "cpipeline-q2", type: "mcq", prompt: "What does the <b>assembler</b> produce from the .s file?", options: ["An executable file", "An object file (.o) of machine code", "Expanded C source", "Assembly text with labels"], answer: 1, marks: 2, hint: "Look at the hex bytes in the Assemble stage.", solution: ["The compiler already produced the assembly text (.s).", "The assembler turns each mnemonic into opcode bytes.", "The result is an object file (.o): machine code that is not yet linked."], explanation: "Linking comes after assembling and joins object files and libraries into the executable.", commonMistake: "Calling the object file an executable. It still has unresolved addresses and library calls." },
    { id: "cpipeline-q3", type: "tf", prompt: "The program counter holds the address of the next instruction to be fetched.", answer: true, marks: 1, hint: "In the run stage it is the gold cell on the instruction strip.", solution: ["The control unit reads the instruction at the address in PC.", "Then PC is advanced to the following instruction (3 bytes later here) or loaded with a jump target."], explanation: "That is why a jump instruction works: it simply overwrites PC.", commonMistake: "Thinking PC holds the instruction itself." },
    { id: "cpipeline-q4", type: "tf", prompt: "In the Link stage the jump targets inside the code do not change.", answer: false, marks: 1, hint: "Compare the Assemble and Link listings of the loop program.", solution: ["The object file stores jump targets as offsets from the start of the code.", "The linker places the code at a base address (0x40 here) and adds it to every jump target."], explanation: "This is called relocation. Without it a jump would land in the wrong place.", commonMistake: "Believing that the assembler already knows the final load address." },
    { id: "cpipeline-q5", type: "mcq", scenario: "Asha looks at the loop program. In the Assemble listing a jg instruction has target 0x30. In the Link listing the same instruction has target 0x70.", prompt: "Which stage changed the target, and by how much?", options: ["The compiler, by 0x30", "The assembler, by 0x40", "The linker, by 0x40", "The loader, by 0x70"], answer: 2, marks: 3, hint: "0x70 minus 0x30.", formulas: ["linked target = object target + load base"], solution: ["0x70 - 0x30 = 0x40.", "Only the linker (relocation) adds the base address to jump targets.", "So the linker added 0x40."], explanation: "The load base in the lab is 0x40, so every jump moves up by exactly that.", commonMistake: "Giving the new target value (0x70) as the amount added." },
    { id: "cpipeline-q6", type: "numeric", prompt: "Run the loop program with n = 5. How many instructions does the CPU execute from reset until it halts? (Count the hlt as well.)", answer: 63, tolerance: 0, marks: 3, hint: "Set n = 5, stage Run and drag the step slider to its end. Or count: 13 + 10n.", formulas: ["instructions = 13 + 10 × n"], solution: ["Set-up before the loop: 6 instructions (store n, s and i).", "Each lap runs the 4 test instructions plus 6 body instructions: 10 per lap.", "The final failing test (4) plus the exit code (load, print, hlt = 3) add 7: total = 6 + 10 × 5 + 7 = 63."], explanation: "The count grows by 10 for every extra lap, which you can confirm by changing n.", commonMistake: "Forgetting the last test that fails or the hlt instruction." },
    { id: "cpipeline-q7", type: "numeric", prompt: "How many bytes of machine code does the sum program (a = 7, b = 5) contain? Each instruction is 3 bytes.", answer: 30, tolerance: 0, unit: "bytes", marks: 2, hint: "Count the assembly lines in the Compile stage, including hlt.", formulas: ["bytes = instructions × 3"], solution: ["The Compile stage shows 10 instructions: 2 × (mov constant + store), 2 loads, add, store of the result, print and hlt.", "bytes = 10 × 3 = 30."], explanation: "The Assemble stage lists these 30 bytes as ten groups of three.", commonMistake: "Counting source lines of C instead of assembly instructions." },
    { id: "cpipeline-q8", type: "numeric", scenario: "Ravi sets the loop bound to n = 3 and runs the program until it halts.", prompt: "What number does the program print?", answer: 6, tolerance: 0, marks: 2, hint: "The program adds 1 + 2 + ... + n.", formulas: ["s = n(n + 1) / 2"], solution: ["The loop adds i to s for i = 1, 2, 3.", "s = 1 + 2 + 3 = 6, which is also 3 × 4 / 2."], explanation: "You can check it on the Output readout at the last step.", commonMistake: "Printing n or n + 1 instead of the running sum." },
  ],
  summary: [
    "The five stages are preprocess (.i), compile (.s), assemble (.o), link (executable) and load-and-run.",
    "Preprocessing is text substitution, compiling makes assembly, assembling makes machine bytes, linking fixes addresses and joins libraries.",
    "The CPU repeats fetch, decode, execute; PC points to the next instruction and jumps overwrite it.",
    "A loop of n laps costs a fixed set-up plus the same number of instructions every lap.",
  ],
};

const ctrlflow: Experiment = {
  labId: "ctrlflow",
  title: "Control flow: break, continue and short-circuit",
  aim: "To trace loops, break, continue and logical operators step by step, and to predict the output of exam programs before running them.",
  objectives: [
    "Predict the output of the break and continue programs of PYQ Q2.9.",
    "Explain why && and || skip their right operand in PYQ Q2.8.",
    "Explain the effect of a stray semicolon after a for loop (PYQ Q2.10).",
    "Count laps and printed items of nested loops.",
  ],
  equipment: [
    { name: "Gold token", what: "Stands on the station of the statement being executed.", where: "Moves along the railway" },
    { name: "Diamond gates", what: "The loop test, the if gate and the inner loop test. Green flash = true, red flash = false.", where: "On the rails" },
    { name: "Roundabout ring and gold discs", what: "The ring turns and one gold disc is added for every lap of a loop.", where: "Around the loop-test gate" },
    { name: "Orange and red stations", what: "Orange: loop step and continue. Red: break exit or an operand skipped by short-circuit.", where: "Lower lane" },
    { name: "Variable pillars", what: "One pillar per variable; height shows the value, red if negative.", where: "Back right" },
    { name: "Output cubes", what: "One cube for every printed character, in the console strip.", where: "Front left" },
  ],
  steps: [
    { id: "c1", title: "Step into the break program", text: "The lab starts with PYQ Q2.9. Drag the program step to 6 or more and watch the gates.", hint: "The first slider under the readouts.", check: { kind: "param", key: "step", op: "gte", value: 6 } },
    { id: "c2", title: "Switch to continue", text: "Change the program to 'continue at 16..18' and step to the end: compare the output with break.", check: { kind: "param", key: "prog", op: "eq", value: "continue" } },
    { id: "c3", title: "Walk the whole continue trace", text: "Move the step slider to 25 or more.", check: { kind: "param", key: "step", op: "gte", value: 25 } },
    { id: "c4", title: "Primes", text: "Choose 'Primes from 2 to N'.", check: { kind: "param", key: "prog", op: "eq", value: "primes" } },
    { id: "c5", title: "Raise the limit N", text: "Set N to 20 or more and step through. Watch p drop to 0 at the first divisor.", check: { kind: "param", key: "n", op: "gte", value: 20 } },
    { id: "c6", title: "Short-circuit", text: "Choose the short-circuit program (PYQ Q2.8) and look for the red skipped-operand event.", check: { kind: "param", key: "prog", op: "eq", value: "shortcirc" } },
    { id: "c7", title: "Make i + 5 zero", text: "Set the value of i to -5 and step to the end. See what happens to z now.", hint: "Use the value-of-i slider or type -5.", check: { kind: "param", key: "vi", op: "lte", value: -5 } },
    { id: "c8", title: "Stray semicolon", text: "Press the preset 'Q2.10 stray semicolon'.", check: { kind: "preset", name: "Q2.10 stray semicolon" } },
    { id: "c9", title: "Reset", text: "Press Reset to restore the starting program.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "ctrlflow-q1", type: "mcq", prompt: "What does this program print? int a = 14; while (a is less than 20) { ++a; if (a is from 16 to 18) break; printf(\"%d \", a); }", options: ["14 15", "15", "15 19 20", "Nothing"], answer: 1, marks: 3, hint: "Run the Q2.9 preset to the last step.", solution: ["a = 14: test true, ++a makes a = 15, the if is false, 15 is printed.", "Next lap: ++a makes a = 16, the if is true, break leaves the loop.", "So only 15 was printed."], explanation: "break ends the loop at once; the printf after it never runs for 16.", commonMistake: "Printing 14, or continuing after the break." },
    { id: "ctrlflow-q2", type: "mcq", prompt: "In the same program replace break by <b>continue</b>. What is printed?", options: ["15", "15 19 20", "15 16 17 18", "19 20"], answer: 1, marks: 3, hint: "Choose the 'continue at 16..18' program.", solution: ["a = 15 is printed.", "a = 16, 17, 18: the if is true and continue skips the printf.", "a = 19 and a = 20 are printed; then the test a is less than 20 fails."], explanation: "continue skips the rest of the lap only; the loop goes on.", commonMistake: "Stopping at 15, which is what break does." },
    { id: "ctrlflow-q3", type: "tf", prompt: "In PYQ Q2.8 (i = 4, j = -1, k = 0), the sub-expression j + 1 is evaluated when computing z.", answer: false, marks: 1, hint: "z = i + 5 || j + 1 && k + 2. Look for the skipped event.", solution: ["i + 5 is 9, which is true.", "For ||, a true left side makes the whole result true, so the right side is skipped."], explanation: "This is short-circuit evaluation: the right operand runs only when needed.", commonMistake: "Evaluating every operand from left to right regardless." },
    { id: "ctrlflow-q4", type: "tf", prompt: "In for (k = 1; k less than or equal to 5; k++); { printf(\"%d \", k); } the printf runs once for each lap of the loop.", answer: false, marks: 1, hint: "Open the stray semicolon preset.", solution: ["The semicolon is an empty body, so the loop only counts k up.", "The block with printf runs once, after the loop, with k = 6."], explanation: "The curly-brace block is a separate statement that follows the loop.", commonMistake: "Thinking the braces belong to the for." },
    { id: "ctrlflow-q5", type: "numeric", prompt: "How many prime numbers does the program print for N = 30?", answer: 10, tolerance: 0, marks: 2, hint: "Choose 'Primes up to 30' and read the output at the last step.", solution: ["The primes up to 30 are 2, 3, 5, 7, 11, 13, 17, 19, 23, 29.", "That is 10 numbers."], explanation: "The inner loop only tries j while j × j is at most i, which is enough to find a divisor.", commonMistake: "Counting 1 as a prime or leaving out 2." },
    { id: "ctrlflow-q6", type: "numeric", prompt: "The number-triangle program prints 1 / 1 2 / 1 2 3 ... with N = 5 rows. How many numbers are printed in total?", answer: 15, tolerance: 0, marks: 2, hint: "Row r has r numbers.", formulas: ["1 + 2 + ... + N = N(N + 1) / 2"], solution: ["Row 1 prints 1 number, row 2 prints 2, ... row 5 prints 5.", "Total = 1 + 2 + 3 + 4 + 5 = 5 × 6 / 2 = 15."], explanation: "The inner loop runs 1 lap in row 1, 2 in row 2 and so on.", commonMistake: "Computing N × N = 25." },
    { id: "ctrlflow-q7", type: "numeric", scenario: "A student runs for (k = 1; k less than or equal to 9; k++); followed by a block with printf(\"%d \", k).", prompt: "What number is printed?", answer: 10, tolerance: 0, marks: 2, hint: "Use the semicolon program with n = 9.", solution: ["The loop leaves when the test k less than or equal to 9 first fails.", "That happens at k = 10, and only then is printf run once."], explanation: "After the loop k is one more than the bound.", commonMistake: "Printing 9, the last value that passed the test." },
    { id: "ctrlflow-q8", type: "mcq", scenario: "In PYQ Q2.8 change the values to i = -5, j = -1, k = 0.", prompt: "What is printed by printf(\"y=%d z=%d\", y, z)?", options: ["y=1 z=1", "y=1 z=0", "y=0 z=0", "y=0 z=1"], answer: 1, marks: 3, hint: "Set the three sliders and step to the end.", formulas: ["y = i + 5 && j + 1 || k + 2", "z = i + 5 || j + 1 && k + 2"], solution: ["i + 5 = 0 (false). For y: 0 && ... is false without evaluating j + 1; then || k + 2 gives 2, which is true: y = 1.", "For z: the left side 0 is false, so the right side j + 1 && k + 2 is tried: j + 1 = 0 is false, so && skips k + 2 and gives 0.", "So y = 1 and z = 0."], explanation: "&& binds tighter than ||, and each operator stops as soon as the result is known.", commonMistake: "Forgetting that && has higher precedence than ||." },
  ],
  summary: [
    "break leaves the loop; continue skips to the next lap.",
    "&& and || stop evaluating as soon as the result is known (short-circuit), and && binds tighter than ||.",
    "A semicolon right after a for header is an empty loop body.",
    "Nested loops multiply: a triangle of N rows prints N(N + 1)/2 numbers.",
  ],
};

const sortstack: Experiment = {
  labId: "sortstack",
  title: "Sorting exam arrays and the recursion stack",
  aim: "To count the comparisons and swaps of bubble, insertion, selection and quick sort on exam arrays, and to see how recursive calls push and pop stack frames.",
  objectives: [
    "Trace bubble sort pass by pass and count comparisons and swaps.",
    "Compare the cost of bubble, insertion and selection sort.",
    "Explain stack depth and number of calls for factorial and Fibonacci.",
  ],
  equipment: [
    { name: "3D bars", what: "One bar per array element; height shows the value.", where: "Centre of the bench" },
    { name: "Gold, red, purple and green bars", what: "Gold: being compared. Red: swapped or shifted. Purple: quick-sort pivot. Green: in final position.", where: "The bars" },
    { name: "Index plates", what: "Small plates in front of the bars that light up under the two compared positions.", where: "Front edge" },
    { name: "Glass cap", what: "Turns on once the sort has started.", where: "Over the bars" },
    { name: "Call-stack tower", what: "One slab per active function call. Pushed on a call, popped on a return.", where: "Recursion modes" },
    { name: "Return-value bars and call dots", what: "A bar beside a slab appears when its return value is ready; gold dots count calls.", where: "Beside the tower" },
  ],
  steps: [
    { id: "s1", title: "Start the bubble sort", text: "The lab opens with bubble sort on [5, 1, 4, 2, 8, 7]. Drag the step slider a few steps.", check: { kind: "param", key: "step", op: "changed" } },
    { id: "s2", title: "Reach the end of the first pass", text: "Move the step to 10 or more and see the largest value settle on the right in green.", check: { kind: "param", key: "step", op: "gte", value: 10 } },
    { id: "s3", title: "Run to the end", text: "Move the step to 18, the last step, and read the totals.", hint: "You can also type 18 in the box next to the slider.", check: { kind: "param", key: "step", op: "gte", value: 18 } },
    { id: "s4", title: "Switch off the early exit", text: "Untick 'Stop early when a pass has no swap'. The comparison count should grow.", check: { kind: "param", key: "early", op: "eq", value: false } },
    { id: "s5", title: "Try insertion sort", text: "Choose insertion sort. Compare its comparisons with bubble sort's on the same array.", check: { kind: "param", key: "alg", op: "eq", value: "insertion" } },
    { id: "s6", title: "Try quick sort on 9 numbers", text: "Choose quick sort and the array [54, 26, 93, 17, 77, 31, 44, 55, 20].", check: { kind: "param", key: "arr", op: "eq", value: "a4" } },
    { id: "s7", title: "Open the recursion tower", text: "Change the mode to factorial and step through the pushes and pops.", check: { kind: "param", key: "mode", op: "eq", value: "fact" } },
    { id: "s8", title: "Go deeper", text: "Set n to 5 or more and see the tower grow.", check: { kind: "param", key: "n", op: "gte", value: 5 } },
    { id: "s9", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "sortstack-q1", type: "numeric", prompt: "Bubble sort with early exit (stop after a pass with no swap) is run on [5, 1, 4, 2, 8, 7]. How many comparisons does it make?", answer: 12, tolerance: 0, marks: 3, hint: "Run the Q3.7 preset to the last step and read Comparisons.", formulas: ["comparisons in pass p = n - p"], solution: ["Pass 1 compares 5 pairs and gives [1, 4, 2, 5, 7, 8].", "Pass 2 compares 4 pairs and gives [1, 2, 4, 5, 7, 8]; pass 3 compares 3 pairs and sees no swap, so it stops.", "Total = 5 + 4 + 3 = 12."], explanation: "The early exit saves the last two passes (2 + 1 comparisons).", commonMistake: "Always using n(n - 1)/2 = 15." },
    { id: "sortstack-q2", type: "numeric", prompt: "The same bubble sort, but without the early exit, runs all n - 1 passes. How many comparisons now?", answer: 15, tolerance: 0, marks: 2, hint: "Untick the early-exit box.", formulas: ["n(n - 1) / 2"], solution: ["n = 6, so n(n - 1)/2 = 6 × 5 / 2.", "= 15 comparisons."], explanation: "Without the flag the number of comparisons does not depend on the data.", commonMistake: "Forgetting to divide by 2." },
    { id: "sortstack-q3", type: "numeric", prompt: "How many swaps does bubble sort make on [5, 1, 4, 2, 8, 7]?", answer: 5, tolerance: 0, marks: 2, hint: "A swap fixes exactly one out-of-order pair.", solution: ["The out-of-order pairs (inversions) are (5,1), (5,4), (5,2), (4,2) and (8,7).", "Each swap of neighbours removes exactly one inversion, so 5 swaps."], explanation: "The swaps of bubble sort always equal the number of inversions.", commonMistake: "Counting comparisons instead of swaps." },
    { id: "sortstack-q4", type: "mcq", prompt: "Which of bubble, insertion and selection sort makes the fewest swaps or writes on [5, 1, 4, 2, 8, 7]?", options: ["Bubble sort (5 swaps)", "Insertion sort (5 shifts)", "Selection sort (3 swaps)", "All make the same number"], answer: 2, marks: 2, hint: "Look at the Swaps readout for each algorithm.", solution: ["Selection sort puts one element into place per pass with at most one swap.", "Here it needs 3 swaps, against 5 for the other two."], explanation: "At most n - 1 swaps makes selection sort useful when writes are expensive.", commonMistake: "Choosing the algorithm with the fewest comparisons." },
    { id: "sortstack-q5", type: "numeric", prompt: "Selection sort is run on the 9 numbers [54, 26, 93, 17, 77, 31, 44, 55, 20]. How many comparisons does it make?", answer: 36, tolerance: 0, marks: 2, hint: "It always compares each element with the minimum in every pass.", formulas: ["n(n - 1) / 2"], solution: ["The passes compare 8, 7, 6, 5, 4, 3, 2 and 1 elements.", "8 + 7 + ... + 1 = 9 × 8 / 2 = 36."], explanation: "The comparison count does not depend on the data.", commonMistake: "Using n × n = 81." },
    { id: "sortstack-q6", type: "tf", prompt: "The maximum height of the call-stack tower for factorial(5) is 5 frames.", answer: true, marks: 1, hint: "Set the mode to factorial with n = 5.", solution: ["factorial(5) calls factorial(4), which calls factorial(3), down to factorial(1).", "These 5 calls are all waiting at the same time before the first return."], explanation: "Depth equals n for factorial.", commonMistake: "Forgetting the base-case call." },
    { id: "sortstack-q7", type: "numeric", scenario: "Meena computes fibonacci(6) with the recursive function fib(n) = fib(n - 1) + fib(n - 2), where fib(0) = 0 and fib(1) = 1.", prompt: "How many function calls are made in total, including the first call fib(6)?", answer: 25, tolerance: 0, marks: 3, hint: "Choose the fibonacci mode with n = 6 and read Calls made at the last step.", formulas: ["calls(n) = calls(n - 1) + calls(n - 2) + 1"], solution: ["calls(0) = calls(1) = 1; calls(2) = 3; calls(3) = 5; calls(4) = 9; calls(5) = 15.", "calls(6) = 15 + 9 + 1 = 25."], explanation: "Fibonacci repeats the same work many times, so its calls grow very fast although the stack depth is only 6.", commonMistake: "Giving fib(6) = 8, the value, instead of the number of calls." },
    { id: "sortstack-q8", type: "tf", prompt: "In the lab, quick sort with the first element as pivot puts the pivot in its final (green) position after each partition.", answer: true, marks: 1, hint: "Watch the purple bar turn green.", solution: ["After partitioning, all smaller items are on the left of the pivot and all larger ones on the right.", "So the pivot is already where it will end up."], explanation: "Quick sort then sorts the two sides independently.", commonMistake: "Thinking the pivot moves again in later partitions." },
  ],
  summary: [
    "Bubble sort makes at most n(n - 1)/2 comparisons; its swaps equal the number of inversions.",
    "Selection sort always makes n(n - 1)/2 comparisons but at most n - 1 swaps.",
    "Insertion sort shifts instead of swapping and is fast on nearly sorted data.",
    "Each recursive call pushes a stack frame and each return pops one; Fibonacci makes far more calls than its depth suggests.",
  ],
};

const ptrheap: Experiment = {
  labId: "ptrheap",
  title: "Pointer arithmetic and the heap",
  aim: "To see how pointer arithmetic scales by the element size (PYQ Q4.6) and how malloc, calloc, realloc and free work on a first-fit heap, including how a lost pointer causes a memory leak.",
  objectives: [
    "Compute ptr2 - ptr1 and the byte distance for int, char and double arrays.",
    "Follow first-fit allocation, freeing and realloc moving a block.",
    "Recognise a memory leak and a dangling pointer.",
  ],
  equipment: [
    { name: "Byte cubes", what: "One cube per byte of the array, each element in its own colour.", where: "Stack zone (back)" },
    { name: "Blue and orange cones", what: "ptr1 (at the start of the array) and ptr2 (d elements further).", where: "Above the array" },
    { name: "Gold byte-distance bar", what: "Lays the byte difference of the two pointers on the floor.", where: "In front of the array" },
    { name: "Heap lattice", what: "128 bytes as 16 cells of 8 bytes. Dark cells are free, coloured cells belong to a block, red cells are leaked.", where: "Heap zone (front)" },
    { name: "Pointer voxels and rails", what: "Variables p, q... with a rail to the first cell of the block they point to. Orange means dangling.", where: "Stack zone in heap view" },
  ],
  steps: [
    { id: "h1", title: "Move ptr2", text: "Drag the 'Elements apart' slider and watch the orange cone and the gold bar change.", check: { kind: "param", key: "d", op: "changed" } },
    { id: "h2", title: "Use double elements", text: "Set the element type to double. The same d now means a much longer byte distance.", check: { kind: "param", key: "pty", op: "eq", value: "double" } },
    { id: "h3", title: "Five elements apart", text: "Set d to 5 or more.", check: { kind: "param", key: "d", op: "gte", value: 5 } },
    { id: "h4", title: "Load PYQ Q4.6", text: "Press the preset 'Q4.6 ptr2 - ptr1' and compare the two difference readouts.", check: { kind: "preset", name: "Q4.6 ptr2 - ptr1" } },
    { id: "h5", title: "Open the heap", text: "Switch the view to Heap: malloc / free.", check: { kind: "param", key: "mode", op: "eq", value: "heap" } },
    { id: "h6", title: "Choose the leak program", text: "Choose the 'Lost pointer (leak)' program.", check: { kind: "param", key: "script", op: "eq", value: "leak" } },
    { id: "h7", title: "Run three statements", text: "Set 'Statements executed' to 3. The statement p = q loses the 32-byte block.", hint: "The red cells appear at step 3.", check: { kind: "param", key: "step", op: "gte", value: 3 } },
    { id: "h8", title: "Watch realloc move a block", text: "Choose the realloc program and set the statements to 3.", check: { kind: "param", key: "script", op: "eq", value: "realloc" } },
    { id: "h9", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "ptrheap-q1", type: "numeric", prompt: "int arr[6]; int *ptr1 = arr; int *ptr2 = arr + 5; What does printf(\"%d\", ptr2 - ptr1) print?", answer: 5, tolerance: 0, marks: 2, hint: "Use the Q4.6 preset.", formulas: ["ptr2 - ptr1 = (byte difference) / sizeof(*ptr)"], solution: ["ptr2 is 5 elements after ptr1.", "Pointer subtraction gives the number of elements: 5."], explanation: "Subtraction of two pointers of the same type is measured in elements.", commonMistake: "Giving the byte distance." },
    { id: "ptrheap-q2", type: "numeric", prompt: "For the same program, what is (char*)ptr2 - (char*)ptr1 ?", answer: 20, tolerance: 0, unit: "bytes", marks: 3, hint: "The cast makes the unit one byte (sizeof char is 1).", formulas: ["byte distance = elements × sizeof(int)"], solution: ["The two addresses are 5 ints apart.", "5 × 4 bytes = 20 bytes.", "For char pointers each element is 1 byte, so the difference is 20."], explanation: "Casting to char * changes the unit from 4-byte ints to single bytes.", commonMistake: "Printing 5 again." },
    { id: "ptrheap-q3", type: "numeric", prompt: "double arr[10]; ptr2 = arr + 6. What is (char*)ptr2 - (char*)ptr1 in bytes?", answer: 48, tolerance: 0, unit: "bytes", marks: 2, hint: "Set double and d = 6.", solution: ["sizeof(double) is 8 bytes.", "6 × 8 = 48 bytes."], explanation: "The step of pointer addition is always the size of the pointed-to type.", commonMistake: "Using 4 bytes for double." },
    { id: "ptrheap-q4", type: "tf", prompt: "malloc sets the allocated memory to zero.", answer: false, marks: 1, hint: "Think about which function the lab marks as zeroed.", solution: ["malloc returns memory with unspecified contents.", "calloc(count, size) allocates count × size bytes and sets them to zero."], explanation: "Never read malloc'ed memory before writing to it.", commonMistake: "Mixing up malloc and calloc." },
    { id: "ptrheap-q5", type: "mcq", prompt: "What makes a block a memory leak in the lab?", options: ["It was freed twice", "It is still allocated but no pointer points to it any more", "It is smaller than 8 bytes", "It was allocated with calloc"], answer: 1, marks: 2, hint: "Look at the red cells after p = q.", solution: ["The block is still marked as in use.", "If every pointer to it has been overwritten, nobody can call free on it."], explanation: "The memory stays reserved until the program ends.", commonMistake: "Calling any freed block a leak." },
    { id: "ptrheap-q6", type: "numeric", scenario: "Hari writes p = malloc(32); q = malloc(24); p = q; free(q);", prompt: "How many bytes are leaked at the end?", answer: 32, tolerance: 0, unit: "bytes", marks: 3, hint: "Choose the leak program and run all 4 statements.", solution: ["After p = q, p and q both point to the 24-byte block, and nothing points to the 32-byte block.", "free(q) frees the 24-byte block (p is now dangling).", "The 32-byte block is still allocated and unreachable: 32 bytes leaked."], explanation: "The fix is to free(p) before reassigning p.", commonMistake: "Reporting 24, the block that was freed." },
    { id: "ptrheap-q7", type: "numeric", prompt: "In the first program (malloc(16), calloc(4, sizeof(int)), realloc(p, 40)), how many bytes are in use after the three statements? Sizes are rounded up to multiples of 8.", answer: 56, tolerance: 0, unit: "bytes", marks: 3, hint: "Choose the first program and set the statements to 3.", solution: ["q = calloc(4, 4) is a 16-byte block.", "realloc(p, 40) cannot grow in place because q follows p, so a new 40-byte block is found and the old 16-byte block is freed.", "In use = 40 + 16 = 56 bytes."], explanation: "While realloc moves a block the old one is released, so only the new size counts.", commonMistake: "Adding the old 16 bytes of p as well (72)." },
    { id: "ptrheap-q8", type: "tf", prompt: "After realloc(a, 48) in the realloc program, the pointer a can have a different address than before.", answer: true, marks: 1, hint: "Compare the address in the Pointers readout at steps 2 and 3.", solution: ["The block after a belongs to b, so a cannot grow in place.", "realloc allocates a new block, copies the data and frees the old one, so the address changes."], explanation: "Always use the pointer returned by realloc, not the old one.", commonMistake: "Assuming realloc keeps the address." },
  ],
  summary: [
    "Adding or subtracting from a pointer moves it by that many elements, not bytes; pointer difference is in elements.",
    "Casting to char * makes the unit a byte: the byte distance is elements × sizeof(type).",
    "malloc and realloc leave memory uninitialised, calloc zero-fills.",
    "A block with no pointer left is leaked; a pointer to freed memory is dangling.",
  ],
};

const structunion: Experiment = {
  labId: "structunion",
  title: "struct, union and file modes",
  aim: "To measure the size and padding of structures, to see that union members share the same bytes, and to compare what each fopen mode does with a missing or an existing file.",
  objectives: [
    "Compute sizeof a struct from member order and alignment.",
    "Explain how union members overlap and how little-endian bytes are re-read.",
    "State the behaviour of r, w, a, r+, w+ and a+ on a missing and an existing file (PYQ Q5.2).",
  ],
  equipment: [
    { name: "Byte grid", what: "One cube per byte of the struct, eight per row. Each member has its own colour; low grey cubes are padding.", where: "Struct bench" },
    { name: "Union lanes", what: "Five coloured lanes (char, short, int, float, double), all starting at the same byte.", where: "Union bench, back" },
    { name: "Byte bars", what: "Eight bars whose heights are the byte values stored in the union (lowest byte first).", where: "Union bench, front" },
    { name: "Disk and byte cells", what: "The file contents, one cell per byte. Green cells were written by this run.", where: "File bench" },
    { name: "Position cones", what: "Blue after fopen, gold after fread, green after fwrite: the file position indicator.", where: "Above the disk" },
    { name: "Glass buffer", what: "Holds the bytes read and written.", where: "Back of the file bench" },
  ],
  steps: [
    { id: "u1", title: "Read the struct", text: "The lab opens with char, int, char. Read sizeof, data and padding bytes.", hint: "Readouts are above the controls.", check: { kind: "param", key: "n", op: "changed" } },
    { id: "u2", title: "Add members", text: "Set the number of members to 5.", check: { kind: "param", key: "n", op: "gte", value: 5 } },
    { id: "u3", title: "Change a member type", text: "Change member 2 to double and see how the padding changes.", check: { kind: "param", key: "m2", op: "eq", value: "double" } },
    { id: "u4", title: "Go to the union", text: "Switch the bench to union overlay.", check: { kind: "param", key: "view", op: "eq", value: "union" } },
    { id: "u5", title: "Change the stored value", text: "Change the value written and watch the byte bars.", check: { kind: "param", key: "val", op: "changed" } },
    { id: "u6", title: "Read as short", text: "Read the union through the short member and compare the value with the char.", check: { kind: "param", key: "rt", op: "eq", value: "short" } },
    { id: "u7", title: "Open the file bench", text: "Switch the bench to FILE stream.", check: { kind: "param", key: "view", op: "eq", value: "file" } },
    { id: "u8", title: "Try mode w", text: "Set the fopen mode to w on the existing file and compare the file before and after.", check: { kind: "param", key: "fmode", op: "eq", value: "w" } },
    { id: "u9", title: "Make the file missing", text: "Untick 'File already exists'. Try r, w and a in turn.", check: { kind: "param", key: "ex", op: "eq", value: false } },
    { id: "u10", title: "Reset", text: "Press Reset.", check: { kind: "reset" } },
  ],
  questions: [
    { id: "structunion-q1", type: "numeric", prompt: "What is sizeof(struct { char a; int b; char c; }) on a typical 64-bit GCC?", answer: 12, tolerance: 0, unit: "bytes", marks: 3, hint: "Open the first preset.", formulas: ["each member offset is a multiple of its alignment", "sizeof is a multiple of the largest alignment"], solution: ["a at offset 0 (1 byte), then 3 padding bytes so that b starts at offset 4.", "b occupies 4 to 7, c is at offset 8, ending at 9.", "The total is rounded up to a multiple of 4: sizeof = 12."], explanation: "Only 6 of the 12 bytes are data.", commonMistake: "Adding the member sizes: 1 + 4 + 1 = 6." },
    { id: "structunion-q2", type: "numeric", prompt: "The members are reordered as int, char, char. What is sizeof now?", answer: 8, tolerance: 0, unit: "bytes", marks: 2, hint: "Move the char down to the end in the lab.", solution: ["int at 0 to 3, the two chars at offsets 4 and 5.", "The total 6 is rounded up to a multiple of 4: 8 bytes."], explanation: "Putting larger members first usually reduces padding.", commonMistake: "Saying 6 (forgetting the end padding)." },
    { id: "structunion-q3", type: "mcq", prompt: "What is sizeof(union { char c; int i; double d; })?", options: ["1", "8", "13", "16"], answer: 1, marks: 2, hint: "Union members start at the same address.", formulas: ["sizeof(union) = size of largest member (rounded to alignment)"], solution: ["All members overlap, so the union needs only the largest one.", "The largest is double with 8 bytes."], explanation: "A struct of the same members would be 16 bytes.", commonMistake: "Adding the sizes like for a struct (13)." },
    { id: "structunion-q4", type: "tf", prompt: "Writing one member of a union and then reading another member always returns the same value that was written.", answer: false, marks: 1, hint: "Write an int and read a float in the lab.", solution: ["Both members share the same bytes, but each reads them with its own type.", "An int and a float interpret the same bits differently, so the value changes."], explanation: "Union overlay reinterprets bits; it does not convert values.", commonMistake: "Expecting a type conversion." },
    { id: "structunion-q5", type: "numeric", scenario: "On a little-endian machine the union has int i and char c. The program sets i = 0x41424344.", prompt: "What integer value does reading c give? (Answer in decimal.)", answer: 68, tolerance: 0, marks: 3, hint: "The lowest byte is stored first. Load the union preset.", formulas: ["little endian: lowest-order byte at the lowest address"], solution: ["0x41424344 is stored as the bytes 44, 43, 42, 41 (lowest first).", "c is the first byte, 0x44.", "0x44 = 4 × 16 + 4 = 68 (the letter D)."], explanation: "The union's char shares byte 0 with the int.", commonMistake: "Reading 0x41 = 65, which would be right on a big-endian machine." },
    { id: "structunion-q6", type: "mcq", prompt: "fopen(\"data.txt\", \"r\") is called and data.txt does not exist. What happens?", options: ["The file is created empty", "fopen returns NULL", "The file is created and truncated", "The program crashes immediately"], answer: 1, marks: 2, hint: "Untick 'File already exists' and select mode r.", solution: ["Mode r only opens an existing file for reading.", "If it is missing, fopen fails and returns NULL (the program must check this)."], explanation: "w, a, w+ and a+ create a missing file; r and r+ do not.", commonMistake: "Assuming every mode creates the file." },
    { id: "structunion-q7", type: "tf", prompt: "Opening an existing file with mode w keeps its old contents and appends to them.", answer: false, marks: 1, hint: "Compare the file before and after in mode w.", solution: ["Mode w truncates the file to zero length when it exists.", "The old data is lost; mode a is the one that appends."], explanation: "Many students lose data by opening a file with w by mistake.", commonMistake: "Mixing up w and a." },
    { id: "structunion-q8", type: "numeric", scenario: "A file contains HELLO. Meena opens it with mode r+, reads 3 bytes, then (after an fseek that keeps the position) writes 2 bytes.", prompt: "What is the file position indicator after the write?", answer: 5, tolerance: 0, marks: 3, hint: "Use mode r+, fread 3, fwrite 2 in the file bench.", solution: ["After fopen in r+ the position is 0; reading 3 bytes moves it to 3.", "Writing 2 bytes overwrites the L and the O at positions 3 and 4 (the file is now HELAB).", "The position is 3 + 2 = 5."], explanation: "In r+ the write overwrites existing bytes; it does not insert.", commonMistake: "Saying 2 (counting only the write) or 7 (inserting)." },
  ],
  summary: [
    "A struct member sits at a multiple of its own alignment and the struct size is rounded up to the largest alignment.",
    "A union is as large as its largest member and all members share the same bytes.",
    "Little-endian machines store the lowest byte first, so reading a char from an int gives the lowest byte.",
    "r and r+ need an existing file; w and w+ create or empty it; a and a+ create it and always write at the end.",
  ],
};

export const CST_EXPERIMENTS: Record<string, Experiment> = { cpipeline, ctrlflow, sortstack, ptrheap, structunion };
