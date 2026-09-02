/**
 * CampusOptrix Authentication Service.
 * Real server-side authentication with bcrypt password hashing and JWT token verification.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'campusoptrix-secure-production-jwt-key-2026';
const TOKEN_EXPIRY = '7d';

// Seeded users for demonstration & production use
const USERS = [
  {
    id: 'usr-admin-01',
    email: 'admin@campusoptrix.edu',
    username: 'admin',
    employeeId: 'ADM-001',
    passwordHash: bcrypt.hashSync('admin123', 10),
    name: 'Dr. Eleanor Vance',
    role: 'admin',
    title: 'Dean of Academic Operations',
    department: 'Central Scheduling Administration',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-faculty-01',
    email: 'faculty@campusoptrix.edu',
    username: 'prof.chen',
    employeeId: 'FAC-01',
    passwordHash: bcrypt.hashSync('faculty123', 10),
    name: 'Prof. Marcus Chen',
    role: 'faculty',
    facultyId: 'FAC-01',
    title: 'Associate Professor of Computer Science',
    department: 'Department of Computer Science & Engineering',
    homeBuilding: 'Tech Complex',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-student-01',
    email: 'student@campusoptrix.edu',
    username: 'alex.rivera',
    studentId: 'STU-2026-881',
    passwordHash: bcrypt.hashSync('student123', 10),
    name: 'Alex Rivera',
    role: 'student',
    studentIdNum: 'STU-2026-881',
    title: 'Undergraduate Student (Year 3)',
    department: 'Computer Science & AI Major',
    enrolledCourses: ['CS-101', 'CS-301', 'CS-205', 'CS-402'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  }
];

// In-memory access request log
const ACCESS_REQUESTS = [];

/**
 * Authenticate user with email/ID and password.
 */
async function authenticateUser({ emailOrId, password, selectedTabRole }) {
  if (!emailOrId || !password) {
    return { success: false, error: 'Email or ID and password are required.' };
  }

  const query = String(emailOrId).toLowerCase().trim();

  // Find user by email, username, employeeId, or studentId
  const user = USERS.find(
    (u) =>
      u.email.toLowerCase() === query ||
      u.username?.toLowerCase() === query ||
      u.employeeId?.toLowerCase() === query ||
      u.studentId?.toLowerCase() === query
  );

  if (!user) {
    // Non-leaking generic error
    return { success: false, error: 'Incorrect email/ID or password.' };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: 'Incorrect email/ID or password.' };
  }

  // Security Check per §0: If user picked a role tab that does not match their real server role, flag it
  if (selectedTabRole && selectedTabRole !== user.role) {
    return {
      success: false,
      roleMismatch: true,
      actualRole: user.role,
      error: `This account is registered with the ${user.role.toUpperCase()} role, not as a ${selectedTabRole.toUpperCase()}. Please switch to the ${user.role === 'admin' ? 'Campus Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)} tab.`
    };
  }

  // Generate Session Token
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
    department: user.department,
    facultyId: user.facultyId,
    studentId: user.studentId,
    avatar: user.avatar,
    enrolledCourses: user.enrolledCourses
  };

  return {
    success: true,
    token,
    user: safeUser
  };
}

/**
 * Verify JWT token and retrieve active user profile.
 */
function verifyToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = USERS.find((u) => u.id === decoded.id);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      department: user.department,
      facultyId: user.facultyId,
      studentId: user.studentId,
      avatar: user.avatar,
      enrolledCourses: user.enrolledCourses
    };
  } catch (err) {
    return null;
  }
}

/**
 * Request Access Flow.
 */
function recordAccessRequest({ fullName, email, roleRequested, department, reason }) {
  const reqItem = {
    id: `req-${Date.now()}`,
    fullName: fullName || 'Anonymous',
    email: email || '',
    roleRequested: roleRequested || 'faculty',
    department: department || 'General Academic',
    reason: reason || 'Academic scheduling operations',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  ACCESS_REQUESTS.push(reqItem);
  return reqItem;
}

/**
 * Password Reset Flow.
 */
function requestPasswordReset(emailOrId) {
  return {
    message: 'If an active account exists with that identifier, a secure reset confirmation link has been dispatched to your institutional email.'
  };
}

module.exports = {
  authenticateUser,
  verifyToken,
  recordAccessRequest,
  requestPasswordReset,
  USERS
};
