
The user wants an IEEE-format research paper about StudyMate. They've given me freedom on the exact topic angle but want it well-structured and "paper length" (standard IEEE conference paper = 6-8 double-column pages).

Plan: Generate a publication-quality IEEE conference paper as a PDF using ReportLab with proper IEEE formatting (two-column layout, Times Roman, 10pt body, numbered sections, IEEE reference style).

## Topic Angle (improvised)
**"StudyMate: A Gamified, AI-Augmented Study Assistant for Enhancing Engagement and Self-Regulated Learning in Students with Attention Deficits"**

This frames StudyMate as a research contribution at the intersection of:
- AI in Education (LLM tutoring + smart actions)
- Gamification (XP, levels, streaks)
- HCI for neurodivergent users (ADHD focus)
- Full-stack web architecture (React + Supabase + Edge Functions)

## Paper Structure (IEEE standard, ~7-8 pages)

1. **Abstract** (~200 words)
2. **Index Terms** (IEEE keywords)
3. **I. Introduction** — problem, motivation, contributions
4. **II. Related Work** — AI tutors, gamification in EdTech, ADHD assistive tech
5. **III. System Architecture** — frontend, backend, AI gateway, data model (with ASCII diagram)
6. **IV. Core Subsystems**
   - A. AI Tutor & Smart Action System
   - B. Gamification Engine (XP, levels, streaks)
   - C. Study Tools (Summarizer, Flashcards, Quizzes, Whiteboard)
   - D. Focus Mode with anti-cheat
7. **V. Implementation Details** — streaming SSE, RLS security, real-time sync via custom events
8. **VI. Evaluation Methodology** — proposed metrics (engagement, retention, task completion)
9. **VII. Discussion** — design tradeoffs, limitations
10. **VIII. Future Work** — voice mode, leaderboards, spaced repetition
11. **IX. Conclusion**
12. **References** (~15-20 IEEE-style citations to real seminal works on gamification, LLMs in education, ADHD interventions)

## Technical Approach

- **Tool**: Python + ReportLab (already in skill knowledge)
- **Layout**: Two-column IEEE format (page size US Letter, ~0.75" margins, two cols with gutter)
- **Fonts**: Times-Roman 10pt body, Times-Bold for headings, 24pt title
- **Section numbering**: Roman numerals (I, II, III) per IEEE
- **Subsections**: A, B, C
- **References**: Numbered [1], [2] in IEEE style — cite real papers (Deterding gamification, Vaswani transformers, Brown GPT-3, Anderson cognitive tutors, etc.)
- **Generate body text** using AI Gateway skill for substantive academic prose, then assemble into ReportLab
- **QA**: Convert PDF to images, inspect every page for layout issues, fix and regenerate

## Steps for implementation
1. Use the AI Gateway skill to draft each section with academic tone (one call per section to avoid token limits)
2. Write a Python script that builds the IEEE-formatted PDF using ReportLab's Platypus with a two-column `BaseDocTemplate`
3. Output to `/mnt/documents/StudyMate_IEEE_Paper.pdf`
4. QA: convert to images, inspect all pages, fix issues
5. Deliver as `<lov-artifact>`

## Disclaimer
The paper will be AI-drafted with real citations to real papers, but you should verify all references before any academic submission since I cannot guarantee perfect citation accuracy.

This is a research/artifact-generation task — once approved, I'll switch to default mode and execute the script.
