// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExplainButton, InfoTip, ShowAllExplanationsDrawer } from "./Explainability";

afterEach(cleanup);

describe("InfoTip", () => {
  it("opens short tooltip text on hover with accessible tooltip semantics", () => {
    const { container } = render(<InfoTip entryId="validation.source.wavelength" />);
    const trigger = screen.getByRole("button", { name: "What is Wavelength?" });

    expect(container.querySelector("[title]")).toBeNull();
    fireEvent.mouseEnter(trigger.parentElement!);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("Wavelength of the monochromatic source");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens on focus and closes on Escape without moving focus into tooltip content", () => {
    render(<InfoTip entryId="validation.residualMap" />);
    const trigger = screen.getByRole("button", { name: "What is Residual Map?" });

    trigger.focus();
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip").textContent).toContain("Difference between normalized numerical intensity");
    expect(document.activeElement).toBe(trigger);

    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("Under-the-hood explanations", () => {
  it("opens rich explanation content by button click, exposes formula text, and closes", () => {
    render(<ExplainButton entryId="validation.analyticReference.airyBessel" />);
    const button = screen.getByRole("button", { name: "Under the hood: Airy/Bessel Analytic Reference" });

    fireEvent.click(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(screen.getByLabelText("Airy/Bessel Analytic Reference under the hood").textContent).toContain("I/I0 = [2 J1");
    expect(screen.getByText("Copy snippet")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close Airy/Bessel Analytic Reference explanation" }));
    expect(screen.queryByLabelText("Airy/Bessel Analytic Reference under the hood")).toBeNull();
  });

  it("can be toggled from the keyboard as a native button path", () => {
    render(<ExplainButton entryId="backend.externalFdtdScaffold" />);
    const button = screen.getByRole("button", { name: "Under the hood: ExternalFdtdBackend" });

    button.focus();
    fireEvent.keyDown(button, { key: "Enter" });
    expect(screen.getByLabelText("ExternalFdtdBackend under the hood").textContent).toContain("scaffold/export-only");
    fireEvent.keyDown(button, { key: "Escape" });
    expect(screen.queryByLabelText("ExternalFdtdBackend under the hood")).toBeNull();
  });
});

describe("ShowAllExplanationsDrawer", () => {
  it("lists grouped explanations and searches key advisor terms", () => {
    render(<ShowAllExplanationsDrawer open={true} onClose={() => undefined} />);

    expect(screen.getByLabelText("Show all explanations").textContent).toContain("Validation Bench");
    fireEvent.change(screen.getByLabelText("Search explanations"), { target: { value: "p90" } });
    expect(screen.getByLabelText("Show all explanations").textContent).toContain("P90 Robust Score");
    expect(screen.getByLabelText("Show all explanations").textContent).not.toContain("Airy/Bessel Analytic Reference");
  });
});
