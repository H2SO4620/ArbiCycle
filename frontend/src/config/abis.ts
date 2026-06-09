export const CIRCLE_FACTORY_ABI = [
  {
    type: "function",
    name: "createCircle",
    inputs: [
      { name: "_name",               type: "string"  },
      { name: "_contributionAmount", type: "uint256" },
      { name: "_maxMembers",         type: "uint256" },
      { name: "_frequency",          type: "uint8"   },
    ],
    outputs: [{ name: "circle", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAllCircles",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserCircles",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCircleCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isCircle",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CircleCreated",
    inputs: [
      { name: "circle",             type: "address", indexed: true  },
      { name: "creator",            type: "address", indexed: true  },
      { name: "name",               type: "string",  indexed: false },
      { name: "contributionAmount", type: "uint256", indexed: false },
      { name: "maxMembers",         type: "uint256", indexed: false },
      { name: "frequency",          type: "uint8",   indexed: false },
    ],
  },
] as const;

export const CIRCLE_ABI = [
  // ── State ──────────────────────────────────────────────────────────────────
  { type: "function", name: "name",             inputs: [], outputs: [{ type: "string"  }], stateMutability: "view" },
  { type: "function", name: "state",            inputs: [], outputs: [{ type: "uint8"   }], stateMutability: "view" },
  { type: "function", name: "contributionAmount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "maxMembers",       inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "currentRound",     inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "roundStartTime",   inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "roundDuration",    inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "frequency",        inputs: [], outputs: [{ type: "uint8"   }], stateMutability: "view" },
  { type: "function", name: "vrfPending",       inputs: [], outputs: [{ type: "bool"    }], stateMutability: "view" },
  { type: "function", name: "activeMembers",    inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // ── Members ────────────────────────────────────────────────────────────────
  { type: "function", name: "getMemberCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "getAllMembers",
    inputs: [],
    outputs: [{
      type: "tuple[]",
      components: [
        { name: "addr",                    type: "address" },
        { name: "joinedAt",                type: "uint256" },
        { name: "hasContributedThisRound", type: "bool"    },
        { name: "contributedAt",           type: "uint256" },
        { name: "hasReceived",             type: "bool"    },
        { name: "isActive",                type: "bool"    },
        { name: "consecutiveMisses",       type: "uint8"   },
        { name: "totalContributed",        type: "uint256" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isMember",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasContributed",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentRecipient",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getNextRotationTime",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentPotValue",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPayoutOrder",
    inputs: [],
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStreamId",
    inputs: [
      { name: "member", type: "address" },
      { name: "round",  type: "uint256" },
    ],
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
  },
  // ── Actions ────────────────────────────────────────────────────────────────
  { type: "function", name: "join",            inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "contribute",      inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "triggerRotation", inputs: [], outputs: [], stateMutability: "nonpayable" },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "MemberJoined",
    inputs: [
      { name: "member",      type: "address", indexed: true  },
      { name: "memberCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VRFRequested",
    inputs: [{ name: "requestId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "PayoutOrderSet",
    inputs: [
      { name: "payoutOrder",   type: "uint256[]", indexed: false },
      { name: "vrfRandomised", type: "bool",      indexed: false },
    ],
  },
  {
    type: "event",
    name: "CircleActivated",
    inputs: [{ name: "activatedAt", type: "uint256", indexed: false }],
  },
  {
    type: "event",
    name: "ContributionMade",
    inputs: [
      { name: "member", type: "address", indexed: true  },
      { name: "amount", type: "uint256", indexed: false },
      { name: "round",  type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PaymentStreamExecuted",
    inputs: [
      { name: "streamId", type: "bytes32", indexed: true  },
      { name: "member",   type: "address", indexed: true  },
      { name: "amount",   type: "uint256", indexed: false },
      { name: "round",    type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PenaltyApplied",
    inputs: [
      { name: "member",        type: "address", indexed: true  },
      { name: "penaltyAmount", type: "uint256", indexed: false },
      { name: "round",         type: "uint256", indexed: false },
      { name: "missed",        type: "bool",    indexed: false },
    ],
  },
  {
    type: "event",
    name: "MemberKicked",
    inputs: [
      { name: "member",            type: "address", indexed: true  },
      { name: "round",             type: "uint256", indexed: false },
      { name: "consecutiveMisses", type: "uint8",   indexed: false },
    ],
  },
  {
    type: "event",
    name: "RotationExecuted",
    inputs: [
      { name: "recipient",  type: "address", indexed: true  },
      { name: "potAmount",  type: "uint256", indexed: false },
      { name: "yieldEarned", type: "uint256", indexed: false },
      { name: "penalties",  type: "uint256", indexed: false },
      { name: "round",      type: "uint256", indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function", name: "approve",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "allowance",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const REPUTATION_ABI = [
  {
    type: "function", name: "getScore",
    inputs: [{ name: "member", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "getLendingLimit",
    inputs: [{ name: "member", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "getStats",
    inputs: [{ name: "member", type: "address" }],
    outputs: [
      { name: "score",             type: "uint256" },
      { name: "totalContributions", type: "uint256" },
      { name: "onTime",            type: "uint256" },
      { name: "late",              type: "uint256" },
      { name: "missed",            type: "uint256" },
      { name: "rotationsReceived", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;
