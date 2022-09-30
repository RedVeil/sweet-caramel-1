import { render } from "@testing-library/react";
import SingleActionModal from "../components/Modal/SingleActionModal";

describe("SingleActionModal component", () => {
  it("should render properly", () => {
    render(<SingleActionModal title="Test" visible content="Test Content" />);

    /*  expect(screen.getByText("Custom internal button")).toBeInTheDocument();
    expect(screen.getByText("Button from ui")).toBeInTheDocument(); */
  });
});
