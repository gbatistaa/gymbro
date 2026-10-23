# Creative Skills (Non-Coding)

Skills focused on the conceptual/abstract side of creative work: generating ideas, refining vague concepts, and
structuring creative tasks before any code is written.

| Skill                                          | Installs | Source Stars |
|------------------------------------------------|----------|--------------|
| `obra/superpowers@brainstorming`               | 402.9K   | 303.7K       |
| `addyosmani/agent-skills@idea-refine`          | 57.3K    | 109.7K       |
| `bmad-code-org/bmad-method@bmad-brainstorming` | 11.5K    | 54.5K        |
| `wondelai/skills@design-sprint`                | 5.4K     | —            |

## 1. `obra/superpowers@brainstorming`

**Why use it:** Structured design dialogue that validates an idea before implementation begins. It enforces a hard gate
(no code until the design is presented and approved) and walks through context exploration, clarifying questions,
alternative approaches, and a review loop. Best when you want to slow down and make sure you understand what is actually
wanted.

**Install:**

```bash
npx skills add obra/superpowers@brainstorming -g -y
```

## 2. `addyosmani/agent-skills@idea-refine`

**Why use it:** Refines a raw idea into a sharp, actionable concept using divergent thinking (generate variations)
followed by convergent thinking (cluster, stress-test, surface hidden assumptions). Produces a concrete markdown
one-pager. Best when the idea is vague and needs shaping before it becomes a plan.

**Install:**

```bash
npx skills add addyosmani/agent-skills@idea-refine -g -y
```

## 3. `bmad-code-org/bmad-method@bmad-brainstorming`

**Why use it:** Runs a brainstorming session as a creative coach. You choose the stance: Facilitator (asks questions
only, never supplies ideas), Creative Partner (trades ideas with you), or Ideate for Me (runs the whole session and
shows the result). Best when you want to generate many ideas and push past the obvious with sharper questions and harder
constraints.

**Install:**

```bash
npx skills add bmad-code-org/bmad-method@bmad-brainstorming -g -y
```

## 4. `wondelai/skills@design-sprint`

**Why use it:** Structures a design sprint (map the problem, sketch options, decide, prototype the concept). Turns
creative intent into an ordered set of tasks. Best when you need to move from idea generation into a concrete,
time-boxed exploration plan.

**Install:**

```bash
npx skills add wondelai/skills@design-sprint -g -y
```

## Suggested Combination

Start with **`brainstorming`** (dialogue and alignment) plus **`bmad-brainstorming`** (idea generation). Use **
`idea-refine`** to sharpen a single promising concept, and **`design-sprint`** when the concept is ready to become a
structured task plan.
