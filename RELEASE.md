# Release Instructions

Follow the steps below to tag a new release for the
`actions/attest-build-provenance` action.

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
