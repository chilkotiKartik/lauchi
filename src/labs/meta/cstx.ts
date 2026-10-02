import type { LabMeta } from "../types";

/** Flagship Programming for Problem Solving (CST-001) labs. */
export const CSTX_LABS: LabMeta[] = [
  { id: "cpipeline", title: "From C source to a running CPU", where: [["CST-001", 1]], blurb: "Follow a tiny C program through preprocess, compile, assemble, link and load: see the assembly and machine-code bytes a real mini compiler makes, then watch a CPU fetch, decode and execute them.", topics: ["Compilation stages", "Preprocessor", "Assembler and linker", "Fetch-decode-execute"], animated: true,
    presets: [
      { name: "Q1.1 all five stages", note: "PYQ Q1.1: the stages of compiling and running a C program. Start at Preprocess (#include is pasted in) and step the Stage list to Link to see each file type: .c, .i, .s, .o, a.out.", values: { prog: "hello", stage: "preprocess", step: 0, a: 7, b: 5, n: 5 } },
      { name: "Sum on the CPU", note: "int a = 7, b = 5; printf a + b. Drag the instruction step and watch eax and ebx load from RAM, the ALU add them and the output become 12.", values: { prog: "sum", stage: "run", step: 8, a: 7, b: 5, n: 5 } },
      { name: "Loop 1..5 machine code", note: "The for loop becomes cmp, jg and jmp. Look at the hex bytes after Assemble, then at the jump targets after Link: they moved by the load base 0x40.", values: { prog: "loop", stage: "link", step: 0, a: 7, b: 5, n: 5 } },
    ] },
  { id: "ctrlflow", title: "Control-flow railway", where: [["CST-001", 2], ["BCA-001", 2]], blurb: "A real C interpreter runs exam programs and drives a token along a 3D railway: gates flip on every test, loops count their laps and the console fills with the output.", topics: ["Loops", "break and continue", "Short-circuit evaluation", "Nested loops", "Prime numbers"], animated: true,
    presets: [
      { name: "Q2.9 break at 16..18", note: "PYQ Q2.9: a starts at 14, ++a gives 15 (printed), then 16 enters the if and break leaves the loop: the output is 15.", values: { prog: "break", step: 0, n: 5, vi: 4, vj: -1, vk: 0 } },
      { name: "Q2.8 short-circuit", note: "PYQ Q2.8 with i=4, j=-1, k=0: y = 1 and z = 1. For z, i+5 is non-zero so || skips the right side completely: look for the red skipped-operand event.", values: { prog: "shortcirc", step: 0, n: 5, vi: 4, vj: -1, vk: 0 } },
      { name: "Q2.10 stray semicolon", note: "PYQ Q2.10: the ; after the for makes an empty body, so the loop only counts k up to 6 and printf runs once afterwards: the output is 6.", values: { prog: "semicolon", step: 0, n: 5, vi: 4, vj: -1, vk: 0 } },
      { name: "Primes up to 30", note: "PYQ Q2.12: for each i the inner loop tries j while j*j <= i, so it stops early. Step through and watch p flip to 0 at the first divisor.", values: { prog: "primes", step: 0, n: 30, vi: 4, vj: -1, vk: 0 } },
    ] },
  { id: "sortstack", title: "Sorting bars and recursion stack", where: [["CST-001", 3], ["BCA-001", 3]], blurb: "Step through bubble, insertion, selection and quick sort on the exam arrays with exact comparison and swap counts, or switch to the recursion tower and watch factorial and Fibonacci push and pop stack frames.", topics: ["Bubble sort", "Insertion sort", "Selection sort", "Quick sort", "Recursion and call stack"], animated: true,
    presets: [
      { name: "Q3.7 bubble [5,1,4,2,8,7]", note: "PYQ Q3.7: with the early-exit flag bubble sort needs 3 passes, 12 comparisons and 5 swaps; without it, 15 comparisons. Drag the step slider to the end to read the totals.", values: { mode: "sort", alg: "bubble", arr: "a2", early: true, n: 4, step: 0 } },
      { name: "Q3.9 quick sort 9 numbers", note: "PYQ Q3.9: quick sort on [54, 26, 93, 17, 77, 31, 44, 55, 20] with the first element as pivot. Each pivot turns green when it reaches its final place.", values: { mode: "sort", alg: "quick", arr: "a4", early: true, n: 4, step: 0 } },
      { name: "factorial(5) stack", note: "PYQ Q3.10: factorial(5) pushes 5 frames before the base case returns 1, then each return pops a frame and multiplies: 120.", values: { mode: "fact", alg: "bubble", arr: "a2", early: true, n: 5, step: 0 } },
    ] },
  { id: "ptrheap", title: "Pointer arithmetic and the heap", where: [["CST-001", 4], ["BCA-001", 4]], blurb: "See why ptr2 - ptr1 counts elements but a char* difference counts bytes, then run malloc, calloc, realloc and free on a first-fit heap and watch leaked blocks glow red.", topics: ["Pointer arithmetic", "malloc and calloc", "realloc and free", "Memory leaks"], animated: true,
    presets: [
      { name: "Q4.6 ptr2 - ptr1", note: "PYQ Q4.6: int arr[6]; ptr2 = arr + 5. The pointer difference is 5 elements, but (char*)ptr2 - (char*)ptr1 is 5 x 4 = 20 bytes.", values: { mode: "ptr", pty: "int", d: 5, script: "leak", step: 0 } },
      { name: "Leak: p overwritten", note: "p = q loses the only pointer to the 32-byte block, so it stays allocated forever: the red voxels are a memory leak. Step to 3 and read Leaked bytes.", values: { mode: "heap", pty: "int", d: 2, script: "leak", step: 3 } },
      { name: "realloc moves a block", note: "The 24-byte block cannot grow in place because b sits right after it, so realloc finds a new first-fit block, copies and frees the old one.", values: { mode: "heap", pty: "int", d: 2, script: "realloc", step: 3 } },
    ] },
  { id: "structunion", title: "Struct, union and FILE bench", where: [["CST-001", 5], ["BCA-001", 5]], blurb: "Lay out struct members byte by byte with alignment padding, overlay union members and read one through another, then open a file in every fopen mode and watch the position indicator move.", topics: ["Structures", "Unions", "Padding and alignment", "File modes r w a r+ w+ a+"], animated: false,
    presets: [
      { name: "struct char,int,char = 12", note: "PYQ Q5.1: char at 0, 3 bytes padding, int at 4, char at 8, 3 bytes tail padding: sizeof is 12 although only 6 bytes are data.", values: { view: "struct", n: 3, m1: "char", m2: "int", m3: "char", m4: "short", m5: "double", wt: "int", rt: "char", val: 1094861636, fmode: "r", ex: true, rd: 3, wr: 2 } },
      { name: "union int then char", note: "A union shares one 8-byte space. Writing the int 0x41424344 stores 44 43 42 41 (little-endian), so reading the char member gives 0x44 = 68.", values: { view: "union", n: 3, m1: "char", m2: "int", m3: "char", m4: "short", m5: "double", wt: "int", rt: "char", val: 1094861636, fmode: "r", ex: true, rd: 3, wr: 2 } },
      { name: "Q5.2 mode w on existing file", note: "PYQ Q5.2: opening an existing file with w truncates it to zero length, while r on a missing file returns NULL and a creates it. Try the other modes with the file present or missing.", values: { view: "file", n: 3, m1: "char", m2: "int", m3: "char", m4: "short", m5: "double", wt: "int", rt: "char", val: 1094861636, fmode: "w", ex: true, rd: 3, wr: 2 } },
    ] },
];
