import { Run } from "../livesplit";

function mapPromiseErr<T, E>(promise: Promise<T>, err: E): ResultPromise<T, E> {
    return promise.catch((_) => { throw err; });
}

async function validatedFetch<E>(
    input: RequestInfo,
    init: RequestInit | undefined,
    err: E,
): ResultPromise<Response, E> {
    const r = await mapPromiseErr(
        fetch(input, init),
        err,
    );

    if (!r.ok) {
        throw err;
    }

    return r;
}

type ResultPromise<S, E> = Promise<S>;

export enum UploadError {
    ApiRequestErrored,
    InvalidJsonResponse,
    UploadRequestErrored,
}

export async function uploadLss(lss: string): ResultPromise<string, UploadError> {
    const response = await validatedFetch(
        "https://splits.io/api/v4/runs",
        {
            method: "POST",
        },
        UploadError.ApiRequestErrored,
    );

    const json = await mapPromiseErr(
        response.json(),
        UploadError.InvalidJsonResponse,
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
        UploadError.UploadRequestErrored,
    );

    return claimUri;
}

export enum DownloadError {
    ApiRequestErrored,
    InvalidBuffer,
    FailedParsing,
}

export async function downloadById(id: string): ResultPromise<Run, DownloadError> {
    const response = await validatedFetch(
        `https://splits.io/api/v4/runs/${id}`,
        {
            headers: new Headers({
                Accept: "application/original-timer",
            }),
        },
        DownloadError.ApiRequestErrored,
    );

    const data = await mapPromiseErr(
        response.arrayBuffer(),
        DownloadError.InvalidBuffer,
    );

    const run = Run.parseArray(new Int8Array(data));

    if (run != null) {
        return run;
    } else {
        throw DownloadError.FailedParsing;
    }
}
