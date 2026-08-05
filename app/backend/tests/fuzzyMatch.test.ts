import { describe, it, expect } from "vitest";
import { isFuzzyMatch, normalize, similarity } from "../src/utils/fuzzyMatch";

describe("normalize", () => {
  it("met en minuscules et retire accents/ponctuation", () => {
    expect(normalize("Héllo, World!")).toBe("hello world");
  });
  it("compacte les espaces", () => {
    expect(normalize("  a   b  ")).toBe("a b");
  });
  it("retourne une chaîne vide pour une entrée vide", () => {
    expect(normalize("")).toBe("");
  });
});

describe("similarity", () => {
  it("vaut 1 pour des chaînes identiques", () => {
    expect(similarity("Bonjour", "Bonjour")).toBe(1);
  });
  it("vaut 0 si une chaîne est vide", () => {
    expect(similarity("", "Bonjour")).toBe(0);
  });
  it("donne un score élevé pour une faute de frappe", () => {
    expect(similarity("Bonjour", "Bonjor")).toBeGreaterThan(0.8);
  });
});

describe("isFuzzyMatch", () => {
  it("accepte une réponse exacte", () => {
    expect(isFuzzyMatch("Bohemian Rhapsody", "Bohemian Rhapsody")).toBe(true);
  });
  it("accepte avec des accents/casse différentes", () => {
    expect(isFuzzyMatch("hélène", "Helene")).toBe(true);
  });
  it("accepte une sous-chaîne significative (≥3 chars)", () => {
    expect(isFuzzyMatch("Rhap", "Bohemian Rhapsody")).toBe(true);
  });
  it("rejette une réponse trop éloignée", () => {
    expect(isFuzzyMatch("totally different", "Bohemian Rhapsody")).toBe(false);
  });
  it("rejette une réponse vide", () => {
    expect(isFuzzyMatch("", "Queen")).toBe(false);
  });
  it("rejette une sous-chaîne trop courte (<3 chars)", () => {
    expect(isFuzzyMatch("Qu", "Queen")).toBe(false);
  });
});
