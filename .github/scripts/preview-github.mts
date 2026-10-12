import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import type { Octokit } from "@octokit/rest";

export type GitHubClient = Pick<Octokit, "rest" | "paginate">;
export type Repository = { owner: string; repo: string };
export type SourceRun = {
    repository: { full_name: string };
    event: string;
    conclusion: string | null;
    workflow_id: number;
    head_sha: string;
    id: number;
};
type PullRequest = {
    state: string;
    head: { sha: string };
    base: { repo: { full_name: string } };
};

export const ARTIFACT_NAME = "livesplit-one-preview";

export function previewBranch(number: number): string {
    if (!Number.isSafeInteger(number) || number <= 0) {
        throw new Error("Invalid pull request number.");
    }
    return `pr-${number}`;
}

export function isCurrentPullRequest(
    pr: PullRequest,
    sha: string,
    repository: string,
): boolean {
    return (
        pr.state === "open" &&
        pr.head.sha === sha &&
        pr.base.repo.full_name === repository
    );
}

// Determine identity exclusively through GitHub's API, never through files
// uploaded by PR code. workflow_run.pull_requests can be empty for fork PRs,
// so resolve associated PRs through the commit API in that case as well.
export async function findPreview(
    github: GitHubClient,
    run: SourceRun,
    repo: Repository,
) {
    const repository = `${repo.owner}/${repo.repo}`;
    if (
        run.repository.full_name !== repository ||
        run.event !== "pull_request" ||
        run.conclusion !== "success"
    ) {
        return null;
    }
    const { data: workflow } = await github.rest.actions.getWorkflow({
        ...repo,
        workflow_id: run.workflow_id,
    });
    if (workflow.path !== ".github/workflows/ci.yml") {
        return null;
    }
    const prs = await github.paginate(
        github.rest.repos.listPullRequestsAssociatedWithCommit,
        { ...repo, commit_sha: run.head_sha, per_page: 100 },
    );
    const candidates = prs.filter((pr) =>
        isCurrentPullRequest(pr, run.head_sha, repository),
    );
    // Never guess which preview to replace if several open PRs share a head.
    const candidate = candidates[0];
    if (candidates.length !== 1 || !candidate) {
        return null;
    }
    const { data: pr } = await github.rest.pulls.get({
        ...repo,
        pull_number: candidate.number,
    });
    if (!isCurrentPullRequest(pr, run.head_sha, repository)) {
        return null;
    }
    previewBranch(pr.number);
    const artifacts = await github.paginate(
        github.rest.actions.listWorkflowRunArtifacts,
        { ...repo, run_id: run.id, per_page: 100 },
    );
    const sites = artifacts.filter(
        (artifact) => artifact.name === ARTIFACT_NAME && !artifact.expired,
    );
    const site = sites[0];
    if (sites.length !== 1 || !site) {
        return null;
    }
    return { number: pr.number, sha: run.head_sha, artifact: site.id };
}

// These files will be uploaded, never executed. Reject advanced-mode Workers,
// links to files outside the artifact, and assets exceeding Pages' free limits.
// Wrangler runs in a separate empty directory, so artifact-supplied config,
// package scripts, or a functions directory cannot run with deployment tokens.
export async function validateStaticSite(directory: string): Promise<void> {
    let files = 0;
    async function visit(relative: string): Promise<void> {
        const entry = await lstat(path.join(directory, relative));
        if (entry.isSymbolicLink()) {
            throw new Error("Preview assets must not contain symbolic links.");
        }
        if (relative === "_worker.js") {
            throw new Error(
                "PR previews must be static sites, not Pages Workers.",
            );
        }
        if (entry.isDirectory()) {
            for (const name of await readdir(path.join(directory, relative))) {
                await visit(path.join(relative, name));
            }
        } else if (!entry.isFile() || entry.size > 25 * 1024 * 1024) {
            throw new Error(
                "Invalid preview asset or asset larger than 25 MiB.",
            );
        } else if (++files > 20000) {
            throw new Error("Preview exceeds the free Pages file limit.");
        }
    }
    await visit("");
    if (!(await lstat(path.join(directory, "index.html"))).isFile()) {
        throw new Error("The preview must include index.html.");
    }
}

export async function reportPreview(
    github: GitHubClient,
    repo: Repository,
    number: number,
    sha: string,
    url: string,
) {
    // Stable branch aliases preserve preview browser storage across commits.
    // Each PR has its own origin, separate from production and other PRs.
    const parsed = new URL(url);
    if (
        parsed.protocol !== "https:" ||
        !parsed.hostname.startsWith(`${previewBranch(number)}.`) ||
        !parsed.hostname.endsWith(".pages.dev") ||
        parsed.username ||
        parsed.password
    ) {
        throw new Error("Unexpected Cloudflare preview URL.");
    }
    await github.rest.checks.create({
        ...repo,
        name: "Web preview",
        head_sha: sha,
        status: "completed",
        conclusion: "success",
        details_url: url,
        output: {
            title: "Open the LiveSplit One preview",
            summary: `[View preview](${url}) — automatically removed when this PR closes or merges.`,
        },
    });
}

export async function markPreviewRemoved(
    github: GitHubClient,
    repo: Repository,
    number: number,
    sha: string,
) {
    previewBranch(number);
    const checks = await github.paginate(github.rest.checks.listForRef, {
        ...repo,
        ref: sha,
        check_name: "Web preview",
        per_page: 100,
    });
    for (const check of checks) {
        // Avoid modifying another integration's checks with the same name.
        if (check.app?.slug === "github-actions") {
            await github.rest.checks.update({
                ...repo,
                check_run_id: check.id,
                status: "completed",
                conclusion: "neutral",
                details_url: `https://github.com/${repo.owner}/${repo.repo}/pull/${number}`,
                output: {
                    title: "Preview removed",
                    summary:
                        "This PR has closed or merged, so its preview deployments were deleted.",
                },
            });
        }
    }
}
