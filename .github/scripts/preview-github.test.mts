import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, symlink, open } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { Octokit } from "@octokit/rest";
import {
    findPreview,
    isCurrentPullRequest,
    markPreviewRemoved,
    previewBranch,
    reportPreview,
    validateStaticSite,
    type SourceRun,
} from "./preview-github.mts";

const repo = { owner: "LiveSplit", repo: "LiveSplitOne" };
const sha = "a".repeat(40);
const run: SourceRun = {
    repository: { full_name: "LiveSplit/LiveSplitOne" },
    event: "pull_request",
    conclusion: "success",
    workflow_id: 1,
    head_sha: sha,
    id: 9,
};
const pr = {
    number: 42,
    state: "open",
    head: { sha },
    base: { repo: { full_name: "LiveSplit/LiveSplitOne" } },
};

function githubFixture(
    options: {
        candidates?: (typeof pr)[];
        current?: typeof pr;
        workflow?: string;
        expired?: boolean;
        comments?: { id: number; body: string; user: { login: string } }[];
    } = {},
) {
    const calls: {
        method: string;
        path: string;
        body: Record<string, unknown>;
    }[] = [];
    const fetcher: typeof fetch = (input, init) => {
        const url = new URL(
            input instanceof Request ? input.url : input.toString(),
        );
        const method = init?.method ?? "GET";
        calls.push({
            method,
            path: url.pathname,
            body: JSON.parse(
                typeof init?.body === "string" ? init.body : "{}",
            ) as Record<string, unknown>,
        });
        let result: unknown;
        if (url.pathname.endsWith("/actions/workflows/1")) {
            result = { path: options.workflow ?? ".github/workflows/ci.yml" };
        } else if (url.pathname.endsWith(`/commits/${sha}/pulls`)) {
            result = options.candidates ?? [pr];
        } else if (url.pathname.endsWith("/pulls/42")) {
            result = options.current ?? pr;
        } else if (url.pathname.endsWith("/actions/runs/9/artifacts")) {
            result = {
                total_count: 1,
                artifacts: [
                    {
                        id: 7,
                        name: "livesplit-one-preview",
                        expired: options.expired ?? false,
                    },
                ],
            };
        } else if (url.pathname.endsWith(`/commits/${sha}/check-runs`)) {
            result = {
                total_count: 2,
                check_runs: [
                    { id: 99, app: { slug: "github-actions" } },
                    { id: 100, app: { slug: "other-app" } },
                ],
            };
        } else if (
            url.pathname.endsWith("/check-runs") ||
            url.pathname.endsWith("/check-runs/99")
        ) {
            result = { id: 99 };
        } else if (url.pathname.endsWith("/issues/42/comments")) {
            result = method === "GET" ? (options.comments ?? []) : { id: 101 };
        } else if (url.pathname.endsWith("/issues/comments/101")) {
            result = { id: 101 };
        } else {
            throw new Error(`Unexpected GitHub request: ${url.pathname}`);
        }
        const response = new Response(JSON.stringify(result), {
            headers: { "content-type": "application/json" },
        });
        // Real fetch responses include their final URL. Octokit's paginator
        // uses it to resolve Link headers, even when this is the only page.
        Object.defineProperty(response, "url", { value: url.toString() });
        return Promise.resolve(response);
    };
    return { github: new Octokit({ request: { fetch: fetcher } }), calls };
}

test("discovers fork PRs through signed commit metadata without artifact-supplied identity", async () => {
    const { github, calls } = githubFixture();
    assert.deepEqual(await findPreview(github, run, repo), {
        number: 42,
        sha,
        artifact: 7,
    });
    assert(calls.some((call) => call.path.endsWith(`/commits/${sha}/pulls`)));
});

test("ignores runs from other repositories, failed CI, and non-PR events", async () => {
    for (const changes of [
        { event: "push" },
        { conclusion: "failure" },
        { repository: { full_name: "other/repo" } },
    ]) {
        const { github, calls } = githubFixture();
        assert.equal(
            await findPreview(github, { ...run, ...changes }, repo),
            null,
        );
        assert.equal(calls.length, 0);
    }
});

test("rejects a different workflow, expired artifacts, and ambiguous PR identity", async () => {
    for (const options of [
        { workflow: ".github/workflows/other.yml" },
        { expired: true },
        { candidates: [pr, { ...pr, number: 43 }] },
    ]) {
        assert.equal(
            await findPreview(githubFixture(options).github, run, repo),
            null,
        );
    }
});

test("a closed or updated PR cannot publish an old completed build", async () => {
    for (const current of [
        { ...pr, state: "closed" },
        { ...pr, head: { sha: "b".repeat(40) } },
    ]) {
        const { github, calls } = githubFixture({ current });
        assert.equal(await findPreview(github, run, repo), null);
        assert(!calls.some((call) => call.path.endsWith("/artifacts")));
        assert.equal(
            isCurrentPullRequest(current, sha, "LiveSplit/LiveSplitOne"),
            false,
        );
    }
});

test("links the stable preview origin to the actual PR commit", async () => {
    const { github, calls } = githubFixture();
    const url = "https://pr-42.livesplit-one-previews.pages.dev/";
    await reportPreview(github, repo, 42, sha, url);
    assert.equal(calls[0]?.body["head_sha"], sha);
    assert.equal(calls[0]?.body["details_url"], url);
    for (const bad of [
        "http://pr-42.example.pages.dev",
        "https://pr-43.example.pages.dev",
        "https://pr-42.example.com",
        "https://user:password@pr-42.example.pages.dev",
    ]) {
        await assert.rejects(
            reportPreview(github, repo, 42, sha, bad),
            /Unexpected/,
        );
    }
});

test("the first preview posts a ready link directly in the PR conversation", async () => {
    const { github, calls } = githubFixture();
    const url = "https://pr-42.livesplit-one-previews.pages.dev/";
    await reportPreview(github, repo, 42, sha, url);
    const created = calls.filter(
        (call) =>
            call.method === "POST" && call.path.endsWith("/issues/42/comments"),
    );
    assert.equal(created.length, 1);
    assert.match(String(created[0]?.body["body"]), /\[Open preview\]/);
    assert(String(created[0]?.body["body"]).includes(url));
    assert(String(created[0]?.body["body"]).includes(`/commit/${sha}`));
});

test("new builds update only the existing preview comment owned by the bot", async () => {
    const marker = "<!-- livesplit-one-pr-preview -->";
    const { github, calls } = githubFixture({
        comments: [
            { id: 102, body: marker, user: { login: "contributor" } },
            {
                id: 103,
                body: "An unrelated bot comment.",
                user: { login: "github-actions[bot]" },
            },
            { id: 101, body: marker, user: { login: "github-actions[bot]" } },
        ],
    });
    const url = "https://pr-42.livesplit-one-previews.pages.dev/";
    await reportPreview(github, repo, 42, sha, url);
    const updates = calls.filter((call) => call.method === "PATCH");
    assert.equal(updates.length, 1);
    assert(updates[0]?.path.endsWith("/issues/comments/101"));
    assert(String(updates[0]?.body["body"]).includes(url));
    assert(
        !calls.some(
            (call) =>
                call.method === "POST" &&
                call.path.endsWith("/issues/42/comments"),
        ),
    );
});

test("cleanup removes the comment link without posting to PRs that never had a preview", async () => {
    for (const comments of [
        [],
        [
            {
                id: 101,
                body: "<!-- livesplit-one-pr-preview -->\n\n[Open preview](https://pr-42.lso.pages.dev)",
                user: { login: "github-actions[bot]" },
            },
        ],
    ]) {
        const { github, calls } = githubFixture({ comments });
        await markPreviewRemoved(github, repo, 42, sha);
        const updates = calls.filter((call) =>
            call.path.endsWith("/issues/comments/101"),
        );
        assert.equal(updates.length, comments.length);
        if (updates[0]) {
            assert.match(String(updates[0].body["body"]), /removed/);
            assert(!String(updates[0].body["body"]).includes("pages.dev"));
        }
        assert(!calls.some((call) => call.method === "POST"));
    }
});

test("cleanup retires only the preview check owned by GitHub Actions", async () => {
    const { github, calls } = githubFixture();
    await markPreviewRemoved(github, repo, 42, sha);
    const updates = calls.filter((call) => call.method === "PATCH");
    assert.equal(updates.length, 1);
    assert.equal(updates[0]?.body["conclusion"], "neutral");
    assert.equal(
        updates[0]?.body["details_url"],
        "https://github.com/LiveSplit/LiveSplitOne/pull/42",
    );
});

test("branch identifiers cannot contain command text or fractional PR numbers", () => {
    assert.equal(previewBranch(42), "pr-42");
    for (const value of [0, -1, 1.5, NaN, Infinity])
        assert.throws(() => previewBranch(value));
});

test("accepts a static app but rejects Workers, symlinks, and oversize assets", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "lso-preview-"));
    try {
        await assert.rejects(validateStaticSite(directory));
        await writeFile(
            path.join(directory, "index.html"),
            "<html>Preview</html>",
        );
        await writeFile(path.join(directory, "core.wasm"), new Uint8Array(8));
        await validateStaticSite(directory);
        await writeFile(
            path.join(directory, "_worker.js"),
            "export default {};",
        );
        await assert.rejects(validateStaticSite(directory), /static sites/);
        await rm(path.join(directory, "_worker.js"));
        await symlink(
            path.join(directory, "index.html"),
            path.join(directory, "linked.html"),
        );
        await assert.rejects(validateStaticSite(directory), /symbolic links/);
        await rm(path.join(directory, "linked.html"));
        await using file = await open(
            path.join(directory, "oversize.wasm"),
            "w",
        );
        await file.truncate(25 * 1024 * 1024 + 1);
        await assert.rejects(validateStaticSite(directory), /25 MiB/);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
