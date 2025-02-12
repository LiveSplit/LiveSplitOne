import { Run } from "../livesplit-core";
import { PostRunResponse } from "./json/PostRunResponse";

function mapPromiseErr<T>(promise: Promise<T>, err: string): Promise<T> {
    return promise.catch((_) => { throw new Error(err); });
}

async function validatedFetch(
    input: RequestInfo,
    init: RequestInit | undefined,
    err: string,
): Promise<Response> {
    const r = await mapPromiseErr(
        fetch(input, init),
        err,
    );

    if (!r.ok) {
        throw new Error(err);
    }

    return r;
}

export async function uploadLss(lss: string | Blob): Promise<string> {
    const response = await validatedFetch(
        "https://splits.io/api/v4/runs",
        {
            method: "POST",
        },
        "API request errored",
    );

    const json: PostRunResponse = await mapPromiseErr(
        response.json(),
        "Invalid JSON response",
    );

    const claimUri = json.uris.claim_uri;
    const request = json.presigned_request;

    const formData = new FormData();
    const fields = request.fields;

    formData.append("key", fields.key);
    formData.append("policy", fields.policy);
    formData.append("x-amz-credential", fields["x-amz-credential"]);
    formData.append("x-amz-algorithm", fields["x-amz-algorithm"]);
    formData.append("x-amz-date", fields["x-amz-date"]);
    formData.append("x-amz-signature", fields["x-amz-signature"]);
    formData.append("file", lss);

    await validatedFetch(
        request.uri,
        {
            method: request.method,
            body: formData,
        },
        "Upload request errored",
    );

    return claimUri;
}

export async function downloadById(id: string, signal?: AbortSignal): Promise<Run> {
    const response = await validatedFetch(
        `https://splits.io/api/v4/runs/${id}`,
        {
            headers: new Headers({
                Accept: "application/original-timer",
            }),
            signal,
        },
        "API request errored",
    );

    const data = await mapPromiseErr(
        response.arrayBuffer(),
        "Invalid buffer",
    );

    using result = Run.parseArray(new Uint8Array(data), "");
    if (result.parsedSuccessfully()) {
        return result.unwrap();
    } else {
        throw new Error("Failed parsing");
    }
}
