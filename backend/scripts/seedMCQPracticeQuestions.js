
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const PracticeQuestion = require("../models/PracticeQuestion");

// ==========================================
// QUESTION HELPERS
// ==========================================

// Format:
// [question, correct answer, wrong1, wrong2, wrong3, explanation]

const bank = {};

const add = (category, difficulty, questions) => {
  const key = `${category}|${difficulty}`;
  if (!bank[key]) bank[key] = [];
  bank[key].push(...questions);
};

const q = (question, correct, a, b, c, explanation) => [
  question,
  String(correct),
  String(a),
  String(b),
  String(c),
  explanation,
];

// ==========================================
// 1. APTITUDE — 30 QUESTIONS
// ==========================================

add("Aptitude", "Easy", [
  q("What is 15% of 200?", 30, 20, 25, 35, "200 × 15/100 = 30."),
  q("What is 12 × 8?", 96, 88, 108, 86, "Multiplying 12 by 8 gives 96."),
  q("Find the average of 10, 20 and 30.", 20, 15, 25, 30, "Sum 60 divided by 3 equals 20."),
  q("Simplify the ratio 12:18.", "2:3", "3:2", "4:5", "1:2", "Divide both terms by 6."),
  q("What is the square of 13?", 169, 156, 196, 144, "13 multiplied by 13 is 169."),
  q("A product costs ₹500. What is its price after a 10% discount?", 450, 400, 475, 550, "Subtract ₹50 from ₹500."),
  q("What is 3/4 of 80?", 60, 40, 50, 70, "80 × 3/4 = 60."),
  q("Find the next number: 2, 4, 6, 8, ?", 10, 9, 12, 16, "The sequence increases by 2."),
  q("What is 25% of 64?", 16, 12, 20, 24, "25% is one quarter; 64/4 = 16."),
  q("Convert 2.5 hours into minutes.", 150, 120, 180, 125, "2.5 × 60 = 150 minutes."),
]);

add("Aptitude", "Medium", [
  q("Find the simple interest on ₹2000 at 5% per year for 3 years.", 300, 250, 350, 400, "SI = PRT/100 = 2000 × 5 × 3 / 100."),
  q("A train travels 180 km in 3 hours. Find its speed.", "60 km/h", "45 km/h", "90 km/h", "75 km/h", "Speed = distance/time."),
  q("An item bought for ₹800 is sold for ₹1000. Find profit percentage.", "25%", "20%", "15%", "30%", "Profit is ₹200; 200/800 × 100 = 25%."),
  q("A can finish a task in 6 days and B in 3 days. Together they need how many days?", 2, 3, 4, 1, "Combined work rate = 1/6 + 1/3 = 1/2 per day."),
  q("A sum doubles in 10 years at simple interest. Find annual interest rate.", "10%", "5%", "15%", "20%", "Interest equals principal in 10 years, giving 10% yearly."),
  q("Two numbers are in the ratio 3:5 and sum to 64. Find the larger number.", 40, 24, 32, 48, "Eight parts equal 64; five parts equal 40."),
  q("Find the compound amount on ₹1000 at 10% for 2 years.", 1210, 1200, 1100, 1220, "1000 × 1.1 × 1.1 = 1210."),
  q("A car covers 150 km at 50 km/h. How long does it take?", "3 hours", "2 hours", "4 hours", "5 hours", "Time = 150/50 = 3 hours."),
  q("What is the probability of rolling an even number on a fair die?", "1/2", "1/3", "1/6", "2/3", "Three of six outcomes are even."),
  q("A price increases from ₹400 to ₹500. Find the percentage increase.", "25%", "20%", "30%", "15%", "Increase = 100/400 × 100 = 25%."),
]);

add("Aptitude", "Hard", [
  q("Find the compound interest on ₹10000 at 10% for 3 years.", 3310, 3000, 3100, 3300, "10000(1.1)^3 − 10000 = 3310."),
  q("Two pipes fill a tank in 12 and 18 hours. Together, how long?", "7.2 hours", "6 hours", "8 hours", "9 hours", "Combined rate = 1/12 + 1/18 = 5/36."),
  q("A boat travels 24 km downstream in 2 hours and upstream in 3 hours. Find speed in still water.", "10 km/h", "8 km/h", "12 km/h", "9 km/h", "Downstream speed 12, upstream 8; average is 10."),
  q("How many arrangements of the letters in LEVEL are possible?", 30, 60, 120, 20, "5!/(2! × 2!) = 30."),
  q("How many ways can 3 students be selected from 8?", 56, 24, 336, 64, "8C3 = 8×7×6/(3×2×1) = 56."),
  q("A 20% discount followed by a 10% discount equals what single discount?", "28%", "30%", "25%", "32%", "Remaining price fraction = 0.8 × 0.9 = 0.72."),
  q("A and B finish a job in 10 and 15 days. They work together for 3 days. What fraction remains?", "1/2", "1/3", "2/5", "3/5", "In three days they complete 3(1/10+1/15) = 1/2."),
  q("Find the number of trailing zeros in 100!.", 24, 20, 25, 22, "Count factors of 5: floor(100/5)+floor(100/25)=24."),
  q("If x + 1/x = 5, find x² + 1/x².", 23, 25, 21, 27, "Square the expression and subtract 2."),
  q("A bag contains 5 red and 3 blue balls. Probability of drawing two red balls without replacement?", "5/14", "25/64", "1/2", "3/14", "Probability = 5/8 × 4/7 = 5/14."),
]);

// ==========================================
// 2. REASONING — 30 QUESTIONS
// ==========================================

add("Reasoning", "Easy", [
  q("Complete: 1, 3, 5, 7, ?", 9, 8, 10, 11, "Odd numbers increase by 2."),
  q("Which is different: Apple, Mango, Carrot, Banana?", "Carrot", "Apple", "Mango", "Banana", "Carrot is a vegetable."),
  q("If CAT becomes DBU, what does DOG become?", "EPH", "FQI", "CNE", "EQH", "Each letter shifts forward by one."),
  q("Complete: A, C, E, G, ?", "I", "H", "J", "K", "Skip one letter each time."),
  q("Which number is odd one out: 2, 4, 6, 9, 8?", 9, 2, 4, 8, "Nine is odd; the others are even."),
  q("If today is Monday, what day is tomorrow?", "Tuesday", "Wednesday", "Sunday", "Friday", "Tuesday follows Monday."),
  q("Hand is to Glove as Foot is to what?", "Shoe", "Hat", "Shirt", "Ring", "A shoe is worn on a foot."),
  q("Complete: 5, 10, 15, 20, ?", 25, 30, 22, 35, "Add 5 each time."),
  q("Which direction is opposite to North?", "South", "East", "West", "Northeast", "South is opposite North."),
  q("Book is to Reading as Pen is to what?", "Writing", "Drawing only", "Singing", "Running", "A pen is used for writing."),
]);

add("Reasoning", "Medium", [
  q("Complete: 2, 6, 12, 20, 30, ?", 42, 40, 44, 36, "Terms follow n(n+1)."),
  q("If A=1, B=2, ..., Z=26, find value of DOG.", 26, 24, 28, 30, "D=4, O=15, G=7; total 26."),
  q("A person faces East, turns left, then right, then right. Final direction?", "South", "North", "East", "West", "East → North → East → South."),
  q("Complete: 3, 9, 27, 81, ?", 243, 162, 324, 108, "Multiply by 3."),
  q("If TABLE is coded UBCMF, how is CHAIR coded?", "DIBJS", "DHBJS", "EIBJS", "DIBIR", "Each letter moves one position forward."),
  q("Which does not belong: Square, Triangle, Circle, Cube?", "Cube", "Square", "Triangle", "Circle", "Cube is three-dimensional."),
  q("A is B's brother. B is C's mother. How is A related to C?", "Uncle", "Father", "Brother", "Grandfather", "Mother's brother is maternal uncle."),
  q("Complete: 1, 4, 9, 16, 25, ?", 36, 30, 49, 35, "These are consecutive perfect squares."),
  q("All roses are flowers. All flowers are plants. Therefore all roses are what?", "Plants", "Trees", "Leaves", "Seeds", "The relationship is transitive."),
  q("Five people stand in a row. How many positions are between the first and fifth?", 3, 2, 4, 5, "Positions 2, 3 and 4 are between them."),
]);

add("Reasoning", "Hard", [
  q("Complete: 1, 2, 6, 24, 120, ?", 720, 600, 240, 840, "The sequence follows factorials."),
  q("Complete: 2, 3, 5, 9, 17, ?", 33, 31, 34, 25, "Successive differences double: 1, 2, 4, 8, 16."),
  q("If every A is B, and no B is C, which statement must hold?", "No A is C", "All C are A", "Some A are C", "All B are A", "A is contained in B, which excludes C."),
  q("Complete: 4, 9, 19, 39, 79, ?", 159, 149, 169, 119, "Each term is previous × 2 + 1."),
  q("A clock reads 3:30. Find the smaller angle between its hands.", "75°", "90°", "60°", "105°", "Minute hand at 180°, hour hand at 105°."),
  q("If 1 January is Monday in a non-leap year, what day is 1 March?", "Thursday", "Wednesday", "Friday", "Tuesday", "January 31 days shifts 3 days; February 28 shifts 0."),
  q("Complete: 1, 8, 27, 64, 125, ?", 216, 196, 225, 256, "These are cubes of 1 through 6."),
  q("How many handshakes occur if 8 people each shake hands once with everyone else?", 28, 56, 16, 24, "Number of pairs = 8×7/2."),
  q("Complete: 100, 96, 88, 76, 60, ?", 40, 44, 36, 48, "Subtract 4, 8, 12, 16, then 20."),
  q("If P is taller than Q, Q taller than R, and R taller than S, who is second tallest?", "Q", "P", "R", "S", "Order is P > Q > R > S."),
]);

// ==========================================
// 3. VERBAL — 30 QUESTIONS
// ==========================================

add("Verbal", "Easy", [
  q("Choose the synonym of Happy.", "Joyful", "Angry", "Sad", "Tired", "Joyful means happy."),
  q("Choose the antonym of Ancient.", "Modern", "Old", "Historic", "Past", "Modern is the opposite of ancient."),
  q("Fill in: She ___ to school daily.", "goes", "go", "going", "gone", "Third-person singular takes goes."),
  q("Which spelling of 'necessary' is correct?", "Necessary", "Neccessary", "Necesary", "Neccesary", "Necessary has one c and two s letters."),
  q("Choose the plural of Child.", "Children", "Childs", "Childes", "Childrens", "Children is the irregular plural."),
  q("Choose the antonym of Brave.", "Cowardly", "Bold", "Fearless", "Strong", "Cowardly contrasts with brave."),
  q("Fill in: I saw ___ elephant.", "an", "a", "the only", "no article", "Elephant begins with a vowel sound."),
  q("Choose the past tense of Write.", "Wrote", "Written", "Writing", "Writes", "Wrote is the simple past."),
  q("Choose the synonym of Quick.", "Fast", "Slow", "Late", "Weak", "Fast and quick have similar meanings."),
  q("Identify the noun: The dog barked loudly.", "dog", "barked", "loudly", "the", "Dog names an animal."),
]);

add("Verbal", "Medium", [
  q("Fill in: Neither of the answers ___ correct.", "is", "are", "were", "have", "Neither is grammatically singular."),
  q("Choose the synonym of Meticulous.", "Careful", "Careless", "Lazy", "Hasty", "Meticulous means very careful."),
  q("Choose the antonym of Scarce.", "Abundant", "Rare", "Limited", "Few", "Abundant means plentiful."),
  q("Which sentence correctly uses the present perfect continuous tense?", "She has been working here for five years.", "She working here since five years.", "She has working here for five years.", "She have been working here.", "Present perfect continuous expresses an action continuing over time."),
  q("Fill in: He is good ___ mathematics.", "at", "in", "on", "for", "Good at is the standard collocation."),
  q("Meaning of 'break the ice'?", "Start a conversation", "Destroy something", "Become angry", "Stop speaking", "The idiom means easing initial social tension."),
  q("Choose the correct passive: They built the bridge.", "The bridge was built by them.", "The bridge built them.", "The bridge is build by them.", "The bridge has build.", "Simple past passive uses was/were + past participle."),
  q("Choose the synonym of Reluctant.", "Unwilling", "Eager", "Ready", "Enthusiastic", "Reluctant means unwilling."),
  q("Fill in: If I ___ you, I would apologize.", "were", "was", "am", "be", "Hypothetical conditionals traditionally use were."),
  q("Choose the antonym of Transparent.", "Opaque", "Clear", "Visible", "Lucid", "Opaque means not transparent."),
]);

add("Verbal", "Hard", [
  q("Choose the synonym of Ephemeral.", "Short-lived", "Permanent", "Endless", "Stable", "Ephemeral means lasting briefly."),
  q("Choose the antonym of Ubiquitous.", "Rare", "Everywhere", "Common", "Widespread", "Ubiquitous means present everywhere."),
  q("Which sentence correctly uses the 'hardly ... when' construction?", "Hardly had he arrived when it started raining.", "Hardly he arrived when it started raining.", "Hardly had he arrived than it rained.", "Hardly he had arrived when raining.", "Hardly ... when uses inversion."),
  q("Meaning of 'a Pyrrhic victory'?", "A victory gained at excessive cost", "An effortless win", "A complete defeat", "A diplomatic agreement", "The cost of victory nearly outweighs its benefit."),
  q("Choose the synonym of Obfuscate.", "Confuse", "Clarify", "Explain", "Simplify", "Obfuscate means make unclear."),
  q("Fill in: No sooner had she entered ___ the lights went out.", "than", "when", "then", "that", "No sooner is followed by than."),
  q("Choose the antonym of Intransigent.", "Flexible", "Stubborn", "Rigid", "Unyielding", "Intransigent means unwilling to compromise."),
  q("Choose the correct conditional sentence.", "Had I known, I would have helped.", "Had I knew, I helped.", "If I would know, I helped.", "Had I know, I will help.", "The inverted third conditional uses had + past participle."),
  q("Meaning of 'equivocal'?", "Ambiguous", "Certain", "Definite", "Explicit", "Equivocal means open to multiple interpretations."),
  q("Choose the synonym of Sagacious.", "Wise", "Foolish", "Careless", "Naive", "Sagacious means showing good judgment."),
]);

// ==========================================
// 4. PROGRAMMING — 30 QUESTIONS
// Stored as category Coding
// ==========================================

add("Programming", "Easy", [
  q("Which symbol terminates a Java statement?", ";", ":", ".", "#", "Java statements commonly end with a semicolon."),
  q("Which keyword declares a constant variable in Java?", "final", "static", "void", "new", "final prevents reassignment."),
  q("Which Python function prints output?", "print()", "show()", "display()", "echo()", "print() writes to standard output."),
  q("Which operator tests equality in Python?", "==", "=", "!=", ">=", "== compares values."),
  q("Which data type stores true or false?", "boolean", "integer", "float", "string", "Boolean values represent truth values."),
  q("What is 10 % 3?", 1, 3, 0, 2, "Modulo returns the remainder."),
  q("Which Java method is the usual program entry point?", "main()", "start()", "run()", "execute()", "Java applications start at main."),
  q("Which keyword starts a conditional branch in Python?", "if", "when", "switch", "check", "if tests a condition."),
  q("Which Python type stores an ordered mutable collection?", "list", "tuple", "int", "bool", "Lists are ordered and mutable."),
  q("What does a loop do?", "Repeats instructions", "Deletes a file", "Compiles code", "Creates a database", "Loops repeat a block based on a condition or iterable."),
]);

add("Programming", "Medium", [
  q("What is the time complexity of iterating once through N elements?", "O(n)", "O(1)", "O(n²)", "O(log n)", "Each element is visited once."),
  q("What is printed by Python: print(2 ** 3)?", 8, 6, 9, 5, "** is exponentiation."),
  q("Which Java collection stores key-value pairs?", "HashMap", "ArrayList", "HashSet", "Stack", "HashMap associates keys with values."),
  q("What does Python list slicing a[1:3] return?", "Elements at indices 1 and 2", "Elements 1 through 3 inclusive", "Only index 3", "The entire list", "The end index is exclusive."),
  q("Which OOP concept permits method overriding?", "Polymorphism", "Compilation", "Tokenization", "Serialization", "Overriding supports runtime polymorphism."),
  q("Which Java exception is thrown for accessing an invalid array index?", "ArrayIndexOutOfBoundsException", "IOException", "SQLException", "ClassNotFoundException", "The array index must be within valid bounds."),
  q("What is the result of Python len('Placify')?", 7, 6, 8, 9, "Placify contains seven characters."),
  q("Which keyword is used to inherit a class in Java?", "extends", "implements", "inherits", "super", "extends declares class inheritance."),
  q("What is a recursive function?", "A function that calls itself", "A function without parameters", "A function that cannot return", "A function with no condition", "Recursion solves problems using self-calls."),
  q("What is the purpose of a base case in recursion?", "Stop recursive calls", "Increase recursion depth", "Create a loop", "Allocate an array", "A base case terminates recursion."),
]);

add("Programming", "Hard", [
  q("What is the average time complexity of HashMap lookup?", "O(1)", "O(n)", "O(n log n)", "O(n²)", "Hashing usually permits constant-time average lookup."),
  q("What does memoization optimize?", "Repeated subproblem computation", "Disk formatting", "Source formatting", "Network routing", "Memoization caches computed results."),
  q("What is a race condition?", "Outcome depends on thread timing", "A syntax error", "A compiler warning", "A memory allocation strategy", "Unsynchronized concurrent operations can produce timing-dependent results."),
  q("Which Java keyword makes a field visible across threads?", "volatile", "final", "private", "abstract", "volatile establishes visibility guarantees for reads and writes."),
  q("What is a closure?", "Function retaining its lexical environment", "A closed database", "A terminated thread", "A compiled binary", "Closures capture variables from enclosing scopes."),
  q("What is the worst-case time complexity of quicksort?", "O(n²)", "O(n)", "O(log n)", "O(1)", "Highly unbalanced partitions cause quadratic work."),
  q("What is the purpose of a mutex?", "Mutual exclusion", "Memory compression", "Query optimization", "Code compilation", "A mutex protects shared critical sections."),
  q("Which principle is violated when a class has unrelated responsibilities?", "Single Responsibility Principle", "Open Closed Principle", "Liskov Substitution Principle", "Dependency Inversion Principle", "SRP calls for one cohesive reason to change."),
  q("What is a deadlock?", "Threads wait indefinitely for each other", "A successful transaction", "A completed thread", "A cache miss", "Circular resource waits can prevent progress."),
  q("What does tail-call optimization reduce?", "Call-stack growth", "Algorithm input size", "Database storage", "Source-code length", "Tail calls can reuse stack frames where supported."),
]);

// ==========================================
// 5. SQL — 30 QUESTIONS
// ==========================================

add("SQL", "Easy", [
  q("Which SQL statement retrieves records?", "SELECT", "INSERT", "DELETE", "DROP", "SELECT queries data."),
  q("Which clause filters rows?", "WHERE", "ORDER BY", "GROUP BY", "FROM", "WHERE applies row conditions."),
  q("Which statement adds a row?", "INSERT", "SELECT", "ALTER", "TRUNCATE", "INSERT creates records."),
  q("Which statement modifies existing rows?", "UPDATE", "CREATE", "SELECT", "DROP", "UPDATE changes stored values."),
  q("Which clause sorts query results?", "ORDER BY", "WHERE", "HAVING", "JOIN", "ORDER BY controls result ordering."),
  q("Which function counts rows?", "COUNT()", "SUM()", "AVG()", "MAX()", "COUNT returns the number of matching rows."),
  q("Which keyword removes duplicate results?", "DISTINCT", "UNIQUE ONLY", "SINGLE", "FILTER", "DISTINCT eliminates duplicate selected rows."),
  q("Which SQL statement removes rows?", "DELETE", "SELECT", "CREATE", "GRANT", "DELETE removes matching records."),
  q("Which command creates a table?", "CREATE TABLE", "MAKE TABLE", "ADD TABLE", "BUILD TABLE", "CREATE TABLE defines a new table."),
  q("Which clause specifies the source table?", "FROM", "WHERE", "SET", "VALUES", "FROM identifies the queried relation."),
]);

add("SQL", "Medium", [
  q("Which JOIN returns only matching rows from both tables?", "INNER JOIN", "LEFT JOIN", "FULL JOIN", "CROSS JOIN", "INNER JOIN requires matching join conditions."),
  q("Which clause filters grouped results?", "HAVING", "WHERE", "ORDER BY", "LIMIT", "HAVING filters aggregate groups."),
  q("Which aggregate calculates an average?", "AVG()", "COUNT()", "SUM()", "MIN()", "AVG computes the arithmetic mean."),
  q("Which clause groups rows for aggregation?", "GROUP BY", "ORDER BY", "WHERE", "DISTINCT", "GROUP BY forms groups."),
  q("Which JOIN preserves every row from the left table?", "LEFT JOIN", "INNER JOIN", "CROSS JOIN", "RIGHT JOIN", "LEFT JOIN includes unmatched left rows."),
  q("Which condition tests SQL NULL?", "IS NULL", "= NULL", "== NULL", "EQUAL NULL", "NULL comparisons require IS NULL."),
  q("What does UNION do by default?", "Combines results and removes duplicates", "Combines results and retains all duplicates", "Joins columns by key", "Deletes duplicate table rows", "UNION performs set union with duplicate elimination."),
  q("Which constraint prevents duplicate non-null key values?", "UNIQUE", "DEFAULT", "CHECK only", "NOT NULL only", "UNIQUE enforces uniqueness."),
  q("Which statement changes a table definition?", "ALTER TABLE", "UPDATE", "SELECT", "INSERT", "ALTER TABLE modifies schema."),
  q("What does COUNT(column_name) ignore?", "NULL values", "All non-NULL values", "Duplicate values always", "Zero values", "COUNT(column) counts non-NULL values."),
]);

add("SQL", "Hard", [
  q("Which window function assigns a unique sequential number to each row?", "ROW_NUMBER()", "RANK()", "DENSE_RANK()", "COUNT()", "ROW_NUMBER numbers rows individually."),
  q("Which isolation anomaly occurs when a transaction reads uncommitted changes?", "Dirty read", "Phantom read", "Lost update", "Deadlock", "Dirty reads observe uncommitted data."),
  q("Which index is most directly useful for equality lookups on an indexed key?", "B-tree index", "Full table scan", "Random sorting", "Temporary table", "B-tree indexes efficiently support key searches."),
  q("Which keyword introduces a common table expression?", "WITH", "HAVING", "USING", "DECLARE", "WITH defines CTEs."),
  q("What is a correlated subquery?", "A subquery referencing an outer query", "A subquery with no tables", "A query that always returns one row", "A query without a WHERE clause", "Correlated subqueries depend on values from outer rows."),
  q("What does DENSE_RANK() do with ties?", "Gives equal ranks without gaps", "Always assigns unique ranks", "Deletes tied rows", "Always starts from zero", "Dense ranking does not skip rank values."),
  q("Which ACID property ensures committed data survives failures?", "Durability", "Isolation", "Atomicity", "Consistency", "Durability preserves committed changes."),
  q("Which normal form removes transitive dependencies of non-key attributes on a candidate key?", "Third Normal Form", "First Normal Form", "Second Normal Form", "Unnormalized Form", "3NF addresses transitive dependencies."),
  q("Which SQL operator tests whether a subquery returns at least one row?", "EXISTS", "BETWEEN", "LIKE", "ALL", "EXISTS evaluates whether a matching row exists."),
  q("Which isolation level is intended to make concurrent transactions behave as if executed serially?", "Serializable", "Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable provides the strongest standard isolation guarantee."),
]);

// ==========================================
// 6. DSA — 30 QUESTIONS
// Stored as Technical / DSA
// ==========================================

add("DSA", "Easy", [
  q("Which data structure follows LIFO?", "Stack", "Queue", "Tree", "Graph", "Stacks remove the last inserted element first."),
  q("Which data structure follows FIFO?", "Queue", "Stack", "Heap", "Set", "Queues remove the earliest inserted element first."),
  q("What is the index of the first element in a zero-indexed array?", 0, 1, -1, 2, "Zero-based indexing starts at zero."),
  q("Which structure contains nodes connected by edges?", "Graph", "Array", "String", "Stack", "Graphs consist of vertices and edges."),
  q("Which linked-list node field refers to the next node?", "next", "head only", "size", "capacity", "The next pointer links successive nodes."),
  q("Which tree node has no children?", "Leaf", "Root always", "Parent", "Ancestor", "Leaf nodes have zero children."),
  q("Which operation adds an item to a stack?", "Push", "Pop", "Peek", "Dequeue", "Push inserts at the stack top."),
  q("Which operation removes an item from a queue?", "Dequeue", "Push", "Peek only", "Append", "Dequeue removes the front element."),
  q("What is the time complexity of direct array access by index?", "O(1)", "O(n)", "O(n²)", "O(log n)", "Array indexing uses direct address calculation."),
  q("Which traversal visits root before children?", "Preorder", "Inorder", "Postorder", "Level order only", "Preorder processes the root first."),
]);

add("DSA", "Medium", [
  q("What is the time complexity of binary search on a sorted array?", "O(log n)", "O(n)", "O(n²)", "O(1) always", "Binary search halves the search space."),
  q("Which traversal uses a queue?", "Breadth First Search", "Depth First Search", "Inorder only", "Postorder only", "BFS explores nodes level by level using a queue."),
  q("Which traversal commonly uses a stack?", "Depth First Search", "Breadth First Search", "Level order", "Counting sort", "DFS can use an explicit stack."),
  q("Which sorting algorithm has O(n log n) worst-case complexity?", "Merge Sort", "Bubble Sort", "Selection Sort", "Insertion Sort", "Merge sort repeatedly divides and merges."),
  q("Which data structure efficiently supports a min-priority queue?", "Min Heap", "Unsorted array only", "Stack", "Linked list only", "Min heaps keep the smallest key at the root."),
  q("Which algorithm finds shortest paths in an unweighted graph?", "BFS", "DFS only", "Quick Sort", "Binary Search", "BFS explores paths by increasing edge count."),
  q("What is the average time complexity of inserting into a hash table?", "O(1)", "O(n²)", "O(log n) always", "O(n log n)", "Hash tables offer constant average insertion."),
  q("Which technique uses two moving indices to solve array problems?", "Two Pointers", "Backtracking only", "Recursion only", "Hashing only", "Two pointers coordinate positions in an array."),
  q("Which data structure is used to check balanced parentheses?", "Stack", "Queue", "Heap", "Graph", "A stack matches nested opening and closing brackets."),
  q("Which technique caches solutions to overlapping subproblems?", "Dynamic Programming", "Linear Search", "Selection Sort", "Breadth First Search", "DP reuses computed subproblem results."),
]);

add("DSA", "Hard", [
  q("Which algorithm finds shortest paths with non-negative edge weights?", "Dijkstra", "Kruskal", "Prim", "Topological Sort", "Dijkstra expands minimum tentative distances."),
  q("Which algorithm detects strongly connected components?", "Tarjan's Algorithm", "Binary Search", "Merge Sort", "Kadane's Algorithm", "Tarjan uses DFS low-link values."),
  q("Which data structure supports efficient range sum queries and point updates?", "Fenwick Tree", "Stack", "Queue", "Plain string", "Fenwick trees support both operations in O(log n)."),
  q("Which algorithm computes a minimum spanning tree?", "Kruskal", "Bellman-Ford", "KMP", "Floyd's Cycle Detection", "Kruskal selects safe edges in increasing weight order."),
  q("What is the time complexity of Floyd-Warshall?", "O(V³)", "O(V)", "O(E)", "O(log V)", "It considers every intermediate vertex for every vertex pair."),
  q("Which algorithm handles negative-weight edges in single-source shortest paths?", "Bellman-Ford", "Standard Dijkstra", "Prim", "Binary Search", "Bellman-Ford relaxes edges repeatedly."),
  q("Which algorithm finds a pattern in text using a prefix function?", "KMP", "BFS", "Heap Sort", "Prim", "KMP uses prefix information to avoid redundant comparisons."),
  q("Which structure supports range minimum queries with updates?", "Segment Tree", "Stack", "Queue", "Hash Set only", "Segment trees maintain aggregate information over intervals."),
  q("Which algorithm uses union-find to avoid cycles?", "Kruskal", "Dijkstra", "KMP", "Binary Search", "Disjoint sets identify connected components."),
  q("Which algorithm finds maximum flow in a directed network?", "Edmonds-Karp", "Merge Sort", "Binary Search", "Prim", "Edmonds-Karp repeatedly finds augmenting paths using BFS."),
]);

// ==========================================
// 7. TECHNICAL SUBJECT — 30 QUESTIONS
// Stored as Technical / other subcategories
// ==========================================

add("Technical Subject", "Easy", [
  q("What does CPU stand for?", "Central Processing Unit", "Computer Processing Utility", "Central Program Unit", "Control Processing User", "CPU executes computer instructions."),
  q("What does RAM stand for?", "Random Access Memory", "Read Access Machine", "Rapid Application Memory", "Random Allocation Module", "RAM is volatile working memory."),
  q("Which protocol is used to access web pages?", "HTTP", "SMTP", "FTP only", "SSH only", "HTTP transfers web resources."),
  q("Which OS manages computer hardware and software resources?", "Operating System", "Compiler", "Text Editor", "Browser", "An operating system manages system resources."),
  q("What does DBMS stand for?", "Database Management System", "Data Binary Memory Storage", "Digital Base Management Software", "Database Machine Server", "DBMS manages databases."),
  q("Which network device forwards packets between networks?", "Router", "Keyboard", "Monitor", "Printer", "Routers forward network-layer packets."),
  q("What does HTML stand for?", "HyperText Markup Language", "HighText Machine Language", "HyperTransfer Main Language", "Home Tool Markup Language", "HTML structures web documents."),
  q("Which protocol commonly sends email between mail servers?", "SMTP", "HTTP", "FTP", "ARP", "SMTP handles mail transfer."),
  q("What is the main function of a compiler?", "Translate source code", "Browse websites", "Manage passwords", "Design graphics", "A compiler translates programs into another representation."),
  q("Which database model organizes data into tables?", "Relational", "Hierarchical only", "Document only", "Graph only", "Relational databases use relations represented as tables."),
]);

add("Technical Subject", "Medium", [
  q("Which OS scheduling algorithm uses a fixed time quantum?", "Round Robin", "FCFS", "Shortest Job First", "Priority only", "Round Robin rotates processes after a time slice."),
  q("Which TCP/IP protocol provides reliable ordered delivery?", "TCP", "UDP", "IP", "ICMP", "TCP uses sequencing and retransmission."),
  q("Which database property ensures all-or-nothing transactions?", "Atomicity", "Durability", "Isolation", "Indexing", "Atomicity prevents partial transaction commits."),
  q("Which HTTP status means resource not found?", 404, 200, 201, 500, "404 indicates the requested resource was not found."),
  q("Which OS concept gives each process its own virtual address space?", "Virtual Memory", "Cache only", "Polling", "Spooling", "Virtual memory provides isolated address spaces."),
  q("Which protocol maps domain names to IP addresses?", "DNS", "SMTP", "SSH", "ARP only", "DNS resolves domain names."),
  q("Which database key uniquely identifies each table row?", "Primary Key", "Foreign Key", "Candidate column only", "Index name", "A primary key uniquely identifies rows."),
  q("Which layer of the OSI model handles routing?", "Network Layer", "Physical Layer", "Session Layer", "Presentation Layer", "Layer 3 handles logical addressing and routing."),
  q("Which Java OOP principle hides implementation details?", "Abstraction", "Compilation", "Serialization", "Garbage Collection", "Abstraction exposes essential behavior."),
  q("Which HTTP method is generally idempotent and used to replace a resource?", "PUT", "POST", "CONNECT", "TRACE", "PUT is defined as idempotent."),
]);

add("Technical Subject", "Hard", [
  q("Which condition is necessary for classical deadlock?", "Circular Wait", "Preemption always", "Unlimited Resources", "No Shared State", "Circular wait is one of the Coffman conditions."),
  q("Which database isolation anomaly involves new rows appearing on repeated predicate queries?", "Phantom Read", "Dirty Write", "Cache Miss", "Deadlock", "Phantoms change the set of matching rows."),
  q("Which consensus algorithm is commonly used in replicated distributed systems?", "Raft", "Quick Sort", "KMP", "Round Robin CPU Scheduling", "Raft coordinates a replicated log through leader election and consensus."),
  q("Which TCP mechanism controls sending rate based on network congestion?", "Congestion Control", "DNS Resolution", "ARP", "HTTP Caching", "TCP adjusts its congestion window."),
  q("Which OS page replacement algorithm theoretically minimizes page faults with future knowledge?", "Optimal Page Replacement", "FIFO", "Random Replacement", "Clock", "The optimal algorithm evicts the page used farthest in the future."),
  q("Which CAP property is sacrificed by an available partition-tolerant system during a partition?", "Strong Consistency", "Availability", "Partition Tolerance", "All three always", "Under a partition, an AP design prioritizes availability over strong consistency."),
  q("Which database index type is commonly used for full-text keyword searching?", "Inverted Index", "Stack", "Queue", "Heap Sort", "Inverted indexes map terms to matching documents."),
  q("Which authentication protocol uses signed tokens and scopes for delegated authorization?", "OAuth 2.0", "ARP", "ICMP", "FTP", "OAuth 2.0 provides scoped delegated authorization; tokens need not always be signed JWTs."),
  q("Which distributed-system property means repeated identical operations have the same effect as one operation?", "Idempotency", "Serialization", "Compression", "Encryption", "Idempotent operations can be safely repeated."),
  q("Which security principle grants only permissions required to perform a task?", "Least Privilege", "Open Access", "Shared Administrator", "Unlimited Trust", "Least privilege limits unnecessary access."),
]);

// ==========================================
// MAP FRONTEND CATEGORIES TO DATABASE
// ==========================================

const categoryMap = {
  Aptitude: {
    category: "Aptitude",
    subCategory: "General",
  },
  Reasoning: {
    category: "Reasoning",
    subCategory: "General",
  },
  Verbal: {
    category: "Verbal",
    subCategory: "English",
  },
  Programming: {
    category: "Coding",
    subCategory: "Programming",
  },
  SQL: {
    category: "SQL",
    subCategory: "SQL",
  },
  DSA: {
    category: "Technical",
    subCategory: "DSA",
  },
  "Technical Subject": {
    category: "Technical",
    subCategory: "Core CS",
  },
};

const difficultyMap = {
  Easy: "Beginner",
  Medium: "Intermediate",
  Hard: "Advanced",
};

// ==========================================
// CREATE VALID QUESTION DOCUMENTS
// ==========================================

function buildDocuments() {
  const documents = [];
  const categories = Object.keys(categoryMap);
  const difficulties = ["Easy", "Medium", "Hard"];

  for (const categoryName of categories) {
    for (const difficulty of difficulties) {
      const key = `${categoryName}|${difficulty}`;
      const entries = bank[key] || [];

      if (entries.length !== 10) {
        throw new Error(
          `${key} must contain exactly 10 questions; found ${entries.length}`
        );
      }

      const mapped = categoryMap[categoryName];

      for (const entry of entries) {
        const [
          questionText,
          correctAnswer,
          wrong1,
          wrong2,
          wrong3,
          explanation,
        ] = entry;

        const options = [
          correctAnswer,
          wrong1,
          wrong2,
          wrong3,
        ];

        if (new Set(options).size !== 4) {
          throw new Error(
            `Duplicate options in: ${questionText}`
          );
        }

        // Shuffle options; correctAnswer stays the
        // exact answer text for existing scoring.
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [
            options[j],
            options[i],
          ];
        }

        documents.push({
          questionText,
          category: mapped.category,
          subCategory: mapped.subCategory,
          difficulty,
          questionType: "MCQ",
          options,
          correctAnswer,
          explanation,
          marks:
            difficulty === "Easy"
              ? 1
              : difficulty === "Medium"
              ? 2
              : 3,
          timeLimitSeconds: 60,
          skillsCovered: [categoryName],
          isActive: true,
        });
      }
    }
  }

  const uniqueTexts = new Set(
    documents.map((doc) =>
      doc.questionText.trim().toLowerCase()
    )
  );

 if (uniqueTexts.size !== documents.length) {
  const seen = new Set();

  for (const doc of documents) {
    const key = doc.questionText.trim().toLowerCase();

    if (seen.has(key)) {
      console.log(
        "Duplicate question:",
        doc.questionText
      );
    }

    seen.add(key);
  }

  throw new Error(
    "Duplicate question texts found in seed bank"
  );
}

  return documents;
}

// ==========================================
// SAFE DATABASE SEEDING
// ==========================================

async function seedMCQPracticeQuestions() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    const documents = buildDocuments();

    console.log(
      `Validated ${documents.length} MCQ questions`
    );

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    let created = 0;
    let updated = 0;

    for (const doc of documents) {
      const existing = await PracticeQuestion.findOne({
        questionText: doc.questionText,
        questionType: "MCQ",
      });

      if (existing) {
        await PracticeQuestion.updateOne(
          { _id: existing._id },
          { $set: doc }
        );
        updated++;
      } else {
        await PracticeQuestion.create(doc);
        created++;
      }
    }

    console.log("------------------------------");
    console.log("MCQ Practice seed completed");
    console.log("Created:", created);
    console.log("Updated:", updated);
    console.log("Total processed:", documents.length);
    console.log("7 Categories x 3 Levels x 10 MCQs");
    console.log("------------------------------");

    // Verify that every requested combination
    // has at least 10 active MCQ questions.
    let allValid = true;

    for (const categoryName of Object.keys(categoryMap)) {
      const mapped = categoryMap[categoryName];

      for (const difficulty of ["Easy", "Medium", "Hard"]) {
        const filter = {
          category: mapped.category,
          difficulty,
          questionType: "MCQ",
          isActive: true,
        };

        if (categoryName === "DSA") {
          filter.subCategory = "DSA";
        } else if (categoryName === "Technical Subject") {
          filter.subCategory = { $ne: "DSA" };
        }

        const count = await PracticeQuestion.countDocuments(
          filter
        );

        console.log(
          `${categoryName} / ${difficultyMap[difficulty]}: ${count}`
        );

        if (count < 10) allValid = false;
      }
    }

    if (!allValid) {
      throw new Error(
        "Some category/difficulty combinations have fewer than 10 MCQs"
      );
    }

    console.log(
      "SUCCESS: All 21 combinations have at least 10 MCQs."
    );
  } catch (error) {
    console.error(
      "MCQ seeding failed:",
      error.message
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedMCQPracticeQuestions();
