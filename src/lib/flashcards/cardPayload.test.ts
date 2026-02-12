import { describe, expect, it } from "vitest";
import {
  buildClozePayload,
  buildImagePayload,
  buildQAPayload,
  parseCardPayload,
  resolveCardImageSrc,
} from "./cardPayload";

describe("cardPayload helpers", () => {
  it("builds and parses QA payloads", () => {
    const payload = buildQAPayload(" What is ATP? ", " Energy currency ");
    expect(payload).toEqual({
      prompt: "What is ATP?",
      response: "Energy currency",
    });

    const parsed = parseCardPayload({
      card_type: "qa",
      card_payload: payload,
    });

    expect(parsed).toEqual({
      type: "qa",
      payload: {
        prompt: "What is ATP?",
        response: "Energy currency",
      },
    });
  });

  it("builds and parses Cloze payloads", () => {
    const payload = buildClozePayload("The capital is _____.", [" Paris ", ""]);
    expect(payload).toEqual({
      sentence: "The capital is _____.",
      blanks: ["Paris"],
    });

    const parsed = parseCardPayload({
      card_type: "cloze",
      card_payload: payload,
    });

    expect(parsed).toEqual({
      type: "cloze",
      payload: {
        sentence: "The capital is _____.",
        blanks: ["Paris"],
      },
    });
  });

  it("parses image payloads and falls back to legacy image fields", () => {
    const payload = buildImagePayload(
      "https://assets.idealite.xyz/diagram.png",
      "ATP synthase",
      "Diagram",
    );

    const parsed = parseCardPayload({
      card_type: "image",
      card_payload: payload,
    });
    expect(parsed).toEqual({
      type: "image",
      payload,
    });

    const fallback = parseCardPayload({
      card_type: "image",
      card_payload: {},
      image_cid: "images/legacy.png",
      description: "Legacy description",
    });
    expect(fallback).toEqual({
      type: "image",
      payload: {
        image_url: "images/legacy.png",
        response: "Legacy description",
        alt: null,
      },
    });
  });

  it("resolves image URLs correctly", () => {
    expect(resolveCardImageSrc("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png",
    );
    expect(resolveCardImageSrc("images/local.png")).toBe(
      "https://assets.idealite.xyz/images/local.png",
    );
  });
});
