export interface PostRunResponse {
    id: string;
    presigned_request: PresignedRequest;
    claim_token: string;
    message: string;
    status: number;
    uris: Uris;
}

export interface PresignedRequest {
    method: string;
    fields: Fields;
    uri: string;
}

export interface Fields {
    policy: string;
    "x-amz-credential": string;
    key: string;
    "x-amz-algorithm": string;
    "x-amz-date": string;
    "x-amz-signature": string;
}

export interface Uris {
    claim_uri: string;
    api_uri: string;
    public_uri: string;
}
