# Claude Certified Developer – Foundations (CCDV-F) - Topics

> Certification: https://anthropic-partners.skilljar.com/claude-certified-developer-foundations-certification
> Prep course: https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations
> Exam guide: Claude Certified Developer – Foundations Exam Guide v1.0 (effective July 2026)
> Skills measured as of: July 2026
> Format: 53 items (multiple-choice + multiple-response), 120 minutes | Passing score: 720 (scale 100–1,000) | Fee: $125 USD | Validity: 12 months
> Proctored: online proctored and/or Pearson VUE test center

## Domain 1: Agents and Workflows (14.7%)

### 1.1 Agent Architecture (4.5%)
- Apply workflow-vs-agent decision criteria
- Design manager/supervisor hierarchies
- Decompose work across subagents

### 1.2 Agent Construction with Claude (5.3%)
- Build agents with the Claude Agent SDK
- Build custom agent loops and harnesses
- Choose self-hosted vs Anthropic-hosted managed deployment
- Use hooks for deterministic actions

### 1.3 Agent Patterns and Frameworks (4.9%)
- Tool-use loops, sub-agents, memory, context-window management
- Frameworks: Strands, LangGraph, PydanticAI

## Domain 2: Applications and Integration (33.1%)

### 2.1 Understanding Requirements (3.4%)
- Interpret and scope product requirements for Claude-based builds

### 2.2 Systems Life Cycle (2.8%)
- Lifecycle of a Claude application: build, ship, maintain, retire

### 2.3 Claude API Mechanics (6.8%)
- Messages API: messages, tools, streaming, vision, thinking, caching
- Third-party vendor invocation of Claude models
- Messages API data access patterns
- Batch API and realtime-vs-batch tradeoffs

### 2.4 Software Engineering Foundations (7.4%)
- REST APIs, JSON, async programming
- Version control, SDLC integration, code review, refactoring

### 2.5 Claude Application Design (8.6%)
- Instruction interpretation across Claude Code/Desktop/claude.ai/API/SDKs
- Content boundaries, schema design, session hygiene, plugin management

### 2.6 Configuration Management (4.1%)
- CLAUDE.md, settings.json, model version pinning, prompt versioning, plugin dependencies

## Domain 3: Claude Code (3.1%)

### 3.1 Claude Code Operation (3.1%)
- Rules, Skills, Commands, Agents, Agent Memory
- Session management, built-in/custom slash commands
- Headless mode, streaming mode, auto-mode
- CLAUDE.md hierarchy, repo init, settings.json

## Domain 4: Eval, Testing, and Debugging (2.6%)

### 4.1 Debugging and Error Handling (2.6%)
- Identify error types and recovery strategies
- Trace analysis for failure modes
- Isolate integration-layer vs model-output problems

## Domain 5: Model Selection and Optimization (16.8%)

### 5.1 LLM Fundamentals (5.2%)
- Tokens, context windows, sampling, non-determinism, next-token generation
- Fast mode, extended/adaptive thinking, effort levels
- Zero-shot, single-shot, multi-shot prompting

### 5.2 Technical Fundamentals (6.1%)
- SDKs wrapping REST APIs, websockets

### 5.3 Model Selection and Tradeoffs (2.7%)
- Opus vs Sonnet vs Haiku; adaptive-thinking support
- Quality/latency/cost tradeoffs; behavior changes across releases

### 5.4 Cost and Token Management (2.8%)
- Token usage tracking, cost modeling
- Prompt caching and cache check-pointing

## Domain 6: Prompt and Context Engineering (11.0%)

### 6.1 Context Engineering (3.8%)
- Context-window management, tool-output pruning, compaction
- Context isolation via subagents / multi-step

### 6.2 Prompt Engineering (4.6%)
- Instruction clarity, few-shot, system vs user placement
- Output constraints, placement across components, iterative refinement
- Input sanitization

### 6.3 Output Handling (2.6%)
- Structured output patterns, response validation, defensive parsing
- Skepticism toward confident output

## Domain 7: Security and Safety (8.1%)

### 7.1 AI Application Security (3.2%)
- Prompt injection awareness and mitigation
- Jailbreak defense, untrusted input handling
- Data leakage prevention, PII handling

### 7.2 Guardrails and Safe Deployment (2.3%)
- Content policy, guardrail layering, privacy
- Identity/access management, least privilege

### 7.3 Claude Hooks (1.0%)
- Hooks as guardrails to prevent destructive actions

### 7.4 Identity, Secrets, and Key Management (1.6%)
- API key handling, secret rotation, identity boundaries

## Domain 8: Tools and MCPs (10.6%)

### 8.1 Tool Implementation (4.4%)
- Function calling, external-system configuration
- Tool description writing, error handling
- Agentic harness dispatch; client-side vs server-side tools
- Approval patterns, tool-set construction

### 8.2 MCP Server Development (2.1%)
- Server authoring, deployment, integration
- MCP resources/tools/prompts; stdio/sockets
- Client vs server responsibilities

### 8.3 Agentic Customization (4.1%)
- Tradeoffs among built-in tools, custom tools, Skills, MCPs
