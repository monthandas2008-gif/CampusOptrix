/**
 * Express REST API Routes for CampusOptrix Gateway.
 * Proxies requests to FastAPI Python backend (http://localhost:8000),
 * hosts the CampusOptrix AI Assistant service, and provides server-side Auth.
 */

const express = require('express');
const axios = require('axios');
const { processAssistantMessage } = require('./assistantService');
const {
  authenticateUser,
  verifyToken,
  recordAccessRequest,
  requestPasswordReset
} = require('./authService');

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Health check
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_URL}/health`);
    res.json({ gateway: 'ok', backend: response.data });
  } catch (err) {
    res.status(503).json({ gateway: 'ok', backend: 'unreachable', error: err.message });
  }
});

// ==========================================
// Authentication Routes
// ==========================================

router.post('/auth/login', async (req, res) => {
  try {
    const { emailOrId, password, selectedTabRole } = req.body;
    const result = await authenticateUser({ emailOrId, password, selectedTabRole });
    if (!result.success) {
      return res.status(401).json({
        error: result.error,
        roleMismatch: result.roleMismatch || false,
        actualRole: result.actualRole || null
      });
    }
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication service encountered an unexpected issue.' });
  }
});

router.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
  res.json({ user });
});

router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

router.post('/auth/forgot-password', (req, res) => {
  const { emailOrId } = req.body;
  const result = requestPasswordReset(emailOrId);
  res.json(result);
});

router.post('/auth/request-access', (req, res) => {
  const { fullName, email, roleRequested, department, reason } = req.body;
  const newReq = recordAccessRequest({ fullName, email, roleRequested, department, reason });
  res.json({
    success: true,
    message: 'Your request has been sent to the Operations Office — an administrator will review it shortly.',
    requestId: newReq.id
  });
});

// ==========================================
// Core Campus Optimization & Simulation Routes
// ==========================================

// Initial State (Rooms, Faculty, Timetable, Distances)
router.get('/initial-state', async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_URL}/api/initial-state`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch initial state', details: err.response?.data || err.message });
  }
});

// Analyze current schedule
router.post('/analyze', async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/analyze`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed', details: err.response?.data || err.message });
  }
});

// Run OR-Tools Optimization
router.post('/optimize', async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/optimize`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Optimization failed', details: err.response?.data || err.message });
  }
});

// What-If manual drag recompute
router.post('/whatif', async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/whatif`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'What-If recompute failed', details: err.response?.data || err.message });
  }
});

// Conflict-Free New Event Scheduler
router.post('/new-event', async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/new-event`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Event scheduling failed', details: err.response?.data || err.message });
  }
});

// Rejection Audit
router.post('/rejection-audit', async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/rejection-audit`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Rejection audit failed', details: err.response?.data || err.message });
  }
});

// Reset to baseline
router.post('/reset', async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/reset`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Reset failed', details: err.response?.data || err.message });
  }
});

// CampusOptrix AI Assistant Message Endpoint
router.post('/assistant/message', async (req, res) => {
  try {
    const { message, assistantContext, conversationId, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message string is required.' });
    }

    let populatedContext = assistantContext || {};
    if (!populatedContext.rooms || populatedContext.rooms.length === 0) {
      try {
        const initRes = await axios.get(`${FASTAPI_URL}/api/initial-state`);
        populatedContext.rooms = initRes.data.rooms || [];
        populatedContext.timetable = initRes.data.timetable || [];
      } catch (e) {
        console.warn('Could not auto-fetch initial state for assistant context:', e.message);
      }
    }

    if (!populatedContext.currentRecommendations || populatedContext.currentRecommendations.length === 0) {
      try {
        const optRes = await axios.post(`${FASTAPI_URL}/optimize`, {
          timetable: populatedContext.timetable || []
        });
        populatedContext.currentRecommendations = optRes.data.reallocations || [];
      } catch (e) {
        // silent fallback
      }
    }

    if (!populatedContext.currentConflicts) {
      try {
        const analyzeRes = await axios.post(`${FASTAPI_URL}/analyze`, {
          timetable: populatedContext.timetable || [],
          rooms: populatedContext.rooms || []
        });
        populatedContext.currentConflicts = analyzeRes.data.conflicts || [];
        populatedContext.currentUtilization = analyzeRes.data.avg_utilization_pct || 70.0;
        populatedContext.currentUDS = analyzeRes.data.total_campus_uds || 35.0;
      } catch (e) {
        // silent fallback
      }
    }

    const response = await processAssistantMessage({
      message,
      assistantContext: populatedContext,
      conversationId: conversationId || 'default',
      history: history || []
    });

    res.json(response);
  } catch (err) {
    console.error('Error in /api/assistant/message:', err);
    res.status(500).json({
      error: 'Assistant processing failed.',
      message: 'CampusOptrix Assistant is temporarily unavailable. Core CampusOptrix tools are still active.'
    });
  }
});

module.exports = router;
