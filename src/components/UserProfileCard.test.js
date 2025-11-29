import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import UserProfileCard from "./UserProfileCard";

// Mock the API_BASE
jest.mock("../../utils/apiBase", () => "http://localhost:4000");

const mockUser = {
  id: "user123",
  name: "John Doe",
  firstName: "John",
  lastName: "Doe",
  category: "Software Engineer",
  summary: "Experienced software developer",
  startingPrice: 50,
  rateType: "H",
  currencyCode: "USD",
  showInDashboard: true,
  showPhoto: true,
  photoPresent: true,
};

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("UserProfileCard", () => {
  test("renders user information correctly", () => {
    renderWithRouter(<UserProfileCard user={mockUser} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(
      screen.getByText("Experienced software developer"),
    ).toBeInTheDocument();
    expect(screen.getByText("$50/hour")).toBeInTheDocument();
  });

  test("displays correct rate format for daily rates", () => {
    const dailyUser = { ...mockUser, rateType: "D" };
    renderWithRouter(<UserProfileCard user={dailyUser} />);

    expect(screen.getByText("$50/day")).toBeInTheDocument();
  });

  test("shows photo placeholder when no photo is present", () => {
    const userWithoutPhoto = { ...mockUser, photoPresent: false };
    renderWithRouter(<UserProfileCard user={userWithoutPhoto} />);

    const avatar = screen.getByAltText("Profile");
    expect(avatar).toBeInTheDocument();
    expect(avatar.src).toContain("avatar_2x.png");
  });

  test("does not show photo when showPhoto is false", () => {
    const userNoPhoto = { ...mockUser, showPhoto: false };
    renderWithRouter(<UserProfileCard user={userNoPhoto} />);

    const avatar = screen.getByAltText("Profile");
    expect(avatar).toBeInTheDocument();
    expect(avatar.src).toContain("avatar_2x.png");
  });

  test("renders contact button when user is logged in", () => {
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => JSON.stringify({ id: "currentUser123" })),
      },
      writable: true,
    });

    renderWithRouter(<UserProfileCard user={mockUser} />);

    const contactButton = screen.getByRole("button", { name: /contact/i });
    expect(contactButton).toBeInTheDocument();
  });

  test("does not render contact button when user is not logged in", () => {
    // Mock localStorage to return null
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => null),
      },
      writable: true,
    });

    renderWithRouter(<UserProfileCard user={mockUser} />);

    const contactButton = screen.queryByRole("button", { name: /contact/i });
    expect(contactButton).not.toBeInTheDocument();
  });

  test("handles missing user data gracefully", () => {
    const incompleteUser = {
      id: "user123",
      name: "",
      category: "",
      summary: "",
    };

    renderWithRouter(<UserProfileCard user={incompleteUser} />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  test("displays correct currency symbols", () => {
    const currencies = [
      { code: "EUR", symbol: "€" },
      { code: "GBP", symbol: "£" },
      { code: "INR", symbol: "₹" },
      { code: "USD", symbol: "$" },
    ];

    currencies.forEach(({ code, symbol }) => {
      const userWithCurrency = { ...mockUser, currencyCode: code };
      const { rerender } = renderWithRouter(
        <UserProfileCard user={userWithCurrency} />,
      );

      expect(screen.getByText(`${symbol}50/hour`)).toBeInTheDocument();

      // Clean up for next iteration
      rerender(
        <BrowserRouter>
          <div />
        </BrowserRouter>,
      );
    });
  });

  test("shows negotiable badge when price is negotiable", () => {
    const negotiableUser = { ...mockUser, negotiable: true };
    renderWithRouter(<UserProfileCard user={negotiableUser} />);

    expect(screen.getByText("Negotiable")).toBeInTheDocument();
  });

  test("does not show negotiable badge when price is not negotiable", () => {
    const nonNegotiableUser = { ...mockUser, negotiable: false };
    renderWithRouter(<UserProfileCard user={nonNegotiableUser} />);

    expect(screen.queryByText("Negotiable")).not.toBeInTheDocument();
  });
});
