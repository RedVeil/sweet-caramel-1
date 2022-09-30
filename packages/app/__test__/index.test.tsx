import { render, screen } from "@testing-library/react";
import Index from "../pages/[network]/index";

describe("Index page", () => {
  it("should render elements properly", () => {
    render(<Index />);

    expect(screen.getByText("Custom internal button")).toBeInTheDocument();
    expect(screen.getByText("Button from ui")).toBeInTheDocument();
  });
});
