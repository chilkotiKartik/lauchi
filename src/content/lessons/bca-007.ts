import type { Lesson } from "./types";

const booth: Lesson = {
  intro: "Booth's algorithm multiplies two signed numbers in 2's complement form directly, with no separate handling of signs, by replacing a run of 1s in the multiplier with one subtraction and one addition. It is the standard multiplication question in Computer Organization. You will learn the registers, the four-way decision on the last two bits, and a full 4-bit trace.",
  sections: [
    { h: "The idea", p: ["A run of 1s in the multiplier, for example 0111100, equals 2⁷ − 2², so instead of adding the multiplicand four times we subtract it once at the start of the run and add it once after the end of the run. Fewer additions are needed when there are long runs of 1s, and negative multipliers work without any special case.", "Booth's method scans the multiplier bits from the right together with one extra bit Q₋₁ (initially 0) and looks at the pair Q₀ Q₋₁."] },
    { h: "Registers and rules", p: ["Registers: M holds the multiplicand, Q holds the multiplier, A (the accumulator) starts at 0, Q₋₁ starts at 0, and a counter SC holds the number of bits n.", "Repeat n times: look at Q₀ Q₋₁. If 10 (start of a run of 1s) do A = A − M. If 01 (end of a run) do A = A + M. If 00 or 11 do nothing. Then arithmetic shift right the combined register A, Q, Q₋₁ by one bit, keeping the sign bit of A. The product is in A and Q (2n bits)."], formula: ["Q0 Q-1 = 10:  A = A - M", "Q0 Q-1 = 01:  A = A + M", "Q0 Q-1 = 00 or 11:  no operation", "Then ASR (A, Q, Q-1);  repeat n times;  product = A:Q  (2n bits)", "-M is the 2's complement of M"] },
    { h: "Points the examiner checks", p: ["Ignore carry out of A when adding or subtracting, and always replicate the sign bit during the shift. Check the answer: the 8-bit product for 4-bit inputs must be the correct 2's complement number.", "Booth's method works for both positive and negative multipliers and multiplicands. Its worst case is a multiplier with alternating bits like 0101, where it performs an operation at every step."] },
  ],
  examples: [
    { q: "Multiply M = +5 (0101) by Q = −3 (1101) using Booth's algorithm in 4 bits.", steps: ["−M = 1011. Start A = 0000, Q = 1101, Q₋₁ = 0, n = 4.", "Step 1: Q₀Q₋₁ = 10, so A = 0000 + 1011 = 1011. ASR: A = 1101, Q = 1110, Q₋₁ = 1.", "Step 2: Q₀Q₋₁ = 01, so A = 1101 + 0101 = 0010 (carry dropped). ASR: A = 0001, Q = 0111, Q₋₁ = 0.", "Step 3: Q₀Q₋₁ = 10, so A = 0001 + 1011 = 1100. ASR: A = 1110, Q = 0011, Q₋₁ = 1.", "Step 4: Q₀Q₋₁ = 11, no operation. ASR: A = 1111, Q = 0001.", "Product = A:Q = 1111 0001, which is 2's complement for −15."], ans: "5 × (−3) = 1111 0001 = −15" },
    { q: "Without a full table, use Booth recoding to explain why 7 × 3 needs only two operations for the multiplier 0011.", steps: ["Multiplier 0011 has one run of 1s covering bits 0 and 1.", "A run from bit 0 to bit 1 equals 2² − 2⁰.", "So 7 × 3 = 7 × 4 − 7 × 1: one subtraction at the start of the run and one addition after its end.", "7 × 4 − 7 = 28 − 7 = 21."], ans: "21, using one subtraction and one addition" },
  ],
  mistakes: ["Adding M when Q₀Q₋₁ = 10. It is subtraction for 10 and addition for 01.", "Logical shift instead of arithmetic shift, so the sign of A is lost.", "Forgetting to shift Q₋₁ along with A and Q.", "Doing only n − 1 steps, or n + 1 steps. Exactly n.", "Forgetting to compute −M in 2's complement before starting."],
  check: [
    { q: "In Booth's algorithm, Q₀Q₋₁ = 01 means", o: ["A = A − M", "A = A + M", "no operation", "stop"], a: 1, why: "01 marks the end of a run of 1s." },
    { q: "The product of two n-bit numbers is held in", o: ["A only", "Q only", "A and Q together (2n bits)", "M"], a: 2, why: "A holds the high half, Q the low half." },
    { q: "The shift used after every step is", o: ["logical left", "arithmetic right", "rotate left", "logical right"], a: 1, why: "Arithmetic right shift preserves the sign." },
    { q: "Booth's algorithm is helpful because it", o: ["avoids all additions", "handles signed numbers directly", "needs no registers", "works only for positives"], a: 1, why: "2's complement numbers are multiplied without sign correction." },
  ],
  lab: { id: "coabooth", label: "Open the Booth multiplication lab" },
};

const ieee: Lesson = {
  intro: "IEEE 754 is the standard way real computers store floating-point numbers. The question appears in different forms: represent a decimal number, decode a hexadecimal word, or explain the addition steps. You will learn the sign, biased exponent and mantissa fields, a reliable conversion method, and the addition and subtraction algorithm.",
  sections: [
    { h: "Layout", p: ["A floating-point number is stored as sign, exponent and fraction (mantissa). Single precision uses 32 bits: 1 sign bit, 8 exponent bits and 23 fraction bits. Double precision uses 64 bits: 1, 11 and 52.", "The value is (−1)<sup>s</sup> × 1.fraction × 2<sup>e − bias</sup>. The leading 1 of a normalised number is not stored (the hidden bit). The exponent is stored with a bias of 127 for single and 1023 for double precision so that it can be compared as an unsigned number.", "Special values: exponent all 0 with fraction 0 is zero; exponent all 1 with fraction 0 is infinity; exponent all 1 with non-zero fraction is NaN; exponent all 0 with non-zero fraction is a denormal number."], formula: ["Single: value = (-1)^s × 1.f × 2^(E - 127),  1 + 8 + 23 bits", "Double: value = (-1)^s × 1.f × 2^(E - 1023), 1 + 11 + 52 bits", "Stored exponent E = true exponent + bias"] },
    { h: "Conversion method", p: ["To encode: convert the number to binary, normalise to 1.xxx × 2ⁿ, add the bias to n to get E, write the fraction bits after the point and pad with zeros, set the sign bit.", "To decode: split the bits, subtract the bias from E, restore the leading 1, and scale."] },
    { h: "Addition and subtraction steps", p: ["Step 1: compare the exponents and shift the mantissa of the smaller number right until the exponents are equal. Step 2: add or subtract the mantissas according to the signs. Step 3: normalise the result (shift left or right and adjust the exponent). Step 4: round, and check for overflow or underflow of the exponent."] },
  ],
  examples: [
    { q: "Represent 12.375 in IEEE 754 single precision and give the hexadecimal form.", steps: ["12 = 1100 and 0.375 = 0.011, so 12.375 = 1100.011.", "Normalise: 1.100011 × 2³.", "Exponent E = 3 + 127 = 130 = 10000010.", "Fraction = 10001100000000000000000 (23 bits). Sign = 0.", "Bits: 0 10000010 10001100000000000000000 = 0100 0001 0100 0110 0000 … = 41460000 in hex."], ans: "0x41460000" },
    { q: "Decode the single precision word C0A00000.", steps: ["C0A00000 = 1100 0000 1010 0000 0000 … so sign = 1.", "Exponent bits = 10000001 = 129, true exponent = 129 − 127 = 2.", "Fraction = 0100000… so the mantissa is 1.01 in binary = 1.25.", "Value = −1.25 × 2² = −5."], ans: "−5.0" },
    { q: "Add 6.0 (1.1 × 2²) and 1.25 (1.01 × 2⁰) using the floating-point addition steps.", steps: ["Exponents differ by 2, so shift the smaller mantissa right by 2: 1.25 = 0.0101 × 2².", "Add the mantissas: 1.1000 + 0.0101 = 1.1101.", "The result 1.1101 × 2² is already normalised.", "Value = 1.8125 × 4 = 7.25."], ans: "7.25 = 1.1101 × 2²" },
  ],
  mistakes: ["Forgetting the bias, or using 127 for double precision.", "Storing the leading 1 of the mantissa. It is the hidden bit.", "Adding mantissas before aligning the exponents.", "Aligning by shifting the larger number instead of the smaller one.", "Forgetting to renormalise after the addition, e.g. a carry gives 10.xxx."],
  check: [
    { q: "The bias for single precision is", o: ["64", "127", "128", "1023"], a: 1, why: "2<sup>7</sup> − 1 = 127 for 8 exponent bits." },
    { q: "How many fraction bits does double precision have?", o: ["23", "32", "52", "64"], a: 2, why: "1 sign + 11 exponent + 52 fraction = 64." },
    { q: "In floating-point addition, the first step is", o: ["normalise", "align exponents", "round", "convert to integer"], a: 1, why: "Mantissas can only be added when the exponents agree." },
    { q: "Exponent all 1s with zero fraction represents", o: ["zero", "NaN", "infinity", "a denormal"], a: 2, why: "That is the special value infinity." },
  ],
};

const addrmodes: Lesson = {
  intro: "An addressing mode tells the CPU how to interpret the address field of an instruction to find the operand. The exam asks for six or seven modes with the effective address of each, usually with a small memory table. You will learn each mode, its effective address formula, and an example you can reuse.",
  sections: [
    { h: "Effective address", p: ["The instruction has an opcode, a mode field and an address field. The effective address (EA) is the memory address of the operand after the mode is applied. Different modes trade between flexibility, instruction size and number of memory accesses."] },
    { h: "The common modes", p: ["Immediate: the operand itself is in the instruction. No memory access, fast, but the constant range is limited.", "Direct (absolute): the address field is the EA. One memory access for the operand.", "Indirect: the address field points to a memory word that holds the EA. Two memory accesses and a very large address space.", "Register: the operand is in a CPU register named by the instruction. Fastest, no memory access, few registers.", "Register indirect: the register holds the EA.", "Relative: EA = PC + address field. Used in branches, makes code position independent.", "Indexed: EA = address field + index register. Used to walk through arrays by changing the index.", "Base register: EA = base register + address field. Used to relocate programs.", "Autoincrement/decrement: register indirect, then the register is changed by the operand size; useful for stacks and arrays."], formula: ["Immediate: Operand = A", "Direct: EA = A", "Indirect: EA = M[A]", "Register: Operand = R", "Register indirect: EA = R", "Relative: EA = PC + A", "Indexed: EA = A + XR", "Base register: EA = BR + A"] },
    { h: "Remember the PC", p: ["In relative mode the PC has already been incremented to point to the next instruction when the address is calculated. State this assumption when you solve a numerical."] },
  ],
  examples: [
    { q: "An instruction is at address 100 and has address field 500. PC = 101 after fetch, R1 = 400 and XR = 100. Memory: M[500] = 800, M[800] = 300, M[400] = 700, M[600] = 900, M[601] = 250. Find the operand loaded in each mode.", steps: ["Immediate: operand = 500.", "Direct: EA = 500, operand = M[500] = 800.", "Indirect: EA = M[500] = 800, operand = M[800] = 300.", "Register (R1): operand = 400. Register indirect: EA = 400, operand = M[400] = 700.", "Relative: EA = PC + 500 = 601, operand = M[601] = 250.", "Indexed: EA = 500 + XR = 600, operand = M[600] = 900."], ans: "Immediate 500, Direct 800, Indirect 300, Register 400, Reg. indirect 700, Relative 250, Indexed 900" },
    { q: "How many memory accesses (excluding the instruction fetch) are needed to get the operand in direct, indirect and register modes?", steps: ["Direct: one access to read M[A].", "Indirect: two accesses, one to read the EA from M[A] and one to read the operand.", "Register: zero accesses."], ans: "1, 2 and 0 accesses" },
  ],
  mistakes: ["Calling the address field the operand in direct mode. The operand is the content at that address.", "Mixing up indirect (EA = M[A]) with register indirect (EA = R).", "Using the PC of the current instruction instead of the incremented PC in relative mode.", "Saying immediate mode needs one memory access for the operand.", "Giving only the names of modes without effective address formulas."],
  check: [
    { q: "The mode with no memory reference for the operand is", o: ["direct", "indirect", "register or immediate", "indexed"], a: 2, why: "The operand is in a register or in the instruction." },
    { q: "In indexed mode the effective address is", o: ["A", "M[A]", "A + XR", "PC + A"], a: 2, why: "The index register is added to the address field." },
    { q: "Relative addressing is mostly used for", o: ["data arrays", "branch instructions", "I/O", "stack operations only"], a: 1, why: "Branch targets are close to the PC." },
    { q: "Indirect mode needs at least", o: ["no memory access", "one memory access", "two memory accesses", "three memory accesses"], a: 2, why: "One for the EA and one for the operand." },
  ],
  lab: { id: "coaddr", label: "Open the addressing modes lab" },
};

const icycle: Lesson = {
  intro: "The instruction cycle is the sequence of steps the CPU repeats for every instruction: fetch, decode, execute, and a check for interrupts. The paper asks for the full cycle with register transfers and the interrupt branch. You will learn the micro-operations of the basic computer and be able to trace a simple ADD.",
  sections: [
    { h: "The four phases", p: ["Fetch: the instruction is read from the memory location pointed to by PC into the instruction register IR, and PC is incremented.", "Decode: the control unit decodes the opcode in IR and, for memory-reference instructions, the mode bit I and the address field.", "Execute: the operation is performed: read an operand, use the ALU, write a result, or change the PC for a branch.", "Interrupt: after execution the CPU checks whether an interrupt request is pending. If yes and interrupts are enabled it saves the return address and jumps to the interrupt service routine; otherwise it fetches the next instruction."] },
    { h: "Register transfers (Mano's basic computer)", p: ["Fetch uses timing signals T0, T1, T2. Decode happens at T2. Indirect addresses are resolved at T3 if I = 1. Execution starts at T4.", "If the interrupt flip-flop R = 1, the interrupt cycle replaces the fetch: RT0, RT1 and RT2 save the PC at location 0, set PC to 1, and clear IEN and R."], formula: ["T0: AR <- PC", "T1: IR <- M[AR], PC <- PC + 1", "T2: decode IR(12-14), AR <- IR(0-11), I <- IR(15)", "T3 (if I = 1): AR <- M[AR]", "Interrupt (R = 1):  RT0: AR <- 0, TR <- PC;  RT1: M[AR] <- TR, PC <- 0;  RT2: PC <- PC + 1, IEN <- 0, R <- 0, SC <- 0", "R is set when IEN = 1 and (FGI = 1 or FGO = 1)"] },
    { h: "Execution of a memory-reference instruction", p: ["ADD: T4: DR <- M[AR]; T5: AC <- AC + DR, E <- Cout, SC <- 0. Load (LDA): T4: DR <- M[AR]; T5: AC <- DR. Store (STA): T4: M[AR] <- AC. SC <- 0 returns the sequence counter to T0 and starts the next cycle."] },
  ],
  examples: [
    { q: "Trace the instruction 1450 (hex) stored at address 300, with M[450] = 0005 and AC = 0003.", steps: ["1450 in binary is 0001 0100 0101 0000. Bit 15 (I) = 0, opcode bits 14-12 = 001 which is ADD, address = 450.", "T0: AR <- 300. T1: IR <- 1450, PC <- 301.", "T2: decode gives D1 (ADD), AR <- 450, I = 0 so no indirect step.", "T4: DR <- M[450] = 0005.", "T5: AC <- 0003 + 0005 = 0008, E <- 0, SC <- 0."], ans: "AC = 0008, PC = 301, next fetch from 301" },
    { q: "Explain what happens when an interrupt is raised while an instruction is executing.", steps: ["The instruction finishes. At its end the CPU tests IEN and the flags; if both are set then R = 1.", "The next cycle is an interrupt cycle: the return address (PC) is stored in memory location 0.", "PC is loaded with 1, where the interrupt service routine (a branch to the real routine) begins. IEN and R are cleared so no nested interrupt occurs.", "The routine ends with an indirect branch through location 0, which restores the PC."], ans: "Return address saved at M[0]; execution resumes at 1; PC restored at the end" },
  ],
  mistakes: ["Incrementing PC before the instruction is fetched. T0 uses the old PC.", "Leaving out the interrupt check, so the cycle shows only fetch-decode-execute.", "Forgetting that decoding happens at T2 and resolving indirect addresses at T3.", "Writing IR <- M[PC] without going through AR in the register transfer form.", "Forgetting SC <- 0 at the end of execution."],
  check: [
    { q: "Which micro-operation fetches the instruction?", o: ["AR <- PC", "IR <- M[AR], PC <- PC + 1", "PC <- AR", "AC <- DR"], a: 1, why: "At T1 the instruction is read and the PC is incremented." },
    { q: "The interrupt flip-flop R is set when", o: ["IEN = 0", "IEN = 1 and a flag is set", "PC = 0", "SC = 0"], a: 1, why: "Interrupts must be enabled and a device must have requested." },
    { q: "During the interrupt cycle the return address is saved at", o: ["location 0", "location 1", "the stack in memory top", "the accumulator"], a: 0, why: "The basic computer saves PC in M[0]." },
    { q: "The decode step determines", o: ["the result", "the operation to perform", "the memory size", "the interrupt priority"], a: 1, why: "The control unit decodes the opcode." },
  ],
};

const commonbus: Lesson = {
  intro: "In a computer many registers must exchange data. Instead of wiring every pair of registers directly, a common bus carries one value at a time and a selector decides which register drives it. The exam asks you to design a common bus for four 4-bit registers with multiplexers. You will learn the design, the control signals and how memory transfers fit in.",
  sections: [
    { h: "Register transfer language", p: ["R2 <- R1 means the contents of R1 are copied into R2 on a clock pulse when the control condition is true. A conditional transfer is written P: R2 <- R1. Memory transfers use the address register AR: read is DR <- M[AR] and write is M[AR] <- R1."] },
    { h: "Bus built from multiplexers", p: ["For k registers of n bits use n multiplexers, one per bit position, each with k data inputs (the same bit of each register). The select lines are common to all multiplexers and choose the source register. For four registers we need select lines S1 S0 and four 4 × 1 multiplexers.", "Bus line j carries bit j of whichever register is selected: S1S0 = 00 selects A, 01 selects B, 10 selects C, 11 selects D. The destination register is chosen by its own load (enable) input: only the register whose LD is 1 captures the bus on the next clock edge.", "A transfer such as C <- A therefore needs S1S0 = 00 and LD of C = 1."], formula: ["Number of MUXes = number of bits per register", "MUX size = number of registers x 1  (k:1)", "Select lines = log2 (number of registers)", "S1 S0 = 00 -> A,  01 -> B,  10 -> C,  11 -> D"] },
    { h: "Three-state buffer bus", p: ["An alternative to multiplexers uses a three-state (tri-state) buffer for every register bit. A buffer is either passing the data to the bus or in a high-impedance state, as if disconnected. A decoder converts the select code into one enable line per register so that exactly one register drives the bus.", "Multiplexers and tri-state buffers give the same behaviour. Buffers allow a bus to be extended across a board easily."] },
  ],
  examples: [
    { q: "Design a common bus for four 4-bit registers A, B, C, D using 4 × 1 multiplexers. State the control signals to perform C <- A.", steps: ["Each register has 4 bits, so we need 4 multiplexers (MUX0 to MUX3), each 4 × 1.", "MUX j receives bit j of A, B, C and D on inputs 0, 1, 2, 3. Its output goes to bus line j. All multiplexers share select lines S1 S0.", "Bus lines go to the data inputs of all four registers. Each register has a load control LD.", "For C <- A: S1S0 = 00 puts A on the bus, LD<sub>C</sub> = 1 and the other loads are 0.", "On the next clock pulse C receives the value of A."], ans: "4 MUXes (4 × 1), select S1S0 = 00, LD of C = 1" },
    { q: "How many multiplexers and what size are needed for a bus connecting 8 registers of 16 bits?", steps: ["One MUX per bit: 16 multiplexers.", "Each MUX has 8 inputs (one per register): size 8 × 1.", "Select lines = log₂ 8 = 3."], ans: "16 multiplexers of 8 × 1 with 3 select lines" },
  ],
  mistakes: ["Using one multiplexer for the whole register. You need one per bit.", "Forgetting the load signal; the select lines only choose the source.", "Giving the multiplexer size as the register width instead of the number of registers.", "Connecting different select lines to each multiplexer.", "Saying tri-state buffers need no control. They need an enable per register."],
  check: [
    { q: "A bus for 4 registers of 8 bits needs", o: ["4 MUX of 8 × 1", "8 MUX of 4 × 1", "32 MUX", "1 MUX of 32 × 1"], a: 1, why: "One 4 × 1 multiplexer for each of the 8 bit positions." },
    { q: "The number of select lines for 16 registers is", o: ["2", "3", "4", "16"], a: 2, why: "log₂ 16 = 4." },
    { q: "What decides which register receives the bus data?", o: ["select lines", "its load input", "the memory", "the clock only"], a: 1, why: "Only a register with LD = 1 captures the bus." },
    { q: "The third state of a three-state buffer is", o: ["logic 0", "logic 1", "high impedance", "unknown logic"], a: 2, why: "It disconnects the output from the bus." },
  ],
};

const hwvsmicro: Lesson = {
  intro: "The control unit generates the signals that make the datapath do what an instruction says. It can be built as fixed logic (hardwired) or as a tiny program stored in a control memory (microprogrammed). The comparison of the two is a 10-mark favourite. You will learn the structure of each, microinstructions, the control memory and the table of differences.",
  sections: [
    { h: "Hardwired control", p: ["The control signals are produced by a network of gates, decoders and counters driven by the opcode, the timing signals and status flags. To change an instruction you must redesign the circuit.", "It is fast, because the delay is only gate delay, and is used in RISC processors. It is expensive and hard to change for a large instruction set."] },
    { h: "Microprogrammed control", p: ["Each machine instruction is carried out by a sequence of microinstructions, a micro-routine, stored in a control memory (usually ROM). A microinstruction is a control word: it contains fields that select the register transfers, ALU operation and so on, plus a field that gives the next address.", "The control address register (CAR) holds the address of the current microinstruction. The opcode is mapped to the starting address of its routine. Next addresses come from incrementing the CAR, a branch, a call/return or the mapping of a new opcode (address sequencing).", "It is flexible: changing or adding an instruction means changing the contents of the control memory. It is slower than hardwired control because every microinstruction needs a memory read. Typical in CISC machines."] },
    { h: "Comparison", p: ["Speed: hardwired faster, microprogrammed slower. Flexibility: microprogrammed easy to modify, hardwired fixed. Design: hardwired uses random logic, difficult for complex sets; microprogrammed is systematic. Cost and size: hardwired grows with complexity, microprogram needs ROM. Use: RISC vs CISC."], formula: ["Control memory size = number of microinstructions x width of microinstruction", "Microinstruction = [ control fields | condition | branch type | address ]"] },
  ],
  examples: [
    { q: "Differentiate between hardwired and microprogrammed control units.", steps: ["Hardwired: gates and flip-flops produce signals; fast; difficult to change; used in RISC.", "Microprogrammed: control signals read from the control memory; slower; changed by rewriting ROM; used in CISC.", "Add the block diagrams: hardwired has instruction register, decoder, step counter and logic network; microprogrammed has CAR, control memory, control data register and next-address logic."], ans: "Hardwired is faster but rigid; microprogrammed is flexible but slower" },
    { q: "A microinstruction has fields F1, F2, F3 of 3 bits each, CD of 2 bits, BR of 2 bits and AD of 7 bits. Find the control memory size for 128 words.", steps: ["Width = 3 + 3 + 3 + 2 + 2 + 7 = 20 bits.", "Size = 128 × 20 = 2560 bits.", "The address field of 7 bits is enough to address 2<sup>7</sup> = 128 words.", "2560 bits = 320 bytes."], ans: "128 words × 20 bits = 2560 bits" },
  ],
  mistakes: ["Saying microprogrammed control is faster. It adds a memory read per step.", "Confusing the control memory with main memory. The control memory is inside the CPU.", "Writing 'microprocessor' for microprogram.", "Forgetting the address field of the microinstruction, which gives the next address.", "Giving only differences with no example or diagram."],
  check: [
    { q: "A microprogram is stored in", o: ["main memory", "control memory", "cache", "hard disk"], a: 1, why: "The control memory holds micro-routines." },
    { q: "Which control unit is easier to modify?", o: ["Hardwired", "Microprogrammed", "Both equally", "Neither"], a: 1, why: "Change ROM contents instead of rewiring." },
    { q: "RISC machines usually use", o: ["hardwired control", "microprogrammed control only", "no control", "software control"], a: 0, why: "Simple instructions allow fast fixed logic." },
    { q: "The CAR holds", o: ["the operand", "the address of the next microinstruction", "the PC", "the data bus"], a: 1, why: "It is the control address register." },
  ],
};

const mapping: Lesson = {
  intro: "Cache memory is a small, fast memory between the CPU and main memory that keeps recently used blocks. The mapping function decides where a main-memory block may sit in the cache. The exam asks for the three mapping methods, address field splits, and an effective access time numerical. You will learn all three and how to split an address into tag, index and offset.",
  sections: [
    { h: "Why a cache works", p: ["Programs show locality: recently used data is likely to be used again (temporal) and nearby data is used soon (spatial). A hit means the word is in the cache. A miss means a whole block is loaded from main memory.", "Hit ratio h = hits / total accesses. Miss ratio = 1 − h."] },
    { h: "Three mapping techniques", p: ["Direct mapping: block j of memory goes to cache line j mod L (L = number of lines). Simple and fast (one comparison) but two blocks that map to the same line keep evicting each other (conflict misses). Address = Tag | Line index | Block offset.", "Fully associative: a block can go in any line. The tag of every line is compared in parallel. Fewest conflicts, but expensive hardware. Address = Tag | Offset and a replacement policy (LRU, FIFO) is needed.", "Set-associative (k-way): the cache is divided into sets of k lines; block j goes to set j mod S, any line in the set. It is a compromise, used in real CPUs. Address = Tag | Set index | Offset."], formula: ["Offset bits = log2 (block size in bytes)", "Direct: index bits = log2 (number of lines)", "Set-assoc: index bits = log2 (number of sets), sets = lines / k", "Tag bits = address bits - index bits - offset bits"] },
    { h: "Effective access time", p: ["With cache access time t<sub>c</sub>, main memory time t<sub>m</sub> and hit ratio h: if the CPU checks the cache first and goes to memory only on a miss, EAT = h·t<sub>c</sub> + (1 − h)(t<sub>c</sub> + t<sub>m</sub>). If the cache and memory are accessed in parallel, EAT = h·t<sub>c</sub> + (1 − h)·t<sub>m</sub>. State which model you use.", "Write policies: write-through updates memory on every write (simple, slow); write-back marks the line dirty and writes to memory only on eviction (fast, complex)."], formula: ["EAT (sequential) = h·tc + (1 - h)(tc + tm)", "EAT (parallel) = h·tc + (1 - h)·tm"] },
  ],
  examples: [
    { q: "A system has a 20-bit address, 16-byte blocks and a 64 KB cache. Find the tag, index and offset bits for direct mapping and 4-way set-associative mapping.", steps: ["Offset = log₂ 16 = 4 bits. Number of lines = 64 KB / 16 B = 4096 = 2<sup>12</sup>.", "Direct mapping: index = 12 bits, tag = 20 − 12 − 4 = 4 bits.", "4-way: sets = 4096 / 4 = 1024 = 2<sup>10</sup>, so index = 10 bits, tag = 20 − 10 − 4 = 6 bits.", "Fully associative: no index, tag = 20 − 4 = 16 bits."], ans: "Direct 4/12/4, 4-way 6/10/4, associative 16/-/4 (tag/index/offset)" },
    { q: "Cache access time is 10 ns, main memory access time is 100 ns and the hit ratio is 0.9. Find the average access time in both models.", steps: ["Sequential: 0.9 × 10 + 0.1 × (10 + 100) = 9 + 11 = 20 ns.", "Parallel: 0.9 × 10 + 0.1 × 100 = 9 + 10 = 19 ns.", "Speed-up over no cache (100 ns): 100 / 20 = 5."], ans: "20 ns (sequential), 19 ns (parallel)" },
    { q: "In a direct-mapped cache of 8 lines, which line holds memory block 12, and which other block conflicts with it?", steps: ["Line = 12 mod 8 = 4.", "Blocks 4, 12, 20, 28, … all map to line 4.", "Accessing 12 and 4 alternately gives a miss every time."], ans: "Line 4; blocks 4, 20, … conflict" },
  ],
  mistakes: ["Using total memory address bits for the index instead of line-count bits.", "Forgetting the block offset when counting tag bits.", "Mixing up sets and lines in a set-associative cache.", "Applying the sequential formula when the question says the accesses are simultaneous (or the reverse).", "Calling a write-back cache simpler than write-through."],
  check: [
    { q: "In direct mapping, memory block j maps to line", o: ["any line", "j mod L", "j / L", "L mod j"], a: 1, why: "Each block has exactly one possible line." },
    { q: "A 2-way set-associative cache of 64 lines has how many sets?", o: ["64", "32", "16", "2"], a: 1, why: "64 / 2 = 32 sets." },
    { q: "A conflict miss is characteristic of", o: ["fully associative", "direct mapped", "no cache", "virtual memory"], a: 1, why: "Different blocks compete for the same line." },
    { q: "For h = 0.95, tc = 5 ns, tm = 50 ns, parallel EAT is", o: ["7.25 ns", "7.5 ns", "10 ns", "52 ns"], a: 0, why: "0.95 × 5 + 0.05 × 50 = 4.75 + 2.5 = 7.25 ns." },
  ],
  lab: { id: "coacache", label: "Open the cache mapping lab" },
};

const vmem: Lesson = {
  intro: "Virtual memory lets a program use more memory than is physically installed by keeping only the needed pages in main memory and the rest on disk. The exam asks you to define it, explain paging with address translation and apply a page replacement policy to a reference string. You will learn the mechanism and trace FIFO and LRU.",
  sections: [
    { h: "The idea", p: ["The program works with virtual (logical) addresses. The memory management unit (MMU) translates them to physical addresses. The address space is divided into fixed-size pages, and physical memory into frames of the same size.", "Only some pages are in frames at any time. The rest stay on disk (swap area). This lets large programs run, allows many programs to share memory, and protects processes from each other."] },
    { h: "Paging and address translation", p: ["A virtual address has a page number p and an offset d. The page table, indexed by p, gives the frame number f and a valid bit. The physical address is f followed by d (the offset is unchanged).", "If the valid bit is 0 the page is not in memory: a page fault occurs. The OS loads the page from disk into a free frame (or picks a victim), updates the table and restarts the instruction. A TLB caches recent translations to avoid reading the page table in memory every time."], formula: ["Virtual address = page number | offset", "Physical address = frame number | offset", "Number of pages = virtual address space / page size"] },
    { h: "Page replacement", p: ["When no frame is free, a victim page is chosen. FIFO removes the oldest loaded page (simple, may suffer Belady's anomaly: more frames can give more faults). LRU removes the page unused for the longest time (good, needs hardware support). Optimal removes the page that will not be used for the longest time ahead (best, only a yardstick).", "Page-fault count is the measure: fewer faults is better."] },
  ],
  examples: [
    { q: "Page size 4 KB. Virtual address 0x3A7C. Page 3 is in frame 5. Find the physical address.", steps: ["4 KB = 2<sup>12</sup> bytes, so the offset is the low 12 bits = A7C and the page number is 3.", "Page 3 is in frame 5, so the physical address is frame 5 followed by A7C.", "Physical address = 0x5A7C."], ans: "0x5A7C" },
    { q: "Reference string 1 2 3 4 1 2 5 1 2 3 4 5 with 3 frames. Count page faults with FIFO.", steps: ["1, 2, 3 are faults (frames 1 2 3). 4 replaces 1 (fault): 2 3 4. 1 replaces 2 (fault): 3 4 1. 2 replaces 3 (fault): 4 1 2.", "5 replaces 4 (fault): 1 2 5. 1 hit. 2 hit.", "3 replaces 1 (fault): 2 5 3. 4 replaces 2 (fault): 5 3 4. 5 hit.", "Faults: 1 2 3 4 1 2 5 3 4 = 9."], ans: "9 page faults" },
    { q: "Run FIFO on the same string with 4 frames. What do you notice?", steps: ["Frames 4: 1 2 3 4 are four faults, then 1 and 2 are hits.", "5 replaces 1 (fault), 1 replaces 2 (fault), 2 replaces 3 (fault), 3 replaces 4 (fault), 4 replaces 5 (fault), 5 replaces 1 (fault).", "Total = 4 + 6 = 10 faults, more than 9 with three frames."], ans: "10 faults: Belady's anomaly" },
  ],
  mistakes: ["Translating the offset along with the page number. Only the page number changes.", "Counting the first loading of a page as no fault. The initial loads are faults too.", "Updating LRU order only on faults. A hit also refreshes the recency.", "Saying more frames always means fewer faults for FIFO; Belady's anomaly shows otherwise.", "Confusing a page (virtual) with a frame (physical)."],
  check: [
    { q: "With 1 KB pages the offset occupies", o: ["8 bits", "10 bits", "12 bits", "16 bits"], a: 1, why: "1024 = 2<sup>10</sup>." },
    { q: "Belady's anomaly occurs in", o: ["LRU", "FIFO", "Optimal", "all of them"], a: 1, why: "FIFO is not a stack algorithm." },
    { q: "A page fault happens when", o: ["the valid bit is 0", "the cache misses", "the TLB hits", "the offset is 0"], a: 0, why: "The page is not in main memory." },
    { q: "The page-replacement algorithm that looks into the future is", o: ["LRU", "FIFO", "Optimal", "Clock"], a: 2, why: "It evicts the page needed furthest away." },
  ],
  lab: { id: "coavmem", label: "Open the paging lab" },
};

const dma: Lesson = {
  intro: "Direct Memory Access lets an I/O device move blocks of data to or from memory without the CPU copying every word. It is the third and fastest I/O method after programmed I/O and interrupt-driven I/O, and the exam always asks you to compare the three. You will learn the DMA controller, the transfer steps and how DMA modes compare with the other methods.",
  sections: [
    { h: "The I/O methods", p: ["Programmed I/O: the CPU polls a status flag in a loop and transfers each word itself. Simple, but the CPU is busy-waiting.", "Interrupt-driven I/O: the device interrupts when ready, the CPU runs a service routine for each word and then goes back to its work. No busy waiting, but every word costs an interrupt.", "DMA: a DMA controller moves the whole block between device and memory, and interrupts the CPU only when the block is done."] },
    { h: "DMA controller and transfer steps", p: ["The controller has an address register (memory address), a word count register and a control register (direction, mode). The CPU initialises these three and starts the device.", "Step 1: the device asks the controller for a transfer (DMA request). Step 2: the controller sends a bus request (BR) to the CPU. Step 3: after finishing the current bus cycle the CPU releases the buses and answers with bus grant (BG). Step 4: the controller puts the address on the address bus and transfers a word directly to or from memory. Step 5: it increments the address and decrements the word count. Step 6: when the count reaches 0 it interrupts the CPU and releases the bus.", "Modes: burst (block) mode keeps the bus until the whole block is moved, cycle stealing takes the bus for one memory cycle at a time between CPU cycles."], formula: ["DMA registers: Address register, Word count, Control", "Handshake: DMA request -> BR -> BG -> transfer -> word count = 0 -> interrupt"] },
    { h: "Comparison", p: ["CPU involvement: programmed highest, interrupt moderate, DMA lowest. Speed for large blocks: DMA best. Hardware: DMA needs a controller. Use: DMA for disks and network cards, interrupts for keyboards, programmed I/O for very simple devices."] },
  ],
  examples: [
    { q: "A block of 2000 words is moved by DMA with cycle stealing; a memory cycle takes 0.5 µs. With interrupt-driven I/O each word needs a 10 µs service routine. Compare the CPU time lost.", steps: ["DMA: each word steals one memory cycle: 2000 × 0.5 µs = 1000 µs = 1 ms of bus time. One interrupt at the end costs a further 10 µs, about 1.01 ms.", "Interrupt-driven: 2000 interrupts × 10 µs = 20,000 µs = 20 ms.", "Ratio: 20 / 1.01 is about 20 times less CPU time with DMA."], ans: "DMA ≈ 1 ms; interrupt-driven = 20 ms" },
    { q: "List the steps by which a disk block is read into memory using DMA.", steps: ["CPU writes the memory start address, the word count and the 'read' direction to the DMA controller and starts the disk.", "The disk sends a DMA request when a word is ready; the controller sends BR and gets BG.", "The word is placed in memory at the address register; the address increments and the count decrements.", "This repeats until the count is zero; then the controller interrupts the CPU."], ans: "Initialise, request bus, transfer words, interrupt at end" },
  ],
  mistakes: ["Saying the CPU is completely idle during DMA. It only loses the bus during stolen cycles.", "Forgetting that the CPU still initialises the DMA controller.", "Believing DMA interrupts the CPU after every word.", "Mixing up bus request (from DMA) and bus grant (from CPU).", "Comparing the methods without a single numerical or example of devices."],
  check: [
    { q: "DMA interrupts the CPU", o: ["after every word", "when the block transfer is complete", "never", "only on errors"], a: 1, why: "Word count reaching zero triggers the interrupt." },
    { q: "Which registers does the DMA controller contain?", o: ["address, word count, control", "PC, IR, AC", "only a data register", "TLB, page table"], a: 0, why: "They define where, how much and which direction." },
    { q: "Cycle stealing means the DMA", o: ["takes the bus for one memory cycle at a time", "stops the CPU forever", "uses cache only", "copies the OS"], a: 0, why: "It steals single cycles between CPU accesses." },
    { q: "The method with busy waiting is", o: ["DMA", "programmed I/O", "interrupt I/O", "vectored I/O"], a: 1, why: "The CPU polls the status flag." },
  ],
  lab: { id: "coaio", label: "Open the I/O lab" },
};

const prio: Lesson = {
  intro: "When several devices can interrupt at once, the computer must decide which one is served first, and must identify the source quickly. This is solved with priority interrupts in software or hardware. The exam asks for the complete interrupt cycle and the daisy-chain and parallel priority schemes. You will learn each scheme and how a vector address is produced.",
  sections: [
    { h: "The interrupt cycle", p: ["Step 1: a device raises an interrupt request and the CPU finishes the current instruction. Step 2: if interrupts are enabled, the CPU acknowledges and saves the return address (PC) and the status on the stack. Step 3: the CPU finds the address of the interrupt service routine (ISR), by polling or from a vector number supplied by the device. Step 4: the ISR runs, usually with other interrupts disabled or masked by priority. Step 5: a return-from-interrupt instruction restores the PC and status and the program continues."] },
    { h: "Three ways to find the source", p: ["Software polling: one common ISR reads each device status in turn. Cheap, but slow, because the last device polled waits longest.", "Daisy chain (hardware serial priority): the devices are connected in a chain by the acknowledge line. The CPU sends an acknowledge to the first device. If it requested, it keeps the signal and puts its vector address on the data bus. Otherwise it passes the signal to the next device. The device nearest the CPU has the highest priority.", "Parallel priority: each device sets a bit in an interrupt register; a mask register can disable chosen bits. A priority encoder gives the binary code of the highest-priority unmasked active bit, and that code makes up the vector address. All requests are examined at once, so it is faster than a daisy chain."], formula: ["Daisy chain: PI -> device 1 -> device 2 -> ... ; PO = PI and (device not requesting)", "Parallel: Interrupt register AND Mask register -> priority encoder -> vector address", "Encoder output xy:  I0 -> 00, I1 -> 01, I2 -> 10, I3 -> 11"] },
    { h: "Priority and nesting", p: ["A higher priority interrupt may interrupt a lower priority ISR (nesting) if the ISR re-enables interrupts for higher levels only. The mask register is set to block equal or lower priorities while an ISR runs."] },
  ],
  examples: [
    { q: "Four devices I0 (highest) to I3 raise requests together. Show which is served first using a priority encoder, and which if I0 is masked.", steps: ["Active requests I0, I1, I2, I3 all set. The encoder outputs the highest priority: I0, code 00.", "If I0 is masked, the AND with the mask clears it. Remaining I1, I2, I3: the highest is I1, code 01.", "The code is appended to a fixed base to give the vector address, e.g. vector = base + 8 × code if each ISR slot is 8 bytes."], ans: "I0 first; with I0 masked, I1 is served" },
    { q: "Devices D1, D2 and D3 are on a daisy chain in this order. D2 and D3 request. Which one is served and what happens to D3?", steps: ["The CPU acknowledge enters D1 first. D1 did not request, so it passes it to D2.", "D2 requested, so it blocks the acknowledge (PO = 0) and places its vector address on the data bus.", "D3 receives nothing, so it waits until D2 finishes."], ans: "D2 is served first; D3 waits" },
  ],
  mistakes: ["Saying the device farthest from the CPU has the highest priority in a daisy chain. It is the nearest one.", "Forgetting the return address save step in the interrupt cycle.", "Mixing up the mask register (disables) with the interrupt register (records requests).", "Claiming daisy chain checks all devices at once; that is the parallel scheme.", "Not stating how the vector address is obtained."],
  check: [
    { q: "In a daisy chain, highest priority belongs to the device", o: ["nearest the CPU", "farthest from the CPU", "with the highest address", "in the middle"], a: 0, why: "The acknowledge signal reaches it first." },
    { q: "A mask register is used to", o: ["record requests", "disable selected interrupts", "store the PC", "set the vector"], a: 1, why: "A mask bit of 0 blocks the corresponding request." },
    { q: "The parallel priority scheme uses", o: ["a priority encoder", "only software", "a stack only", "DMA"], a: 0, why: "It outputs the code of the highest active request." },
    { q: "Before the ISR runs, the CPU must save", o: ["the return address", "the hard disk", "the cache", "nothing"], a: 0, why: "The PC is needed to resume the interrupted program." },
  ],
  lab: { id: "coaio", label: "Open the I/O lab" },
};

/** BCA-007 lessons. Keys are "BCA-007:unit:topic" (topic = 1-based index in the syllabus unit's topics). */
export const L_BCA007: Record<string, Lesson> = {
  "BCA-007:1:10": booth,
  "BCA-007:1:6": ieee,
  "BCA-007:2:10": addrmodes,
  "BCA-007:2:3": icycle,
  "BCA-007:3:2": commonbus,
  "BCA-007:3:10": hwvsmicro,
  "BCA-007:4:4": mapping,
  "BCA-007:4:7": vmem,
  "BCA-007:5:7": dma,
  "BCA-007:5:8": prio,
};
