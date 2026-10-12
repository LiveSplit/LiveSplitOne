import assert from "node:assert/strict";
import { test } from "node:test";
import { Octokit } from "@octokit/rest";
import {
    cloudflareClient,
    deletePreviewDeployments,
    removeClosedPreview,
} from "./preview-cloudflare.mts";

const account = "a".repeat(32);

test("merged and unmerged closes clean up; a reopened PR keeps its preview", async () => {
    for (const [state, merged] of [
        ["closed", true],
        ["closed", false],
        ["open", false],
    ] as const) {
        const github = new Octokit({
            request: {
                fetch: (input: RequestInfo | URL) => {
                    const url = new URL(
                        input instanceof Request ? input.url : input.toString(),
                    );
                    const data = url.pathname.endsWith("/pulls/42")
                        ? { state, merged, head: { sha: "a".repeat(40) } }
                        : { total_count: 0, check_runs: [] };
                    const response = new Response(JSON.stringify(data), {
                        headers: { "content-type": "application/json" },
                    });
                    Object.defineProperty(response, "url", {
                        value: url.toString(),
                    });
                    return Promise.resolve(response);
                },
            },
        });
        let removed = 0;
        const client = cloudflareClient(
            account,
            "lso-previews",
            "test-token",
            (input, init) => {
                const url = new URL(
                    input instanceof Request ? input.url : input.toString(),
                );
                if (init?.method === "DELETE") removed++;
                const result = url.pathname.includes("deployments")
                    ? [deployment("latest", "pr-42")]
                    : { production_branch: "master" };
                return Promise.resolve(
                    new Response(JSON.stringify({ success: true, result })),
                );
            },
        );
        assert.equal(
            await removeClosedPreview(
                github,
                { owner: "LiveSplit", repo: "LiveSplitOne" },
                42,
                client,
            ),
            state === "closed" ? 1 : null,
        );
        assert.equal(removed, state === "closed" ? 1 : 0);
    }
});

function deployment(id: string, branch: string, environment = "preview") {
    return { id, environment, deployment_trigger: { metadata: { branch } } };
}

test("removes every PR build and its alias without touching other PRs or production", async () => {
    const calls: string[] = [];
    const fetcher: typeof fetch = (input, init) => {
        const url = new URL(
            input instanceof Request ? input.url : input.toString(),
        );
        const call = `${init?.method ?? "GET"} ${url.pathname}${url.search}`;
        calls.push(call);
        let result: unknown;
        let pages: { total_pages: number } | undefined;
        if (!url.pathname.includes("/deployments")) {
            result = { production_branch: "master" };
        } else if (init?.method === "DELETE") {
            assert.equal(url.searchParams.get("force"), "true");
            result = null;
        } else {
            assert.equal(url.searchParams.get("env"), "preview");
            pages = { total_pages: 2 };
            result =
                url.searchParams.get("page") === "1"
                    ? [
                          deployment("latest", "pr-42"),
                          deployment("other", "pr-43"),
                          deployment("production", "pr-42", "production"),
                      ]
                    : [
                          deployment("old", "pr-42"),
                          deployment("similar", "pr-420"),
                      ];
        }
        return Promise.resolve(
            new Response(
                JSON.stringify({
                    success: true,
                    result,
                    result_info: pages,
                }),
                { headers: { "content-type": "application/json" } },
            ),
        );
    };
    const client = cloudflareClient(
        account,
        "lso-previews",
        "test-token",
        fetcher,
    );
    assert.equal(await deletePreviewDeployments(client, 42), 2);
    assert(calls[1]?.includes("page=1") && calls[2]?.includes("page=2"));
    const removed = calls.filter((call) => call.startsWith("DELETE"));
    assert.equal(removed.length, 2);
    assert(
        removed[0]?.includes("/latest?force=true") &&
            removed[1]?.includes("/old?force=true"),
    );
});

test("empty and already-deleted previews are safe to clean up repeatedly", async () => {
    for (const entries of [[], [deployment("gone", "pr-42")]]) {
        const client = cloudflareClient(
            account,
            "lso-previews",
            "test-token",
            (input, init) => {
                if (init?.method === "DELETE")
                    return Promise.resolve(new Response(null, { status: 404 }));
                const url = new URL(
                    input instanceof Request ? input.url : input.toString(),
                );
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            result: url.pathname.includes("deployments")
                                ? entries
                                : { production_branch: "master" },
                        }),
                    ),
                );
            },
        );
        assert.equal(
            await deletePreviewDeployments(client, 42),
            entries.length,
        );
    }
});

test("rejects a misconfigured production branch before listing or deleting deployments", async () => {
    let requests = 0;
    const client = cloudflareClient(
        account,
        "lso-previews",
        "test-token",
        () => {
            requests++;
            return Promise.resolve(
                new Response(
                    JSON.stringify({
                        success: true,
                        result: { production_branch: "pr-42" },
                    }),
                ),
            );
        },
    );
    await assert.rejects(
        deletePreviewDeployments(client, 42),
        /production branch/,
    );
    assert.equal(requests, 1);
});

test("authentication errors fail cleanup without logging the token or response body", async () => {
    const token = "private-test-token";
    const client = cloudflareClient(account, "lso-previews", token, () =>
        Promise.resolve(new Response(token, { status: 401 })),
    );
    await assert.rejects(
        deletePreviewDeployments(client, 42),
        (error: unknown) =>
            error instanceof Error &&
            error.message.includes("401") &&
            !error.message.includes(token),
    );
});
