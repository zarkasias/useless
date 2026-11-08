"use client";

import { Component, type ReactNode } from "react";

interface SceneBoundaryProps {
  /** Shown instead of the scene if it can't load or can't start. */
  fallback: ReactNode;
  children?: ReactNode;
}

/**
 * Keeps the hero working when the 3D scene fails: its chunk didn't load
 * (a flaky connection) or WebGL isn't available. Without this the whole
 * page would fall through to the error screen.
 */
export class SceneBoundary extends Component<
  SceneBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("The hero scene could not start:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
