import { render, screen } from "@testing-library/react";
import SingleActionModal from "../components/Modal/SingleActionModal";

describe("SingleActionModal component", () => {
  it("should render properly", () => {
    render(<SingleActionModal title="TitleForTest" visible content="ContentForTest" />);

    expect(screen.getByText("TitleForTest")).toBeInTheDocument();
    expect(screen.getByText("ContentForTest")).toBeInTheDocument();
  });
});
