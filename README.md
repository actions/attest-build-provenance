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

See [Using artifact attestations to establish provenance for builds][6] for more
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

**As of version 4, `actions/attest-build-provenance` is simply a wrapper on top
of [`actions/attest`][7].**

Existing applications may continue to use the `attest-build-provenance` action,
but new implementations should use `actions/attest` instead. Please see the
[`actions/attest`][7] repository for usage information.

Documentation for previous versions of this action can be found
[here](https://github.com/actions/attest-build-provenance/blob/v3.2.0/README.md).

[1]: https://github.com/actions/toolkit/tree/main/packages/attest
[2]: https://github.com/in-toto/attestation/tree/main/spec/v1
[3]: https://slsa.dev/spec/v1.0/provenance
[4]: https://www.sigstore.dev/
[5]: https://cli.github.com/manual/gh_attestation_verify
[6]:
  https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds
[7]: https://github.com/actions/attest
