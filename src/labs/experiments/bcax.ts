import type { Equipment, Experiment, Question, Step, StepCheck } from "./types";

/**
 * Guided experiments for the BCA labs (Digital Electronics, Data Structures, Computer Organization, Java).
 * Every numeric answer is recomputed from src/labs/sim/bcax.ts in bcax.test.ts.
 */

type X = { hint?: string; scenario?: string; formulas?: string[]; commonMistake?: string; marks?: number };
const mcq = (id: string, prompt: string, options: string[], answer: number, solution: string[], explanation: string, o: X = {}): Question => ({ id, type: "mcq", prompt, options, answer, solution, explanation, ...o, marks: o.marks ?? 2 });
const tf = (id: string, prompt: string, answer: boolean, solution: string[], explanation: string, o: X = {}): Question => ({ id, type: "tf", prompt, answer, solution, explanation, ...o, marks: o.marks ?? 1 });
const num = (id: string, prompt: string, answer: number, tolerance: number, solution: string[], explanation: string, o: X & { unit?: string } = {}): Question => ({ id, type: "numeric", prompt, answer, tolerance, solution, explanation, ...o, marks: o.marks ?? 3 });
const eq = (id: string, title: string, text: string, key: string, op: "eq" | "gte" | "neq", value: number | string | boolean, hint?: string): Step => ({ id, title, text, hint, check: { kind: "param", key, op, value } as StepCheck });
const pre = (id: string, title: string, text: string, name: string): Step => ({ id, title, text, check: { kind: "preset", name } });
const rst = (id: string): Step => ({ id, title: "Reset the bench", text: "Press Reset to go back to the starting values.", check: { kind: "reset" } });
const eqp = (name: string, what: string, where?: string): Equipment => ({ name, what, where });

const dlqm: Experiment = {
  labId: "dlqm",
  title: "Quine-McCluskey minimisation, step by step",
  aim: "To minimise a Boolean function with the tabular (Quine-McCluskey) method: group minterms, merge them into prime implicants, find the essential primes and write the minimal SOP.",
  objectives: ["Group minterms by their number of 1s and merge pairs that differ in one bit.", "Tell prime implicants from merged rows and find the essential primes.", "Write the minimal sum-of-products from the chosen cover."],
  equipment: [eqp("Bit rows", "Each row is an implicant: blue = 1, dark = 0, gold dash = eliminated variable.", "Glass columns"), eqp("Green and orange backings", "Green: prime implicant. Orange: essential prime. Purple: extra prime chosen for the cover.", "Behind each row"), eqp("Gold SOP line", "The minimal expression, shown at the last stage.", "Front of the bench")],
  steps: [
    eq("d1", "Choose the PYQ function", "Make sure the function is PYQ Q3.4: f = Σm(0,1,5,7,10,14).", "fn", "eq", "q34"),
    eq("d2", "Show the first merge", "Move the stage slider to 1 and see the rows that differ in one bit merge into a dash.", "stage", "gte", 1, "The first slider under the readouts."),
    eq("d3", "Second pass", "Go to stage 2. Can any dashed rows merge again?", "stage", "gte", 2),
    eq("d4", "Prime implicants", "Go to stage 4: unmerged rows now glow green. Count them.", "stage", "gte", 4),
    eq("d5", "Minimal cover", "Go to stage 6 and read the minimal SOP.", "stage", "gte", 6),
    pre("d6", "Try five variables", "Load the preset 'Q3.3 five variables' and walk through its stages.", "Q3.3 five variables"),
    rst("d7"),
  ],
  questions: [
    mcq("dlqm-q1", "What is a <b>prime implicant</b>?", ["Any product term of the function", "An implicant that cannot be merged into a larger one", "A minterm with an odd number of 1s", "A term that covers exactly one minterm"], 1, ["Merging removes one variable and enlarges the group.", "When no further merge is possible the term is prime."], "In the table, prime implicants are the rows that never get merged (the green ones).", { hint: "Look at which rows stay unmerged.", commonMistake: "Calling every merged row prime." }),
    tf("dlqm-q2", "An essential prime implicant covers at least one minterm that no other prime implicant covers.", true, ["Essential means indispensable.", "If it were dropped, that minterm would be uncovered."], "Essential primes must all appear in the minimal cover."),
    num("dlqm-q3", "How many prime implicants does f = Σm(0,1,5,7,10,14) have?", 4, 0, ["Pass 1 merges 0-1, 1-5, 5-7 and 10-14.", "Pass 2 finds nothing more to merge.", "So the primes are 000-, 0-01, 01-1 and 1-10: four."], "Read it from the green rows at stage 4.", { hint: "Set stage 4 or more." }),
    num("dlqm-q4", "How many of them are essential?", 3, 0, ["m0 is only in 000-, m7 only in 01-1 and m10 only in 1-10.", "Each of those is therefore essential: three."], "The remaining prime 0-01 is not needed, because m1 and m5 are already covered.", { hint: "Look for orange backings.", formulas: ["essential: minterm covered by exactly one prime"] }),
    mcq("dlqm-q5", "The minimal SOP of PYQ Q3.4 is", ["A'B'C + A'BD + ACD'", "A'B'C' + A'BD + ACD'", "A'C'D + A'BD + BCD'", "A'B'C' + BD + ACD'"], 1, ["000- means A=0, B=0, C=0: A'B'C'.", "01-1 is A'BD and 1-10 is ACD'.", "Their sum is A'B'C' + A'BD + ACD'."], "The dash drops the variable that changes.", { scenario: "A student merges m0 = 0000 with m1 = 0001 and gets 000-.", commonMistake: "Writing C instead of C' for a 0 bit." }),
    num("dlqm-q6", "The PYQ Q3.3 five-variable function has how many minterms?", 17, 0, ["Count the numbers in Σm(0,1,2,4,7,8,12,14,15,16,17,18,20,24,28,30,31).", "There are 17."], "More minterms mean a longer first column, which is why Quine-McCluskey is done by program for large functions."),
  ],
  summary: ["Quine-McCluskey is a systematic version of K-map grouping that works for any number of variables.", "Only rows that differ in exactly one bit merge; an unmerged row is a prime implicant.", "Essential primes are forced; the rest of the cover is chosen to cover what is left."],
};

const addsub: Experiment = {
  labId: "addsub",
  title: "Ripple, look-ahead, subtraction and BCD addition",
  aim: "To compare ripple-carry and look-ahead adders by carry delay, subtract with 2's complement and correct a BCD sum with +6.",
  objectives: ["See a carry travel through a ripple adder.", "Compare gate delays of ripple and look-ahead adders.", "Explain why BCD addition needs the +6 correction."],
  equipment: [eqp("Full-adder blocks", "Four purple blocks: each makes a sum bit and a carry.", "Middle row"), eqp("Gold carry wires", "Glow when the carry is 1; the gold packet shows the ripple.", "Between the blocks"), eqp("Orange +6 block", "Lights when a BCD sum exceeds 9.", "Left, BCD mode only")],
  steps: [
    eq("a1", "Make a long carry", "Set A to 15 (B stays 6, so the sum carries).", "a", "gte", 15),
    pre("a2", "Load 15 + 1", "Load the preset 'Ripple 15 + 1' and watch the carry packet cross all four stages.", "Ripple 15 + 1"),
    eq("a3", "Switch to look-ahead", "Choose the look-ahead carry adder and compare the delay readouts.", "mode", "eq", "lookahead"),
    eq("a4", "Subtract", "Choose the subtractor and read the no-borrow flag.", "mode", "eq", "sub"),
    pre("a5", "BCD 9 + 8", "Load the preset 'Q3.8 BCD 9 + 8' and watch the orange +6 block light up.", "Q3.8 BCD 9 + 8"),
    rst("a6"),
  ],
  questions: [
    num("addsub-q1", "In a 4-bit ripple-carry adder, after how many gate delays is the last sum bit ready?", 8, 0, ["Every stage adds 2 gate delays to the carry (AND then OR).", "For n = 4 the last sum bit is ready after 2n = 8 gate delays."], "Read it from the 'Last sum ready after' readout in ripple mode.", { formulas: ["ripple sum delay = 2n gate delays"] }),
    num("addsub-q2", "How many gate delays does the 4-bit look-ahead adder need for its last sum bit?", 4, 0, ["P and G take 1 delay, the two-level carry logic 2 more, the sum XOR 1 more.", "Total 4, whatever the word length."], "That is why look-ahead is used in fast ALUs.", { hint: "Switch to look-ahead mode." }),
    tf("addsub-q3", "The delay of a look-ahead carry adder grows linearly with the number of bits.", false, ["Carries are computed in parallel from P and G.", "The delay stays constant (but the logic gets bigger)."], "Ripple delay grows with n; look-ahead delay does not.", { commonMistake: "Mixing up ripple and look-ahead." }),
    mcq("addsub-q4", "A BCD digit adder adds 0110 to the binary sum when", ["the sum is odd", "the sum is greater than 9 (or there is a carry)", "both inputs are zero", "the carry-in is 1"], 1, ["BCD digits only go to 9, but 4 bits go to 15.", "Adding 6 skips the 6 unused codes and produces the decimal carry."], "9 + 8 = 17 is 10001; adding 0110 gives 0111 with a carry: digits 1 and 7.", { scenario: "A BCD adder gets the digits 9 and 8 with no carry-in.", hint: "Use the BCD preset." }),
    num("addsub-q5", "In the same BCD addition (9 + 8), what is the ones digit of the answer?", 7, 0, ["Binary sum 17 is above 9, so add 6: 17 + 6 = 23 = 1 0111.", "The low four bits 0111 are 7 and the carry 1 is the tens digit."], "Final answer 17 in BCD.", { marks: 2 }),
    num("addsub-q6", "The subtractor computes 9 − 5 as 9 + 5' + 1. What 4-bit difference does it output (decimal)?", 4, 0, ["5 = 0101, its complement is 1010.", "1001 + 1010 + 1 = 1 0100: the carry 1 means no borrow and the difference is 0100 = 4."], "The carry out of a 2's complement subtraction means A ≥ B."),
  ],
  summary: ["A ripple adder's delay grows with word length; a look-ahead adder computes all carries in parallel.", "Subtraction is addition of the 2's complement: A + B' + 1, and Cout = 1 means no borrow.", "BCD addition adds 6 whenever the binary sum exceeds 9."],
};

const ffconv: Experiment = {
  labId: "ffconv",
  title: "Flip-flop truth tables and conversion",
  aim: "To clock SR, JK, D and T flip-flops, and to convert one type into another using excitation tables.",
  objectives: ["Predict Q after each clock pulse for each flip-flop type.", "Read the inputs a base flip-flop needs to imitate a target.", "Recall the conversions SR to D and JK to T."],
  equipment: [eqp("Master and slave latches", "Blue master and purple slave: the master follows the input, the slave copies it on the clock edge.", "Left of the bench"), eqp("Input and converted rows", "Blue/purple: target inputs. Orange/red: inputs the real flip-flop is fed.", "Timeline"), eqp("Green Q bars", "Q after each pulse.", "Bottom row")],
  steps: [
    eq("f1", "SR as D", "The lab starts with an SR flip-flop acting as a D flip-flop (PYQ Q3.11).", "tgt", "eq", "D"),
    eq("f2", "Apply four pulses", "Set the clock pulses to 4 and watch Q follow the D row.", "k", "gte", 4),
    eq("f3", "Apply eight pulses", "Set the pulses to 8 and read the S and R rows.", "k", "gte", 8),
    eq("f4", "Use a JK flip-flop", "Change the base flip-flop to JK.", "base", "eq", "JK"),
    eq("f5", "Make it behave like T", "Set the target to T.", "tgt", "eq", "T"),
    pre("f6", "JK as T", "Load the preset 'JK as T'.", "JK as T"),
    rst("f7"),
  ],
  questions: [
    mcq("ffconv-q1", "The characteristic equation of a JK flip-flop is", ["Q+ = JQ' + K'Q", "Q+ = D", "Q+ = T ⊕ Q", "Q+ = S + R'Q"], 0, ["J=1,K=0 sets, J=0,K=1 resets, J=K=1 toggles.", "That gives Q+ = JQ' + K'Q."], "D is Q+ = D, T is Q+ = T ⊕ Q and SR is Q+ = S + R'Q."),
    tf("ffconv-q2", "S = R = 1 is a valid input for an SR flip-flop.", false, ["Both outputs would be forced to 0 at once.", "When the inputs return to 0 together, the final state is unpredictable."], "That is why JK was invented: J = K = 1 toggles instead.", { commonMistake: "Thinking SR toggles like JK." }),
    mcq("ffconv-q3", "To convert an SR flip-flop into a D flip-flop, connect", ["S = D, R = D'", "S = D', R = D", "S = R = D", "S = Q, R = D"], 0, ["D = 1 must set (S=1,R=0); D = 0 must reset (S=0,R=1).", "So S = D and R = D'."], "The red R row in the lab is the inverse of the D row.", { scenario: "Asha builds a D flip-flop out of an SR flip-flop and an inverter.", hint: "Compare the orange and red rows with the blue row." }),
    num("ffconv-q4", "SR as D with the D pattern 90 (pulses read bit 0 first): what is Q after 4 pulses?", 1, 0, ["D bits for the first four pulses are 0, 1, 0, 1.", "Q follows D, so after the 4th pulse Q = 1."], "Check with the 'Q after pulses' readout.", { marks: 2 }),
    num("ffconv-q5", "JK as T with the T pattern 117 (binary 01110101): how many of the 8 pulses toggle Q?", 5, 0, ["Reading from bit 0: 1,0,1,0,1,1,1,0.", "Five of the eight T bits are 1, so Q toggles five times."], "J = K = T: T = 1 toggles, T = 0 holds.", { hint: "Load the 'JK as T' preset and count the toggle pulses.", formulas: ["Q+ = T ⊕ Q"] }),
    num("ffconv-q6", "A T flip-flop starts at 0 and gets T = 1, 1, 0 on three pulses. What is Q at the end?", 0, 0, ["Pulse 1 toggles to 1, pulse 2 toggles back to 0.", "Pulse 3 holds: Q = 0."], "A T flip-flop divides the clock by 2 when T = 1.", { scenario: "Ravi connects T = 1 for two pulses and then T = 0." }),
  ],
  summary: ["SR sets and resets, JK adds toggling, D copies its input and T toggles.", "Conversion uses the excitation table of the base flip-flop and a K-map for the inputs.", "SR to D is S = D, R = D'; JK to T is J = K = T."],
};

const counters: Experiment = {
  labId: "counters",
  title: "Ripple, synchronous, ring and Johnson counters",
  aim: "To compare counter types by their sequences, moduli and maximum clock frequency.",
  objectives: ["Count with ripple and synchronous counters.", "Explain why a ripple counter is slower.", "Write the Johnson counter sequence."],
  equipment: [eqp("Flip-flop blocks and LEDs", "Each block stores one bit; the LED glows for 1.", "Centre"), eqp("Gold clock packet", "In ripple mode it passes from block to block; in synchronous mode it reaches all at once.", "Along the blocks"), eqp("Red and green bars", "Settling time of a ripple and a synchronous counter.", "Right edge")],
  steps: [
    eq("c1", "Count in ripple mode", "Raise the clock pulses to 8 or more; the binary count rises.", "k", "gte", 8),
    eq("c2", "Switch to synchronous", "Change the circuit to the synchronous counter and compare f(max).", "kind", "eq", "sync"),
    eq("c3", "Ring counter", "Choose the ring counter and look at the single 1.", "kind", "eq", "ring"),
    eq("c4", "Johnson counter", "Choose the Johnson counter and step the pulses 0 to 8.", "kind", "eq", "johnson"),
    pre("c5", "Preset: ripple vs sync", "Load the preset 'Q3.9 ripple vs sync'.", "Q3.9 ripple vs sync"),
    rst("c6"),
  ],
  questions: [
    num("counters-q1", "A 4-bit ripple counter has flip-flop delay 20 ns. What is the maximum clock frequency (MHz)?", 12.5, 0.1, ["The clock must wait for 4 flip-flops: 4 × 20 = 80 ns.", "f = 1/80 ns = 12.5 MHz."], "A synchronous counter avoids adding the delays.", { unit: "MHz", formulas: ["f(max) = 1 / (n · t<sub>pd</sub>)"] }),
    num("counters-q2", "A synchronous counter with t(pd) = 20 ns and AND-gate delay 10 ns: maximum frequency (MHz)?", 33.3, 0.1, ["Period ≥ 20 + 10 = 30 ns.", "f = 1000/30 = 33.3 MHz."], "It does not depend on the number of bits.", { unit: "MHz", formulas: ["f(max) = 1 / (t<sub>pd</sub> + t<sub>gate</sub>)"] }),
    num("counters-q3", "What is the MOD (number of states) of a 4-bit Johnson counter?", 8, 0, ["A Johnson counter has 2n states.", "n = 4 gives 8."], "The states are 0000, 1000, 1100, 1110, 1111, 0111, 0011, 0001 (PYQ Q3.12)."),
    tf("counters-q4", "A 4-bit ring counter has 16 different states.", false, ["It circulates a single 1 through 4 flip-flops.", "Only 4 states occur."], "A ring uses n flip-flops for n states; Johnson uses n for 2n; a binary counter for 2^n.", { commonMistake: "Thinking every counter has 2^n states." }),
    mcq("counters-q5", "Which counter clocks all its flip-flops at the same instant?", ["Ripple counter", "Synchronous counter", "Neither", "Only the ring counter"], 1, ["In a ripple counter each flip-flop clocks the next.", "In a synchronous counter they share the clock."], "That is why synchronous counters are faster and have no glitches in the output code.", { scenario: "A designer needs a counter that runs from a 30 MHz clock.", hint: "Compare the f(max) of both types." }),
    num("counters-q6", "A 3-bit ripple counter has t(pd) = 30 ns. How long (ns) does the output take to settle after a clock edge in the worst case?", 90, 0, ["Three flip-flops change one after the other.", "3 × 30 = 90 ns."], "That is the red bar in the lab.", { unit: "ns" }),
  ],
  summary: ["Ripple counters are simple but their delays add up; synchronous counters share the clock.", "Ring counters have n states, Johnson counters 2n and binary counters 2^n.", "Maximum frequency is 1/(n·t_pd) for ripple and 1/(t_pd + t_gate) for synchronous."],
};

const hazard: Experiment = {
  labId: "hazard",
  title: "Static-1 hazard and races",
  aim: "To see a glitch in F = AB + A'C, remove it with the consensus term and tell critical from non-critical races.",
  objectives: ["Explain the cause of a static-1 hazard.", "Remove it with a redundant term.", "Explain critical and non-critical races."],
  equipment: [eqp("Waveform ribbons", "A, A', the two AND outputs, the consensus term and F.", "Stacked rows"), eqp("Red glass window", "Marks the time when F drops to 0.", "On the F row"), eqp("State circles", "00, 01, 10 and 11 in race mode.", "Race view")],
  steps: [
    eq("h1", "Slow inverter", "Set the inverter delay to 4 ns or more and look at the red window.", "dinv", "gte", 4),
    eq("h2", "Add the consensus term", "Tick the consensus term BC.", "cons", "eq", true),
    eq("h3", "Race view", "Switch to the race experiment.", "view", "eq", "race"),
    eq("h4", "Non-critical race", "Untick the critical race box and see where the packet ends.", "crit", "eq", false),
    pre("h5", "Critical race preset", "Load the preset 'Q3.13 critical race'.", "Q3.13 critical race"),
    rst("h6"),
  ],
  questions: [
    num("hazard-q1", "With an inverter delay of 3 ns and no consensus term, how wide (ns) is the glitch in F?", 3, 0, ["A' rises 3 ns after A falls.", "For those 3 ns both AND gates output 0."], "The glitch width equals the inverter delay.", { unit: "ns" }),
    tf("hazard-q2", "Adding the redundant term BC removes the static-1 hazard of F = AB + A'C.", true, ["With B = C = 1 the term BC stays 1 while A changes.", "So F never drops."], "BC is the consensus of AB and A'C.", { commonMistake: "Removing redundant terms to simplify a circuit also removes hazard protection." }),
    mcq("hazard-q3", "A static-1 hazard is", ["an output that should stay 1 but briefly goes to 0", "an output that should stay 0 but briefly goes to 1", "a permanent stuck-at-1 fault", "a race between two flip-flops"], 0, ["Static means the output should not change.", "1 is the level it should hold."], "A static-0 hazard is the opposite.", { scenario: "An engineer sees a 2 ns dip on a signal that must stay high." }),
    mcq("hazard-q4", "In a critical race the final stable state", ["is always the same", "depends on which variable changes first", "is always 11", "is undefined forever"], 1, ["Both intermediate states are stable.", "The faster variable decides which one the circuit reaches."], "Fix it with a race-free state assignment."),
    num("hazard-q5", "Critical race, y1 delay 3 ns and y2 delay 5 ns: the circuit stops in state 10 or 01? Enter 10 for 10 and 1 for 01.", 10, 0, ["y1 is faster, so it changes first: 00 goes to 10.", "In a critical table 10 is stable, so the circuit stays there."], "Swap the delays and it ends in 01.", { marks: 2 }),
    tf("hazard-q6", "In a non-critical race both orders of change lead to the same final state.", true, ["The intermediate states both feed into 11.", "So the result is independent of delays."], "Only critical races are dangerous."),
  ],
  summary: ["A static-1 hazard is a brief 0 on an output that should stay 1, caused by unequal path delays.", "A redundant consensus term covers the gap.", "Critical races give delay-dependent results; avoid them by changing one state variable at a time."],
};

const dsstack: Experiment = {
  labId: "dsstack",
  title: "Stack, circular queue and expressions",
  aim: "To perform push and pop with overflow/underflow checks, wrap a circular queue and evaluate postfix expressions.",
  objectives: ["Detect overflow and underflow.", "Explain index wrapping with mod N.", "Evaluate and convert expressions with a stack."],
  equipment: [eqp("Glass tube of slabs", "The stack: slabs drop in on push and lift out on pop.", "Centre"), eqp("Ring of slots", "The circular queue with green front and orange rear markers.", "Queue mode"), eqp("Token strip", "The expression characters, green once read.", "Front of the bench")],
  steps: [
    eq("s1", "Fill the stack", "Step the operations to 5 or more with capacity 5.", "step", "gte", 5),
    eq("s2", "Overflow", "Set the capacity to 4 and watch the red flash on the 5th push.", "cap", "eq", 4),
    eq("s3", "Circular queue", "Switch to the circular queue.", "mode", "eq", "cqueue"),
    eq("s4", "Wrap-around", "Step the queue to 8 operations and find the wrap.", "step", "gte", 8),
    eq("s5", "Postfix", "Evaluate the postfix expression.", "mode", "eq", "postfix"),
    rst("s6"),
  ],
  questions: [
    mcq("dsstack-q1", "A stack follows the rule", ["FIFO", "LIFO", "random access", "priority order"], 1, ["The last item pushed is the first popped.", "A queue is FIFO."], "That is why a stack suits recursion and undo."),
    num("dsstack-q2", "A stack with capacity 4 is empty. After 4 pushes, what is the value of top?", 3, 0, ["top starts at −1.", "Each push does top++: after four pushes top = 3 = MAX − 1."], "A fifth push would be an overflow.", { hint: "Use the stack mode with capacity 4." }),
    num("dsstack-q3", "Evaluate the postfix expression 23+4*62/- (this is (2+3)*4−6/2).", 17, 0, ["2 3 + gives 5; 5 4 * gives 20.", "6 2 / gives 3; 20 − 3 = 17."], "The lab shows the same pushes and pops.", { formulas: ["scan left to right; operator pops two operands"] }),
    num("dsstack-q4", "In a circular queue with N = 5, rear = 4 and an item is enqueued. What is the new rear?", 0, 0, ["rear = (rear + 1) mod N = 5 mod 5 = 0.", "It wraps to the start of the array."], "A linear queue would have reported full.", { scenario: "The array end is reached but slots 0 and 1 were freed by dequeues." }),
    tf("dsstack-q5", "In infix to postfix conversion the operators are held on the stack.", true, ["Operands go straight to the output.", "Operators wait on the stack until their right operand is complete."], "The stack top holds the operator that will be output first."),
    num("dsstack-q6", "Evaluate the postfix expression 853-/23*+ (this is 8/(5−3)+2*3).", 10, 0, ["5 3 − gives 2; 8 2 / gives 4.", "2 3 * gives 6; 4 + 6 = 10."], "Note the second operand popped is the right one.", { commonMistake: "Subtracting in the wrong order." }),
  ],
  summary: ["Push checks overflow (top = MAX−1); pop checks underflow (top = −1).", "A circular queue uses (index + 1) mod N so freed slots are reused.", "Postfix evaluation and infix conversion both rely on a stack."],
};

const dsbst: Experiment = {
  labId: "dsbst",
  title: "Binary search tree operations",
  aim: "To build a BST, traverse it in the three depth-first orders, search it and delete nodes of every kind.",
  objectives: ["Insert the PYQ keys into a BST.", "Write inorder, preorder and postorder sequences.", "Delete a node with two children."],
  equipment: [eqp("Sphere nodes", "Blue spheres hold keys; gold marks the current node.", "The tree"), eqp("Rails", "Parent-child links light up along the path.", "Between spheres"), eqp("White bead", "Runs along the visited path.", "Over the tree")],
  steps: [
    eq("b1", "Insert the keys", "Step the build to all 7 keys (15 10 20 8 12 17 25).", "step", "gte", 7),
    eq("b2", "Traversal view", "Switch to the traversal experiment.", "view", "eq", "traverse"),
    eq("b3", "Preorder", "Choose preorder.", "trav", "eq", "pre"),
    eq("b4", "Postorder", "Choose postorder.", "trav", "eq", "post"),
    eq("b5", "Delete view", "Switch to delete and remove 15, the root.", "view", "eq", "delete"),
    pre("b6", "Delete the root", "Load the preset 'Delete the root' and read the replacement.", "Delete the root"),
    rst("b7"),
  ],
  questions: [
    num("dsbst-q1", "What is the height (levels) of the BST built from 15, 10, 20, 8, 12, 17, 25?", 3, 0, ["15 is the root; 10 and 20 below; four leaves at level 3.", "Height 3."], "Balanced shapes have height about log2 n."),
    num("dsbst-q2", "How many comparisons does it take to find 17 in that tree?", 3, 0, ["Compare with 15 (go right), 20 (go left), 17 (found).", "Three comparisons."], "Search cost is the path length."),
    mcq("dsbst-q3", "The inorder traversal of a BST gives the keys", ["in descending order", "in ascending order", "level by level", "in insertion order"], 1, ["Left subtree, root, right subtree.", "Everything on the left is smaller."], "Hence inorder is used to sort with a BST.", { hint: "Try the traversal view." }),
    num("dsbst-q4", "After deleting the root 15 (two children), which key becomes the new root (inorder successor)?", 17, 0, ["The successor is the smallest key in the right subtree.", "The right subtree 20, 17, 25 has smallest key 17."], "The successor is then removed from its old place.", { scenario: "Ravi deletes the root of the PYQ tree.", formulas: ["successor = leftmost node of the right subtree"] }),
    num("dsbst-q5", "Inserting the sorted keys 10, 20, 30, 40, 50 gives a tree of what height?", 5, 0, ["Each key goes to the right of the previous one.", "The tree is a chain of 5 nodes."], "This worst case makes search O(n) and motivates AVL trees."),
    tf("dsbst-q6", "A node with exactly one child is deleted by replacing it with that child.", true, ["The child subtree is attached to the deleted node's parent.", "Ordering is preserved."], "A leaf is simply removed."),
  ],
  summary: ["BST operations follow one path from the root, so cost is O(height).", "Inorder gives sorted order; preorder and postorder have the root first or last.", "Deleting a node with two children uses its inorder successor."],
};

const dsavl: Experiment = {
  labId: "dsavl",
  title: "AVL rotations",
  aim: "To keep a BST balanced with LL, RR, LR and RL rotations.",
  objectives: ["Read balance factors.", "Identify which rotation fixes which imbalance.", "See the middle key become the subtree root."],
  equipment: [eqp("Coloured spheres", "Green: balance 0, gold: ±1, red: ±2.", "The tree"), eqp("Small numbers", "The balance factor beside each sphere.", "Upper right of each node"), eqp("Gliding nodes", "After a rotation spheres glide to their new places.", "Whole tree")],
  steps: [
    eq("v1", "LR case", "The lab starts with 30, 10, 20. Step to 3 to see the imbalance at 30.", "step", "gte", 3),
    eq("v2", "Rotation done", "Step to 4 to watch the glide.", "step", "gte", 4),
    eq("v3", "LL case", "Choose 30, 20, 10.", "seq", "eq", "ll"),
    eq("v4", "RR case", "Choose 10, 20, 30.", "seq", "eq", "rr"),
    eq("v5", "RL case", "Choose 10, 30, 20.", "seq", "eq", "rl"),
    eq("v6", "Longer sequence", "Choose the long sequence and step to the end.", "seq", "eq", "long"),
    rst("v7"),
  ],
  questions: [
    mcq("dsavl-q1", "Inserting 30, 10, 20 into an empty AVL tree needs which rotation?", ["LL", "RR", "LR", "RL"], 2, ["20 goes to the right of 10 which is left of 30.", "Left child is right-heavy: left-right case."], "Rotate 10 left, then 30 right.", { scenario: "Keys arrive in the order 30, 10, 20." }),
    num("dsavl-q2", "After the LL rotation of 30, 20, 10, which key is the root?", 20, 0, ["The middle key becomes the root.", "20 with 10 left and 30 right."], "In every rotation case the middle of the three keys rises."),
    tf("dsavl-q3", "In an AVL tree every node has a balance factor of −1, 0 or +1.", true, ["Balance factor = height(left) − height(right).", "Insertions that break this are repaired by rotations."], "This keeps the height at O(log n)."),
    num("dsavl-q4", "Inserting 10, 20, 30, 40, 50, 25 in order: how many rotations are needed in total?", 3, 0, ["Inserting 30 triggers an RR rotation.", "Inserting 50 triggers another RR.", "Inserting 25 triggers an RL: three rotations."], "Count the red frames in the lab.", { hint: "Step through the long sequence." }),
    mcq("dsavl-q5", "A node has balance factor +2 and its left child has balance factor +1. The fix is", ["a single right rotation", "a single left rotation", "left-right double rotation", "no rotation"], 0, ["Left-heavy and left-left: LL.", "A single right rotation at the node."], "LR is when the left child leans right."),
    num("dsavl-q6", "What is the height of the final AVL tree after 10, 20, 30, 40, 50, 25?", 3, 0, ["The balanced result has 6 nodes in 3 levels.", "A plain BST would have height 5 or 6."], "Check the readout at the last step.", { hint: "Last step of the long sequence." }),
  ],
  summary: ["AVL trees keep |balance factor| ≤ 1 using rotations.", "LL and RR need one rotation; LR and RL need two.", "After a rotation the middle key becomes the subtree root."],
};

const dsgraph: Experiment = {
  labId: "dsgraph",
  title: "BFS, DFS and minimum spanning trees",
  aim: "To compare breadth-first and depth-first search and to build a minimum spanning tree with Prim's and Kruskal's algorithms.",
  objectives: ["Trace BFS with a queue and DFS with a stack.", "Build an MST with Prim and Kruskal.", "Read an adjacency matrix."],
  equipment: [eqp("Vertices and edges", "Seven spheres A to G joined by weighted rails.", "Above the bench"), eqp("Holder strip", "The queue, stack or remaining edges, in front.", "Front"), eqp("Green tiles", "Adjacency matrix when ticked.", "Front")],
  steps: [
    eq("g1", "Run BFS", "Step to 7 with BFS from A.", "step", "gte", 7),
    eq("g2", "Run DFS", "Choose depth-first search.", "alg", "eq", "dfs"),
    eq("g3", "Prim", "Choose Prim's algorithm and step to the end.", "alg", "eq", "prim"),
    eq("g4", "Kruskal", "Choose Kruskal's algorithm.", "alg", "eq", "kruskal"),
    eq("g5", "Matrix", "Tick the adjacency matrix box.", "mat", "eq", true),
    rst("g6"),
  ],
  questions: [
    mcq("dsgraph-q1", "Breadth-first search uses which data structure?", ["Stack", "Queue", "Heap", "Hash table"], 1, ["BFS visits all neighbours before going deeper.", "A FIFO queue gives that order."], "DFS uses a stack (or recursion)."),
    num("dsgraph-q2", "In BFS from A, at what position (1 = first) is vertex E visited?", 5, 0, ["The BFS order is A, B, D, C, E, F, G.", "E is fifth."], "Neighbours are taken in alphabetical order.", { hint: "Step BFS to the end." }),
    num("dsgraph-q3", "What is the total weight of the minimum spanning tree?", 39, 0, ["Prim from A takes A-D 5, D-F 6, A-B 7, B-E 7, E-C 5, E-G 9.", "5+6+7+7+5+9 = 39."], "Kruskal gives the same total.", { marks: 4 }),
    num("dsgraph-q4", "How many edges does a spanning tree of this 7-vertex graph have?", 6, 0, ["A spanning tree has V − 1 edges.", "7 − 1 = 6."], "Any more would create a cycle.", { formulas: ["edges = V − 1"] }),
    num("dsgraph-q5", "Kruskal's algorithm examines all 11 edges. How many does it reject?", 5, 0, ["6 are accepted.", "11 − 6 = 5 are rejected because they would close a cycle."], "Rejected edges are shown red.", { scenario: "The edges are sorted by weight and each is accepted only if it joins two components." }),
    tf("dsgraph-q6", "The adjacency matrix of an undirected graph is symmetric.", true, ["An edge u-v sets both entries [u][v] and [v][u].", "So the matrix equals its transpose."], "It needs V² cells whatever the number of edges."),
  ],
  summary: ["BFS uses a queue, DFS a stack; both visit each vertex once.", "A spanning tree has V − 1 edges; Prim and Kruskal find the cheapest one.", "Matrices cost V² memory, lists V + E."],
};

const dshash: Experiment = {
  labId: "dshash",
  title: "Hash tables and collisions",
  aim: "To insert keys with linear probing, chaining and double hashing and count the probes.",
  objectives: ["Compute h(k) = k mod m.", "Follow probe sequences.", "Compare chaining and open addressing."],
  equipment: [eqp("Bucket row", "Numbered slots; the slot just used glows.", "Bench"), eqp("Gold packet", "Hops along the probe sequence.", "Above the buckets"), eqp("Key towers", "In chaining mode keys stack on their bucket.", "Chain mode")],
  steps: [
    eq("h1", "Insert all keys", "With linear probing and m = 7, insert 7 keys.", "step", "gte", 7),
    eq("h2", "Chaining", "Switch to separate chaining.", "scheme", "eq", "chain"),
    eq("h3", "Double hashing", "Switch to double hashing.", "scheme", "eq", "double"),
    eq("h4", "Quadratic probing", "Switch to quadratic probing.", "scheme", "eq", "quad"),
    pre("h5", "Linear preset", "Load the preset 'Q5.18 linear probing'.", "Q5.18 linear probing"),
    rst("h6"),
  ],
  questions: [
    num("dshash-q1", "With m = 7, which slot does the key 85 hash to first?", 1, 0, ["85 mod 7 = 1 (7 × 12 = 84).", "Slot 1."], "50 also hashes to 1, so 85 collides.", { formulas: ["h(k) = k mod m"] }),
    num("dshash-q2", "Insert 50, 700, 76, 85, 92, 73, 101 with linear probing, m = 7. Where does 85 end up?", 2, 0, ["Slot 1 is taken by 50.", "The next slot 2 is free."], "92 then goes to slot 3.", { hint: "Step to 4 keys." }),
    num("dshash-q3", "How many probes in total are used for all 7 keys with linear probing?", 13, 0, ["Probes per key: 50 needs 1, 700 needs 1, 76 needs 1, 85 needs 2, 92 needs 3, 73 needs 2 and 101 needs 3.", "Sum = 1 + 1 + 1 + 2 + 3 + 2 + 3 = 13."], "Read the 'Probes / total' readout.", { marks: 4 }),
    num("dshash-q4", "With separate chaining, how many keys end up in the chain of slot 1?", 3, 0, ["50, 85 and 92 all hash to 1.", "The chain has three keys."], "Long chains slow down search.", { scenario: "The same 7 keys go into a chained table with m = 7." }),
    tf("dshash-q5", "Open addressing can fail to insert a key when the table is full.", true, ["All slots are occupied.", "No probe finds a free one."], "Chaining never overflows (memory aside)."),
    mcq("dshash-q6", "Which scheme avoids the clustering of linear probing by using a second hash?", ["Chaining", "Double hashing", "Rehashing by 1", "Direct addressing"], 1, ["Double hashing steps by h2(k) = 1 + k mod (m−1).", "Different keys get different step sizes."], "Quadratic probing also reduces clustering."),
  ],
  summary: ["Hashing maps a key to a slot with h(k) = k mod m.", "Collisions are solved by chaining or by open addressing (linear, quadratic, double).", "The load factor drives the number of probes."],
};

const coabooth: Experiment = {
  labId: "coabooth",
  title: "Booth multiplication",
  aim: "To multiply signed numbers with Booth's algorithm and divide with the restoring method.",
  objectives: ["Choose add, subtract or shift from Q0 and Q−1.", "Read the product from A and Q.", "Trace restoring division."],
  equipment: [eqp("Bit-cube rows", "M (purple), A (blue), Q (green), Q−1 (orange).", "Centre"), eqp("Halo", "Marks the active register.", "Around A"), eqp("Operation lamp", "Green add, red subtract, gold shift.", "Right")],
  steps: [
    eq("o1", "Run the cycles", "Step to 8 and watch four add/subtract/shift pairs.", "step", "gte", 8),
    eq("o2", "Change the multiplier", "Set the multiplier to 7 (a run of ones).", "q", "eq", 7),
    eq("o3", "Division mode", "Switch to restoring division.", "mode", "eq", "div"),
    pre("o4", "Division preset", "Load 'Restoring 13 / 3'.", "Restoring 13 / 3"),
    rst("o5"),
  ],
  questions: [
    mcq("coabooth-q1", "In Booth's algorithm, Q0 Q−1 = 10 means", ["add M", "subtract M", "shift only", "stop"], 1, ["10 is the start of a run of 1s.", "So A = A − M."], "01 is the end of a run: add M."),
    num("coabooth-q2", "What is 7 × (−3) by Booth's algorithm?", -21, 0, ["Multiplicand 0111, multiplier 1101.", "After 4 cycles A:Q = 11101011 = −21."], "Check with the product readout.", { marks: 4 }),
    num("coabooth-q3", "How many shift operations does a 4-bit Booth multiplication perform?", 4, 0, ["One arithmetic shift per cycle.", "n = 4 cycles."], "The number of adds/subtracts varies."),
    tf("coabooth-q4", "A long run of 1s in the multiplier needs only one subtraction and one addition.", true, ["The run start does A − M, the run end does A + M.", "The cycles in between only shift."], "That is Booth's advantage for such multipliers.", { scenario: "The multiplier is 0111." }),
    num("coabooth-q5", "Restoring division 13 ÷ 3: what is the quotient?", 4, 0, ["After four cycles Q = 0100.", "13 = 3 × 4 + 1."], "A holds the remainder.", { formulas: ["dividend = divisor × quotient + remainder"] }),
    num("coabooth-q6", "In the same division, what is the remainder?", 1, 0, ["13 − 12 = 1.", "The final A register is 00001."], "Read it in the final A Q readout."),
  ],
  summary: ["Booth examines Q0 and Q−1: 10 subtracts, 01 adds, 00 and 11 shift.", "The 2n-bit product is in A:Q.", "Restoring division restores A when A − M is negative."],
};

const coacache: Experiment = {
  labId: "coacache",
  title: "Cache mapping and access time",
  aim: "To compare direct and set-associative mapping and to compute effective access time.",
  objectives: ["Find the set for a block.", "See conflict misses.", "Compute EMAT."],
  equipment: [eqp("Memory blocks", "Numbered blocks on the left.", "Left"), eqp("Cache lines", "Eight lines grouped into sets.", "Right"), eqp("Gold packet", "Carries a block into the cache on a miss.", "Between")],
  steps: [
    eq("k1", "Run the accesses", "Make 10 accesses with direct mapping.", "step", "gte", 10),
    eq("k2", "Try 2-way", "Choose the 2-way set associative cache.", "map", "eq", "set2"),
    eq("k3", "Fully associative", "Choose the fully associative cache.", "map", "eq", "full"),
    pre("k4", "EMAT preset", "Load 'Q6.16 EMAT = 20 ns'.", "Q6.16 EMAT = 20 ns"),
    eq("k5", "Raise the hit ratio", "Set the hit ratio to 99% and watch EMAT fall.", "hr", "gte", 99),
    rst("k6"),
  ],
  questions: [
    num("coacache-q1", "Cache 10 ns, memory 100 ns, hit ratio 90% (PYQ Q6.16). What is the effective access time (ns)?", 20, 0.01, ["EMAT = h·tc + (1−h)(tc + tm).", "0.9 × 10 + 0.1 × 110 = 9 + 11 = 20 ns."], "Read it from the EMAT readout.", { unit: "ns", formulas: ["EMAT = h·t<sub>c</sub> + (1 − h)(t<sub>c</sub> + t<sub>m</sub>)"], marks: 4 }),
    num("coacache-q2", "If memory is accessed simultaneously with the cache, the same system's EMAT (ns) is", 19, 0.01, ["Misses cost only tm: 0.9 × 10 + 0.1 × 100 = 19."], "Tick the simultaneous box to check.", { unit: "ns" }),
    num("coacache-q3", "With direct mapping and the conflict pattern 0 8 0 8 0 8 1 9 1 9, how many hits occur?", 0, 0, ["Blocks 0 and 8 share line 0 and evict each other; 1 and 9 share line 1.", "Every access misses."], "A conflict (thrashing) miss pattern.", { hint: "Run all 10 accesses." }),
    num("coacache-q4", "The same pattern in a 2-way set associative cache gives how many hits?", 6, 0, ["Both blocks of each pair fit in one set.", "Only the first access of each of the four blocks misses: 10 − 4 = 6 hits."], "Associativity removes conflict misses."),
    tf("coacache-q5", "A fully associative cache can place a block in any line.", true, ["There is only one set.", "All tags are compared."], "The price is more comparators."),
    mcq("coacache-q6", "Block 12 in a direct-mapped cache of 8 lines goes to line", ["2", "4", "6", "12"], 1, ["Line = block mod 8.", "12 mod 8 = 4."], "The index is the low bits of the block number.", { scenario: "A direct-mapped cache has 8 lines." }),
  ],
  summary: ["Direct mapping: line = block mod lines; conflicts are possible.", "Associativity removes conflicts but costs comparators.", "EMAT = h·tc + (1−h)(tc + tm)."],
};

const coavmem: Experiment = {
  labId: "coavmem",
  title: "Page replacement and Belady's anomaly",
  aim: "To compare FIFO, LRU and optimal page replacement and to see Belady's anomaly.",
  objectives: ["Count page faults.", "Rank the policies.", "Explain Belady's anomaly."],
  equipment: [eqp("Reference string", "Page numbers along the back; red = fault, green = hit.", "Back"), eqp("Frame stack", "Physical frames in front.", "Front"), eqp("Fault counter", "Red digits.", "Right")],
  steps: [
    eq("p1", "Run the string", "Process all 20 references with FIFO.", "step", "gte", 20),
    eq("p2", "LRU", "Switch to LRU.", "alg", "eq", "lru"),
    eq("p3", "Optimal", "Switch to OPT.", "alg", "eq", "opt"),
    pre("p4", "Belady", "Load the preset 'Belady's anomaly'.", "Belady's anomaly"),
    eq("p5", "Fewer frames", "Set the frames to 3 and compare the faults.", "nf", "eq", 3),
    rst("p6"),
  ],
  questions: [
    num("coavmem-q1", "How many page faults does FIFO give on 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 with 3 frames?", 15, 0, ["Trace the frames reference by reference.", "FIFO evicts the oldest page and faults 15 times."], "The counter shows 15 at step 20.", { marks: 4 }),
    num("coavmem-q2", "How many faults with LRU (3 frames, same string)?", 12, 0, ["LRU keeps recently used pages such as 0.", "12 faults."], "Better than FIFO."),
    num("coavmem-q3", "How many faults with the optimal policy (3 frames)?", 9, 0, ["OPT evicts the page needed farthest in the future.", "9 faults: the minimum possible."], "OPT cannot be built in practice; it is the benchmark."),
    num("coavmem-q4", "On 1 2 3 4 1 2 5 1 2 3 4 5 with FIFO and 4 frames, how many faults?", 10, 0, ["With 3 frames FIFO gives 9.", "With 4 frames it gives 10: more frames, more faults."], "This is Belady's anomaly.", { scenario: "Asha adds a frame to speed up a program and it slows down." }),
    tf("coavmem-q5", "LRU can suffer from Belady's anomaly.", false, ["LRU is a stack algorithm.", "The pages kept with n frames are always a subset of those with n+1."], "Only FIFO-like policies show the anomaly."),
    mcq("coavmem-q6", "A page fault occurs when", ["the page is not in a frame", "the frame is dirty", "the CPU is idle", "the cache misses"], 0, ["The page table entry says the page is not resident.", "The OS must load it."], "A cache miss is a different event."),
  ],
  summary: ["A page fault means the page is not in a frame.", "OPT ≤ LRU ≤ FIFO on typical strings.", "FIFO can show Belady's anomaly."],
};

const jdispatch: Experiment = {
  labId: "jdispatch",
  title: "Dynamic method dispatch",
  aim: "To predict which overridden method runs and when the compiler rejects a call.",
  objectives: ["Separate compile-time and run-time checks.", "Follow the lookup chain.", "Explain overriding vs overloading."],
  equipment: [eqp("Class blocks", "Animal at the base, Dog and Cat above, Puppy on Dog.", "Centre"), eqp("Method bricks", "Orange bricks are methods a class defines.", "Front of each block"), eqp("Gold packet", "Climbs the chain from the object's class.", "Right of the blocks")],
  steps: [
    eq("j1", "Animal a = new Dog()", "The lab starts with a speak() call through an Animal reference on a Dog.", "obj", "eq", "Dog"),
    eq("j2", "Use a Puppy", "Create a Puppy object.", "obj", "eq", "Puppy"),
    eq("j3", "Call eat()", "Change the method slider to 1.", "mi", "gte", 1),
    eq("j4", "Call fetch()", "Change the method slider to 2 and see the compile error.", "mi", "gte", 2),
    eq("j5", "Use a Dog reference", "Choose the Dog reference type.", "ref", "eq", "Dog"),
    rst("j6"),
  ],
  questions: [
    mcq("jdispatch-q1", "Animal a = new Dog(); a.speak(); runs", ["Animal.speak()", "Dog.speak()", "a compile error", "both"], 1, ["The reference is Animal but the object is a Dog.", "The JVM picks the overridden method at run time."], "That is dynamic method dispatch.", { scenario: "Dog overrides speak() and prints Woof." }),
    tf("jdispatch-q2", "Overloaded methods are chosen at run time from the object's class.", false, ["Overloading is resolved by the compiler from the argument types.", "Overriding is resolved at run time."], "Compile-time vs run-time polymorphism.", { commonMistake: "Swapping the two." }),
    num("jdispatch-q3", "For Animal a = new Puppy(); a.speak(), how many classes does the JVM look at (Puppy first) before it finds speak()?", 2, 0, ["Puppy does not define speak().", "The search goes to Dog, which does: two classes."], "Inherited methods are found higher in the chain.", { hint: "Choose Puppy and read the run-time search." }),
    mcq("jdispatch-q4", "Animal a = new Dog(); a.fetch(); gives", ["Dog fetches", "a compile error: cannot find symbol", "a run-time error", "nothing"], 1, ["fetch() is not defined in Animal.", "The compiler checks the reference type."], "Cast to Dog first: ((Dog) a).fetch()."),
    num("jdispatch-q5", "How many classes are in the inheritance chain of Puppy (including Puppy and Animal)?", 3, 0, ["Puppy extends Dog extends Animal.", "Three classes."], "Every class also extends Object."),
    tf("jdispatch-q6", "A reference of a parent type can hold an object of a child type.", true, ["A Dog is an Animal.", "So the assignment is allowed."], "The reverse needs a cast."),
  ],
  summary: ["The compiler checks the reference type; the JVM chooses the method from the object's class.", "A subclass may override; the lookup climbs the chain.", "Overloading is compile-time, overriding run-time."],
};

const jthread: Experiment = {
  labId: "jthread",
  title: "Thread life cycle and race conditions",
  aim: "To follow thread states and to see how synchronized prevents lost updates.",
  objectives: ["Name the thread states.", "Explain a race condition.", "Fix it with synchronized."],
  equipment: [eqp("State platforms", "Seven platforms; the active one glows.", "Life view"), eqp("White token", "Hops between states.", "Life view"), eqp("Green and red bars", "Expected and actual counter.", "Race view")],
  steps: [
    eq("t1", "Walk the life cycle", "Step to 11, the end of the thread's life.", "step", "gte", 11),
    eq("t2", "Race view", "Switch to the race experiment.", "view", "eq", "race"),
    eq("t3", "Break counter++", "Set the switch interval to 2 or less and see lost updates.", "q", "eq", 2),
    eq("t4", "Synchronize", "Tick synchronized.", "sync", "eq", true),
    rst("t5"),
  ],
  questions: [
    mcq("jthread-q1", "After t.start() a thread is in the state", ["NEW", "RUNNABLE", "TERMINATED", "BLOCKED"], 1, ["start() makes it ready to run.", "The scheduler later makes it RUNNING."], "NEW is before start()."),
    num("jthread-q2", "Two threads each add 1 ten times to a shared counter with switching every 2 micro-steps and no lock. How many updates are lost?", 10, 0, ["Each increment is load, add, store.", "A switch inside it makes the other thread overwrite the result.", "With this schedule the counter ends at 10 instead of 20, so 10 updates are lost."], "Read the lost-updates readout.", { marks: 4, scenario: "The counter should reach 20." }),
    num("jthread-q3", "With synchronized, what is the final counter value?", 20, 0, ["Only one thread can be inside the three steps.", "So every update counts: 2 × 10 = 20."], "The lock serialises the critical section."),
    tf("jthread-q4", "A TERMINATED thread can be started again with start().", false, ["Its run() has finished.", "Calling start() again throws IllegalThreadStateException."], "Create a new Thread object instead."),
    num("jthread-q5", "How many steps of the story until the thread is TERMINATED (the last step number)?", 11, 0, ["The walk-through has steps 0 to 11.", "Step 11 is TERMINATED."], "Read the Step readout."),
    mcq("jthread-q6", "wait() makes a thread", ["release the lock and wait for notify()", "hold the lock and sleep", "terminate", "raise its priority"], 0, ["wait() must be called inside synchronized code.", "It releases the monitor so others can proceed."], "sleep() keeps any locks."),
  ],
  summary: ["Threads go NEW, RUNNABLE, RUNNING, (WAITING/BLOCKED), TERMINATED.", "counter++ is not atomic.", "synchronized makes the critical section indivisible."],
};

export const BCAX_EXPERIMENTS: Record<string, Experiment> = { dlqm, addsub, ffconv, counters, hazard, dsstack, dsbst, dsavl, dsgraph, dshash, coabooth, coacache, coavmem, jdispatch, jthread };
