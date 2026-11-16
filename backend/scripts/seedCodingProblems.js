
require("dotenv").config();
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const CodingProblem = require("../models/CodingProblem");

// All Java solutions use public class Main.
// All solutions read from standard input (stdin).

const java = (body) => `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        ${body}
    }
}
`.trim();

const test = (input, expectedOutput, isHidden = false) => ({
  input: String(input),
  expectedOutput: String(expectedOutput),
  isHidden,
});

const makeProblem = ({
  title,
  difficulty,
  category,
  description,
  inputFormat,
  outputFormat,
  sampleInput,
  sampleOutput,
  tests,
  javaCode,
  pythonCode,
  skills,
}) => ({
  title,
  difficulty,
  category,
  description,
  inputFormat,
  outputFormat,
  constraints: "Use standard input and standard output.",
  sampleInput,
  sampleOutput,
  supportedLanguages: ["Java", "Python"],
  testCases: tests,
  demoSolutions: {
    Java: java(javaCode),
    Python: pythonCode.trim(),
  },
  marks:
    difficulty === "Easy" ? 10 :
    difficulty === "Medium" ? 20 : 30,
  timeLimitSeconds: 5,
  skillsCovered: skills,
  companyTags: [],
  isActive: true,
});

const problems = [

  // ==========================================
  // EASY — 4 PROBLEMS
  // ==========================================

  makeProblem({
    title: "Sum of Two Numbers",
    difficulty: "Easy",
    category: "Basic Programming",
    description:
      "Read two integers and print their sum.",
    inputFormat: "Two space-separated integers.",
    outputFormat: "One integer.",
    sampleInput: "5 7",
    sampleOutput: "12",
    tests: [
      test("5 7", "12"),
      test("10 20", "30"),
      test("-5 8", "3", true),
      test("0 0", "0", true),
    ],
    javaCode: `
        long a = sc.nextLong();
        long b = sc.nextLong();
        System.out.println(a + b);
    `,
    pythonCode: `
a, b = map(int, input().split())
print(a + b)
    `,
    skills: ["Arithmetic", "Input Output"],
  }),

  makeProblem({
    title: "Even or Odd",
    difficulty: "Easy",
    category: "Basic Programming",
    description:
      "Determine whether an integer is even or odd.",
    inputFormat: "One integer.",
    outputFormat: "Even or Odd.",
    sampleInput: "8",
    sampleOutput: "Even",
    tests: [
      test("8", "Even"),
      test("7", "Odd"),
      test("-3", "Odd", true),
      test("0", "Even", true),
    ],
    javaCode: `
        long n = sc.nextLong();
        System.out.println(n % 2 == 0 ? "Even" : "Odd");
    `,
    pythonCode: `
n = int(input())
print("Even" if n % 2 == 0 else "Odd")
    `,
    skills: ["Conditionals", "Modulo"],
  }),

  makeProblem({
    title: "Reverse a String",
    difficulty: "Easy",
    category: "Strings",
    description:
      "Reverse the characters of the given string.",
    inputFormat: "One line containing a string.",
    outputFormat: "The reversed string.",
    sampleInput: "hello",
    sampleOutput: "olleh",
    tests: [
      test("hello", "olleh"),
      test("Placify", "yifcalP"),
      test("abcde", "edcba", true),
      test("a", "a", true),
    ],
    javaCode: `
        String s = sc.nextLine();
        System.out.println(
            new StringBuilder(s).reverse().toString()
        );
    `,
    pythonCode: `
s = input()
print(s[::-1])
    `,
    skills: ["Strings"],
  }),

  makeProblem({
    title: "Find Largest Number",
    difficulty: "Easy",
    category: "Arrays",
    description:
      "Find the largest element in an array.",
    inputFormat:
      "First integer N, followed by N integers.",
    outputFormat: "Largest integer.",
    sampleInput: "5\n2 8 4 1 6",
    sampleOutput: "8",
    tests: [
      test("5\n2 8 4 1 6", "8"),
      test("3\n1 2 3", "3"),
      test("4\n-5 -2 -9 -1", "-1", true),
      test("1\n42", "42", true),
    ],
    javaCode: `
        int n = sc.nextInt();
        long max = Long.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            max = Math.max(max, sc.nextLong());
        }
        System.out.println(max);
    `,
    pythonCode: `
import sys
a = list(map(int, sys.stdin.read().split()))
n = a[0]
print(max(a[1:1+n]))
    `,
    skills: ["Arrays", "Loops"],
  }),

  // ==========================================
  // MEDIUM — 4 PROBLEMS
  // ==========================================

  makeProblem({
    title: "Two Sum",
    difficulty: "Medium",
    category: "Arrays",
    description:
      "Given an array and a target, find two distinct indices whose values add to the target. Print the zero-based indices in ascending order, or -1 if no pair exists. If multiple pairs exist, choose the first pair found by scanning the array from left to right and using the earliest matching previous index.",
    inputFormat:
      "First line: N and target. Second line: N integers.",
    outputFormat:
      "Two zero-based indices or -1.",
    sampleInput: "4 9\n2 7 11 15",
    sampleOutput: "0 1",
    tests: [
      test("4 9\n2 7 11 15", "0 1"),
      test("3 6\n3 2 4", "1 2"),
      test("2 6\n3 3", "0 1", true),
      test("3 10\n1 2 3", "-1", true),
    ],
    javaCode: `
        int n = sc.nextInt();
        long target = sc.nextLong();
        Map<Long, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            long x = sc.nextLong();
            if (map.containsKey(target - x)) {
                System.out.println(map.get(target - x) + " " + i);
                return;
            }
            map.putIfAbsent(x, i);
        }
        System.out.println(-1);
    `,
    pythonCode: `
import sys
a = list(map(int, sys.stdin.read().split()))
n, target = a[0], a[1]
nums = a[2:2+n]
seen = {}
for i, x in enumerate(nums):
    if target - x in seen:
        print(seen[target - x], i)
        break
    if x not in seen:
        seen[x] = i
else:
    print(-1)
    `,
    skills: ["Arrays", "Hash Map"],
  }),

  makeProblem({
    title: "Valid Parentheses",
    difficulty: "Medium",
    category: "Stack",
    description:
      "Check whether a string of (), {}, and [] brackets is balanced and correctly nested.",
    inputFormat: "One bracket string.",
    outputFormat: "Valid or Invalid.",
    sampleInput: "{[()]}",
    sampleOutput: "Valid",
    tests: [
      test("{[()]}", "Valid"),
      test("([)]", "Invalid"),
      test("((()))", "Valid", true),
      test("(()", "Invalid", true),
    ],
    javaCode: `
        String s = sc.nextLine();
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) {
                    System.out.println("Invalid");
                    return;
                }
                char t = stack.pop();
                if ((c == ')' && t != '(') ||
                    (c == ']' && t != '[') ||
                    (c == '}' && t != '{')) {
                    System.out.println("Invalid");
                    return;
                }
            }
        }
        System.out.println(stack.isEmpty() ? "Valid" : "Invalid");
    `,
    pythonCode: `
s = input()
stack = []
pairs = {')': '(', ']': '[', '}': '{'}
valid = True
for c in s:
    if c in "([{":
        stack.append(c)
    elif not stack or stack.pop() != pairs[c]:
        valid = False
        break
print("Valid" if valid and not stack else "Invalid")
    `,
    skills: ["Stack", "Strings"],
  }),

  makeProblem({
    title: "Binary Search",
    difficulty: "Medium",
    category: "Searching",
    description:
      "Find the first zero-based index of a target in a sorted array. Print -1 if absent.",
    inputFormat:
      "First line: N and target. Second line: N sorted integers.",
    outputFormat: "First matching index or -1.",
    sampleInput: "5 7\n1 3 5 7 9",
    sampleOutput: "3",
    tests: [
      test("5 7\n1 3 5 7 9", "3"),
      test("4 6\n1 3 5 7", "-1"),
      test("5 2\n1 2 2 2 3", "1", true),
      test("1 9\n9", "0", true),
    ],
    javaCode: `
        int n = sc.nextInt();
        long target = sc.nextLong();
        long[] a = new long[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextLong();
        int l = 0, r = n - 1, ans = -1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (a[mid] >= target) {
                if (a[mid] == target) ans = mid;
                r = mid - 1;
            } else {
                l = mid + 1;
            }
        }
        System.out.println(ans);
    `,
    pythonCode: `
import sys
a = list(map(int, sys.stdin.read().split()))
n, target = a[0], a[1]
nums = a[2:2+n]
l, r, ans = 0, n - 1, -1
while l <= r:
    mid = (l + r) // 2
    if nums[mid] >= target:
        if nums[mid] == target:
            ans = mid
        r = mid - 1
    else:
        l = mid + 1
print(ans)
    `,
    skills: ["Binary Search"],
  }),

  makeProblem({
    title: "Maximum Subarray Sum",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description:
      "Find the maximum sum of a non-empty contiguous subarray.",
    inputFormat:
      "First integer N, followed by N integers.",
    outputFormat: "Maximum subarray sum.",
    sampleInput: "5\n-2 1 -3 4 5",
    sampleOutput: "9",
    tests: [
      test("5\n-2 1 -3 4 5", "9"),
      test("3\n1 2 3", "6"),
      test("3\n-5 -2 -7", "-2", true),
      test("1\n8", "8", true),
    ],
    javaCode: `
        int n = sc.nextInt();
        long current = sc.nextLong();
        long best = current;
        for (int i = 1; i < n; i++) {
            long x = sc.nextLong();
            current = Math.max(x, current + x);
            best = Math.max(best, current);
        }
        System.out.println(best);
    `,
    pythonCode: `
import sys
a = list(map(int, sys.stdin.read().split()))
nums = a[1:1+a[0]]
current = best = nums[0]
for x in nums[1:]:
    current = max(x, current + x)
    best = max(best, current)
print(best)
    `,
    skills: ["Kadane Algorithm", "Dynamic Programming"],
  }),

  // ==========================================
  // HARD — 4 PROBLEMS
  // ==========================================

  makeProblem({
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Hard",
    category: "Sliding Window",
    description:
      "Find the length of the longest substring containing no repeated characters.",
    inputFormat: "One string.",
    outputFormat: "Maximum length.",
    sampleInput: "abcabcbb",
    sampleOutput: "3",
    tests: [
      test("abcabcbb", "3"),
      test("bbbbb", "1"),
      test("pwwkew", "3", true),
      test("abcdef", "6", true),
    ],
    javaCode: `
        String s = sc.nextLine();
        Map<Character, Integer> last = new HashMap<>();
        int left = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (last.containsKey(c)) {
                left = Math.max(left, last.get(c) + 1);
            }
            last.put(c, i);
            best = Math.max(best, i - left + 1);
        }
        System.out.println(best);
    `,
    pythonCode: `
s = input()
last = {}
left = 0
best = 0
for i, c in enumerate(s):
    if c in last:
        left = max(left, last[c] + 1)
    last[c] = i
    best = max(best, i - left + 1)
print(best)
    `,
    skills: ["Sliding Window", "Hash Map"],
  }),

  makeProblem({
    title: "Longest Increasing Subsequence",
    difficulty: "Hard",
    category: "Dynamic Programming",
    description:
      "Find the length of the longest strictly increasing subsequence. Elements do not need to be contiguous.",
    inputFormat:
      "First integer N, followed by N integers.",
    outputFormat: "LIS length.",
    sampleInput: "8\n10 9 2 5 3 7 101 18",
    sampleOutput: "4",
    tests: [
      test("8\n10 9 2 5 3 7 101 18", "4"),
      test("5\n1 2 3 4 5", "5"),
      test("5\n5 4 3 2 1", "1", true),
      test("6\n1 3 2 4 3 5", "4", true),
    ],
    javaCode: `
        int n = sc.nextInt();
        long[] tails = new long[n];
        int size = 0;
        for (int i = 0; i < n; i++) {
            long x = sc.nextLong();
            int l = 0, r = size;
            while (l < r) {
                int mid = (l + r) / 2;
                if (tails[mid] < x) l = mid + 1;
                else r = mid;
            }
            tails[l] = x;
            if (l == size) size++;
        }
        System.out.println(size);
    `,
    pythonCode: `
import sys
from bisect import bisect_left
a = list(map(int, sys.stdin.read().split()))
nums = a[1:1+a[0]]
tails = []
for x in nums:
    i = bisect_left(tails, x)
    if i == len(tails):
        tails.append(x)
    else:
        tails[i] = x
print(len(tails))
    `,
    skills: ["Dynamic Programming", "Binary Search"],
  }),

  makeProblem({
    title: "Coin Change",
    difficulty: "Hard",
    category: "Dynamic Programming",
    description:
      "Given unlimited coins of specified denominations, find the minimum number needed to make the target amount. Print -1 if impossible.",
    inputFormat:
      "First line: N and amount. Second line: N positive coin denominations.",
    outputFormat: "Minimum coin count or -1.",
    sampleInput: "3 11\n1 2 5",
    sampleOutput: "3",
    tests: [
      test("3 11\n1 2 5", "3"),
      test("1 3\n2", "-1"),
      test("3 0\n1 2 5", "0", true),
      test("2 6\n3 4", "2", true),
    ],
    javaCode: `
        int n = sc.nextInt();
        int amount = sc.nextInt();
        int[] coins = new int[n];
        for (int i = 0; i < n; i++) coins[i] = sc.nextInt();
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a) {
                    dp[a] = Math.min(dp[a], dp[a - c] + 1);
                }
            }
        }
        System.out.println(dp[amount] > amount ? -1 : dp[amount]);
    `,
    pythonCode: `
import sys
a = list(map(int, sys.stdin.read().split()))
n, amount = a[0], a[1]
coins = a[2:2+n]
dp = [amount + 1] * (amount + 1)
dp[0] = 0
for value in range(1, amount + 1):
    for coin in coins:
        if coin <= value:
            dp[value] = min(dp[value], dp[value-coin] + 1)
print(-1 if dp[amount] > amount else dp[amount])
    `,
    skills: ["Dynamic Programming", "Optimization"],
  }),

  makeProblem({
    title: "Trapping Rain Water",
    difficulty: "Hard",
    category: "Two Pointers",
    description:
      "Given non-negative bar heights of unit width, calculate the total units of rainwater trapped between them.",
    inputFormat:
      "First integer N, followed by N non-negative heights.",
    outputFormat: "Total trapped water.",
    sampleInput: "6\n4 2 0 3 2 5",
    sampleOutput: "9",
    tests: [
      test("6\n4 2 0 3 2 5", "9"),
      test("3\n1 2 3", "0"),
      test("3\n3 0 3", "3", true),
      test("5\n5 4 3 2 1", "0", true),
    ],
    javaCode: `
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int l = 0, r = n - 1;
        int leftMax = 0, rightMax = 0;
        long water = 0;
        while (l < r) {
            if (a[l] <= a[r]) {
                leftMax = Math.max(leftMax, a[l]);
                water += leftMax - a[l];
                l++;
            } else {
                rightMax = Math.max(rightMax, a[r]);
                water += rightMax - a[r];
                r--;
            }
        }
        System.out.println(water);
    `,
    pythonCode: `
import sys
a = list(map(int, sys.stdin.read().split()))
h = a[1:1+a[0]]
l, r = 0, len(h) - 1
left_max = right_max = water = 0
while l < r:
    if h[l] <= h[r]:
        left_max = max(left_max, h[l])
        water += left_max - h[l]
        l += 1
    else:
        right_max = max(right_max, h[r])
        water += right_max - h[r]
        r -= 1
print(water)
    `,
    skills: ["Two Pointers", "Arrays"],
  }),
];

// ==========================================
// SAFE MONGODB SEEDING
// ==========================================

async function seedCodingProblems() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    let created = 0;
    let updated = 0;

    for (const problem of problems) {
      const result = await CodingProblem.updateOne(
        { title: problem.title },
        { $set: problem },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        created++;
      } else {
        updated++;
      }

      console.log(
        `[${problem.difficulty}] ${problem.title}`
      );
    }

    console.log("----------------------------");
    console.log("Coding problems seeded successfully");
    console.log("Created:", created);
    console.log("Updated:", updated);
    console.log("Total processed:", problems.length);
    console.log("Easy: 4 | Medium: 4 | Hard: 4");
  } catch (error) {
    console.error(
      "Failed to seed coding problems:",
      error.message
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedCodingProblems();
