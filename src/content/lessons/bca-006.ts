import type { Lesson } from "./types";

const asym: Lesson = {
  intro: "Asymptotic notation is the language we use to say how fast an algorithm's cost grows as the input gets large, ignoring machine speed and small constants. Every Data Structures paper asks for the definitions of O, Ω and Θ with a proof for a small polynomial. You will learn the three definitions, how to find the constants c and n₀, and the usual order of growth.",
  sections: [
    { h: "Why we need it", p: ["Running time in seconds depends on the computer, the compiler and the input. We instead count basic steps as a function f(n) of the input size n, and we only care how f(n) behaves when n becomes very large.", "For large n the highest-order term dominates: in 3n² + 2n + 5 the n² term wins, and the constant 3 only depends on how we count steps. So we describe f(n) by its growth class."] },
    { h: "Big-O, Omega and Theta", p: ["Big-O (upper bound, used for worst case): f(n) = O(g(n)) if there are positive constants c and n₀ such that f(n) ≤ c·g(n) for all n ≥ n₀.", "Omega (lower bound, used for best case): f(n) = Ω(g(n)) if f(n) ≥ c·g(n) for all n ≥ n₀.", "Theta (tight bound): f(n) = Θ(g(n)) if f(n) is both O(g(n)) and Ω(g(n)). Equivalently there are c₁, c₂, n₀ with c₁·g(n) ≤ f(n) ≤ c₂·g(n) for n ≥ n₀.", "Big-O says 'grows no faster than', Ω says 'grows at least as fast as', Θ says 'grows exactly like'. Do not confuse the notation with the case: you can give an O bound for the best case too, but O is most often quoted for the worst case."], formula: ["f(n) = O(g(n)):  f(n) ≤ c·g(n) for all n ≥ n₀", "f(n) = Ω(g(n)):  f(n) ≥ c·g(n) for all n ≥ n₀", "f(n) = Θ(g(n)):  c₁·g(n) ≤ f(n) ≤ c₂·g(n) for all n ≥ n₀"] },
    { h: "Order of growth", p: ["From slowest to fastest growth: 1 < log n < √n < n < n log n < n² < n³ < 2ⁿ < n!. Binary search is O(log n), a single loop is O(n), merge sort is O(n log n), two nested loops are O(n²), and trying all subsets is O(2ⁿ).", "Rules: drop constants (O(5n) = O(n)), drop lower terms (O(n² + n) = O(n²)), and when two parts run one after the other keep the larger one."] },
  ],
  examples: [
    { q: "Show that f(n) = 3n² + 2n + 5 is O(n²), Ω(n²) and hence Θ(n²).", steps: ["Upper bound: for n ≥ 1 we have 2n ≤ 2n² and 5 ≤ 5n². So f(n) ≤ 3n² + 2n² + 5n² = 10n².", "So f(n) ≤ 10·n² for all n ≥ 1. Take c = 10, n₀ = 1. Hence f(n) = O(n²).", "Lower bound: f(n) = 3n² + 2n + 5 ≥ 3n² for all n ≥ 1. Take c = 3, n₀ = 1. Hence f(n) = Ω(n²).", "Both hold, so 3n² ≤ f(n) ≤ 10n² for n ≥ 1, so f(n) = Θ(n²)."], ans: "f(n) = Θ(n²) with c₁ = 3, c₂ = 10, n₀ = 1" },
    { q: "Is 2<sup>n+1</sup> = O(2<sup>n</sup>)? Is n² = O(n)?", steps: ["2<sup>n+1</sup> = 2 · 2<sup>n</sup>. Take c = 2, n₀ = 1: 2<sup>n+1</sup> ≤ 2 · 2<sup>n</sup>. So yes.", "Suppose n² ≤ c·n for all n ≥ n₀. Dividing by n gives n ≤ c, which fails for n > c. No constant works.", "So n² is not O(n), although n is O(n²)."], ans: "2<sup>n+1</sup> = O(2<sup>n</sup>) is true; n² = O(n) is false" },
    { q: "Arrange in increasing order of growth: n log n, 2ⁿ, n², log n, n, n³.", steps: ["Logarithm grows slowest: log n.", "Then linear n, then n log n (a little above n).", "Then polynomials n² and n³.", "Exponential 2ⁿ beats any polynomial for large n."], ans: "log n < n < n log n < n² < n³ < 2ⁿ" },
  ],
  mistakes: ["Writing f(n) ≤ c·g(n) without saying 'for all n ≥ n₀'. The definition holds only from some point onwards.", "Saying O(n²) means exactly n². It is only an upper bound; use Θ for a tight bound.", "Keeping constants and lower terms, e.g. answering O(3n² + 2n). The answer is O(n²).", "Mixing up the cases and the notations: best/worst/average case is a property of the input, O/Ω/Θ is a property of the function.", "Using the same constant c for O and Ω in a Θ proof. Use c₁ and c₂."],
  check: [
    { q: "f(n) = 5n + 20 is", o: ["O(1)", "Θ(n)", "Θ(n²)", "Ω(n²)"], a: 1, why: "5n ≤ 5n + 20 ≤ 25n for n ≥ 1, so it is bounded above and below by n." },
    { q: "Which notation gives a lower bound?", o: ["O", "Ω", "Θ", "o"], a: 1, why: "Ω(g) means f grows at least as fast as g." },
    { q: "Which grows fastest?", o: ["n³", "n log n", "2ⁿ", "n²"], a: 2, why: "Exponential growth eventually beats every polynomial." },
    { q: "Two loops run one after the other, taking O(n²) and O(n). The total is", o: ["O(n³)", "O(n²)", "O(n)", "O(n² + n) written as O(n)"], a: 1, why: "Sequential costs add and the larger term dominates, so O(n²)." },
  ],
  lab: { id: "dsbigo", label: "Open the Big-O lab" },
};

const complexity: Lesson = {
  intro: "Time complexity counts how many basic operations an algorithm performs, and space complexity counts how much extra memory it needs, both as functions of the input size n. The exam usually gives you a piece of code with nested loops and asks for its complexity. You will learn a quick method for single, nested, dependent and logarithmic loops, and how to count space.",
  sections: [
    { h: "What we count", p: ["Time complexity T(n) is the number of basic steps (comparisons, assignments, arithmetic) for input size n. We analyse the worst case unless asked otherwise, because it is a guarantee.", "Space complexity S(n) is the extra memory beyond the input: variables, temporary arrays and the recursion stack. An in-place sort has S = O(1) extra space, merge sort needs O(n)."] },
    { h: "Counting loops", p: ["A loop that runs n times with constant work inside is O(n). Statements outside the loop add only a constant.", "Nested independent loops multiply: for i = 1..n and for j = 1..n gives n × n = O(n²).", "A dependent inner loop must be summed: if j runs from 1 to i, the work is 1 + 2 + … + n = n(n + 1)/2 = O(n²).", "If the loop variable is multiplied or divided each time (i = 1, 2, 4, 8, … or i = n, n/2, n/4, …) the loop runs about log₂ n times, so it is O(log n)."], formula: ["for (i = 1; i <= n; i++) { ... }               -> n times, O(n)", "for (i = 1; i <= n; i++) for (j = 1; j <= n; j++)   -> n², O(n²)", "for (i = 1; i <= n; i++) for (j = 1; j <= i; j++)   -> n(n+1)/2, O(n²)", "for (i = 1; i < n; i = i * 2) { ... }          -> floor(log2 n)+1 times, O(log n)"] },
    { h: "Space and recursion", p: ["Iterative sum of n numbers uses a few variables, so S(n) = O(1). A recursive version sum(n) = n + sum(n − 1) keeps n frames on the call stack, so S(n) = O(n) although T(n) is also O(n).", "Space-time trade-off: spending more memory can reduce time (a lookup table or hash table), and saving memory usually costs time (recomputing values)."] },
  ],
  examples: [
    { q: "Find the time complexity of: for (i = 1; i <= n; i++) for (j = 1; j <= n; j = j * 2) count++;", steps: ["Outer loop runs n times.", "For each i, j takes values 1, 2, 4, …, so it runs about log₂ n times.", "Total = n × log₂ n."], ans: "O(n log n)" },
    { q: "Find the number of times count++ executes in: for (i = 1; i <= n; i++) for (j = 1; j <= i; j++) count++; Then give the complexity.", steps: ["For i = 1 the inner loop runs 1 time, for i = 2 it runs 2 times, … for i = n it runs n times.", "Total = 1 + 2 + … + n = n(n + 1)/2.", "n(n + 1)/2 = n²/2 + n/2, drop constant and lower term."], ans: "n(n + 1)/2 times, so O(n²)" },
    { q: "Compare the space needed by the iterative and recursive sum of the first n natural numbers.", steps: ["Iterative: one variable for the sum and one for the counter, S(n) = O(1).", "Recursive sum(n) calls sum(n − 1) until sum(0), so n + 1 frames are alive at the deepest point.", "Each frame holds a constant amount, so total stack space is proportional to n."], ans: "Iterative O(1); recursive O(n). Time is O(n) for both." },
  ],
  mistakes: ["Calling every nested loop O(n²). If the inner loop doubles its variable it is only O(log n).", "Forgetting to sum a dependent inner loop; the answer is n(n + 1)/2, not n.", "Ignoring the recursion stack when stating space complexity.", "Giving the exact count with constants (e.g. 3n + 2) instead of the asymptotic class.", "Treating two sequential loops as multiplied. Sequential parts add."],
  check: [
    { q: "for (i = n; i >= 1; i = i / 2) count++; runs in", o: ["O(n)", "O(log n)", "O(n²)", "O(1)"], a: 1, why: "The variable is halved each time, so about log₂ n iterations." },
    { q: "Recursive factorial of n uses stack space", o: ["O(1)", "O(log n)", "O(n)", "O(n²)"], a: 2, why: "There are n pending calls at the deepest level." },
    { q: "Total work 1 + 2 + 3 + … + n equals", o: ["n", "n²", "n(n + 1)/2", "2n"], a: 2, why: "Sum of the first n natural numbers." },
    { q: "Space complexity measures", o: ["running time", "extra memory used", "the number of lines of code", "input size"], a: 1, why: "It counts the memory the algorithm needs beyond the input." },
  ],
  lab: { id: "dsbigo", label: "Open the Big-O lab" },
};

const cqueue: Lesson = {
  intro: "A circular queue fixes the biggest weakness of the simple array queue: after some dequeues the front part of the array is wasted even though the queue looks full. By letting the indices wrap around with the modulus operator, the whole array is reused. This is a regular 10-mark question: you must give the algorithms and handle the full and empty conditions correctly.",
  sections: [
    { h: "The problem with a linear queue", p: ["In an array queue rear moves right on enqueue and front moves right on dequeue. When rear reaches the last index the queue reports 'full' even if cells at the beginning are free, because front has moved ahead.", "A circular queue treats the array as a ring. After the last index N − 1 comes index 0 again."] },
    { h: "Index wrapping and the two conditions", p: ["Move an index forward with i = (i + 1) % N. This wraps N − 1 to 0 automatically.", "Start with front = −1 and rear = −1 for an empty queue.", "Full: (rear + 1) % N == front. Empty: front == −1. With this convention all N cells can be used."], formula: ["next(i) = (i + 1) % N", "Empty:  front == -1", "Full:   (rear + 1) % N == front", "Number of elements = (rear - front + N) % N + 1  (when not empty)"] },
    { h: "Enqueue and dequeue algorithms", p: ["Enqueue(x): if the queue is full print overflow and stop. If it is empty set front = rear = 0, otherwise rear = (rear + 1) % N. Then a[rear] = x.", "Dequeue(): if empty print underflow and stop. Take x = a[front]. If front == rear the queue had one element, so set front = rear = −1. Otherwise front = (front + 1) % N. Return x."], formula: ["Enqueue(x):", "  if ((rear + 1) % N == front) overflow", "  else { if (front == -1) front = rear = 0; else rear = (rear + 1) % N;", "         a[rear] = x; }", "Dequeue():", "  if (front == -1) underflow", "  else { x = a[front]; if (front == rear) front = rear = -1;", "         else front = (front + 1) % N; return x; }"] },
  ],
  examples: [
    { q: "A circular queue has N = 5 cells. Show front and rear after: enqueue 10, 20, 30, 40, 50; dequeue twice; enqueue 60; enqueue 70.", steps: ["Enqueue 10: front = rear = 0. Then 20, 30, 40, 50 put rear at 1, 2, 3, 4. Queue 10 20 30 40 50, front = 0, rear = 4. Full because (4 + 1) % 5 = 0 = front.", "Dequeue twice removes 10 and 20: front = 2, rear = 4.", "Enqueue 60: (4 + 1) % 5 = 0 is not equal to front (2), so rear = 0 and a[0] = 60.", "Enqueue 70: rear = 1 and a[1] = 70. Now (1 + 1) % 5 = 2 = front, so the queue is full."], ans: "Queue from front: 30 40 50 60 70; front = 2, rear = 1; full" },
    { q: "In a circular queue with N = 8, front = 6 and rear = 1. How many elements are stored?", steps: ["Use (rear − front + N) % N + 1.", "(1 − 6 + 8) % 8 + 1 = 3 + 1 = 4.", "Check by listing: cells 6, 7, 0, 1 hold the elements."], ans: "4 elements" },
  ],
  mistakes: ["Using rear + 1 instead of (rear + 1) % N, so the index runs off the array.", "Testing full as rear == N − 1, which is the linear queue condition.", "Forgetting to reset front and rear to −1 when the last element is removed, so the empty queue looks non-empty.", "Confusing the full and empty condition when the convention uses front == rear for both. State clearly which convention you use.", "Dequeuing without checking underflow first."],
  check: [
    { q: "With N = 6 and rear = 5, the next rear after an enqueue is", o: ["6", "0", "5", "1"], a: 1, why: "(5 + 1) % 6 = 0, the index wraps." },
    { q: "In the front = −1 convention, the queue is full when", o: ["front == −1", "rear == N − 1", "(rear + 1) % N == front", "front == rear"], a: 2, why: "The next position of rear would collide with front." },
    { q: "The main advantage of a circular queue is", o: ["faster search", "reuse of freed cells", "no need for indices", "sorted order"], a: 1, why: "Wrapping around reuses the space left by dequeued elements." },
    { q: "The time to enqueue or dequeue in a circular queue is", o: ["O(1)", "O(n)", "O(log n)", "O(n²)"], a: 0, why: "Only index arithmetic and one array access are done." },
  ],
  lab: { id: "dsstack", label: "Open the stack and queue lab" },
};

const addrcalc: Lesson = {
  intro: "An array lives in consecutive memory cells, so the address of any element can be calculated with a formula instead of searching. Address calculation is an easy numerical in the paper if you remember the three formulas and the lower bounds. You will learn 1-D, 2-D row-major and 2-D column-major addressing.",
  sections: [
    { h: "One dimensional array", p: ["Let B be the base address (address of the first element), w the size of one element in bytes and LB the lower bound of the index (0 in C and Java, but it can be 1 or any value in exam questions).", "The element A[i] is i − LB cells after the first, so its address is B + w·(i − LB)."], formula: ["LOC(A[i]) = B + w × (i − LB)"] },
    { h: "Two dimensional array", p: ["A matrix with m rows and n columns is stored in a line. Row-major order (C, Java) stores row 0 fully, then row 1, and so on. Column-major order (Fortran) stores column 0 fully, then column 1.", "Let the row bounds start at LBr and column bounds at LBc. Then before A[i][j] in row-major there are (i − LBr) full rows of n cells plus (j − LBc) cells of the current row.", "In column-major the elements before it are (j − LBc) full columns of m cells plus (i − LBr) cells of the current column."], formula: ["Row-major:     LOC(A[i][j]) = B + w × [ (i - LBr) × n + (j - LBc) ]", "Column-major:  LOC(A[i][j]) = B + w × [ (j - LBc) × m + (i - LBr) ]", "m = number of rows, n = number of columns"] },
    { h: "Getting m and n from the bounds", p: ["If the declaration is A[l1..u1][l2..u2] then m = u1 − l1 + 1 and n = u2 − l2 + 1. A declaration like int a[4][5] in C means 4 rows, 5 columns, bounds start at 0."] },
  ],
  examples: [
    { q: "An array A = [2, 4, 6, 8, 10] is stored with base address 1000 and each integer takes 4 bytes. Find the address of the elements 8 and 10 and the address of A[5] if it existed.", steps: ["Lower bound is 0 for a C/Java style array, so LOC(A[i]) = 1000 + 4i.", "Element 8 is A[3]: 1000 + 4 × 3 = 1012.", "Element 10 is A[4]: 1000 + 16 = 1016.", "A[5] would be at 1020, the first address after the array."], ans: "8 at 1012, 10 at 1016" },
    { q: "An array int A[4][5] is stored from base address 2000 with 2 bytes per element. Find the address of A[2][3] in row-major and column-major order.", steps: ["m = 4, n = 5, LB = 0, w = 2.", "Row-major: 2000 + 2 × (2 × 5 + 3) = 2000 + 2 × 13 = 2026.", "Column-major: 2000 + 2 × (3 × 4 + 2) = 2000 + 2 × 14 = 2028."], ans: "Row-major 2026, column-major 2028" },
    { q: "An array A[1..10][1..20] has base address 1000 and element size 4 bytes. Find the address of A[5][8] in row-major and column-major order.", steps: ["m = 10, n = 20, LBr = LBc = 1.", "Row-major: 1000 + 4 × [(5 − 1) × 20 + (8 − 1)] = 1000 + 4 × 87 = 1348.", "Column-major: 1000 + 4 × [(8 − 1) × 10 + (5 − 1)] = 1000 + 4 × 74 = 1296."], ans: "Row-major 1348, column-major 1296" },
  ],
  mistakes: ["Forgetting to subtract the lower bound when the array starts at 1.", "Using the number of rows where the number of columns is needed (row-major uses n, column-major uses m).", "Forgetting to multiply by the element size w.", "Using the upper bound instead of the count: n = u − l + 1, not u − l.", "Writing the address of A[i] as B + i when w is not 1."],
  check: [
    { q: "A[0..9], base 500, w = 2. The address of A[6] is", o: ["506", "512", "514", "510"], a: 1, why: "500 + 2 × 6 = 512." },
    { q: "For row-major storage of an array with n columns, the offset of A[i][j] (bounds from 0) is", o: ["i × n + j", "j × n + i", "i + j", "i × j"], a: 0, why: "i full rows of n cells, then j cells." },
    { q: "int A[3][4] from 100, w = 4, row-major. Address of A[2][1] is", o: ["132", "144", "136", "148"], a: 1, why: "100 + 4 × (2 × 4 + 1) = 100 + 36 = 136." },
    { q: "In C and Java a 2-D array is stored in", o: ["column-major order", "row-major order", "diagonal order", "random order"], a: 1, why: "Rows are laid out one after the other." },
  ],
  lab: { id: "dsarray", label: "Open the array address lab" },
};

const bstins: Lesson = {
  intro: "A Binary Search Tree keeps keys ordered so that search, insertion and deletion take time proportional to the height of the tree. The standard question gives a list of keys and asks you to build the BST and write its traversals. You will learn the BST rule, insertion, search, the three deletion cases and how traversals read the tree.",
  sections: [
    { h: "The BST property", p: ["A binary tree where for every node, all keys in its left subtree are smaller and all keys in its right subtree are larger. Duplicates are normally not allowed.", "The first key inserted becomes the root. The shape of the tree depends on the insertion order: sorted input gives a skewed tree of height n, a good order gives height about log n."] },
    { h: "Insertion and search", p: ["To insert or search a key k, start at the root. If k is smaller than the node go left, if larger go right. Search stops when the key is found; insert places the new node at the empty spot where the search fell off the tree.", "Cost is O(h), where h is the height: O(log n) for a balanced tree and O(n) for a skewed one."], formula: ["insert(root, k):", "  if root == NULL return newNode(k)", "  if k < root->key  root->left  = insert(root->left, k)", "  else if k > root->key  root->right = insert(root->right, k)", "  return root", "search(root, k): if root == NULL or root->key == k return root;", "  if k < root->key return search(root->left, k) else return search(root->right, k)"] },
    { h: "Deletion: three cases", p: ["Case 1, leaf: simply remove it.", "Case 2, one child: replace the node by its only child.", "Case 3, two children: replace the node's key by its inorder successor (smallest key in the right subtree) or inorder predecessor (largest in the left subtree), then delete that successor node, which has at most one child.", "Inorder traversal (Left, Root, Right) of a BST gives the keys in sorted order. Preorder is Root, Left, Right and postorder is Left, Right, Root."] },
  ],
  examples: [
    { q: "Insert the keys 15, 10, 20, 8, 12, 17, 25 into an empty BST. Draw it and give all three traversals.", steps: ["15 is the root. 10 < 15 goes left. 20 > 15 goes right.", "8 < 15, < 10: left child of 10. 12 < 15, > 10: right child of 10.", "17 > 15, < 20: left child of 20. 25 > 15, > 20: right child of 20.", "The tree is full: 15 has children 10 and 20; 10 has 8 and 12; 20 has 17 and 25.", "Inorder: 8 10 12 15 17 20 25. Preorder: 15 10 8 12 20 17 25. Postorder: 8 12 10 17 25 20 15."], ans: "Height 2. Inorder 8 10 12 15 17 20 25 (sorted)" },
    { q: "In the tree above delete 10 (two children) and then delete 25 (leaf).", steps: ["Node 10 has children 8 and 12. Inorder successor = smallest in right subtree = 12.", "Copy 12 into the node. Delete the old node 12 (a leaf). Now 15 has left child 12 which has left child 8.", "Delete 25: it is a leaf, so cut it from 20. Node 20 keeps only the left child 17.", "Inorder of the result: 8 12 15 17 20, still sorted."], ans: "Final inorder: 8 12 15 17 20" },
    { q: "Build a BST from 10, 20, 30, 40. What is its height and why is it bad?", steps: ["10 is the root. 20 goes right of 10. 30 goes right of 20. 40 goes right of 30.", "Every node has only a right child: a chain of 4 nodes, height 3.", "Search for 40 needs 4 comparisons, so O(n)."], ans: "Skewed tree, height n − 1; this is why AVL trees are needed" },
  ],
  mistakes: ["Placing a new key in the first free spot found instead of following the smaller-left, larger-right path from the root.", "Writing inorder as Root, Left, Right. Inorder is Left, Root, Right.", "In two-child deletion, using any successor. It must be the inorder successor or predecessor, so order is kept.", "Forgetting that the traversal of a BST depends on the shape, so insertion order matters.", "Claiming search is always O(log n). A skewed BST gives O(n)."],
  check: [
    { q: "Inorder traversal of a BST visits keys in", o: ["random order", "sorted ascending order", "descending order only", "level order"], a: 1, why: "Left subtree < root < right subtree at every node." },
    { q: "Deleting a node with two children is done by replacing it with", o: ["its parent", "its inorder successor", "the root", "its left child only"], a: 1, why: "The smallest key of the right subtree keeps the BST property." },
    { q: "Keys 5, 3, 8, 1 are inserted. The preorder traversal is", o: ["5 3 1 8", "1 3 5 8", "5 8 3 1", "1 3 8 5"], a: 0, why: "Root 5, left subtree 3 with child 1, then right subtree 8." },
    { q: "Worst-case search time in a BST with n nodes is", o: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], a: 2, why: "A skewed tree is a linked list." },
  ],
  lab: { id: "dsbst", label: "Open the BST lab" },
};

const avl: Lesson = {
  intro: "An AVL tree is a BST that rebalances itself after each insertion so its height stays O(log n). It is a 10-mark question almost every year: explain balance factors, name the four rotations and show them on a sequence of keys. You will learn how to find the unbalanced node and choose the correct rotation without guessing.",
  sections: [
    { h: "Balance factor", p: ["For every node, balance factor BF = height(left subtree) − height(right subtree). The height of an empty tree is −1 (or count nodes; be consistent).", "A BST is an AVL tree if every node has BF equal to −1, 0 or +1. If any node reaches +2 or −2 after an insertion, we rotate."] },
    { h: "Four cases and the rotations", p: ["Find the lowest unbalanced node z on the path from the new node up to the root. Look at the two links from z towards the new key.", "LL case (BF = +2, left child is left heavy): inserted in left subtree of left child. Fix with a single right rotation at z.", "RR case (BF = −2, right child is right heavy): fix with a single left rotation at z.", "LR case (BF = +2 but the left child is right heavy): first left rotate the left child, then right rotate z.", "RL case (BF = −2 but the right child is left heavy): first right rotate the right child, then left rotate z.", "After one correct (single or double) rotation the subtree has its old height again, so the rest of the tree is balanced."], formula: ["BF(node) = h(left) - h(right),  allowed: -1, 0, +1", "LL: BF(z) = +2, BF(left) = +1   -> right rotation at z", "RR: BF(z) = -2, BF(right) = -1  -> left rotation at z", "LR: BF(z) = +2, BF(left) = -1   -> left at child, right at z", "RL: BF(z) = -2, BF(right) = +1  -> right at child, left at z"] },
    { h: "Why AVL is worth it", p: ["An AVL tree with n nodes has height at most about 1.44 log₂ n, so search, insert and delete are all O(log n) in the worst case, unlike a plain BST. The cost is storing a balance factor and doing rotations."] },
  ],
  examples: [
    { q: "Insert 10, 20, 30 into an empty AVL tree.", steps: ["After 10 and 20 the tree is 10 with right child 20, BF(10) = −1, fine.", "Insert 30: it goes right of 20. Now BF(10) = −2 and its right child 20 has BF = −1. This is the RR case.", "Left rotation at 10: 20 becomes the root with left child 10 and right child 30."], ans: "20 is the root, 10 left, 30 right (all BF = 0)" },
    { q: "Insert 30, 10, 20 into an empty AVL tree.", steps: ["30 root, 10 left of 30. Insert 20: it goes left of 30, then right of 10.", "BF(30) = +2, its left child 10 has BF = −1. This is the LR case.", "Left rotate at 10: 20 becomes the left child of 30 with 10 as its left child. Then right rotate at 30: 20 becomes the root."], ans: "20 root, 10 left, 30 right" },
    { q: "Insert 10, 20, 30, 40, 50, 25 in this order and show the final AVL tree.", steps: ["10, 20, 30 gives 20(10, 30) as in the RR case.", "Insert 40: right of 30. Insert 50: right of 40, so BF(30) = −2: RR, left rotate at 30. Now 20(10, 40(30, 50)).", "Insert 25: 20 -> right 40 -> left 30 -> left 25. BF(30) = +1, BF(40) = +1 and BF(20) = −2. The lowest unbalanced node is 20; its right child 40 is left heavy, so this is the RL case.", "Right rotate at 40: 30 becomes the subtree root with left child 25 and right child 40 (which keeps 50). Then left rotate at 20.", "Result: root 30, left child 20 (with children 10 and 25), right child 40 (with right child 50)."], ans: "30(20(10, 25), 40(-, 50)), every BF within ±1" },
  ],
  mistakes: ["Rotating at the new node or its parent instead of at the lowest unbalanced node.", "Using a single rotation for a zig-zag case (LR, RL). Zig-zag needs a double rotation.", "Computing BF as right − left on some nodes and left − right on others.", "Forgetting to update heights after a rotation, so the next insertion looks wrong.", "Thinking AVL deletion never needs rotations. It may need several."],
  check: [
    { q: "BF(z) = −2 and BF(right child) = +1. The fix is", o: ["single left rotation", "single right rotation", "right then left rotation", "left then right rotation"], a: 2, why: "That is the RL case: right rotate the child, then left rotate z." },
    { q: "Allowed balance factors in an AVL tree are", o: ["0 only", "−1, 0, 1", "−2 to 2", "any value"], a: 1, why: "Heights of the two subtrees differ by at most one." },
    { q: "Inserting 1, 2, 3 into an empty AVL tree needs", o: ["a right rotation", "a left rotation", "an LR double rotation", "no rotation"], a: 1, why: "RR case; 2 becomes the root." },
    { q: "Worst-case height of an AVL tree with n nodes is", o: ["O(n)", "O(log n)", "O(1)", "O(n log n)"], a: 1, why: "The balance condition keeps the height logarithmic." },
  ],
  lab: { id: "dsavl", label: "Open the AVL lab" },
};

const adjmat: Lesson = {
  intro: "A graph must be stored in memory before any algorithm can run on it. The two standard ways are the adjacency matrix and the adjacency list, and the exam asks you to draw both for a small graph and to compare them. You will learn how to fill the matrix for directed and undirected graphs, read degrees from it, and choose the right representation.",
  sections: [
    { h: "Graph basics you need", p: ["A graph G = (V, E) is a set of vertices V and edges E. In an undirected graph an edge {u, v} has no direction; in a directed graph (digraph) an edge (u, v) goes from u to v. The degree of a vertex is the number of edges at it; for digraphs we have in-degree and out-degree."] },
    { h: "Adjacency matrix", p: ["For n vertices use an n × n matrix M. M[i][j] = 1 if there is an edge from i to j, else 0. (For weighted graphs store the weight and use a special value like 0 or infinity for no edge.)", "For an undirected graph the matrix is symmetric, M[i][j] = M[j][i], and the sum of row i is the degree of i. For a digraph the row sum is the out-degree and the column sum is the in-degree.", "The matrix needs n² cells whatever the number of edges. Checking an edge is O(1), but listing the neighbours of a vertex takes O(n). The number of paths of length k from i to j is the entry (i, j) of M<sup>k</sup>."] },
    { h: "Adjacency list and the comparison", p: ["An adjacency list keeps, for each vertex, a linked list of its neighbours. It needs O(V + E) space and listing neighbours of v costs O(degree of v), but testing an edge costs O(degree).", "Choose the matrix for dense graphs (E close to V²) or when edge tests dominate. Choose the list for sparse graphs, which most real graphs are, and for traversals like BFS and DFS in O(V + E)."], formula: ["Matrix space: O(V²)    List space: O(V + E)", "Edge test:  matrix O(1)    list O(degree)", "List all neighbours: matrix O(V)    list O(degree)", "Undirected graph: sum of degrees = 2E"] },
  ],
  examples: [
    { q: "Draw the adjacency matrix and adjacency list of the undirected graph with vertices A, B, C, D and edges A-B, A-C, B-C, C-D.", steps: ["Order the vertices A, B, C, D. Put 1 where an edge exists in both positions.", "Row A: 0 1 1 0. Row B: 1 0 1 0. Row C: 1 1 0 1. Row D: 0 0 1 0.", "Degrees are the row sums: A = 2, B = 2, C = 3, D = 1. Total 8 = 2 × 4 edges, a useful check.", "List: A -> B, C;  B -> A, C;  C -> A, B, D;  D -> C."], ans: "Symmetric 4 × 4 matrix, 8 ones; list has 8 entries" },
    { q: "A digraph has edges 1->2, 2->3, 3->1 and 1->3. Write its matrix and find the number of paths of length 2 from 1 to 3.", steps: ["Matrix rows: 1: [0 1 1]; 2: [0 0 1]; 3: [1 0 0]. It is not symmetric.", "Out-degree of 1 is 2; in-degree of 3 is 2 (from 1 and 2).", "Paths of length 2 from 1 to 3 = (row 1 of M) · (column 3 of M) = 0×1 + 1×1 + 1×0 = 1.", "That path is 1 -> 2 -> 3."], ans: "Exactly one path of length 2: 1-2-3" },
    { q: "A graph has 1000 vertices and 3000 edges. Compare the memory of matrix and list (assume one unit per entry).", steps: ["Matrix: 1000² = 1,000,000 cells.", "List for an undirected graph: about V + 2E = 1000 + 6000 = 7000 entries.", "The graph is sparse, so the list uses far less memory."], ans: "Matrix 1,000,000 units vs list about 7,000 units; use the list" },
  ],
  mistakes: ["Filling only one half of the matrix for an undirected graph.", "Reading the row sum as the degree for a digraph; it is the out-degree only.", "Saying the matrix is better for sparse graphs. It wastes memory there.", "Forgetting that the diagonal is 0 unless there are self-loops.", "Forgetting to state the vertex order used for rows and columns."],
  check: [
    { q: "Space needed for an adjacency matrix of V vertices is", o: ["O(V)", "O(V + E)", "O(V²)", "O(E)"], a: 2, why: "A V × V array." },
    { q: "The adjacency matrix of an undirected graph is", o: ["always upper triangular", "symmetric", "always diagonal", "all ones"], a: 1, why: "An edge appears in both (i, j) and (j, i)." },
    { q: "Sum of all degrees in an undirected graph with E edges is", o: ["E", "2E", "E²", "E/2"], a: 1, why: "Each edge adds one to the degree of each end." },
    { q: "Checking whether edge (u, v) exists is O(1) in", o: ["adjacency matrix", "adjacency list", "both", "neither"], a: 0, why: "Direct index M[u][v]." },
  ],
  lab: { id: "dsgraph", label: "Open the graph lab" },
};

const bfsdfs: Lesson = {
  intro: "Graph traversal means visiting every vertex reachable from a start vertex exactly once. BFS goes level by level using a queue, DFS goes as deep as possible using a stack or recursion. The exam asks for both algorithms and a traversal order for a given graph. You will learn the steps, the order of visiting, and their complexity.",
  sections: [
    { h: "Breadth-First Search (BFS)", p: ["BFS uses a FIFO queue and a visited array. Mark the start visited and enqueue it. While the queue is not empty, dequeue a vertex v, process it, and for each unvisited neighbour mark it visited and enqueue it.", "It visits all vertices at distance 1, then distance 2, and so on, so on an unweighted graph it finds shortest paths in terms of edge count. Applications: shortest path in unweighted graphs, level order, connected components, web crawling."], formula: ["BFS(s): visited[s] = true; enqueue(s)", "  while queue not empty:", "    v = dequeue(); visit(v)", "    for each neighbour w of v: if not visited[w] { visited[w] = true; enqueue(w) }"] },
    { h: "Depth-First Search (DFS)", p: ["DFS follows one path as far as possible, then backtracks. Recursive version: visit v, mark it, and call DFS on each unvisited neighbour. The recursion stack plays the role of an explicit stack.", "Applications: cycle detection, topological sort, finding connected components, solving mazes."], formula: ["DFS(v): visited[v] = true; visit(v)", "  for each neighbour w of v: if not visited[w] DFS(w)"] },
    { h: "Complexity and a note on order", p: ["With an adjacency list both visit each vertex once and look at each edge once (twice if undirected): O(V + E). With an adjacency matrix both cost O(V²) because each vertex scans a full row.", "The visiting order depends on the order in which neighbours are listed. State your rule (for example alphabetical) so the examiner can follow your answer. For a disconnected graph repeat the search from every unvisited vertex."] },
  ],
  examples: [
    { q: "For the undirected graph with edges A-B, A-C, B-D, C-D, D-E, give the BFS and DFS orders from A, taking neighbours in alphabetical order.", steps: ["Adjacency: A: B, C;  B: A, D;  C: A, D;  D: B, C, E;  E: D.", "BFS: queue [A]. Visit A, enqueue B, C. Visit B, enqueue D. Visit C (D already marked). Visit D, enqueue E. Visit E. Order A B C D E.", "DFS: visit A, go to B, from B go to D, from D the unvisited neighbours are C then E. Visit C (its neighbours A and D are visited), return to D, visit E.", "DFS order: A B D C E."], ans: "BFS: A B C D E;  DFS: A B D C E" },
    { q: "Find the shortest path (fewest edges) from A to E in the same graph using BFS.", steps: ["BFS levels: level 0 is A; level 1 is B and C; level 2 is D (reached from B first); level 3 is E.", "Keep a parent array: parent[D] = B, parent[E] = D, parent[B] = A.", "Trace back from E: E <- D <- B <- A."], ans: "A-B-D-E, 3 edges" },
  ],
  mistakes: ["Using a stack for BFS or a queue for DFS.", "Marking a vertex visited when dequeued instead of when enqueued, which puts duplicates in the queue.", "Forgetting the visited array, so cycles cause infinite loops.", "Stating O(V + E) while using an adjacency matrix; it is O(V²) there.", "Not repeating the search for disconnected graphs when all vertices must be visited."],
  check: [
    { q: "BFS uses which data structure?", o: ["Stack", "Queue", "Heap", "Tree"], a: 1, why: "FIFO order gives level-by-level visiting." },
    { q: "BFS or DFS with an adjacency list runs in", o: ["O(V)", "O(V + E)", "O(E²)", "O(V log V)"], a: 1, why: "Each vertex and edge is processed a constant number of times." },
    { q: "Which finds shortest paths in an unweighted graph?", o: ["DFS", "BFS", "Neither", "Both always"], a: 1, why: "BFS reaches vertices in increasing distance." },
    { q: "The recursion in DFS implicitly uses a", o: ["queue", "stack", "hash table", "array of heaps"], a: 1, why: "The call stack stores the path back." },
  ],
  lab: { id: "dsgraph", label: "Open the graph lab" },
};

const mergesort: Lesson = {
  intro: "Merge sort and quick sort are the two divide-and-conquer sorts you must be able to compare. The exam asks for the algorithm, an example run, the time complexities and when each is preferred. You will learn how merging works, how partitioning works, and why merge sort is always O(n log n) while quick sort can degrade to O(n²).",
  sections: [
    { h: "Merge sort", p: ["Divide the array into two halves, sort each half recursively, then merge the two sorted halves. The base case is an array of one element.", "Merge uses two pointers, one on each sorted half, and repeatedly copies the smaller front element into a temporary array. Merging two halves of total length n takes O(n).", "Recurrence T(n) = 2T(n/2) + n gives O(n log n) in best, average and worst cases. It needs O(n) extra space and is stable."], formula: ["mergeSort(a, lo, hi): if lo < hi { mid = (lo + hi) / 2;", "    mergeSort(a, lo, mid); mergeSort(a, mid + 1, hi); merge(a, lo, mid, hi); }", "T(n) = 2 T(n/2) + O(n)  =>  O(n log n)"] },
    { h: "Quick sort", p: ["Pick a pivot, partition so that smaller elements are to its left and larger to its right (the pivot lands in its final place), then sort the two parts recursively. No merge step is needed, the work is in the partition.", "Lomuto partition with the last element as pivot: keep i just before the 'smaller' zone; scan j from lo to hi − 1; if a[j] ≤ pivot, increment i and swap a[i] with a[j]. At the end swap a[i + 1] with the pivot.", "Average and best cases are O(n log n). The worst case O(n²) happens when the pivot is always the smallest or largest element, e.g. a sorted array with the last element as pivot. It sorts in place (O(log n) stack) and is not stable."] },
    { h: "Comparison", p: ["Merge sort: guaranteed O(n log n), stable, extra O(n) space, good for linked lists and external sorting. Quick sort: in place, usually faster in practice thanks to cache behaviour, worst case O(n²), fixed by random or median-of-three pivots."] },
  ],
  examples: [
    { q: "Sort 38, 27, 43, 3, 9, 82, 10 using merge sort and show the splits and merges.", steps: ["Split: [38 27 43 3] and [9 82 10]; then [38 27] [43 3] and [9] [82 10]; then single elements.", "Merge small: [27 38], [3 43], [10 82].", "Merge: [27 38] + [3 43] = [3 27 38 43];  [9] + [10 82] = [9 10 82].", "Final merge: [3 27 38 43] + [9 10 82] = [3 9 10 27 38 43 82]."], ans: "3 9 10 27 38 43 82" },
    { q: "Partition 10, 80, 30, 90, 40, 50, 70 around the last element 70 and give the pivot position.", steps: ["pivot = 70, i = −1. j = 0: 10 ≤ 70, i = 0, swap with itself.", "j = 1: 80 > 70, skip. j = 2: 30 ≤ 70, i = 1, swap a[1] and a[2]: 10 30 80 90 40 50 70.", "j = 3: 90 skip. j = 4: 40 ≤ 70, i = 2, swap a[2], a[4]: 10 30 40 90 80 50 70.", "j = 5: 50 ≤ 70, i = 3, swap a[3], a[5]: 10 30 40 50 80 90 70.", "End: swap a[i + 1] = a[4] with the pivot: 10 30 40 50 70 90 80."], ans: "Array 10 30 40 50 70 90 80; pivot 70 is at index 4" },
  ],
  mistakes: ["Saying quick sort is always O(n log n). The worst case is O(n²).", "Forgetting the extra O(n) array in merge sort.", "Writing the recurrence as T(n) = T(n/2) + n for merge sort; there are two recursive calls.", "Swapping the pivot too early and losing track of its final position.", "Claiming quick sort is stable."],
  check: [
    { q: "Worst-case time of merge sort is", o: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], a: 1, why: "The array is always halved and merging is linear." },
    { q: "Quick sort degrades to O(n²) when", o: ["the array is random", "the pivot is always the smallest or largest", "n is small", "the array has duplicates only once"], a: 1, why: "The partitions are of size 0 and n − 1." },
    { q: "Which is stable?", o: ["Quick sort", "Merge sort", "Both", "Neither"], a: 1, why: "Merge keeps equal elements in order if it takes from the left half first." },
    { q: "Merge sort needs extra space of", o: ["O(1)", "O(log n)", "O(n)", "O(n²)"], a: 2, why: "A temporary array holds the merged halves." },
  ],
  lab: { id: "dsmerge", label: "Open the merge sort lab" },
};

const hashing: Lesson = {
  intro: "Hashing stores and finds a key in nearly constant time by computing its position from the key itself. The difficulty is collisions, when two keys want the same slot. The exam asks what hashing is, common hash functions, and collision resolution by chaining and by open addressing with an example. You will learn each method and trace it on keys.",
  sections: [
    { h: "Hash table and hash function", p: ["A hash table is an array of m slots. A hash function h(k) maps a key k to an index from 0 to m − 1. Search, insert and delete take O(1) on average.", "Division method: h(k) = k mod m (choose m prime and not close to a power of 2). Mid-square: square the key and take the middle digits. Folding: split the key into parts and add them. A good function is fast and spreads keys evenly.", "Load factor λ = n / m, where n is the number of stored keys. Performance falls as λ grows."] },
    { h: "Separate chaining", p: ["Each slot holds a linked list of all keys that hash there. A collision just adds the key to the list. The table never becomes full; search costs 1 + λ on average. It needs extra memory for pointers."] },
    { h: "Open addressing", p: ["All keys are stored in the table itself. On a collision we probe a sequence of slots until one is empty: h(k, i) where i = 0, 1, 2, …", "Linear probing: h(k, i) = (h(k) + i) mod m. Simple but causes primary clustering, long runs of filled slots.", "Quadratic probing: h(k, i) = (h(k) + i²) mod m. Reduces primary clustering but may cause secondary clustering (same start gives same sequence).", "Double hashing: h(k, i) = (h1(k) + i·h2(k)) mod m, with h2(k) never 0. The step depends on the key, which spreads keys best.", "Deleting in open addressing needs a 'deleted' marker, otherwise searches stop too early."], formula: ["Linear:    (h(k) + i) mod m", "Quadratic: (h(k) + i²) mod m", "Double:    (h1(k) + i × h2(k)) mod m", "Load factor = n / m"] },
  ],
  examples: [
    { q: "Insert keys 25, 35, 45, 12, 22 into a table of size 10 with h(k) = k mod 10 using linear probing.", steps: ["25 -> slot 5, empty, store.", "35 -> slot 5 taken, try 6, store. 45 -> 5 taken, 6 taken, try 7, store.", "12 -> slot 2, store. 22 -> slot 2 taken, try 3, store."], ans: "Slots: 2 = 12, 3 = 22, 5 = 25, 6 = 35, 7 = 45" },
    { q: "Insert the same keys using separate chaining and then quadratic probing for 25, 35, 45.", steps: ["Chaining: slot 5 holds the list 25 -> 35 -> 45 and slot 2 holds 12 -> 22.", "Quadratic: 25 -> slot 5. 35: slot 5 taken, 5 + 1 = 6 is free, store.", "45: slot 5 taken, 6 taken (i = 1), 5 + 4 = 9 is free, store."], ans: "Quadratic slots: 5 = 25, 6 = 35, 9 = 45" },
    { q: "Use double hashing with h1(k) = k mod 10 and h2(k) = 7 − (k mod 7) to place 25 and then 35.", steps: ["25 -> slot 5, store.", "35: h1 = 5 is taken. h2(35) = 7 − (35 mod 7) = 7 − 0 = 7.", "Next probe = (5 + 1 × 7) mod 10 = 2, free, store 35 there."], ans: "25 in slot 5, 35 in slot 2" },
  ],
  mistakes: ["Choosing m as a power of 2 with the division method; low bits of the keys then decide everything.", "Forgetting the mod m after adding the probe offset.", "In double hashing, letting h2(k) become 0, which probes the same slot forever.", "Saying chaining needs the table to be larger than the number of keys. It does not.", "Physically emptying a slot on deletion in open addressing, which breaks later searches."],
  check: [
    { q: "Linear probing suffers from", o: ["primary clustering", "no collisions", "pointer overhead", "O(n²) space"], a: 0, why: "Filled slots form long runs that grow." },
    { q: "In separate chaining the load factor can be", o: ["at most 1", "greater than 1", "exactly 1", "negative"], a: 1, why: "Lists can hold more keys than slots." },
    { q: "Quadratic probing uses the sequence", o: ["h + i", "h + i²", "h × i", "h + 2i"], a: 1, why: "Offsets 1, 4, 9, …" },
    { q: "Average cost of a successful search in a good hash table is", o: ["O(1)", "O(n)", "O(log n)", "O(n log n)"], a: 0, why: "The position is computed directly from the key." },
  ],
  lab: { id: "dshash", label: "Open the hashing lab" },
};

/** BCA-006 lessons. Keys are "BCA-006:unit:topic" (topic = 1-based index in the syllabus unit's topics). */
export const L_BCA006: Record<string, Lesson> = {
  "BCA-006:1:5": asym,
  "BCA-006:1:6": complexity,
  "BCA-006:2:7": cqueue,
  "BCA-006:2:13": addrcalc,
  "BCA-006:3:6": bstins,
  "BCA-006:3:11": avl,
  "BCA-006:4:5": adjmat,
  "BCA-006:4:7": bfsdfs,
  "BCA-006:5:4": mergesort,
  "BCA-006:5:10": hashing,
};
