import { describe, expect, it } from "vitest";
import {
  cleanVoicePrompt,
  createBinaryTreeElements,
  extractElements,
  inferDiagramType,
  isAgentWhiteboardClaim,
  isBinaryTreePrompt,
  isWhiteboardPageDrawingCommand,
  isWhiteboardDiagramCommand,
} from "./WhiteboardDataBridge";

describe("WhiteboardDataBridge helpers", () => {
  it("extracts Excalidraw elements from supported payload shapes", () => {
    const elements = [{ id: "box-1", type: "rectangle" }];

    expect(extractElements(elements)).toBe(elements);
    expect(extractElements({ elements })).toBe(elements);
    expect(extractElements({ payload: { excalidrawElements: elements } })).toBe(elements);
    expect(extractElements({ data: { scene: { diagram: elements } } })).toBe(elements);
  });

  it("detects whiteboard drawing requests from user transcripts", () => {
    expect(isWhiteboardDiagramCommand("draw a flowchart on the whiteboard about photosynthesis")).toBe(true);
    expect(isWhiteboardDiagramCommand("can you explain photosynthesis to me")).toBe(false);
    expect(isWhiteboardPageDrawingCommand("draw a binary tree")).toBe(true);
  });

  it("forces binary tree prompts away from linked-list generation", () => {
    expect(isBinaryTreePrompt("make a binnary tree")).toBe(true);
    expect(cleanVoicePrompt("hey aria draw a binnary tree")).toContain("A binary tree with 7 nodes");
    expect(createBinaryTreeElements()).toHaveLength(20);
  });

  it("detects when the agent claims it drew on the board", () => {
    expect(isAgentWhiteboardClaim("I've put the diagram on the whiteboard now.")).toBe(true);
    expect(isAgentWhiteboardClaim("Photosynthesis has two major stages.")).toBe(false);
  });

  it("infers the diagram type from transcript text", () => {
    expect(inferDiagramType("make a process flow chart on the board")).toBe("flowchart");
    expect(inferDiagramType("draw a mind map on the whiteboard")).toBe("mindmap");
    expect(inferDiagramType("draw a labeled diagram on the canvas")).toBe("diagram");
  });
});