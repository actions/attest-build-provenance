# Release Instructions

Follow the steps below to tag a new release for the
`actions/attest-build-provenance` action.

If changes were made to the internal `actions/attest-build-provenance/predicate`
action (any updates to [`./predicate/action.yaml`](./predicate/action.yml) or
any of the code in the [`./src`](./src) directory), start with step #1;
otherwise, skip directly to step #5.

1. Merge the latest changes to the `main` branch.
1. Create and push a new predicate tag of the form `predicate@X.X.X` following
   SemVer conventions:

   ```shell
   git tag -a "predicate@X.X.X" -m "predicate@X.X.X Release"
   git push --tags
   ```

1. Update the reference to the `actions/attest-build-provenance/predicate`
   action in [`action.yml`](./action.yml) to point to the SHA of the newly
   created tag.
1. Push the `action.yml` change and open a PR. Once it has been reviewed, merge
   the PR and proceed with the release instructions.
1. Create a new release for the top-level action using a tag of the form
   `vX.X.X` following SemVer conventions:

   ```shell
   gh release create vX.X.X
   ```

1. Move (or create) the major version tag to point to the same commit tagged
   above:

   ```shell
   git tag -fa vX -m "vX"
   git push origin vX --force
   ```
