import type { LabMeta } from "../types";

/** Programming for Problem Solving (CST-001) labs. */
export const CPROG_LABS: LabMeta[] = [
  { id: "sorting", title: "Sorting algorithms step by step", where: [["CST-001", 3]], blurb: "Watch bubble, insertion and selection sort work on bars, step through every comparison and swap with the C statement being run, and compare the counts.", topics: ["Arrays", "Bubble sort", "Insertion sort", "Selection sort"], animated: true,
    presets: [
      { name: "Bubble sort, worst case", note: "A reversed array makes bubble sort do n(n−1)/2 comparisons and swaps: 66 of each for n = 12. Drag the step slider to the end to read the totals.", values: { n: 12, algo: "bubble", order: "reversed", seed: 1, step: 0, auto: false } },
      { name: "Insertion on nearly sorted", note: "Insertion sort shifts each element only as far as needed, so a nearly sorted array costs close to n comparisons: this is its best case, O(n).", values: { n: 16, algo: "insertion", order: "nearly", seed: 1, step: 0, auto: false } },
      { name: "Selection sort, few swaps", note: "Selection sort always makes about n²/2 comparisons but at most n − 1 swaps: useful when writes are expensive.", values: { n: 12, algo: "selection", order: "random", seed: 7, step: 0, auto: false } },
    ] },
  { id: "search", title: "Linear vs binary search", where: [["CST-001", 3]], blurb: "Search a sorted array for a value one probe at a time and see how binary search halves the range while linear search walks one by one.", topics: ["Searching", "Linear search", "Binary search"], animated: true,
    presets: [
      { name: "Binary search, 64 items", note: "At most ⌈log₂(65)⌉ = 7 probes for 64 sorted values, however unlucky the target. Step through to see the low–high window halve.", values: { n: 64, method: "binary", x: 100, step: 0, auto: false } },
      { name: "Linear search, same array", note: "Linear search checks each element from the start, so a value near the end costs many probes; binary search needs the array to be sorted.", values: { n: 64, method: "linear", x: 100, step: 0, auto: false } },
      { name: "Value not present", note: "A missing value costs the worst case: linear reads all n elements, binary stops when low > high.", values: { n: 32, method: "binary", x: 2, step: 0, auto: false } },
    ] },
  { id: "pointers", title: "Pointers, arrays and addresses", where: [["CST-001", 4]], blurb: "See an array laid out byte by byte in memory: move a pointer with p + i and read the real address arithmetic, the value it points to and when it goes out of bounds.", topics: ["Pointers", "Pointer arithmetic", "Arrays and pointers"], animated: true,
    presets: [
      { name: "int array, p + 2", note: "With int (4 bytes) p + 2 moves 8 bytes: pointer arithmetic is scaled by sizeof(*p), so the address rises by i × 4.", values: { n: 6, type: "int", k: 1, i: 2, base: "x1000" } },
      { name: "double steps by 8", note: "The same p + 2 on a double array moves 16 bytes; the array takes n × 8 bytes in total.", values: { n: 6, type: "double", k: 0, i: 2, base: "x1000" } },
      { name: "Off the end of the array", note: "p + i beyond a[n − 1] is out of bounds: pointing one past the end is allowed, but reading there is undefined behaviour.", values: { n: 4, type: "int", k: 2, i: 3, base: "stack" } },
    ] },
  { id: "bits", title: "Bitwise operators", where: [["CST-001", 2]], blurb: "Set two 8-bit values and apply &, |, ^, ~, << or >>: see every bit line up, the result in binary, hex and decimal and the classic trick each one is used for.", topics: ["Bitwise operators", "Operators and expressions", "Binary representation"], animated: false,
    presets: [
      { name: "12 & 10 masks bits", note: "1100 & 1010 = 1000: a bit stays 1 only if it is 1 in both. AND with a mask picks out (tests) bits.", values: { a: 12, b: 10, s: 2, op: "and" } },
      { name: "Shift left multiplies", note: "12 << 2 = 48: shifting left by s multiplies by 2^s. Bits shifted past bit 7 are lost in an 8-bit type.", values: { a: 12, b: 10, s: 2, op: "shl" } },
      { name: "XOR swap trick", note: "XOR flips bits where b is 1, so (a ^ b) ^ b gives a back: the classic swap without a temporary variable.", values: { a: 170, b: 85, s: 2, op: "xor" } },
    ] },
  { id: "structlayout", title: "Structure layout and padding", where: [["CST-001", 5]], blurb: "Order the members of a struct and see every byte in memory: where the compiler adds padding, the total sizeof and how reordering saves space.", topics: ["Structures", "Padding and alignment", "sizeof and unions"], animated: false,
    presets: [
      { name: "char, int, char, double", note: "Members are aligned to their own size, so 1 + 3 pad + 4 + 1 + 7 pad + 8 = 24 bytes, of which only 14 are data.", values: { n: 4, m1: "char", m2: "int", m3: "char", m4: "double", m5: "short", m6: "char" } },
      { name: "Sorted largest first", note: "Putting members in decreasing size, double, int, char, char, cuts the struct to 16 bytes: same data, less padding.", values: { n: 4, m1: "double", m2: "int", m3: "char", m4: "char", m5: "short", m6: "char" } },
      { name: "Six mixed members", note: "Padding at the end rounds sizeof up to a multiple of the largest alignment (8 here), so arrays of this struct stay aligned.", values: { n: 6, m1: "char", m2: "double", m3: "short", m4: "int", m5: "char", m6: "ptr" } },
    ] },
];
