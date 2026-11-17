import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// Database connection pool
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "root",
  database: process.env.DB_NAME || "evangadi_forum",
});

const ensureParams = (params) => {
  if (params === undefined || params === null) {
    throw new Error("SQL parameters are required");
  }
  const isArray = Array.isArray(params);
  const isObject = !isArray && typeof params === "object";
  if (!isArray && !isObject) {
    throw new Error("SQL parameters must be an array or object");
  }
};

// In-memory mock data store for local dev when MySQL is unavailable
const defaultHashedPassword = bcrypt.hashSync("password123", 10);

const mockUsers = [
  {
    user_id: 1,
    first_name: "Abebe",
    last_name: "Kebede",
    email: "abebe@example.com",
    password_hash: defaultHashedPassword,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    user_id: 2,
    first_name: "new",
    last_name: "user",
    email: "user@example.com",
    password_hash: defaultHashedPassword,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    user_id: 99,
    first_name: "Demo",
    last_name: "Student",
    email: "demo@example.com",
    password_hash: defaultHashedPassword,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockQuestions = [
  {
    question_id: 1,
    question_hash: "a1b2c3d4e5f67890",
    user_id: 1,
    first_name: "Abebe",
    last_name: "Kebede",
    title: "React Router: useParams() returns undefined after hard refresh on dynamic route",
    content: `### What I'm trying to do\nI have a route like \`/questions/:questionHash\` and I read the param using \`useParams()\`. \n\n### Expected\nRefreshing the page on \`/questions/a1b2c3d4e5f67890\` should still show the question details.\n\n### Actual\nAfter a hard refresh, \`questionHash\` is \`undefined\` and my fetch call fails.\n\n### Code\n\`\`\`javascript\nimport { useParams } from 'react-router-dom';\n\nexport default function QuestionDetail() {\n  const { questionHash } = useParams();\n  // fetch(\`/api/questions/\${questionHash}\`)\n}\n\`\`\`\n\n### Environment\n- React: 19\n- react-router-dom: 7.x\n- Vite\n\nWhat are the common causes for this (route config vs server fallback), and what should I verify first?`,
    created_at: "2026-05-01T12:00:00Z",
    updated_at: "2026-05-01T12:00:00Z",
    answer_count: 1,
  },
  {
    question_id: 2,
    question_hash: "b2c3d4e5f6a12345",
    user_id: 2,
    first_name: "New",
    last_name: "User",
    title: "Why does my React state reset after route navigation?",
    content: "I store a draft in component state, navigate to another route, then come back and the draft is gone. What should I persist and where?",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    answer_count: 0,
  },
  {
    question_id: 3,
    question_hash: "c3d4e5f6a1b23456",
    user_id: 1,
    first_name: "Abebe",
    last_name: "Kebede",
    title: "Understanding React useEffect dependency array",
    content: "How does the dependency array in useEffect work when dealing with object references and async functions?",
    created_at: "2026-04-18T10:00:00Z",
    updated_at: "2026-04-18T10:00:00Z",
    answer_count: 2,
  },
  {
    question_id: 4,
    question_hash: "d4e5f6a1b2c34567",
    user_id: 2,
    first_name: "New",
    last_name: "User",
    title: "How to fix CORS error in Node.js Express backend?",
    content: "When calling my Express API from Vite frontend on port 5173, I receive a CORS header error. How do I configure cors middleware properly?",
    created_at: "2026-04-18T14:00:00Z",
    updated_at: "2026-04-18T14:00:00Z",
    answer_count: 1,
  },
  {
    question_id: 5,
    question_hash: "e5f6a1b2c3d45678",
    user_id: 1,
    first_name: "Abebe",
    last_name: "Kebede",
    title: "Understanding Closures in JavaScript",
    content: "Can someone provide a clear explanation with code examples of how lexical scoping and closures work in modern JS?",
    created_at: "2026-04-19T09:00:00Z",
    updated_at: "2026-04-19T09:00:00Z",
    answer_count: 3,
  },
];

const mockAnswers = [
  {
    answer_id: 1,
    question_id: 1,
    user_id: 2,
    first_name: "new",
    last_name: "user",
    content: `**Most common cause on hard refresh:** the browser asks the server for \`/questions/a1b2c3d4e5f67890\`. If the server is not configured to serve your SPA's \`index.html\` for that path, you get a 404 or a different document—your React app may not mount with the route you expect, or a fallback page loads without the router seeing the URL.\n\n**Verify first:** (1) **Dev/prod server:** Vite preview/production needs SPA fallback (history API) so every path returns \`index.html\`. (2) **Route definition:** confirm a parent \`<Route path="/questions/:questionHash" ...>\` (or equivalent) exists and matches the URL you refresh on—typos, missing \`:param\`, or a different \`basename\` break \`useParams()\`. (3) **Quick sanity check:** after refresh, log \`window.location.pathname\` and compare to your declared routes. If the path is correct but \`useParams()\` is still wrong, the mismatch is almost always in the route tree (nested routes, relative paths, or duplicate routers).`,
    created_at: "2026-05-01T15:00:00Z",
    updated_at: "2026-05-01T15:00:00Z",
  },
];

function executeMockQuery(sql, params) {
  const norm = sql.toLowerCase().replace(/\s+/g, " ");

  // 1. SELECT question by hash
  if (norm.includes("from questions") && norm.includes("q.question_hash = ?")) {
    const hash = params[0];
    const q = mockQuestions.find((item) => item.question_hash === hash);
    return q ? [q] : [];
  }

  // 2. SELECT question by question_id
  if (norm.includes("from questions") && (norm.includes("where question_id = ?") || norm.includes("where q.question_id = ?"))) {
    const qid = Number(params[0]);
    const q = mockQuestions.find((item) => item.question_id === qid);
    return q ? [q] : [];
  }

  // 3. SELECT answers by question_id
  if (norm.includes("from answers") && norm.includes("where a.question_id = ?")) {
    const qid = Number(params[0]);
    return mockAnswers.filter((a) => a.question_id === qid);
  }

  // 4. INSERT INTO answers
  if (norm.includes("insert into answers")) {
    const [qid, uid, content] = params;
    const author = mockUsers.find((u) => u.user_id === Number(uid)) || {
      first_name: "Student",
      last_name: "User",
    };
    const newAnswer = {
      answer_id: mockAnswers.length + 1,
      question_id: Number(qid),
      user_id: Number(uid),
      first_name: author.first_name,
      last_name: author.last_name,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockAnswers.push(newAnswer);

    const question = mockQuestions.find((q) => q.question_id === Number(qid));
    if (question) {
      question.answer_count = (question.answer_count || 0) + 1;
    }

    return { insertId: newAnswer.answer_id };
  }

  // 5. SELECT answer by answer_id
  if (norm.includes("from answers") && norm.includes("where a.answer_id = ?")) {
    const aid = Number(params[0]);
    const ans = mockAnswers.find((a) => a.answer_id === aid);
    return ans ? [ans] : [];
  }

  // 6. SELECT questions list / similar
  if (norm.includes("from questions") && norm.includes("where q.question_id !=")) {
    const excludeId = Number(params[0]);
    const limit = Number(params[1]) || 5;
    return mockQuestions
      .filter((q) => q.question_id !== excludeId)
      .slice(0, limit);
  }

  if (norm.includes("from questions")) {
    return mockQuestions;
  }

  // 7. Users queries
  if (norm.includes("from users where email = ?")) {
    const email = params[0]?.toLowerCase();
    const user = mockUsers.find((u) => u.email === email);
    return user ? [user] : [];
  }

  if (norm.includes("insert into users")) {
    const [first, last, email, pwd] = params;
    const newUser = {
      user_id: mockUsers.length + 1,
      first_name: first,
      last_name: last,
      email,
      password_hash: pwd,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return { insertId: newUser.user_id };
  }

  return [];
}

export const safeExecute = async (sql, params) => {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("SQL query must be a non-empty string");
  }
  ensureParams(params);
  try {
    const [result] = await db.execute(sql, params);
    return result;
  } catch (err) {
    if (
      err.code === "ECONNREFUSED" ||
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ENOTFOUND" ||
      err.message?.includes("connect")
    ) {
      return executeMockQuery(sql, params);
    }
    throw err;
  }
};
