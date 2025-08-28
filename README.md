# `actions/attest-build-provenance`

[![Public-Good Sigstore Prober](https://github.com/actions/attest-build-provenance/actions/workflows/prober-public-good.yml/badge.svg)](https://github.com/actions/attest-build-provenance/actions/workflows/prober-public-good.yml)
[![GitHub Sigstore Prober](https://github.com/actions/attest-build-provenance/actions/workflows/prober-github.yml/badge.svg)](https://github.com/actions/attest-build-provenance/actions/workflows/prober-github.yml)

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

<!-- prettier-ignore-start -->
> [!NOTE]
> Artifact attestations are available in public repositories for all
> current GitHub plans. They are not available on legacy plans, such as Bronze,
> Silver, or Gold. If you are on a GitHub Free, GitHub Pro, or GitHub Team plan,
> artifact attestations are only available for public repositories. To use
> artifact attestations in private or internal repositories, you must be on a
> GitHub Enterprise Cloud plan.
<!-- prettier-ignore-end -->

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
   - uses: actions/attest-build-provenance@v3
     with:
       subject-path: '<PATH TO ARTIFACT>'
   ```

   The `subject-path` parameter should identify the artifact for which you want
   to generate an attestation.

### Inputs

See [action.yml](action.yml)

```yaml
- uses: actions/attest-build-provenance@v3
  with:
    # Path to the artifact serving as the subject of the attestation. Must
    # specify exactly one of "subject-path", "subject-digest", or
    # "subject-checksums". May contain a glob pattern or list of paths
    # (total subject count cannot exceed 1024).
    subject-path:

    # SHA256 digest of the subject for the attestation. Must be in the form
    # "sha256:hex_digest" (e.g. "sha256:abc123..."). Must specify exactly one
    # of "subject-path", "subject-digest", or "subject-checksums".
    subject-digest:

    # Subject name as it should appear in the attestation. Required when
    # identifying the subject with the "subject-digest" input.
    subject-name:

    # Path to checksums file containing digest and name of subjects for
    # attestation. Must specify exactly one of "subject-path", "subject-digest",
    # or "subject-checksums".
    subject-checksums:

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

| Name              | Description                                                    | Example                                          |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| `attestation-id`  | GitHub ID for the attestation                                  | `123456`                                         |
| `attestation-url` | URL for the attestation summary                                | `https://github.com/foo/bar/attestations/123456` |
| `bundle-path`     | Absolute path to the file containing the generated attestation | `/tmp/attestation.json`                          |

<!-- markdownlint-enable MD013 -->

Attestations are saved in the JSON-serialized [Sigstore bundle][6] format.

If multiple subjects are being attested at the same time, a single attestation
will be created with references to each of the supplied subjects.

The absolute path to the generated attestation is appended to the file
`${RUNNER_TEMP}/created_attestation_paths.txt`. This file will accumulate the
paths to all attestations created over the course of a single workflow.

## Attestation Limits

### Subject Limits

No more than 1024 subjects can be attested at the same time.

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
    runs-on: ubuntu-latest
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
        uses: actions/attest-build-provenance@v3
        with:
          subject-path: '${{ github.workspace }}/my-app'
```

### Identify Multiple Subjects

If you are generating multiple artifacts, you can attest all of them at the same
time by using a wildcard in the `subject-path` input.

```yaml
- uses: actions/attest-build-provenance@v3
  with:
    subject-path: 'dist/**/my-bin-*'
```

For supported wildcards along with behavior and documentation, see
[@actions/glob][8] which is used internally to search for files.

Alternatively, you can explicitly list multiple subjects with either a comma or
newline delimited list:

```yaml
- uses: actions/attest-build-provenance@v3
  with:
    subject-path: 'dist/foo, dist/bar'
```

```yaml
- uses: actions/attest-build-provenance@v3
  with:
    subject-path: |
      dist/foo
      dist/bar
```

### Identify Subjects with Checksums File

If you are using tools like
[goreleaser](https://goreleaser.com/customization/checksum/) or
[jreleaser](https://jreleaser.org/guide/latest/reference/checksum.html) which
generate a checksums file you can identify the attestation subjects by passing
the path of the checksums file to the `subject-checksums` input. Each of the
artifacts identified in the checksums file will be listed as a subject for the
attestation.

```yaml
- name: Calculate artifact digests
  run: |
    shasum -a 256 foo_0.0.1_* > subject.checksums.txt
- uses: actions/attest-build-provenance@v3
  with:
    subject-checksums: subject.checksums.txt
```

<!-- markdownlint-disable MD038 -->

The file referenced by the `subject-checksums` input must conform to the same
format used by the shasum tools. Each subject should be listed on a separate
line including the hex-encoded digest (either SHA256 or SHA512), a space, a
single character flag indicating either binary (`*`) or text (` `) input mode,
and the filename.

<!-- markdownlint-enable MD038 -->

```text
b569bf992b287f55d78bf8ee476497e9b7e9d2bf1c338860bfb905016218c740  foo_0.0.1_darwin_amd64
a54fc515e616cac7fcf11a49d5c5ec9ec315948a5935c1e11dd610b834b14dde  foo_0.0.1_darwin_arm64
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
        uses: actions/attest-build-provenance@v3
        id: attest
        with:
          subject-name: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          subject-digest: ${{ steps.push.outputs.digest }}
          push-to-registry: true
```

### Integration with `actions/upload-artifact`

If you'd like to create an attestation for an archive created with the
[actions/upload-artifact][11] action you can feed the digest of the generated
artifact directly into the `subject-digest` input of the attestation action.

```yaml
- name: Upload build artifact
  id: upload
  uses: actions/upload-artifact@v4
  with:
    path: dist/*
    name: artifact.zip

- uses: actions/attest-build-provenance@v3
  with:
    subject-name: artifact.zip
    subject-digest: sha256:${{ steps.upload.outputs.artifact-digest }}
```

[1]: https://github.com/actions/toolkit/tree/main/packages/attest
[2]: https://github.com/in-toto/attestation/tree/main/spec/v1
[3]: https://slsa.dev/spec/v1.0/provenance
[4]: https://www.sigstore.dev/
[5]: https://cli.github.com/manual/gh_attestation_verify
[6]:
  https://github.com/sigstore/protobuf-specs/blob/main/protos/sigstore_bundle.proto
[8]: https://github.com/actions/toolkit/tree/main/packages/glob#patterns
[9]:
  https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds
[10]: https://github.com/sigstore/cosign/blob/main/specs/BUNDLE_SPEC.md
[11]: https://github.com/actions/upload-artifact
