# Installation and Basic Setup

> **Parent**: [SETUP_GITHUB_COPILOT.md](../../SETUP_GITHUB_COPILOT.md) | **Time**: 45 minutes

This guide covers STEP 1 (Installation) and STEP 2 (copilot-instructions.md setup) for getting GitHub Copilot ready for AI-driven development.

---

## STEP 1: Installation (15 minutes)

### 1-1: GitHub Copilot Subscription

1. **Access GitHub Copilot page**
   - <https://github.com/features/copilot>

2. **Subscribe or start free trial**
   - Individual: $10/month
   - Business: $19/user/month
   - Free trial available (first month)

3. **Login with GitHub account**
   - Create account if needed

4. **Enter payment information**
   - Required even for trial
   - Can cancel before trial ends

5. **Verify subscription**
   - Check at: <https://github.com/settings/copilot>
   - Ensure status shows as "Active"

### 1-2: VS Code Extension Installation

1. **Open VS Code**

2. **Open Extensions Marketplace**
   - macOS: `Cmd + Shift + X`
   - Windows/Linux: `Ctrl + Shift + X`

3. **Search for "GitHub Copilot"**

4. **Install the following extensions**:
   - **GitHub Copilot** (required)
     - ID: `GitHub.copilot`
     - Provides code completion

   - **GitHub Copilot Chat** (recommended)
     - ID: `GitHub.copilot-chat`
     - Provides interactive AI assistance

5. **Restart VS Code**

### 1-3: GitHub Account Connection

1. **Click "Sign in to GitHub" in VS Code**
   - Located in bottom-left corner
   - Or click Copilot icon and select "Sign in"

2. **Authenticate in browser**
   - Login with GitHub account that has Copilot subscription

3. **Authorize VS Code**
   - Click "Authorize Visual Studio Code"

4. **Verify connection**
   - Check for green Copilot icon in status bar
   - Tooltip should display "Ready"

### STEP 1 Completion Checklist

- [ ] GitHub Copilot subscription purchased and active
- [ ] VS Code extensions installed (Copilot + Copilot Chat)
- [ ] GitHub account connected to VS Code
- [ ] Copilot icon shows "Ready" status

---

## STEP 2: copilot-instructions.md Setup (5-30 minutes)

### 2-1: Create .github Folder

In your project root directory:

```bash
mkdir -p .github
```

### 2-2: Choose Your Setup Method

| Method           | Time         | Best For                             |
| ---------------- | ------------ | ------------------------------------ |
| **A: AI Prompt** | **5-10 min** | MASTER.md exists, AI tools available |
| B: Template      | 15 min       | Copy from existing project           |
| C: Manual        | 30 min       | Full customization needed            |

---

## Method A: AI Prompt Generation (Recommended)

**Time**: 5-10 minutes

### Prerequisites

- `docs-template/MASTER.md` exists in your project
- Access to AI tool (Claude Code, GitHub Copilot Chat, or Cursor)

### Steps

#### 1. Open your AI tool

- **GitHub Copilot Chat**: `Cmd+I` (macOS) or `Ctrl+I` (Windows/Linux)
- **Claude Code**: <https://claude.ai/code>
- **Cursor**: `Cmd+L` (macOS) or `Ctrl+L` (Windows/Linux)

#### 2. Use this prompt

```
Generate a .github/copilot-instructions.md file based on the following project information.

# Project Information
- Project Name: [Your project name]
- Tech Stack: [e.g., TypeScript, React, Node.js, PostgreSQL]
- Architecture: [e.g., Clean Architecture, Microservices]

# Mandatory Constraints (from docs-template/MASTER.md)
[Copy and paste the "Code Generation Rules" section from MASTER.md]

# Project-Specific Rules
[Add your project-specific rules]
Example:
- React: Function components only
- State Management: Zustand
- Styling: Tailwind CSS

# Output Format
Generate Markdown with these sections:
  1. Project Overview
  2. Tech Stack
  3. Code Generation Rules
  4. Naming Conventions
  5. Prohibited Practices
  6. Architecture Patterns
  7. Security Requirements
  8. Performance Targets
  9. Document References
  10. Code Review Checklist

# Constraints
- Reflect MASTER.md content accurately
- Explicitly state: No magic numbers
- Explicitly state: No `any` type
- Explicitly state: Result pattern for error handling
- Explicitly state: 80%+ test coverage target

# Information Verification Protocol
If information is missing, DO NOT assume - request confirmation.

Required confirmations:
- Project name, target users, core features
- Tech stack (database type, authentication method, API format)
- Performance and security requirements

Confirmation format:
```

⚠️ Missing Information - Confirmation Required

[Required Confirmations]

1. [Item]: [What is unclear]
   - Why needed: [Reason]
   - Recommended: [Suggested options]

[Next Steps]
After confirmation, instruct: "Proceed with [confirmed details]"

```

See docs-template/MASTER.md "Information Verification Protocol" for details.
```

#### 3. Save generated content

```bash
# Copy AI-generated content and execute:
cat > .github/copilot-instructions.md << 'EOF'
[Paste AI-generated content here]
EOF
```

#### 4. Verify and adjust

- Confirm project name is correct
- Verify tech stack versions are current
- Ensure project-specific rules are included

### Example: React Project Prompt

```
# Project-Specific Rules
- React 18 usage
- Function components only (no class components)
- Hooks preferred (useState, useEffect, useContext)
- TypeScript types instead of PropTypes
- styled-components for styling
- State management: Zustand
- Routing: React Router v6
```

---

## Method B: Template Copy

**Time**: 15 minutes

```bash
# If you have this repository cloned:
cp path/to/ai-spec-driven-development/.github/copilot-instructions.md \
   .github/copilot-instructions.md
```

Then customize with your project-specific details.

---

## Method C: Manual Creation

**Time**: 30 minutes

Create `.github/copilot-instructions.md` with this structure:

```markdown
# GitHub Copilot Instructions

## MANDATORY: Read MASTER.md First

Before generating code suggestions, read and understand `docs-template/MASTER.md`.

## Project Context

[Project overview - name, purpose, target users]

## Key Constraints from MASTER.md

### Type Safety

- TypeScript with strict mode
- No `any` types (use `unknown` or proper types)
- Explicit type definitions for all variables, functions, and API responses

### Code Quality

- No magic numbers/hardcoded values (use named constants)
- No `console.log` in production code
- No unused imports or variables
- No error swallowing (always handle errors properly)
- Functions under 30 lines

### Naming Conventions

#### Code

- Variables: camelCase (`userName`, `isActive`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Types/Interfaces: PascalCase (`UserProfile`, `ApiResponse`)
- Files: kebab-case (`user-service.ts`)

#### Documentation Files

- Directories: `number-lowercase-hyphen` (`01-context`, `02-design`)
- Files: `UPPERCASE.md` (`MASTER.md`, `ARCHITECTURE.md`)

### Error Handling

- Use Result pattern
- Implement try-catch blocks with proper error messages
- Log errors with structured logging

### Testing

- Generate unit tests for all functions (80%+ coverage target)
- Use AAA pattern (Arrange-Act-Assert)
- Mock dependencies appropriately

## Architecture Patterns

[Your architecture patterns]

- Clean Architecture
- Repository Pattern
- etc.

## Document References

- `docs-template/MASTER.md` - Project overview and rules
- `docs-template/01-context/PROJECT.md` - Business requirements
- `docs-template/02-design/ARCHITECTURE.md` - Technical architecture
- `docs-template/03-implementation/PATTERNS.md` - Implementation patterns
- `docs-template/04-quality/TESTING.md` - Testing strategies

## Code Review Checklist

- [ ] MASTER.md rules followed
- [ ] No magic numbers/hardcoded values
- [ ] Type safety ensured
- [ ] Error handling implemented
- [ ] Tests generated
- [ ] Security requirements met
- [ ] Naming conventions followed
```

---

## 2-3: MASTER.md Integration (Critical)

### Content to Copy from MASTER.md

1. **Project Context**
   - From `docs-template/MASTER.md` "Project Overview" section

2. **Architecture Patterns**
   - From `docs-template/MASTER.md` "Architecture Patterns" section

3. **Code Generation Rules**
   - Type safety rules
   - Magic number prohibition
   - Error handling patterns
   - Test coverage targets

### Integration Example

```markdown
## Key Constraints from MASTER.md

### Type Safety (from MASTER.md)

- TypeScript strict mode required
- No `any` type (use `unknown` or proper types)
- Explicit type definitions for all variables, functions, and API responses

### Magic Number Prohibition (from MASTER.md)

- No magic numbers or hardcoded values
- All meaningful values must be extracted to named constants
- Document units (ms, KB, etc.) and valid ranges
- Organize constants by architectural layer
```

---

## STEP 2 Completion Checklist

- [ ] `.github/copilot-instructions.md` created
- [ ] Project-specific information filled in
- [ ] MASTER.md content reflected
- [ ] Tech stack rules included
- [ ] Code generation rules specified

---

## Troubleshooting

### Subscription not recognized

**Symptom**: "No subscription" message appears

**Solution**:

1. Verify GitHub account (correct account with subscription)
2. Check status at <https://github.com/settings/copilot>
3. Restart VS Code
4. Sign out and sign in again

### Extension installation fails

**Symptom**: Cannot click install button or errors occur

**Solution**:

1. Update VS Code to latest version
2. Check system requirements
3. Run VS Code with administrator privileges
4. Clear extension cache

### Connection doesn't complete

**Symptom**: Browser authentication doesn't return to VS Code

**Solution**:

1. Manually copy authentication code from browser
2. Open Command Palette (`Cmd/Ctrl + Shift + P`)
3. Execute "GitHub: Sign in with Device Code"
4. Paste authentication code

---

## FAQ

### Q: Can I use AI-generated content as-is?

A: Always verify:

- Project name is correct
- Tech stack versions are current
- No conflicts with MASTER.md
- Team-specific rules are included

### Q: How to update existing copilot-instructions.md?

A: Use this prompt:

```
Update the following .github/copilot-instructions.md based on new requirements.

# Current Content
[Paste current copilot-instructions.md]

# New/Changed Requirements
[New requirements or changes]

# Update Policy
- Maintain existing rules
- Prioritize new requirements where conflicts exist
- Avoid duplication
```

---

## Next Steps

After completing installation and basic setup:

[STEP 3: VS Code Configuration](./configuration.md)
