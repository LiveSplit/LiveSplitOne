import {
    markPreviewRemoved,
    previewBranch,
    type GitHubClient,
    type Repository,
} from "./preview-github.mts";

type ApiResponse<T> = {
    success: boolean;
    result: T;
    result_info?: { total_pages?: number };
};
export type PagesClient = {
    get<T>(suffix?: string): Promise<ApiResponse<T>>;
    delete(suffix: string): Promise<void>;
};
type Deployment = {
    id: string;
    environment: string;
    deployment_trigger?: { metadata?: { branch?: string } };
};

export function cloudflareClient(
    account: string,
    project: string,
    token: string,
    fetcher: typeof fetch = fetch,
): PagesClient {
    if (
        !/^[0-9a-f]{32}$/i.test(account) ||
        !/^[a-z0-9][a-z0-9-]{0,62}$/.test(project) ||
        !token
    ) {
        throw new Error(
            "Configure the Cloudflare account, preview project, and API token.",
        );
    }
    const base = `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${project}`;
    async function request(suffix = "", method = "GET") {
        const response = await fetcher(base + suffix, {
            method,
            headers: { Authorization: `Bearer ${token}` },
        });
        // Deletions are idempotent, including retries after a partial cleanup.
        if (method === "DELETE" && response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(
                `Cloudflare request failed: HTTP ${response.status}.`,
            );
        }
        const body = (await response.json()) as ApiResponse<unknown>;
        if (!body.success) {
            throw new Error("Cloudflare rejected the preview request.");
        }
        return body;
    }
    return {
        async get<T>(suffix = "") {
            const response = await request(suffix);
            if (response === null)
                throw new Error("Missing Cloudflare response.");
            return response as ApiResponse<T>;
        },
        async delete(suffix) {
            await request(suffix, "DELETE");
        },
    };
}

export async function checkPreviewProject(client: PagesClient, number: number) {
    const branch = previewBranch(number);
    const { result } = await client.get<{ production_branch: string }>();
    // A mistaken project configuration must never turn a PR deployment into
    // production, where deleting its latest deployment would be unsafe.
    if (
        typeof result.production_branch !== "string" ||
        /^pr-\d+$/.test(result.production_branch)
    ) {
        throw new Error(
            "The Pages production branch must not use a PR preview branch.",
        );
    }
    return branch;
}

export async function deletePreviewDeployments(
    client: PagesClient,
    number: number,
) {
    const branch = await checkPreviewProject(client, number);
    const deployments: Deployment[] = [];
    // Collect every page before deleting anything. Otherwise deletions shift
    // the remaining pages and can leave older PR builds behind.
    for (let page = 1; ; page++) {
        const response = await client.get<Deployment[]>(
            `/deployments?env=preview&per_page=100&page=${page}`,
        );
        deployments.push(
            ...response.result.filter(
                (deployment) =>
                    deployment.environment === "preview" &&
                    deployment.deployment_trigger?.metadata?.branch === branch,
            ),
        );
        const totalPages = response.result_info?.total_pages;
        if (
            totalPages !== undefined
                ? page >= totalPages
                : response.result.length < 100
        ) {
            break;
        }
    }
    for (const deployment of deployments) {
        // force removes the branch alias as well as historic immutable URLs.
        // The explicit environment and branch checks above protect production
        // and every other PR, even if the API returns an unexpected entry.
        await client.delete(
            `/deployments/${encodeURIComponent(deployment.id)}?force=true`,
        );
    }
    return deployments.length;
}

// Both the close workflow and late publishers use the same cleanup. GitHub
// replaces older pending jobs in a concurrency group, even with cancellation
// disabled. A publisher queued after a close must therefore clean up too,
// rather than rely solely on the potentially replaced close job.
export async function removeClosedPreview(
    github: GitHubClient,
    repo: Repository,
    number: number,
    client: PagesClient,
) {
    const { data: pr } = await github.rest.pulls.get({
        ...repo,
        pull_number: number,
    });
    if (pr.state !== "closed") {
        return null;
    }
    const deleted = await deletePreviewDeployments(client, number);
    await markPreviewRemoved(github, repo, number, pr.head.sha);
    return deleted;
}
