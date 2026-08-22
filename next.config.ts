import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `next dev` otherwise appends its own agent-rules block to CLAUDE.md.
   * CLAUDE.md is the governing file for this repository and is not modified as
   * a side effect of running a dev server (CLAUDE.md §0, §14).
   */
  agentRules: false,
};

export default nextConfig;
