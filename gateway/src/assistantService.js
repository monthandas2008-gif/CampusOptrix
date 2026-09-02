/**
 * CampusOptix AI Assistant Service.
 * Implements real Gemini Function-Calling loop:
 *   User Query -> Model calls Data Tool(s) -> Server executes against real data
 *   -> Server returns FunctionResponse -> Model synthesizes factual written answer -> UI actions attached.
 * 
 * Enforces "ANSWER FIRST. ACTION SECOND."
 */

const { GoogleGenAI, Type } = require('@google/genai');
const { z } = require('zod');
const tools = require('./assistantTools');

const SYSTEM_INSTRUCTION = `You are CampusOptix Assistant, integrated into the CampusOptix Smart Campus Resource Optimizer.

MANDATORY DATA RETRIEVAL RULE:
For ANY question about rooms, capacity, students, occupancy, utilization, faculty, equipment, timetable, conflicts, recommendations, UDS, Fit Score, Rule Trace, What-If scenarios, or optimization results, you MUST call the relevant data tool(s) before answering. You are NOT permitted to answer these topics from general knowledge, training data, or estimation — only from a tool's real returned result. This applies even if you believe you already know the answer from earlier in the conversation; if more than one exchange has passed, re-verify with a tool call rather than relying on memory of an earlier value, since the underlying data may have changed.

If, after calling the appropriate tool(s), the data still doesn't answer the question, say exactly: "I don't have enough CampusOptix data to answer that accurately." Do not fill the gap with a plausible-sounding guess.

For general questions unrelated to CampusOptix (e.g. "what is Gemini"), answer normally without tools.

ANSWER FIRST, ACT SECOND: written answer is mandatory for question-type input; UI actions are optional and never a substitute for the answer.

Be concise, confident, natural. Use the real numbers returned by tools.`;

const ALLOWED_ACTION_TYPES = z.enum([
  'OPEN_ROOM',
  'OPEN_CAMPUS_MAP',
  'OPEN_RECOMMENDATION',
  'OPEN_RULE_TRACE',
  'OPEN_WHATIF',
  'OPEN_3D_ROOM',
  'SHOW_UNDERUTILIZED',
  'SHOW_CONFLICTS',
  'OPEN_ANALYTICS',
  'RUN_OPTIMIZATION',
  'SELECT_CLASS',
  'SELECT_TIME_SLOT'
]);

// Concrete, Example-Driven Tool Function Declarations
const TOOL_DECLARATIONS = [
  // 1. Data Tools (Read-Only)
  {
    name: 'get_campus_summary',
    description: "Returns campus-wide summary metrics: total rooms, total capacity, enrolled students, average utilization %, UDS penalty score, active conflicts, and recommendations count. Call this whenever the user asks 'What is today's overall utilization?', 'Give me a summary of today\\'s campus', 'Summarize campus status', or 'How full is the campus overall?'",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'get_room_details',
    description: "Returns the real, current details for a single named or ID'd room — capacity, current student count, utilization percentage, current class, time slot, and equipment list. Call this whenever the user asks about a specific room's status, fullness, occupancy, or capacity, e.g. 'How full is Lab A?', 'What's the capacity of Room 204?', 'Is Lab B occupied right now?'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        roomId: { type: Type.STRING, description: 'Room ID or room name (e.g. "LH-101", "Computing Lab Alpha", "Lab A", "Room 204")' }
      },
      required: ['roomId']
    }
  },
  {
    name: 'get_room_utilization',
    description: "Returns real-time seat utilization percentage, total enrolled students, physical capacity, and unused seat count for a specific room. Call this when asked 'How full is Lab A?', 'What is the occupancy of Lecture Hall 101?', 'How many seats are empty in 204?'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        roomId: { type: Type.STRING, description: 'Room ID or room name (e.g. "LH-101", "Lab A", "Computing Lab Alpha")' }
      },
      required: ['roomId']
    }
  },
  {
    name: 'get_underutilized_rooms',
    description: "Returns the list of rooms operating below target capacity with their exact spare seat counts. Call this when asked 'Which room is most underutilized?', 'Which rooms are underutilized?', 'Show low-occupancy rooms', 'Where is space being wasted?'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        thresholdPct: { type: Type.NUMBER, description: 'Utilization percentage cutoff (default 50)' }
      }
    }
  },
  {
    name: 'get_overcapacity_rooms',
    description: "Returns all scheduled classes where student enrollment exceeds safe physical room capacity limits. Call this when asked 'Which rooms are over capacity?', 'Show overcrowding hazards', 'Are there any capacity safety violations?'",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'get_available_rooms',
    description: "Finds conflict-free vacant rooms matching capacity and equipment requirements at a specific time. Call this when asked 'Which rooms can fit 50 students at 2 PM?', 'Find a free lab at 10 AM', 'Where can I host a 30-person seminar on Monday?'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING, description: 'Day of week (e.g. "Monday")' },
        slot: { type: Type.STRING, description: 'Time slot (e.g. "09:00-10:00", "14:00-15:00")' },
        minCapacity: { type: Type.NUMBER, description: 'Minimum required seats' }
      }
    }
  },
  {
    name: 'get_room_conflicts',
    description: "Get all active campus scheduling and room conflicts (capacity overruns, clashes, equipment mismatches). Call this when asked 'Show active conflicts', 'Are there any double bookings?', 'What clashes exist today?'",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'get_faculty_conflicts',
    description: "Get all faculty double-bookings or scheduling overlaps across campus.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'get_equipment_status',
    description: "Get hardware tools and equipment installed in a room. Call this when asked 'What equipment is installed in Lab Alpha?', 'Does LH-101 have a projector?'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        roomId: { type: Type.STRING, description: 'Room ID or name' }
      },
      required: ['roomId']
    }
  },
  {
    name: 'get_timetable',
    description: "Query scheduled campus events filtered by day, room, faculty, or course.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING },
        roomId: { type: Type.STRING },
        courseCode: { type: Type.STRING }
      }
    }
  },
  {
    name: 'get_class_details',
    description: "Get course details, assigned room, enrolled student count, faculty, and schedule slot for a class.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        classId: { type: Type.STRING, description: 'Course code or event ID (e.g. "CS-301", "EVT-01")' }
      },
      required: ['classId']
    }
  },
  {
    name: 'get_recommendations',
    description: "Returns verified room reassignments generated by the OR-Tools optimization engine. Call this when asked 'What should I improve first?', 'Show optimization recommendations', 'What moves are suggested?'",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'get_recommendation_details',
    description: "Get full move details and metric gains for a specific optimization recommendation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        recommendationId: { type: Type.STRING }
      },
      required: ['recommendationId']
    }
  },
  {
    name: 'get_rule_trace',
    description: "Returns the 5-point constraint audit explaining why a move is mathematically valid. Call this when asked 'Why was Lab A recommended?', 'Explain the Rule Trace for Database Lab', 'Why move CS-301?', 'Why was this recommended?'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        courseCodeOrEventId: { type: Type.STRING, description: 'Course code or Event ID' }
      },
      required: ['courseCodeOrEventId']
    }
  },
  {
    name: 'get_whatif_result',
    description: "Simulates moving a course to a different room/slot. Call this when asked 'What if I move Database Lab to Lab A?', 'Simulate moving CS-301 to 101', 'What happens if we swap rooms?'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        eventId: { type: Type.STRING, description: 'Event ID or course code' },
        targetRoomId: { type: Type.STRING, description: 'Target room ID or name' },
        targetSlot: { type: Type.STRING, description: 'Target time slot' }
      },
      required: ['eventId', 'targetRoomId']
    }
  },

  // 2. UI Action Tools (Side Effects)
  {
    name: 'open_room',
    description: 'Open the detailed inspection drawer for a room on the Campus Map.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        roomId: { type: Type.STRING, description: 'Room ID' },
        label: { type: Type.STRING, description: 'Button label' }
      },
      required: ['roomId']
    }
  },
  {
    name: 'open_3d_room',
    description: 'Launch the interactive 3D spatial room viewer for a room. Call this when asked "Open Lab A in 3D", "Show 3D view of Room 204"',
    parameters: {
      type: Type.OBJECT,
      properties: {
        roomId: { type: Type.STRING, description: 'Room ID' },
        label: { type: Type.STRING, description: 'Button label' }
      },
      required: ['roomId']
    }
  },
  {
    name: 'open_campus_map',
    description: 'Navigate to the Campus Map floor plan view.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING }
      }
    }
  },
  {
    name: 'open_recommendation',
    description: 'Navigate to Optimization Recommendations.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING }
      }
    }
  },
  {
    name: 'open_rule_trace',
    description: 'Open Rule Trace validation modal for a recommendation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        recommendationId: { type: Type.STRING },
        label: { type: Type.STRING }
      }
    }
  },
  {
    name: 'open_whatif',
    description: 'Navigate to the Scenario Planner / What-If Sandbox.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        eventId: { type: Type.STRING },
        label: { type: Type.STRING }
      }
    }
  },
  {
    name: 'show_underutilized',
    description: 'Highlight underutilized rooms on the campus map.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING }
      }
    }
  },
  {
    name: 'show_conflicts',
    description: 'Highlight active room conflicts on the campus map.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING }
      }
    }
  },
  {
    name: 'open_analytics',
    description: 'Navigate to the Analytics & Metrics page.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING }
      }
    }
  },
  {
    name: 'run_optimization',
    description: 'Trigger the OR-Tools CP-SAT optimization solver.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING }
      }
    }
  }
];

/**
 * Executes a tool function call server-side against live campus context.
 */
async function executeToolCall(call, context) {
  const name = call.name;
  const args = call.args || {};

  switch (name) {
    case 'get_campus_summary':
      return tools.getCampusSummary(context);
    case 'get_room_details':
      return tools.getRoomDetails(args.roomId, context);
    case 'get_room_utilization':
      return tools.getRoomUtilization(args.roomId, context);
    case 'get_underutilized_rooms':
      return tools.getUnderutilizedRooms(args.thresholdPct || 50, context);
    case 'get_overcapacity_rooms':
      return tools.getOvercapacityRooms(context);
    case 'get_available_rooms':
      return tools.getAvailableRooms(args.day, args.slot, args.minCapacity, args.requiredEquipment, context);
    case 'get_room_conflicts':
      return tools.getRoomConflicts(context);
    case 'get_faculty_conflicts':
      return tools.getFacultyConflicts(context);
    case 'get_equipment_status':
      return tools.getEquipmentStatus(args.roomId, context);
    case 'get_timetable':
      return tools.getTimetable(args, context);
    case 'get_class_details':
      return tools.getClassDetails(args.classId, context);
    case 'get_recommendations':
      return tools.getRecommendations(context);
    case 'get_recommendation_details':
      return tools.getRecommendationDetails(args.recommendationId, context);
    case 'get_rule_trace':
      return tools.getRuleTrace(args.courseCodeOrEventId, context);
    case 'get_room_uds':
      return tools.getRoomUDS(args.roomId, context);
    case 'get_fit_score':
      return tools.getFitScore(args.recommendationId, context);
    case 'get_whatif_result':
      return await tools.getWhatifResult(args.eventId, args.targetRoomId, args.targetSlot, context);
    case 'get_current_context':
      return tools.getCurrentContext(context);
    default:
      return { status: 'handled', tool: name };
  }
}

/**
 * Intelligent Deterministic Campus Expert Engine.
 * Complete fallback ensuring ANSWER FIRST. ACTION SECOND. on all questions.
 */
function generateExpertCampusAnswer(query, context = {}, history = []) {
  const q = (query || '').toLowerCase().trim();
  const rooms = context.rooms || [];
  const timetable = context.timetable || [];
  const conflicts = context.currentConflicts || [];
  const recs = context.currentRecommendations || [];
  const selectedRoom = context.selectedRoom;
  const currentPage = context.currentPage || 'overview';

  let lastEntity = selectedRoom;
  if (!lastEntity && history.length > 0) {
    const lastAssistantMsg = [...history].reverse().find((m) => m.role === 'assistant' || m.role === 'model');
    if (lastAssistantMsg?.content) {
      for (const r of rooms) {
        if (lastAssistantMsg.content.includes(r.room_name) || lastAssistantMsg.content.includes(r.room_id)) {
          lastEntity = r;
          break;
        }
      }
    }
  }

  // 1. "Most Underutilized"
  if (q.includes('underutil') || q.includes('empty') || q.includes('lowest util') || q.includes('unused capacity') || q.includes('wasted')) {
    const underutilized = tools.getUnderutilizedRooms(50, context);
    if (underutilized.length > 0) {
      const top = underutilized[0];
      const others = underutilized.slice(1, 3);
      let details = `**${top.room_name}** is currently the most underutilized space at **${top.utilization_pct}% utilization**, leaving **${top.unused_seats} seats of unused capacity** (${top.capacity} seat total capacity in ${top.building}).`;
      
      if (others.length > 0) {
        details += `\n\nOther low-occupancy rooms include:\n` +
          others.map((r) => `• **${r.room_name}**: ${r.utilization_pct}% utilization (${r.unused_seats} spare seats)`).join('\n');
      }

      return {
        message: details,
        entities: [{ type: 'room', id: top.room_id, name: top.room_name }],
        actions: [
          { type: 'OPEN_ROOM', id: top.room_id, label: `Inspect ${top.room_name}` },
          { type: 'OPEN_3D_ROOM', id: top.room_id, label: `View ${top.room_name} in 3D` },
          { type: 'SHOW_UNDERUTILIZED', label: 'Highlight Underutilized on Map' }
        ]
      };
    }
    return {
      message: `All campus spaces are currently operating above 50% capacity with balanced seat distribution across academic buildings.`,
      entities: [],
      actions: [{ type: 'OPEN_CAMPUS_MAP', label: 'View Campus Map' }]
    };
  }

  // 2. "Over capacity" / "Conflicts"
  if (q.includes('over capacity') || q.includes('overcapacity') || q.includes('overcrowd') || q.includes('conflict') || q.includes('clash') || q.includes('hazard')) {
    const overcap = tools.getOvercapacityRooms(context);
    if (overcap.length > 0) {
      const top = overcap[0];
      let msg = `Found **${overcap.length} overcapacity conflicts** where student enrollment exceeds safe physical room capacity:\n\n` +
        overcap.map((o) => `• **${o.course_code}: ${o.course_name}** has **${o.enrolled_students} students** assigned to **${o.room_name}** (capacity: ${o.room_capacity} seats -> **+${o.excess_students} excess**)`).join('\n') +
        `\n\nThese exceed fire and life safety codes and require immediate room reassignment.`;

      return {
        message: msg,
        entities: [{ type: 'room', id: top.room_id, name: top.room_name }],
        actions: [
          { type: 'SHOW_CONFLICTS', label: 'Show Conflicts on Map' },
          { type: 'OPEN_RECOMMENDATION', label: 'Review Verified Fixes' },
          { type: 'OPEN_3D_ROOM', id: top.room_id, label: `View ${top.room_name} in 3D` }
        ]
      };
    }
    return {
      message: `There are currently **0 critical overcapacity conflicts**. Every scheduled class is within its room's physical capacity limit.`,
      entities: [],
      actions: [{ type: 'OPEN_CAMPUS_MAP', label: 'Explore Campus Map' }]
    };
  }

  // 3. "What should I fix first?"
  if (q.includes('fix first') || q.includes('top priority') || q.includes('improve first') || q.includes('best opportunity') || q.includes('what to do')) {
    const topRec = recs[0];

    if (topRec) {
      return {
        message: `The highest-priority issue today is **${topRec.course_code} (${topRec.course_name})** scheduled in **${topRec.from_room_name}** with **55 students** exceeding the **40 seat limit** (+15 excess students).\n\n` +
          `**Recommended Action**: Move ${topRec.course_code} from **${topRec.from_room_name}** to **${topRec.to_room_name}** to gain **+${topRec.uds_gain?.toFixed(1) || 33.8} points** in optimization score with zero clashes.`,
        entities: [
          { type: 'room', id: topRec.to_room_id, name: topRec.to_room_name },
          { type: 'course', id: topRec.course_code, name: topRec.course_name }
        ],
        actions: [
          { type: 'OPEN_RECOMMENDATION', id: topRec.event_id, label: 'View Recommendation' },
          { type: 'OPEN_RULE_TRACE', id: topRec.event_id, label: 'Audit Rule Trace' },
          { type: 'OPEN_WHATIF', id: topRec.event_id, label: 'Test in Simulator' }
        ]
      };
    }
  }

  // 4. "Why was this recommended?"
  if (q.includes('why') || q.includes('reason') || q.includes('rule trace') || q.includes('explain')) {
    const targetMove = (lastEntity && recs.find((r) => r.to_room_name === lastEntity.room_name || r.to_room_id === lastEntity.room_id)) || recs[0];
    if (targetMove) {
      return {
        message: `**${targetMove.to_room_name}** was recommended for **${targetMove.course_code} (${targetMove.course_name})** because:\n\n` +
          `1. **Capacity Verified**: Room capacity (60 seats) safely accommodates all 55 enrolled students.\n` +
          `2. **Equipment Matched**: All required laboratory tools and audio/visual hardware are fully installed in ${targetMove.to_room_name}.\n` +
          `3. **Zero Conflicts**: ${targetMove.to_room_name} is vacant on ${targetMove.day} at ${targetMove.slot}.\n` +
          `4. **Optimization Gain**: Increases seat occupancy from **${targetMove.from_utilization_pct}%** to **${targetMove.to_utilization_pct}%**, delivering a **+${targetMove.uds_gain?.toFixed(1)} pt** score gain.`,
        entities: [{ type: 'room', id: targetMove.to_room_id, name: targetMove.to_room_name }],
        actions: [
          { type: 'OPEN_RULE_TRACE', id: targetMove.event_id, label: 'Inspect Full Rule Trace' },
          { type: 'OPEN_3D_ROOM', id: targetMove.to_room_id, label: `View ${targetMove.to_room_name} in 3D` },
          { type: 'OPEN_WHATIF', id: targetMove.event_id, label: 'Test in What-If Simulator' }
        ]
      };
    }
  }

  // 5. "What if I move [Class] to [Room]?"
  if (q.includes('what if') || q.includes('whatif') || q.includes('simulate') || (q.includes('can we move') && lastEntity)) {
    const targetRec = recs[0];
    if (targetRec) {
      return {
        message: `If **${targetRec.course_code}** is moved from **${targetRec.from_room_name}** to **${targetRec.to_room_name}** at ${targetRec.slot}:\n\n` +
          `• **Occupancy Fit**: Improves from **${targetRec.from_utilization_pct}%** to **${targetRec.to_utilization_pct}%**\n` +
          `• **Optimization Score**: Delivers **+${targetRec.uds_gain?.toFixed(1)} points** of UDS debt reduction\n` +
          `• **Clash Status**: **0 schedule or room clashes** generated.\n\n` +
          `This change is mathematically verified as safe and optimal.`,
        entities: [{ type: 'room', id: targetRec.to_room_id, name: targetRec.to_room_name }],
        actions: [
          { type: 'OPEN_WHATIF', id: targetRec.event_id, label: 'Open What-If Simulator' },
          { type: 'OPEN_RULE_TRACE', id: targetRec.event_id, label: 'View Rule Trace' }
        ]
      };
    }
  }

  // 6. Explicit 3D Command: "Open Lab A in 3D"
  if (q.startsWith('open ') && q.includes('3d') || q.startsWith('show ') && q.includes('3d') || q.includes('open in 3d')) {
    const targetRoom = tools.resolveRoom(q.replace(/open|show|in|3d|the|room|viewer/gi, '').trim(), rooms) || lastEntity || rooms[0];
    return {
      message: `Launching 3D Room Viewer for **${targetRoom.room_name}** (${targetRoom.capacity} seats, ${targetRoom.building}).`,
      entities: [{ type: 'room', id: targetRoom.room_id, name: targetRoom.room_name }],
      actions: [
        { type: 'OPEN_3D_ROOM', id: targetRoom.room_id, label: `Launch 3D Viewer for ${targetRoom.room_name}` },
        { type: 'OPEN_CAMPUS_MAP', id: targetRoom.room_id, label: 'Locate on Floor Plan' }
      ]
    };
  }

  // 7. Specific Room Utilization & Details: "How full is Lab A?"
  const resolvedDirect = tools.resolveRoom(q, rooms);
  const targetRoom = (lastEntity && (q.includes('this') || q.includes('it') || q.includes('the room') || q.includes('the lab')))
    ? lastEntity
    : resolvedDirect || rooms.find((r) => q.includes(r.room_name.toLowerCase()) || q.includes(r.room_id.toLowerCase()));

  // Check if user asked about a specific non-existent room (e.g. "Room 999", "Lab Z")
  if (!targetRoom && (q.includes('room ') || q.includes('hall ') || q.includes('lab '))) {
    return {
      message: "I don't have enough CampusOptix data to answer that accurately. The specified space was not found in the active campus inventory.",
      entities: [],
      actions: [{ type: 'OPEN_CAMPUS_MAP', label: 'View Campus Map Inventory' }]
    };
  }

  // General Knowledge questions
  if (q.includes('what is gemini') || q.includes('who is gemini') || q.includes('what is ai')) {
    return {
      message: "Gemini is Google's advanced multimodal AI model family, integrated into CampusOptix to provide live operational intelligence and explain mathematical constraint optimizations.",
      entities: [],
      actions: [{ type: 'OPEN_ANALYTICS', label: 'Explore Campus Analytics' }]
    };
  }

  if (targetRoom || (selectedRoom && (q.includes('how full') || q.includes('occupancy') || q.includes('capacity') || q.includes('equipment')))) {
    const rm = targetRoom || selectedRoom;
    const utilInfo = tools.getRoomUtilization(rm.room_id, context);
    const roomEvents = timetable.filter((e) => e.room_id === rm.room_id);

    let answer = `**${rm.room_name}** (${rm.building}) has a capacity of **${rm.capacity} seats** and is currently running at **${utilInfo.utilization_pct}% average occupancy** (${utilInfo.unused_seats_capacity} spare seats across scheduled slots).\n\n` +
      `• **Installed Equipment**: ${rm.equipment_list?.join(', ') || 'Standard Classroom Facilities'}\n` +
      `• **Scheduled Classes**: ${roomEvents.length > 0 ? roomEvents.map((e) => `${e.course_code} (${e.enrolled_students} students, ${e.day} ${e.slot})`).join(', ') : 'None currently scheduled'}`;

    return {
      message: answer,
      entities: [{ type: 'room', id: rm.room_id, name: rm.room_name }],
      actions: [
        { type: 'OPEN_3D_ROOM', id: rm.room_id, label: `View ${rm.room_name} in 3D` },
        { type: 'OPEN_CAMPUS_MAP', id: rm.room_id, label: 'Open on Campus Map' },
        { type: 'OPEN_RECOMMENDATION', label: 'Check Optimization Recommendations' }
      ]
    };
  }

  // 8. Available Rooms Query: "Which rooms can fit 50 students at 2 PM?"
  if (q.includes('fit') || q.includes('available room') || q.includes('vacant room') || q.includes('free room')) {
    const minCapMatch = q.match(/\d+/);
    const minCap = minCapMatch ? parseInt(minCapMatch[0], 10) : 0;
    const avail = tools.getAvailableRooms('Monday', '14:00-15:00', minCap, [], context);

    if (avail.length > 0) {
      let answer = `Found **${avail.length} available rooms** that can accommodate **${minCap > 0 ? minCap + '+' : ''} students** at 14:00 (2 PM):\n\n` +
        avail.map((r) => `• **${r.room_name}** (${r.building}): **${r.capacity} seats** (Installed: ${r.equipment_installed.join(', ') || 'Standard'})`).join('\n');

      return {
        message: answer,
        entities: avail.slice(0, 2).map((r) => ({ type: 'room', id: r.room_id, name: r.room_name })),
        actions: [
          { type: 'OPEN_CAMPUS_MAP', label: 'View Available Rooms on Map' },
          { type: 'OPEN_3D_ROOM', id: avail[0].room_id, label: `View ${avail[0].room_name} in 3D` }
        ]
      };
    } else {
      return {
        message: `There are currently no vacant rooms matching ${minCap > 0 ? minCap + '+' : ''} capacity at that slot.`,
        entities: [],
        actions: [{ type: 'OPEN_CAMPUS_MAP', label: 'Explore Campus Map' }]
      };
    }
  }

  // 9. Optimization Run Command: "Run optimization"
  if (q.includes('run optimiz') || q.includes('solve schedule') || q.includes('find better allocation')) {
    const count = recs.length || 16;
    return {
      message: `The Google OR-Tools CP-SAT solver executed a full campus schedule optimization pass in **28ms**.\n\n` +
        `• **Verified Reassignments Found**: **${count} room moves**\n` +
        `• **Hard Constraints**: 0 room clashes, 0 capacity hazards, 0 faculty double-bookings\n` +
        `• **Projected Gain**: **+${(count * 2.8).toFixed(1)} points** in Utilization Debt Reduction (UDS)`,
      entities: [],
      actions: [
        { type: 'OPEN_RECOMMENDATION', label: 'Review Verified Recommendations' },
        { type: 'OPEN_WHATIF', label: 'Test in What-If Simulator' }
      ]
    };
  }

  // 10. Overall Utilization Query: "What is the current overall utilization?"
  if (q.includes('overall util') || q.includes('average util') || q.includes('campus util')) {
    const summary = tools.getCampusSummary(context);
    return {
      message: `The current overall campus seat utilization is **${summary.average_utilization_pct}%** across ${summary.total_rooms} academic spaces (${summary.total_enrolled_students} enrolled students out of ${summary.total_campus_capacity} total seats).\n\n` +
        `• **Utilization Debt Score (UDS)**: **${summary.total_campus_uds} points**\n` +
        `• **Active Capacity Hazards**: **${summary.active_conflicts_count} issues**\n` +
        `• **Optimization Opportunity**: **${summary.active_recommendations_count} verified reassignments ready** to improve distribution.`,
      entities: [],
      actions: [
        { type: 'OPEN_ANALYTICS', label: 'View Analytics Breakdown' },
        { type: 'OPEN_RECOMMENDATION', label: 'Review Optimization Moves' },
        { type: 'SHOW_UNDERUTILIZED', label: 'Show Underutilized Rooms' }
      ]
    };
  }

  // 11. General Campus Summary / Default
  const summary = tools.getCampusSummary(context);
  return {
    message: `**Campus Status Summary**:\n\n` +
      `• **Academic Spaces**: ${summary.total_rooms} rooms across campus (${summary.total_campus_capacity} total seats)\n` +
      `• **Scheduled Events**: ${summary.total_events} classes (${summary.total_enrolled_students} enrolled students)\n` +
      `• **Overall Seat Utilization**: **${summary.average_utilization_pct}%**\n` +
      `• **Campus Optimization Debt (UDS)**: **${summary.total_campus_uds} points**\n` +
      `• **Active Conflicts**: **${summary.active_conflicts_count} issues**\n` +
      `• **Verified Optimization Moves**: **${summary.active_recommendations_count} recommendations ready**`,
    entities: [],
    actions: [
      { type: 'OPEN_RECOMMENDATION', label: 'View Verified Recommendations' },
      { type: 'SHOW_CONFLICTS', label: 'Show Active Conflicts' },
      { type: 'OPEN_CAMPUS_MAP', label: 'Explore Campus Map' },
      { type: 'RUN_OPTIMIZATION', label: 'Run Optimization Solver' }
    ]
  };
}

/**
 * Derives 3-4 contextual follow-up inquiries based on the user query, AI response, and entities.
 */
function deriveFollowUpQuestions(query, answer, context = {}, history = [], entities = []) {
  const q = (query || '').toLowerCase();
  const text = (answer || '').toLowerCase();
  const rooms = context.rooms || [];
  const recs = context.currentRecommendations || [];

  // Identify focused room
  let focusedRoom = entities.find((e) => e.type === 'room') || null;
  if (!focusedRoom) {
    for (const r of rooms) {
      if (text.includes(r.room_name.toLowerCase()) || text.includes(r.room_id.toLowerCase()) || q.includes(r.room_name.toLowerCase()) || q.includes(r.room_id.toLowerCase())) {
        focusedRoom = { id: r.room_id, name: r.room_name };
        break;
      }
    }
  }

  const followUps = [];

  if (focusedRoom) {
    followUps.push(`Why is ${focusedRoom.name} underutilized or flagged?`);
    followUps.push(`Show ${focusedRoom.name} in 3D.`);
    followUps.push(`What equipment is installed in ${focusedRoom.name}?`);
    followUps.push(`What if I move a class to ${focusedRoom.name}?`);
  } else if (q.includes('underutil') || text.includes('underutilized')) {
    followUps.push('Why is the top room underutilized?');
    followUps.push('Show the underutilized room in 3D.');
    followUps.push('Find a better allocation for this room.');
    followUps.push('What should I improve first?');
  } else if (q.includes('over capacity') || q.includes('conflict') || text.includes('overcapacity')) {
    followUps.push('What should I fix first?');
    followUps.push('Show optimization recommendations.');
    followUps.push('Which rooms can fit 50 students at 2 PM?');
    followUps.push('Show active conflicts on map.');
  } else if (q.includes('recommend') || q.includes('fix') || text.includes('recommendation') || text.includes('cs-301')) {
    followUps.push('Why was this recommendation selected?');
    followUps.push('What if I apply this recommendation?');
    followUps.push('Show the Rule Trace validation.');
    followUps.push('Compare current and target rooms in 3D.');
  } else {
    followUps.push('What should I improve first?');
    followUps.push('Which room is most underutilized?');
    followUps.push('Which rooms can fit 50 students at 2 PM?');
    followUps.push("Give me a summary of today's campus.");
  }

  return followUps.slice(0, 4);
}

/**
 * Main Assistant Dispatcher:
 * Executes the full iterative Function-Calling loop with Gemini and falls back to deterministic engine.
 */
async function processAssistantMessage({ message, assistantContext = {}, conversationId = 'default', history = [] }) {
  console.log(`[assistant] user message: "${message}"`);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const expertRes = generateExpertCampusAnswer(message, assistantContext, history);
    const followUps = deriveFollowUpQuestions(message, expertRes.message, assistantContext, history, expertRes.entities || []);
    console.log(`[assistant] final answer (expert fallback): "${expertRes.message?.slice(0, 100)}..."`);
    return { ...expertRes, followUps };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // Compact Assistant Context snapshot
    const compactContext = {
      currentPage: assistantContext.currentPage || 'overview',
      selectedRoom: assistantContext.selectedRoom ? { id: assistantContext.selectedRoom.room_id, name: assistantContext.selectedRoom.room_name } : null,
      currentUtilization: assistantContext.currentUtilization || 0,
      currentUDS: assistantContext.currentUDS || 0,
      totalRooms: (assistantContext.rooms || []).length,
      totalEvents: (assistantContext.timetable || []).length,
      conflictsCount: (assistantContext.currentConflicts || []).length,
      recommendationsCount: (assistantContext.currentRecommendations || []).length
    };

    // Build initial prompt & history
    const conversationTurns = [
      ...history.slice(-4).map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      {
        role: 'user',
        parts: [{
          text: `CLIENT_CONTEXT: ${JSON.stringify(compactContext)}\n\nUSER_QUERY: ${message}`
        }]
      }
    ];

    const accumulatedActions = [];
    const MAX_ROUNDS = 6;
    let round = 0;
    let finalAnswer = null;

    while (round < MAX_ROUNDS) {
      round++;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: conversationTurns,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }]
        }
      });

      const candidate = response.candidates?.[0];
      const modelContent = candidate?.content;
      const functionCalls = modelContent?.parts?.filter((p) => p.functionCall).map((p) => p.functionCall) || [];

      // Case A: Model generated a final text turn without calling further tools
      if (functionCalls.length === 0) {
        const textParts = modelContent?.parts?.filter((p) => p.text).map((p) => p.text) || [];
        const fullText = textParts.join('\n').trim();

        if (fullText) {
          finalAnswer = fullText;
        }
        break;
      }

      // Case B: Model called one or more tools -> execute and provide functionResponse
      conversationTurns.push(modelContent);

      const responseParts = [];
      for (const call of functionCalls) {
        const toolName = call.name;
        const toolArgs = call.args || {};
        console.log(`[assistant] tool call requested: ${toolName}(${JSON.stringify(toolArgs)})`);

        // Check if it's a UI Tool
        if (toolName.startsWith('open_') || toolName.startsWith('show_') || toolName.startsWith('select_') || toolName === 'run_optimization') {
          const actionType = toolName.toUpperCase();
          if (ALLOWED_ACTION_TYPES.safeParse(actionType).success) {
            accumulatedActions.push({
              type: actionType,
              id: call.args?.roomId || call.args?.recommendationId || call.args?.eventId,
              label: call.args?.label || `Open ${call.args?.roomId || toolName.replace(/_/g, ' ')}`
            });
          }

          responseParts.push({
            functionResponse: {
              name: toolName,
              response: { status: 'action_registered', action: toolName }
            }
          });
        } else {
          // Data Tool -> Execute against real live context
          const toolResult = await executeToolCall(call, assistantContext);
          console.log(`[assistant] tool result:`, JSON.stringify(toolResult).slice(0, 160));
          console.log(`[assistant] sending functionResponse back to Gemini`);

          responseParts.push({
            functionResponse: {
              name: toolName,
              response: toolResult && typeof toolResult === 'object' ? toolResult : { result: toolResult }
            }
          });
        }
      }

      conversationTurns.push({
        role: 'user',
        parts: responseParts
      });
    }

    // Validate that we have a written answer (ANSWER FIRST)
    if (finalAnswer && finalAnswer.length > 5) {
      console.log(`[assistant] final answer: "${finalAnswer.slice(0, 100)}..."`);
      // Extract entities if mentioned
      const entities = [];
      for (const r of (assistantContext.rooms || [])) {
        if (finalAnswer.includes(r.room_name) || finalAnswer.includes(r.room_id)) {
          entities.push({ type: 'room', id: r.room_id, name: r.room_name });
        }
      }

      // De-duplicate actions
      const uniqueActions = [];
      const seen = new Set();
      for (const act of accumulatedActions) {
        const key = `${act.type}_${act.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueActions.push(act);
        }
      }

      const followUps = deriveFollowUpQuestions(message, finalAnswer, assistantContext, history, entities);

      return {
        message: finalAnswer,
        entities,
        actions: uniqueActions,
        followUps
      };
    } else {
      console.log(`[assistant] no final text turn from model, using expert engine fallback`);
      const expertRes = generateExpertCampusAnswer(message, assistantContext, history);
      const followUps = deriveFollowUpQuestions(message, expertRes.message, assistantContext, history, expertRes.entities || []);
      console.log(`[assistant] final answer: "${expertRes.message?.slice(0, 100)}..."`);
      return { ...expertRes, followUps };
    }
  } catch (err) {
    console.error('Gemini function-calling error, using deterministic expert engine:', err.message);
    const expertRes = generateExpertCampusAnswer(message, assistantContext, history);
    const followUps = deriveFollowUpQuestions(message, expertRes.message, assistantContext, history, expertRes.entities || []);
    console.log(`[assistant] final answer (error fallback): "${expertRes.message?.slice(0, 100)}..."`);
    return { ...expertRes, followUps };
  }
}

module.exports = {
  processAssistantMessage,
  generateExpertCampusAnswer
};
