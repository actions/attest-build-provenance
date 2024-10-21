# `actions/attest-build-provenance`

Generate signed build provenance attestations for workflow artifacts. Internally
powered by the [@actions/attest][1] package.

Attestations bind some subject (a named artifact along with its digest) to a
[SLSA build provenance][3] predicate using the [in-toto][2] format.

A verifiable signature is generated for the attestation using a short-lived
[Sigstore][4]-issued signing certificate. If the repository initiating the
GitHub Actions workflow is public, the public-good instance of Sigstore will be
used to generate the attestation signature. If the repository is
private/internal, it will use the GitHub private Sigstore instance.

Once the attestation has been created and signed, it will be uploaded to the GH
attestations API and associated with the repository from which the workflow was
initiated.

Attestations can be verified using the [`attestation` command in the GitHub
CLI][5].

See [Using artifact attestations to establish provenance for builds][9] for more
information on artifact attestations.

## Usage

Within the GitHub Actions workflow which builds some artifact you would like to
attest:

1. Ensure that the following permissions are set:

   ```yaml
   permissions:
     id-token: write
     attestations: write
   ```

   The `id-token` permission gives the action the ability to mint the OIDC token
   necessary to request a Sigstore signing certificate. The `attestations`
   permission is necessary to persist the attestation.

1. Add the following to your workflow after your artifact has been built:

   ```yaml
   - uses: actions/attest-build-provenance@v1
     with:
       subject-path: '<PATH TO ARTIFACT>'
   ```

   The `subject-path` parameter should identify the artifact for which you want
   to generate an attestation.

### Inputs

See [action.yml](action.yml)

```yaml
- uses: actions/attest-build-provenance@v1
  with:
    # Path to the artifact serving as the subject of the attestation. Must
    # specify exactly one of "subject-path" or "subject-digest". May contain a
    # glob pattern or list of paths (total subject count cannot exceed 2500).
    subject-path:

    # SHA256 digest of the subject for the attestation. Must be in the form
    # "sha256:hex_digest" (e.g. "sha256:abc123..."). Must specify exactly one
    # of "subject-path" or "subject-digest".
    subject-digest:

    # Subject name as it should appear in the attestation. Required unless
    # "subject-path" is specified, in which case it will be inferred from the
    # path.
    subject-name:

    # Whether to push the attestation to the image registry. Requires that the
    # "subject-name" parameter specify the fully-qualified image name and that
    # the "subject-digest" parameter be specified. Defaults to false.
    push-to-registry:

    # Whether to attach a list of generated attestations to the workflow run
    # summary page. Defaults to true.
    show-summary:

    # The GitHub token used to make authenticated API requests. Default is
    # ${{ github.token }}
    github-token:
```

### Outputs

<!-- markdownlint-disable MD013 -->

| Name          | Description                                                    | Example                  |
| ------------- | -------------------------------------------------------------- | ------------------------ |
| `bundle-path` | Absolute path to the file containing the generated attestation | `/tmp/attestation.jsonl` |

<!-- markdownlint-enable MD013 -->

Attestations are saved in the JSON-serialized [Sigstore bundle][6] format.

If multiple subjects are being attested at the same time, each attestation will
be written to the output file on a separate line (using the [JSON Lines][7]
format).

## Attestation Limits

### Subject Limits

No more than 2500 subjects can be attested at the same time. Subjects will be
processed in batches 50. After the initial group of 50, each subsequent batch
will incur an exponentially increasing amount of delay (capped at 1 minute of
delay per batch) to avoid overwhelming the attestation API.

## Examples

### Identify Subject by Path

For the basic use case, simply add the `attest-build-provenance` action to your
workflow and supply the path to the artifact for which you want to generate
attestation.

```yaml
name: build-attest

on:
  workflow_dispatch:

jobs:
  build:
    permissions:
      id-token: write
      contents: read
      attestations: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Build artifact
        run: make my-app
      - name: Attest
        uses: actions/attest-build-provenance@v1
        with:
          subject-path: '${{ github.workspace }}/my-app'
```

### Identify Multiple Subjects

If you are generating multiple artifacts, you can generate a provenance
attestation for each by using a wildcard in the `subject-path` input.

```yaml
- uses: actions/attest-build-provenance@v1
  with:
    subject-path: 'dist/**/my-bin-*'
```

For supported wildcards along with behavior and documentation, see
[@actions/glob][8] which is used internally to search for files.

Alternatively, you can explicitly list multiple subjects with either a comma or
newline delimited list:

```yaml
- uses: actions/attest-build-provenance@v1
  with:
    subject-path: 'dist/foo, dist/bar'
```

```yaml
- uses: actions/attest-build-provenance@v1
  with:
    subject-path: |
      dist/foo
      dist/bar
```

### Container Image

When working with container images you can invoke the action with the
`subject-name` and `subject-digest` inputs.

If you want to publish the attestation to the container registry with the
`push-to-registry` option, it is important that the `subject-name` specify the
fully-qualified image name (e.g. "ghcr.io/user/app" or
"acme.azurecr.io/user/app"). Do NOT include a tag as part of the image name --
the specific image being attested is identified by the supplied digest.

Attestation bundles are stored in the OCI registry according to the [Cosign
Bundle Specification][10].

> **NOTE**: When pushing to Docker Hub, please use "index.docker.io" as the
> registry portion of the image name.

```yaml
name: build-attested-image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      packages: write
      contents: read
      attestations: write
    env:
      REGISTRY: ghcr.io
      IMAGE_NAME: ${{ github.repository }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push image
        id: push
        uses: docker/build-push-action@v5.0.0
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
      - name: Attest
        uses: actions/attest-build-provenance@v1
        id: attest
        with:
          subject-name: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          subject-digest: ${{ steps.push.outputs.digest }}
          push-to-registry: true
```

[1]: https://github.com/actions/toolkit/tree/main/packages/attest
[2]: https://github.com/in-toto/attestation/tree/main/spec/v1
[3]: https://slsa.dev/spec/v1.0/provenance
[4]: https://www.sigstore.dev/
[5]: https://cli.github.com/manual/gh_attestation_verify
[6]:
  https://github.com/sigstore/protobuf-specs/blob/main/protos/sigstore_bundle.proto
[7]: https://jsonlines.org/
[8]: https://github.com/actions/toolkit/tree/main/packages/glob#patterns
[9]:
  https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds
[10]: https://github.com/sigstore/cosign/blob/main/specs/BUNDLE_SPEC.md
