import {
  validateEmail,
  validateMobile,
  validateSummary,
  validatePassword,
} from "./validation";

describe("Validation Utils", () => {
  describe("validateEmail", () => {
    test("should validate correct email format", () => {
      const result = validateEmail("test@example.com");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    test("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "test@",
        "test@.com",
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain("valid email address");
      });
    });

    test("should reject empty/null/undefined emails", () => {
      const emptyEmails = ["", null, undefined];

      emptyEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain("Email is required");
      });
    });

    test("should accept emails with subdomains and plus signs", () => {
      const validEmails = [
        "test.email+tag@example.co.uk",
        "user+test@gmail.com",
        "test@test.example.com",
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("validateMobile", () => {
    test("should validate correct mobile numbers", () => {
      const testCases = [
        { number: "+1234567890", countryCode: "+1" }, // 10 digits for US
        { number: "1234567890", countryCode: "+1" }, // 10 digits for US
        { number: "+919876543210", countryCode: "+91" }, // 10 digits for India
        { number: "0987654321", countryCode: "+91" }, // 10 digits for India
      ];

      testCases.forEach(({ number, countryCode }) => {
        const result = validateMobile(number, countryCode);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe("");
      });
    });

    test("should reject invalid mobile numbers", () => {
      const invalidCases = [
        { number: "123", countryCode: "+1" }, // too short for US
        { number: "123456789012345678901", countryCode: "+1" }, // too long for US
        { number: "abcdefghij", countryCode: "+1" }, // non-numeric
      ];

      invalidCases.forEach(({ number, countryCode }) => {
        const result = validateMobile(number, countryCode);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeTruthy();
      });
    });

    test("should allow empty mobile numbers", () => {
      const result = validateMobile("");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    test("should validate mobile numbers without country code using default", () => {
      const result = validateMobile("1234567890");
      expect(result.isValid).toBe(true);
    });

    test("should reject numbers that are wrong length for country code", () => {
      // US number (11 digits with country code) with India country code (requires 10 digits)
      const result = validateMobile("+1234567890", "+91");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("10 digits");
    });
  });

  describe("validateSummary", () => {
    test("should validate correct summary length", () => {
      const validSummary = "A".repeat(100);
      const result = validateSummary(validSummary);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    test("should reject summaries that are too long", () => {
      const longSummary = "A".repeat(151);
      const result = validateSummary(longSummary);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("100 characters");
    });

    test("should allow empty summaries", () => {
      const result = validateSummary("");
      expect(result.isValid).toBe(true);
    });

    test("should handle null/undefined values", () => {
      expect(validateSummary(null).isValid).toBe(true);
      expect(validateSummary(undefined).isValid).toBe(true);
    });
  });

  describe("validatePassword", () => {
    test("should validate strong passwords", () => {
      const strongPasswords = [
        "Password123!",
        "MySecurePass2024@",
        "Test123$%^",
        "short123!", // meets all criteria
      ];

      strongPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe("");
      });
    });

    test("should reject weak passwords", () => {
      const weakPasswords = [
        "short", // too short
        "NoNumbers!", // no numbers
        "NoSpecial123", // no special characters
        "", // empty
      ];

      weakPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeTruthy();
      });
    });

    test("should accept passwords without uppercase/lowercase requirements", () => {
      const validPasswords = [
        "password123!", // no uppercase
        "PASSWORD123!", // no lowercase
        "nouppercase123!", // no uppercase
        "NOLOWERCASE123!", // no lowercase
      ];

      validPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
      });
    });

    test("should provide specific error messages", () => {
      const result1 = validatePassword("short");
      expect(result1.message).toContain("at least 8 characters");

      const result2 = validatePassword("NoNumbers!");
      expect(result2.message).toContain("number");

      const result3 = validatePassword("NoSpecial123");
      expect(result3.message).toContain("special character");
    });
  });
});
